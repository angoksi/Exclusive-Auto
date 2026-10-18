import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Anchor, Check, KeyRound, Phone, ShieldAlert, Ship, X } from 'lucide-react';
import { Gallery } from '@/components/gallery';
import { FavoriteButton } from '@/components/favorite-button';
import { CompareButton } from '@/components/compare-button';
import { InquiryForm } from '@/components/inquiry-form';
import { VehicleCard } from '@/components/vehicle-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getFavoriteIds } from '@/lib/favorites';
import { getSiteInfo, SITE_NAME, SITE_URL, telHref } from '@/lib/site';
import { cardInclude } from '@/lib/vehicles';
import { CONDITION_LABEL, REGION_LABEL, SALE_LABEL, STATUS_LABEL, dateBg, eur, kmToMi, money, num } from '@/lib/format';
import { STAGES } from '@/lib/stages';

type P = { params: Promise<{ slug: string }> };

const load = (slug: string) => db.vehicle.findFirst({ where: { slug, published: true }, include: { images: { orderBy: { position: 'asc' } }, history: { orderBy: { date: 'desc' } } } });

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const v = await load((await params).slug);
  if (!v) return { title: 'Автомобилът не е намерен' };
  const title = `${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''} ${v.year} — ${REGION_LABEL[v.region]}`;
  return {
    title,
    description: `${v.year} ${v.make} ${v.model}, ${num(v.odometerKm)} км, ${v.engine}. Внос от ${REGION_LABEL[v.region]} с пълна разбивка на крайната цена до България.`,
    alternates: { canonical: `/catalog/${v.slug}` },
    openGraph: { title, images: v.images[0] ? [{ url: v.images[0].url }] : undefined },
  };
}

const delivery = { US: [45, 65], CA: [50, 70], KR: [40, 60] } as const;

