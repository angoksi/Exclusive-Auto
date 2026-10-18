'use server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { calculateImport } from '@/lib/pricing';
import { getPricing } from '@/lib/pricing-server';
import { zodErrors, type FormState } from './types';

const schema = z.object({
  type: z.enum(['VEHICLE', 'CALCULATOR', 'WIZARD', 'CONTACT']),
  name: z.string().trim().min(2, 'Въведете име').max(80),
  email: z.string().trim().toLowerCase().email('Невалиден имейл'),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(3000).optional(),
  vehicleSlug: z.string().trim().max(120).optional(),
  payload: z.string().max(10_000).optional(),
  website: z.string().max(0).optional(), // honeypot
  consent: z.literal('on', { message: 'Необходимо е съгласие' }),
});

const calcInputSchema = z.object({
  region: z.enum(['US', 'CA', 'KR']),
  price: z.number().min(0).max(1_000_000_000),
  currency: z.string().max(3),
  platform: z.string().max(20),
  auctionFeeOverride: z.number().min(0).max(1_000_000_000).nullable().optional(),
  inlandOverride: z.number().min(0).max(100000).nullable().optional(),
  seaOverride: z.number().min(0).max(100000).nullable().optional(),
  destination: z.string().max(30),
  insurance: z.boolean(),
  originProof: z.boolean(),
  extras: z.array(z.string().max(30)).max(20),
});

export async function submitInquiry(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit('inquiry', 5, 10 * 60_000))) return { error: 'Твърде много заявки. Опитайте след няколко минути.' };
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    // honeypot: тиха „успешна“ реакция за ботове
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return { ok: true, message: 'Благодарим ви!' };
    return { errors: zodErrors(parsed.error.issues) };
  }
  const d = parsed.data;
  if ((d.type === 'CONTACT' || d.type === 'VEHICLE') && !d.message && !d.phone) return { errors: { message: 'Добавете съобщение или телефон' } };

  let payload: object | undefined;
  if (d.payload) {
    try {
      payload = JSON.parse(d.payload);
    } catch {
      return { error: 'Невалидни данни във формата.' };
    }
  }
  if (d.type === 'CALCULATOR' && payload) {
    // Резултатът се преизчислява на сървъра с актуалната конфигурация — не се доверяваме на клиента
    const inp = calcInputSchema.safeParse((payload as { input?: unknown }).input);
    if (!inp.success) return { error: 'Невалидни данни от калкулатора.' };
    payload = { input: inp.data, result: calculateImport(inp.data, await getPricing()) };
  }
  const vehicle = d.vehicleSlug ? await db.vehicle.findUnique({ where: { slug: d.vehicleSlug }, select: { id: true } }) : null;
  const user = await getUser();
  await db.inquiry.create({
    data: { type: d.type, name: d.name, email: d.email, phone: d.phone || null, message: d.message || null, payload, vehicleId: vehicle?.id, userId: user?.id, consentAt: new Date() },
  });
  return { ok: true, message: 'Благодарим ви! Получихме запитването и консултант ще се свърже с вас в рамките на работния ден.' };
}
