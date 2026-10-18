import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';
import { CatalogFilters } from '@/components/catalog-filters';
import { SortSelect } from '@/components/sort-select';
import { VehicleCard } from '@/components/vehicle-card';
import { Button } from '@/components/ui/button';
import { getUser } from '@/lib/auth';
import { getFavoriteIds } from '@/lib/favorites';
import { cn } from '@/lib/utils';
import { makeModelMap, parseFilters, searchVehicles, toQuery } from '@/lib/vehicles';

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const where = 'от Южна Корея';
  const what = [f.make, f.model].filter(Boolean).join(' ') || 'Автомобили';
  return {
    title: `${what} ${where}`,
    description: `Каталог с автомобили ${where}: филтри по марка, модел, година, цена, пробег, състояние и аукционна платформа. Пълна разбивка на крайната цена до България.`,
    alternates: { canonical: '/catalog' },
    robots: Object.keys(await searchParams).filter((k) => !['make'].includes(k)).length ? { index: false, follow: true } : undefined,
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: SP }) {
  const raw = await searchParams;
  const f = parseFilters(raw);
  const [{ total, items, page, pages }, makeModels, favs, user] = await Promise.all([searchVehicles(f), makeModelMap(f.region), getFavoriteIds(), getUser()]);

  const values = Object.fromEntries(Object.entries(f).filter(([k, v]) => v != null && !['page', 'sort', 'view', 'region'].includes(k)).map(([k, v]) => [k, String(v)]));
  const keep = Object.fromEntries(Object.entries({ region: f.region, sort: f.sort, view: f.view }).filter(([, v]) => v).map(([k, v]) => [k, String(v)]));
  const view = f.view ?? 'grid';
  const link = (over: Record<string, string | number | undefined>) => '/catalog' + toQuery({ ...f, ...over });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((v, i) => ({ '@type': 'ListItem', position: i + 1 + (page - 1) * 12, url: `/catalog/${v.slug}`, name: `${v.make} ${v.model} ${v.year}` })),
  };

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x py-10">
          <p className="eyebrow">Каталог</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Автомобили за внос</h1>
          <p className="mt-2 max-w-2xl text-muted">Подбрани обяви от Южна Корея с ясна цена, състояние и вид продажба — фиксирана цена или търг.</p>
        </div>
      </section>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
        <CatalogFilters values={values} makeModels={makeModels} keepParams={keep} loggedIn={!!user} />
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite"><strong className="text-navy-900">{total}</strong> {total === 1 ? 'автомобил' : 'автомобила'}</p>
            <div className="flex items-center gap-2">
              <SortSelect value={f.sort ?? 'newest'} />
              <div className="flex overflow-hidden rounded-md border border-line bg-paper">
                <Link href={link({ view: 'grid', page: undefined })} aria-label="Решетка" aria-current={view === 'grid'} className={cn('grid size-10 place-items-center', view === 'grid' ? 'bg-navy-900 text-white' : 'hover:bg-mist')}><LayoutGrid className="size-4" /></Link>
                <Link href={link({ view: 'list', page: undefined })} aria-label="Списък" aria-current={view === 'list'} className={cn('grid size-10 place-items-center', view === 'list' ? 'bg-navy-900 text-white' : 'hover:bg-mist')}><List className="size-4" /></Link>
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="card p-12 text-center">
              <h2 className="text-xl">Няма автомобили по тези критерии</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">Разширете филтрите или ни кажете какво търсите — ще намерим подходящ автомобил за вас.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline"><Link href="/catalog">Изчисти филтрите</Link></Button>
                <Button asChild variant="copper"><Link href="/find-my-car">Намери моя автомобил</Link></Button>
              </div>
            </div>
          ) : (
            <div className={cn('grid gap-5', view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
              {items.map((v) => <VehicleCard key={v.id} v={v} favorite={favs.has(v.id)} layout={view} />)}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Страници">
              {page > 1 && <Link href={link({ page: page - 1 })} className="rounded-md border border-line bg-paper px-3.5 py-2 text-sm font-semibold hover:bg-mist">← Назад</Link>}
              {Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1).map((n, i, a) => (
                <span key={n} className="flex items-center gap-1.5">
                  {i > 0 && a[i - 1] !== n - 1 && <span className="text-muted">…</span>}
                  <Link href={link({ page: n })} aria-current={n === page ? 'page' : undefined} className={cn('grid size-10 place-items-center rounded-md border text-sm font-semibold', n === page ? 'border-navy-900 bg-navy-900 text-white' : 'border-line bg-paper hover:bg-mist')}>{n}</Link>
                </span>
              ))}
              {page < pages && <Link href={link({ page: page + 1 })} className="rounded-md border border-line bg-paper px-3.5 py-2 text-sm font-semibold hover:bg-mist">Напред →</Link>}
            </nav>
          )}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
