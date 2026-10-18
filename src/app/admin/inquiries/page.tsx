import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { INQUIRY_STATUS_LABEL, dateBg } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Запитвания — админ' };
const TYPE = { VEHICLE: 'За автомобил', CALCULATOR: 'Калкулатор', WIZARD: 'Намери автомобил', CONTACT: 'Контакт' } as const;
const STATUSES = ['NEW', 'IN_PROGRESS', 'QUOTED', 'CLOSED'] as const;

export default async function AdminInquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const st = (await searchParams).status;
  const status = STATUSES.find((s) => s === st);
  const rows = await db.inquiry.findMany({ where: status ? { status } : {}, orderBy: { createdAt: 'desc' }, take: 100, include: { vehicle: { select: { make: true, model: true, year: true } } } });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Запитвания и оферти</h1>
      <div className="flex flex-wrap gap-2">
        {[undefined, ...STATUSES].map((s) => <Link key={s ?? 'all'} href={s ? `?status=${s}` : '?'} className={cn('rounded-full border px-4 py-1.5 text-sm font-semibold', status === s ? 'border-navy-900 bg-navy-900 text-white' : 'border-line bg-paper hover:bg-mist')}>{s ? INQUIRY_STATUS_LABEL[s] : 'Всички'}</Link>)}
      </div>
      <div className="card divide-y divide-line">
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted">Няма запитвания.</p>}
        {rows.map((q) => (
          <Link key={q.id} href={`/admin/inquiries/${q.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-mist">
            <span><strong className="block text-navy-900">{q.name} <span className="font-normal text-muted">· {q.email}</span></strong><span className="text-xs text-muted">{dateBg(q.createdAt, true)} · {TYPE[q.type]}{q.vehicle ? ` · ${q.vehicle.year} ${q.vehicle.make} ${q.vehicle.model}` : ''}</span></span>
            <Badge tone={q.status === 'NEW' ? 'copper' : q.status === 'CLOSED' ? 'neutral' : 'ok'}>{INQUIRY_STATUS_LABEL[q.status]}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
