import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { respondToOffer } from '@/lib/actions/user';
import { dateBg, eur } from '@/lib/format';

export const metadata = { title: 'Получени оферти' };
const TONE = { SENT: 'copper', ACCEPTED: 'ok', DECLINED: 'neutral' } as const;
const LABEL = { SENT: 'Очаква отговор', ACCEPTED: 'Приета', DECLINED: 'Отказана' } as const;

export default async function Offers() {
  const user = await requireUser('/account/offers');
  const rows = await db.offer.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h1 className="text-3xl">Оферти</h1>
      <div className="mt-6 space-y-4">
        {rows.length === 0 && <p className="card p-8 text-center text-sm text-muted">Все още нямате оферти.</p>}
        {rows.map((o) => (
          <article key={o.id} className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-muted">{dateBg(o.createdAt)}{o.validUntil ? ` · валидна до ${dateBg(o.validUntil)}` : ''}</p><h2 className="mt-1 text-lg">{o.title}</h2></div>
              <Badge tone={TONE[o.status]}>{LABEL[o.status]}</Badge>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-navy-900">{eur(o.totalEur)}</p>
            {o.notes && <p className="mt-2 text-sm text-ink/75">{o.notes}</p>}
            {o.status === 'SENT' && (
              <div className="mt-5 flex gap-3">
                <form action={respondToOffer.bind(null, o.id, true)}><Button variant="copper">Приемам офертата</Button></form>
                <form action={respondToOffer.bind(null, o.id, false)}><Button variant="outline">Отказвам</Button></form>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
