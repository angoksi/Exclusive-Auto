import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Photo } from '@/components/photo';
import { RunButton } from '@/components/admin/action-form';
import { db } from '@/lib/db';
import { requireRole, STAFF } from '@/lib/auth';
import { deleteVehicle, recalcPrices, runSync, toggleVehiclePublished } from '@/lib/actions/admin';
import { REGION_LABEL, STATUS_LABEL, eur, num } from '@/lib/format';
import { ADAPTERS } from '@/lib/providers/adapters';

export const metadata = { title: 'Автомобили — админ' };
const PER = 20;

export default async function AdminVehicles({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requireRole(STAFF);
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = q ? { OR: [{ make: { contains: q, mode: 'insensitive' as const } }, { model: { contains: q, mode: 'insensitive' as const } }, { vin: { contains: q, mode: 'insensitive' as const } }, { lotNumber: { contains: q } }] } : {};
  const [total, rows] = await Promise.all([db.vehicle.count({ where }), db.vehicle.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, include: { images: { orderBy: { position: 'asc' }, take: 1 } } })]);
  const pages = Math.max(1, Math.ceil(total / PER));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">Автомобили <span className="text-lg text-muted">({total})</span></h1><Button asChild variant="copper"><Link href="/admin/vehicles/new"><Plus /> Нов автомобил</Link></Button></div>
      <form className="flex gap-2"><Input name="q" defaultValue={q} placeholder="Търсене по марка, модел, VIN, лот…" /><Button variant="outline">Търси</Button></form>
      <div className="card flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="text-sm"><p className="font-bold text-navy-900">Доставчици на данни</p><p className="text-muted">{ADAPTERS.map((a) => `${a.name}: ${a.isConfigured() ? 'свързан' : 'няма ключ (демо)'}`).join(' · ')}</p></div>
        <div className="flex flex-wrap gap-3"><RunButton action={runSync} label="Синхронизирай доставчици" />{user.role === 'ADMIN' && <RunButton action={recalcPrices} label="Преизчисли цените в EUR" />}</div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted"><tr><th className="p-3" /><th className="p-3">Автомобил</th><th className="p-3">Държава</th><th className="p-3">Пробег</th><th className="p-3">Цена</th><th className="p-3">Статус</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((v) => (
              <tr key={v.id}>
                <td className="p-3"><Photo src={v.images[0]?.url} alt="" className="h-12 w-[72px] rounded" sizes="72px" /></td>
                <td className="p-3"><strong className="block text-navy-900">{v.year} {v.make} {v.model}</strong><span className="font-mono text-xs text-muted">{v.vin ?? '—'}</span> {v.isDemo && <Badge tone="outline">демо</Badge>}</td>
                <td className="p-3">{REGION_LABEL[v.region]}</td><td className="p-3">{num(v.odometerKm)} км</td><td className="p-3 font-semibold">{v.priceEur ? eur(v.priceEur) : '—'}</td>
                <td className="p-3"><div className="flex flex-wrap gap-1"><Badge tone={v.status === 'AVAILABLE' ? 'ok' : 'copper'}>{STATUS_LABEL[v.status]}</Badge>{!v.published && <Badge tone="warn">скрит</Badge>}{v.featured && <Badge tone="navy">топ</Badge>}</div></td>
                <td className="p-3"><div className="flex justify-end gap-1.5">
                  <Button asChild size="icon" variant="outline" aria-label="Редакция"><Link href={`/admin/vehicles/${v.id}`}><Pencil /></Link></Button>
                  <form action={toggleVehiclePublished.bind(null, v.id)}><Button size="sm" variant="outline" type="submit" className="h-10">{v.published ? 'Скрий' : 'Покажи'}</Button></form>
                  <form action={deleteVehicle.bind(null, v.id)}><Button size="icon" variant="danger" type="submit" aria-label="Изтрий"><Trash2 /></Button></form>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && <div className="flex justify-center gap-2">{page > 1 && <Link className="rounded-md border border-line bg-paper px-3 py-2 text-sm" href={`?q=${q}&page=${page - 1}`}>← Назад</Link>}<span className="px-3 py-2 text-sm text-muted">{page} / {pages}</span>{page < pages && <Link className="rounded-md border border-line bg-paper px-3 py-2 text-sm" href={`?q=${q}&page=${page + 1}`}>Напред →</Link>}</div>}
    </div>
  );
}
