import Link from 'next/link';
import { ActionForm } from '@/components/admin/action-form';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/form';
import { db } from '@/lib/db';
import { createOrder } from '@/lib/actions/admin';
import { stageTitle } from '@/lib/stages';
import { dateBg } from '@/lib/format';

export const metadata = { title: 'Поръчки — админ' };

export default async function AdminOrders() {
  const rows = await db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { name: true, email: true } } } });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Поръчки и доставки</h1>
      <div className="card divide-y divide-line">
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">Няма поръчки.</p>}
        {rows.map((o) => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-mist">
            <span><span className="font-mono text-xs text-muted">{o.number}</span><strong className="block text-navy-900">{o.vehicleTitle}</strong><span className="text-xs text-muted">{o.user.name} · ETA {dateBg(o.estimatedDelivery)}</span></span>
            <Badge tone={o.stage === 10 ? 'ok' : 'copper'}>{o.stage}. {stageTitle(o.stage)}</Badge>
          </Link>
        ))}
      </div>
      <div className="card max-w-2xl p-6"><h2 className="mb-4 text-lg">Нова поръчка</h2>
        <ActionForm action={createOrder} submit="Създай поръчка" variant="copper"><>
          <Field label="Имейл на клиента (регистриран потребител)" name="userEmail"><Input name="userEmail" type="email" required /></Field>
          <Field label="Автомобил" name="vehicleTitle"><Input name="vehicleTitle" required placeholder="напр. 2022 Hyundai Tucson Inspiration" /></Field>
          <Field label="VIN" name="vin"><Input name="vin" required maxLength={17} className="font-mono uppercase" /></Field>
          <Field label="Очаквана дата на доставка"><Input name="estimatedDelivery" type="date" /></Field></></ActionForm></div>
    </div>
  );
}
