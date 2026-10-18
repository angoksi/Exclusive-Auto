import type { Metadata } from 'next';
import Link from 'next/link';
import { Photo } from '@/components/photo';
import { CompareButton } from '@/components/compare-button';
import { VehicleCard } from '@/components/vehicle-card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getCompareSlugs } from '@/lib/compare';
import { getPricing } from '@/lib/pricing-server';
import { calculateImport, platformKeyFor, REGION_CURRENCY } from '@/lib/pricing';
import { cardInclude } from '@/lib/vehicles';
import { CONDITION_LABEL, REGION_LABEL, SALE_LABEL, dateBg, eur, kmToMi, num } from '@/lib/format';

export const metadata: Metadata = { title: 'Сравнение на автомобили', robots: { index: false } };

export default async function ComparePage() {
  const slugs = await getCompareSlugs();
  const [config, found] = await Promise.all([getPricing(), db.vehicle.findMany({ where: { slug: { in: slugs }, published: true }, include: { images: { orderBy: { position: 'asc' }, take: 1 } } })]);
  const vehicles = slugs.map((s) => found.find((v) => v.slug === s)).filter((v): v is NonNullable<typeof v> => !!v);

  if (vehicles.length === 0)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-3xl">Няма автомобили за сравнение</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">Добавете до 4 автомобила от каталога с бутона „Сравни“.</p>
        <Button asChild className="mt-8"><Link href="/catalog">Към каталога</Link></Button>
      </div>
    );

  const totals = vehicles.map((v) => {
    const native = (v.saleType === 'BUY_NOW' ? v.buyNowPrice : v.currentBid) ?? v.buyNowPrice ?? v.currentBid ?? 0;
    return calculateImport({ region: v.region, price: native, currency: REGION_CURRENCY[v.region], platform: platformKeyFor(v.source, v.region), destination: 'varna', insurance: true, originProof: true, extras: [] }, config).total;
  });
  const best = Math.min(...totals);

  const rows: [string, (v: (typeof vehicles)[number], i: number) => React.ReactNode][] = [
    ['Държава', (v) => REGION_LABEL[v.region]],
    ['Година', (v) => v.year],
    ['Пробег', (v) => `${num(v.odometerKm)} км (${num(kmToMi(v.odometerKm))} ми)`],
    ['Двигател', (v) => v.engine],
    ['Гориво', (v) => v.fuel],
    ['Трансмисия', (v) => v.transmission],
    ['Задвижване', (v) => v.drive],
    ['Тип', (v) => v.bodyType],
    ['Цвят', (v) => v.color],
    ['Състояние', (v) => CONDITION_LABEL[v.condition]],
    ['Основна повреда', (v) => v.primaryDamage ?? 'Няма'],
    ['В движение', (v) => (v.runsAndDrives ? 'Да' : 'Не')],
    ['Тип продажба', (v) => SALE_LABEL[v.saleType]],
    ['Дата на търга', (v) => dateBg(v.auctionDate)],
    ['Цена на автомобила', (v) => (v.priceEur ? eur(v.priceEur) : '—')],
    ['Прогнозна крайна цена до България', (_, i) => <span className={totals[i] === best && vehicles.length > 1 ? 'font-extrabold text-ok' : 'font-extrabold'}>{eur(totals[i])}</span>],
  ];

  // алтернативи според бюджета
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const alts = await db.vehicle.findMany({ where: { published: true, status: 'AVAILABLE', slug: { notIn: slugs }, priceEur: { gte: Math.round(avg * 0.25), lte: Math.round(avg * 0.7) } }, take: 3, orderBy: { year: 'desc' }, include: cardInclude });

  return (
    <div className="container-x py-12">
      <p className="eyebrow">Сравнение</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Сравнение на автомобили</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Прогнозната крайна цена включва аукционни такси, транспорт до Варна, застраховка, мито, ДДС, такси и комисиона. Ориентировъчна оценка.</p>
      <div className="card mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-44 p-4" />
              {vehicles.map((v) => (
                <th key={v.id} className="w-1/4 p-4 text-left align-top font-normal">
                  <Link href={`/catalog/${v.slug}`}><Photo src={v.images[0]?.url} alt={v.make} className="aspect-[3/2] w-full rounded-md" sizes="300px" /></Link>
                  <Link href={`/catalog/${v.slug}`} className="mt-3 block font-bold text-navy-900 hover:text-copper-700">{v.make} {v.model}</Link>
                  <div className="mt-2"><CompareButton slug={v.slug} variant="full" initial /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">{label}</th>
                {vehicles.map((v, i) => <td key={v.id} className="p-4 font-medium text-navy-900">{fn(v, i)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {alts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl">Алтернативи в по-нисък бюджет</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{alts.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
        </section>
      )}
    </div>
  );
}