export default async function VehiclePage({ params }: P) {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) notFound();
  const [user, favs, site] = await Promise.all([getUser(), getFavoriteIds(), getSiteInfo()]);
  const similar = await db.vehicle.findMany({
    where: { published: true, status: 'AVAILABLE', id: { not: v.id }, region: v.region, OR: [{ bodyType: v.bodyType }, { make: v.make }] },
    orderBy: { year: 'desc' }, take: 3, include: cardInclude,
  });
  const title = `${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`;
  const native = v.saleType === 'BUY_NOW' ? v.buyNowPrice : v.currentBid;
  const price = v.buyNowPrice ?? v.currentBid;
  const damaged = v.condition === 'DAMAGED' || v.condition === 'SALVAGE';
  const [dMin, dMax] = delivery[v.region];

  const spec: [string, string][] = [
    ['Марка', v.make], ['Модел', v.model], ['Модификация', v.trim ?? '—'], ['Година', String(v.year)],
    ['VIN', v.vin ?? 'При запитване'], 
    ['Пробег', `${num(v.odometerKm)} км (${num(kmToMi(v.odometerKm))} мили)`], ['Двигател', v.engine], ['Гориво', v.fuel], ['Трансмисия', v.transmission],
    ['Задвижване', v.drive], ['Тип купе', v.bodyType], ['Цвят', v.color], ['Локация', `${v.location}, ${v.country}`],
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${v.year} ${title}`,
    brand: { '@type': 'Brand', name: v.make },
    model: v.model,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.odometerKm, unitCode: 'KMT' },
    fuelType: v.fuel,
    vehicleTransmission: v.transmission,
    bodyType: v.bodyType,
    color: v.color,
    vehicleIdentificationNumber: v.vin ?? undefined,
    image: v.images.map((i) => (i.url.startsWith('http') ? i.url : SITE_URL + i.url)),
    url: `${SITE_URL}/catalog/${v.slug}`,
    offers: { '@type': 'Offer', availability: v.status === 'AVAILABLE' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', seller: { '@type': 'Organization', name: SITE_NAME } },
  };

  return (
    <>
      <div className="border-b border-line bg-paper">
        <nav className="container-x flex flex-wrap items-center gap-2 py-3 text-xs text-muted" aria-label="Път">
          <Link href="/" className="hover:text-navy-900">Начало</Link>/<Link href="/catalog" className="hover:text-navy-900">Каталог</Link>/
          <Link href="/catalog" className="hover:text-navy-900">{REGION_LABEL[v.region]}</Link>/<span className="text-navy-900">{title}</span>
        </nav>
      </div>

      <div className="container-x grid gap-10 py-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-12">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge tone="navy">{REGION_LABEL[v.region]}</Badge>
              <Badge tone={v.status === 'AVAILABLE' ? 'ok' : 'copper'}>{STATUS_LABEL[v.status]}</Badge>
              <Badge tone={damaged ? 'warn' : 'neutral'}>{CONDITION_LABEL[v.condition]}</Badge>
              {v.isDemo && <Badge tone="outline">Демо обява</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl">{v.year} {title}</h1>
            <p className="mt-1.5 text-muted">{v.engine} · {v.transmission} · {v.drive}</p>
            <div className="mt-6"><Gallery images={v.images} title={`${v.year} ${title}`} /></div>
          </div>

          <nav className="sticky top-[68px] z-20 -mx-4 overflow-x-auto border-y border-line bg-cream/95 px-4 backdrop-blur sm:top-[104px] lg:mx-0 lg:px-0" aria-label="Секции">
            <ul className="flex gap-6 whitespace-nowrap text-sm font-semibold">
              {[['specs', 'Характеристики'], ['condition', 'Състояние'], ['history', 'История'], ['delivery', 'Доставка'], ['similar', 'Подобни']].map(([id, l]) => (
                <li key={id}><a href={`#${id}`} className="block border-b-2 border-transparent py-3.5 text-navy-900/70 hover:border-copper-600 hover:text-navy-900">{l}</a></li>
              ))}
            </ul>
          </nav>

          <section id="specs" className="scroll-mt-40">
            <h2 className="text-2xl">Технически характеристики</h2>
            <dl className="card mt-5 grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
              {spec.map(([k, val], idx) => (
                <div key={k} className={`flex justify-between gap-4 px-5 py-3.5 text-sm sm:border-b sm:border-line ${idx % 2 === 0 ? 'sm:border-r' : ''}`}>
                  <dt className="text-muted">{k}</dt><dd className="text-right font-semibold text-navy-900 break-all">{val}</dd>
                </div>
              ))}
            </dl>
            {v.features.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">{v.features.map((f) => <li key={f} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium"><Check className="size-3.5 text-copper-600" />{f}</li>)}</ul>
            )}
            <p className="prose-bg mt-6">{v.description}</p>
          </section>

          <section id="condition" className="scroll-mt-40">
            <h2 className="text-2xl">Състояние и повреди</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><ShieldAlert className="size-4" /> Основна повреда</p>
                <p className="mt-2 text-lg font-bold text-navy-900">{v.primaryDamage ?? 'Няма докладвана'}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Вторична повреда</p>
                <p className="mt-1 font-semibold text-navy-900">{v.secondaryDamage ?? 'Няма докладвана'}</p>
              </div>
              <ul className="card divide-y divide-line">
                <Row icon={v.runsAndDrives ? Check : X} ok={v.runsAndDrives} label="Статус на движение" value={v.runsAndDrives ? 'В движение (Run & Drive)' : 'Не е в движение'} />
                <Row icon={KeyRound} ok={v.hasKeys} label="Налични ключове" value={v.hasKeys ? 'Да' : 'Не / при уточнение'} />
                <Row icon={damaged ? X : Check} ok={!damaged} label="Общо състояние" value={CONDITION_LABEL[v.condition]} />
              </ul>
            </div>
            {damaged && <p className="mt-4 rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900">Автомобилите с повреди се продават „както са“. Преди наддаване консултант ще ви предостави снимки, ориентировъчна оценка на ремонта и препоръка.</p>}
          </section>

          <section id="history" className="scroll-mt-40">
            <h2 className="text-2xl">История на автомобила</h2>
            {v.history.length ? (
              <ol className="mt-5 space-y-0 border-l-2 border-line pl-6">
                {v.history.map((h) => (
                  <li key={h.id} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[31px] top-1 size-3 rounded-full border-2 border-copper-600 bg-cream" />
                    <p className="text-xs text-muted">{dateBg(h.date)}{h.odometerKm ? ` · ${num(h.odometerKm)} км` : ''}</p>
                    <p className="font-semibold text-navy-900">{h.type}</p>
                    <p className="text-sm text-ink/75">{h.description}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted">Няма налична история за този автомобил.</p>
            )}
          </section>

          <section id="delivery" className="scroll-mt-40">
            <h2 className="text-2xl">Доставка и срокове</h2>
            <div className="card mt-5 p-6">
              <p className="flex items-center gap-3 text-navy-900"><Ship className="size-6 text-copper-600" /><span><strong className="text-xl">{dMin}–{dMax} дни</strong> <span className="text-sm text-muted">ориентировъчно от покупката до предаването в България</span></span></p>
              <ol className="mt-6 grid gap-3 sm:grid-cols-2">
                {STAGES.map((s) => (
                  <li key={s.n} className="flex gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy-900 text-[11px] font-bold text-white">{s.n}</span><span className="text-ink/80">{s.title}</span></li>
                ))}
              </ol>
              <p className="mt-5 flex items-start gap-2 text-xs text-muted"><Anchor className="mt-0.5 size-4 shrink-0" />Сроковете зависят от графика на корабите и митническата обработка. Консултантът ви информира на всеки етап.</p>
            </div>
          </section>

          {similar.length > 0 && (
            <section id="similar" className="scroll-mt-40">
              <h2 className="text-2xl">Подобни автомобили</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{similar.map((s) => <VehicleCard key={s.id} v={s} favorite={favs.has(s.id)} />)}</div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-[120px] lg:self-start">
          <div className="card overflow-hidden shadow-lg shadow-navy-900/5">
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Цена · {SALE_LABEL[v.saleType]}</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-navy-900">При запитване</p>
              <p className="mt-2 text-xs text-muted">Свържете се с консултант за цена и пълна оферта за доставка до България.</p>
              {v.auctionDate && <p className="mt-4 rounded-md bg-mist px-3 py-2 text-sm"><span className="text-muted">Дата на търга:</span> <strong>{dateBg(v.auctionDate, true)}</strong></p>}
            </div>
            <div className="grid gap-2.5 border-t border-line bg-cream/50 p-6">
              <Button asChild variant="copper" size="lg"><a href="#inquiry">Направи запитване</a></Button>
              <div className="grid grid-cols-2 gap-2.5">
                <FavoriteButton vehicleId={v.id} initial={favs.has(v.id)} variant="full" />
                <CompareButton slug={v.slug} variant="full" />
              </div>
              <Button asChild variant="outline" size="lg"><a href={telHref(site.phone)}><Phone /> Свържи се с консултант</a></Button>
            </div>
          </div>
          <div id="inquiry" className="card mt-5 scroll-mt-32 p-6">
            <h2 className="text-lg">Запитване за този автомобил</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Консултант ще отговори в рамките на работния ден.</p>
            <InquiryForm type="VEHICLE" compact vehicleSlug={v.slug} user={user} defaultMessage={`Интересувам се от ${v.year} ${title}.`} />
          </div>
        </aside>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}

function Row({ icon: Icon, ok, label, value }: { icon: React.ComponentType<{ className?: string }>; ok: boolean; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-4 text-sm">
      <span className={`grid size-8 place-items-center rounded-full ${ok ? 'bg-emerald-50 text-ok' : 'bg-red-50 text-danger'}`}><Icon className="size-4" /></span>
      <span className="flex-1 text-muted">{label}</span>
      <span className="font-semibold text-navy-900">{value}</span>
    </li>
  );
}
