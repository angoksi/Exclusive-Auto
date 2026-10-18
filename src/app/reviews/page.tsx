import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Клиентски отзиви', description: 'Какво казват клиентите, внесли автомобил чрез EXCLUSIVE AUTO TRADE.', alternates: { canonical: '/reviews' } };
export const revalidate = 600;

export default async function Reviews() {
  const rows = await db.review.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } });
  return (
    <>
      <PageHero eyebrow="Отзиви" title="Клиентски отзиви" />
      <div className="container-x grid gap-5 py-12 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <figure key={r.id} className="card flex flex-col p-7">
            <div className="flex gap-0.5 text-copper-600">{Array.from({ length: r.rating }, (_, i) => <Star key={i} className="size-4 fill-current" />)}</div>
            <blockquote className="mt-4 flex-1 text-[15px] leading-7 text-ink/80">{r.text}</blockquote>
            <figcaption className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm"><span><strong className="text-navy-900">{r.author}</strong>{r.city ? `, ${r.city}` : ''}{r.vehicle ? ` · ${r.vehicle}` : ''}</span>{r.isDemo && <Badge tone="outline">Примерен</Badge>}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
