import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { INQUIRY_STATUS_LABEL, REGION_LABEL, dateBg } from '@/lib/format';

export default async function AdminHome() {
  const since = new Date(Date.now() - 30 * 86400000);
  const [vehicles, published, inqNew, inq30, activeOrders, users, offersSent, byRegion, byStatus, recent] = await Promise.all([
    db.vehicle.count(), db.vehicle.count({ where: { published: true, status: 'AVAILABLE' } }), db.inquiry.count({ where: { status: 'NEW' } }),
    db.inquiry.count({ where: { createdAt: { gte: since } } }), db.order.count({ where: { stage: { lt: 10 } } }), db.user.count(), db.offer.count({ where: { status: 'SENT' } }),
    db.vehicle.groupBy({ by: ['region'], _count: true }), db.inquiry.groupBy({ by: ['status'], _count: true }),
    db.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { vehicle: { select: { make: true, model: true } } } }),
  ]);
  const stats = [['Нови запитвания', inqNew], ['Запитвания (30 дни)', inq30], ['Активни поръчки', activeOrders], ['Чакащи оферти', offersSent], ['Налични автомобили', `${published} / ${vehicles}`], ['Потребители', users]];
  const max = Math.max(1, ...byRegion.map((r) => r._count));
  return (
    <div className="space-y-8">
      <h1 className="text-3xl">Статистики</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{stats.map(([l, v]) => <div key={l} className="card p-5"><p className="text-3xl font-extrabold text-navy-900">{v}</p><p className="mt-1 text-xs text-muted">{l}</p></div>)}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg">Автомобили по държава</h2>
          <ul className="mt-5 space-y-3">{byRegion.map((r) => <li key={r.region}><div className="mb-1 flex justify-between text-sm"><span>{REGION_LABEL[r.region]}</span><strong>{r._count}</strong></div><div className="h-2 rounded-full bg-mist"><div className="h-full rounded-full bg-navy-900" style={{ width: `${(r._count / max) * 100}%` }} /></div></li>)}</ul>
          <h2 className="mt-8 text-lg">Запитвания по статус</h2>
          <ul className="mt-4 flex flex-wrap gap-2">{byStatus.map((s) => <li key={s.status}><Badge tone="outline">{INQUIRY_STATUS_LABEL[s.status]}: {s._count}</Badge></li>)}</ul>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg">Последни запитвания</h2><Link href="/admin/inquiries" className="link-arrow">Всички →</Link></div>
          <ul className="mt-4 divide-y divide-line">{recent.map((q) => <li key={q.id}><Link href={`/admin/inquiries/${q.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-copper-700"><span><strong className="block text-sm text-navy-900">{q.name}</strong><span className="text-xs text-muted">{q.vehicle ? `${q.vehicle.make} ${q.vehicle.model}` : q.type} · {dateBg(q.createdAt)}</span></span><Badge tone={q.status === 'NEW' ? 'copper' : 'neutral'}>{INQUIRY_STATUS_LABEL[q.status]}</Badge></Link></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
