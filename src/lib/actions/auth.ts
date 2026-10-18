'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, destroySession, hashPassword, verifyPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { zodErrors, type FormState } from './types';

const safeNext = (n: unknown) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/account');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Въведете име').max(80),
  email: z.string().trim().toLowerCase().email('Невалиден имейл'),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8, 'Минимум 8 символа').max(100).refine((p) => /[A-Za-zА-Яа-я]/.test(p) && /\d/.test(p), 'Паролата трябва да съдържа буква и цифра'),
  consent: z.literal('on', { message: 'Необходимо е съгласие' }),
});

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit('register', 5, 10 * 60_000))) return { error: 'Твърде много опити. Опитайте след няколко минути.' };
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error.issues) };
  const { name, email, phone, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { errors: { email: 'Вече има профил с този имейл' } };
  const user = await db.user.create({ data: { name, email, phone: phone || null, passwordHash: await hashPassword(password), consentAt: new Date() } });
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect(safeNext(fd.get('next')));
}

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await rateLimit('login', 8, 10 * 60_000))) return { error: 'Твърде много опити. Опитайте след няколко минути.' };
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: 'Невалиден имейл или парола.' };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // еднакво време/съобщение за липсващ профил и грешна парола
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : await verifyPassword(parsed.data.password, '$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok) return { error: 'Невалиден имейл или парола.' };
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  const next = safeNext(fd.get('next'));
  redirect(next === '/account' && (user.role === 'ADMIN' || user.role === 'MANAGER') ? '/admin' : next);
}

export async function logout() {
  await destroySession();
  redirect('/');
}
