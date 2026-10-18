import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { PageHero } from '@/components/page-hero';
import { VehicleRow } from '@/components/vehicle-row';
import { Button } from '@/components/ui/button';
import { getFavoriteIds } from '@/lib/favorites';
import { MARKETS, PROCESS } from '@/lib/content';
import { latest } from '@/lib/vehicles';

type P = { params: Promise<{ market: string }> };
export const generateStaticParams = () => Object.keys(MARKETS).map((market) => ({ market }));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const m = MARKETS[(await params).market as keyof typeof MARKETS];
  if (!m) return {};
  return { title: m.title, description: `${m.intro} Платформи: ${m.platforms}. Срок ${m.time}.`, alternates: { canonical: `/import/${m.slug}` } };
}

export default async function MarketPage({ params }: P) {
  const m = MARKETS[(await params).market as keyof typeof MARKETS];
  if (!m) notFound();
  const [items, favs] = await Promise.all([latest(4, { region: m.region }), getFavoriteIds()]);
  return (
    <>
      <PageHero eyebrow="Внос" title={m.title} text={m.intro}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="copper" size="lg"><Link href={`/catalog?region=${m.region.toLowerCase()}`}>Автомобили от {m.short}</Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/calculator">Калкулатор</Link></Button>
        </div>
      </PageHero>
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-2xl">Какво получавате</h2>
            <ul className="mt-5 space-y-3">{m.points.map((p) => <li key={p} className="flex gap-3 text-[15px]"><Check className="mt-1 size-4 shrink-0 text-copper-600" />{p}</li>)}</ul>
            <p className="mt-8 rounded-md bg-copper-100/60 p-4 text-sm leading-6 text-ink/80">{m.note}</p>
          </div>
          <dl className="card divide-y divide-line">
            <div className="p-6"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Платформи</dt><dd className="mt-1 font-bold text-navy-900">{m.platforms}</dd></div>
            <div className="p-6"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Ориентировъчен срок</dt><dd className="mt-1 text-2xl font-extrabold text-navy-900">{m.time}</dd></div>
            <div className="p-6"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Процес</dt><dd className="mt-1 text-sm text-ink/75">{PROCESS.length} стъпки · проследяване на всеки етап</dd></div>
          </dl>
        </div>
      </section>
      <VehicleRow title={`Налични от ${m.short}`} href={`/catalog?region=${m.region.toLowerCase()}`} items={items} favs={favs} />
    </>
  );
}
