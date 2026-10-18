import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { stageTitle } from '@/lib/stages';
import { dateBg } from '@/lib/format';

export const metadata = { title: 'Поръчки' };

export default async function Orders() {
  const user = await requireUser('/account/orders');
  const rows = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h1 className="text-3xl">Поръчки</h1>
      <div className="mt-6 space-y-3">
        {rows.length === 0 && <p className="card p-8 text-center text-sm text-muted">Нямате поръчки.</p>}
        {rows.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.number}`} className="card flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:border-navy-900">
            <div><p className="font-mono text-xs text-muted">{o.number}</p><p className="font-bold text-navy-900">{o.vehicleTitle}</p><p className="text-xs text-muted">Очаквана дата: {dateBg(o.estimatedDelivery)}</p></div>
            <Badge tone={o.stage === 10 ? 'ok' : 'copper'}>Етап {o.stage}: {stageTitle(o.stage)}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
