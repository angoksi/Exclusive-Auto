import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { INQUIRY_STATUS_LABEL, dateBg } from '@/lib/format';

export const metadata = { title: 'Моите запитвания' };
const TYPE = { VEHICLE: 'За автомобил', CALCULATOR: 'От калкулатор', WIZARD: 'Намери моя автомобил', CONTACT: 'Контакт' } as const;

export default async function Inquiries() {
  const user = await requireUser('/account/inquiries');
  const rows = await db.inquiry.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { vehicle: { select: { slug: true, make: true, model: true, year: true } }, offers: { select: { id: true } } } });
  return (
    <div>
      <h1 className="text-3xl">Запитвания</h1>
      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="card p-8 text-center text-sm text-muted">Нямате запитвания.</p>}
        {rows.map((q) => (
          <article key={q.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">{dateBg(q.createdAt, true)} · {TYPE[q.type]}</p>
              <Badge tone={q.status === 'NEW' ? 'copper' : q.status === 'CLOSED' ? 'neutral' : 'ok'}>{INQUIRY_STATUS_LABEL[q.status]}</Badge>
            </div>
            {q.vehicle && <Link href={`/catalog/${q.vehicle.slug}`} className="mt-2 block font-bold text-navy-900 hover:text-copper-700">{q.vehicle.year} {q.vehicle.make} {q.vehicle.model}</Link>}
            {q.message && <p className="mt-2 text-sm text-ink/75">{q.message}</p>}
            {q.offers.length > 0 && <Link href="/account/offers" className="link-arrow mt-3">Получена оферта →</Link>}
          </article>
        ))}
      </div>
    </div>
  );
}
