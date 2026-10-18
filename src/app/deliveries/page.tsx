import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { REGION_LABEL, dateBg } from '@/lib/format';

export const metadata: Metadata = { title: 'Реализирани доставки', description: 'Автомобили, внесени от САЩ, Канада и Южна Корея и предадени на клиентите ни.', alternates: { canonical: '/deliveries' } };
export const revalidate = 600;

export default async function Deliveries() {
  const rows = await db.completedDelivery.findMany({ orderBy: { deliveredAt: 'desc' } });
  return (
    <>
      <PageHero eyebrow="Реализации" title="Реализирани доставки" text="Част от автомобилите, които сме внесли и предали на клиентите си." />
      <div className="container-x grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((d) => (
          <article key={d.id} className="card p-6">
            <div className="flex items-center justify-between"><Badge tone="navy">{REGION_LABEL[d.origin]}</Badge>{d.isDemo && <Badge tone="outline">Демо</Badge>}</div>
            <h2 className="mt-4 text-xl">{d.title}</h2>
            <p className="text-sm text-muted">{d.year}{d.city ? ` · ${d.city}` : ''}</p>
            <div className="mt-6 flex items-end justify-between border-t border-line pt-4"><p className="text-3xl font-extrabold text-navy-900">{d.days} <span className="text-sm font-semibold text-muted">дни</span></p><p className="text-xs text-muted">предадена на {dateBg(d.deliveredAt)}</p></div>
          </article>
        ))}
        {rows.length === 0 && <p className="text-muted">Все още няма публикувани доставки.</p>}
      </div>
    </>
  );
}
