import { Check } from 'lucide-react';
import { RouteMap } from '@/components/route-map';
import { STAGES } from '@/lib/stages';
import { cn } from '@/lib/utils';
import { dateBg } from '@/lib/format';

type Ev = { id: string; stage: number; title: string; note: string | null; location: string | null; lat: number | null; lng: number | null; createdAt: Date };
type Ord = { number: string; vehicleTitle: string; stage: number; estimatedDelivery: Date | null; events: Ev[]; vin?: string };

export function OrderTimeline({ order, showNotes }: { order: Ord; showNotes: boolean }) {
  const last = order.events[0];
  const points = [...order.events].reverse().filter((e) => e.lat != null && e.lng != null).map((e) => ({ lat: e.lat!, lng: e.lng!, label: e.location }));
  const pct = Math.round(((order.stage - 1) / (STAGES.length - 1)) * 100);
  return (
    <div className="space-y-8">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Поръчка {order.number}</p>
            <h2 className="mt-1 text-2xl">{order.vehicleTitle}</h2>
            {showNotes && order.vin && <p className="mt-1 font-mono text-sm text-muted">{order.vin}</p>}
          </div>
          <dl className="grid grid-cols-2 gap-6 text-sm">
            <div><dt className="text-muted">Очаквана дата</dt><dd className="mt-0.5 text-lg font-extrabold text-navy-900">{dateBg(order.estimatedDelivery)}</dd></div>
            <div><dt className="text-muted">Последна актуализация</dt><dd className="mt-0.5 text-lg font-extrabold text-navy-900">{last ? dateBg(last.createdAt) : '—'}</dd></div>
          </dl>
        </div>
        <div className="mt-8">
          <div className="h-2 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-copper-600" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-sm text-muted">Етап {order.stage} от {STAGES.length}: <strong className="text-navy-900">{STAGES[order.stage - 1]?.title}</strong></p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ol className="card p-6 sm:p-8" aria-label="Етапи на доставката">
          {STAGES.map((s, i) => {
            const done = s.n < order.stage, current = s.n === order.stage;
            return (
              <li key={s.n} className="relative flex gap-4 pb-7 last:pb-0">
                {i < STAGES.length - 1 && <span className={cn('absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5', done ? 'bg-copper-600' : 'bg-line')} />}
                <span className={cn('relative grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold', done && 'bg-copper-600 text-white', current && 'bg-navy-900 text-white ring-4 ring-navy-900/15', !done && !current && 'border-2 border-line bg-paper text-muted')}>
                  {done ? <Check className="size-4" /> : s.n}
                </span>
                <div>
                  <p className={cn('text-sm font-bold', !done && !current ? 'text-muted' : 'text-navy-900')}>{s.title}{current && <span className="ml-2 rounded-sm bg-copper-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-copper-700">Сега</span>}</p>
                  {(current || done) && <p className="mt-0.5 text-xs text-muted">{s.hint}</p>}
                </div>
              </li>
            );
          })}
        </ol>
        <div className="space-y-8">
          {points.length > 0 && <RouteMap points={points} />}
          <div className="card p-6 sm:p-8">
            <h3 className="text-lg">История на събитията</h3>
            {order.events.length ? (
              <ul className="mt-5 divide-y divide-line">
                {order.events.map((e) => (
                  <li key={e.id} className="py-4 first:pt-0 last:pb-0">
                    <p className="text-xs text-muted">{dateBg(e.createdAt, true)}{e.location ? ` · ${e.location}` : ''}</p>
                    <p className="font-semibold text-navy-900">{e.title}</p>
                    {showNotes && e.note && <p className="mt-1 rounded-md bg-mist p-3 text-sm text-ink/80">{e.note}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-muted">Все още няма записани събития.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
