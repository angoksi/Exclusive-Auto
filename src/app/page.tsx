import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Globe2, ShieldCheck, Star } from 'lucide-react';
import { HeroSearch } from '@/components/hero-search';
import { Photo } from '@/components/photo';
import { Reveal } from '@/components/reveal';
import { SectionHead } from '@/components/section-head';
import { VehicleRow } from '@/components/vehicle-row';
import { FaqList } from '@/components/faq-list';
import { InquiryForm } from '@/components/inquiry-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getFavoriteIds } from '@/lib/favorites';
import { getSiteInfo } from '@/lib/site';
import { PROCESS, WHY } from '@/lib/content';
import { REGION_LABEL, dateBg } from '@/lib/format';
import { latest, makeModelMap, cardInclude } from '@/lib/vehicles';

export const revalidate = 300;

export default async function Home() {
  const [makeModels, featured, newest, fixed, suv, electrified, deliveries, reviews, faqs, favs, user, site, counts] = await Promise.all([
    makeModelMap(),
    db.vehicle.findMany({ where: { region: 'KR', published: true, status: 'AVAILABLE', featured: true }, orderBy: { createdAt: 'desc' }, take: 4, include: cardInclude }),
    latest(8),
    latest(4, { saleType: 'BUY_NOW' }),
    latest(4, { bodyType: 'SUV' }),
    latest(4, { fuel: { in: ['Електрически', 'Хибрид', 'Plug-in хибрид'] } }),
    db.completedDelivery.findMany({ orderBy: { deliveredAt: 'desc' }, take: 4 }),
    db.review.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
    db.faq.findMany({ orderBy: { position: 'asc' }, take: 5 }),
    getFavoriteIds(),
    getUser(),
    getSiteInfo(),
    db.vehicle.count({ where: { region: 'KR', published: true, status: 'AVAILABLE' } }),
  ]);
  const hasHero = fs.existsSync(path.join(/*turbopackIgnore: true*/ process.cwd(), 'public/images/hero.jpg'));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0">
          {hasHero ? <Photo src="/images/hero.jpg" alt="" priority sizes="100vw" className="size-full opacity-60" /> : <Photo src="/api/demo-image/coupe/c9bfae/3" alt="" priority className="size-full object-cover opacity-40" />}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
        </div>
        <div className="container-x relative pb-10 pt-16 sm:pt-24 lg:pb-14">
          <Reveal>
            <p className="eyebrow !text-copper-300">Внос от Южна Корея</p>
            <h1 className="mt-5 max-w-3xl text-[40px] font-extrabold leading-[1.05] !text-white sm:text-6xl lg:text-7xl">Твоят следващ автомобил. <span className="text-copper-300">Без граници.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">Внасяме автомобили от Южна Корея — с ясна разбивка на цената, личен консултант и проследяване на всеки етап до предаването.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild variant="copper" size="lg"><Link href="/catalog">Разгледай автомобили</Link></Button>
              <Button asChild variant="light" size="lg"><Link href="/calculator">Получаване на оферта</Link></Button>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="mt-14 lg:mt-20"><HeroSearch makeModels={makeModels} /></Reveal>
          <dl className="mt-8 grid max-w-3xl grid-cols-3 gap-6 text-white">
            {[[String(counts), 'автомобила в каталога'], ['KR', 'директен внос от Корея'], ['10', 'етапа на проследяване']].map(([n, l]) => (
              <div key={l}><dt className="text-3xl font-extrabold text-copper-300">{n}</dt><dd className="mt-1 text-xs text-white/60 sm:text-sm">{l}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      {/* Markets */}
      <section className="bg-paper py-12">
        <div className="container-x grid gap-4 md:grid-cols-3">
          {[{ href: '/catalog?source=ENCAR', t: 'Encar', d: 'Най-голямата корейска платформа за употребявани автомобили' }, { href: '/catalog?source=KCAR', t: 'K Car', d: 'Сертифицирани автомобили с проверка на състоянието' }, { href: '/catalog?source=AUTOWINI', t: 'Autowini', d: 'Експортна платформа с фиксирани цени' }].map((m) => (
            <Link key={m.t} href={m.href} className="group flex items-center justify-between rounded-lg border border-line p-6 transition-colors hover:border-navy-900">
              <span><span className="block text-xl font-bold text-navy-900">{m.t}</span><span className="text-sm text-muted">{m.d}</span></span>
              <ArrowRight className="size-5 text-copper-600 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <VehicleRow eyebrow="Селекция" title="Препоръчани автомобили" text="Подбрани от нашия екип по състояние, цена и ликвидност." href="/catalog" items={featured} favs={favs} />
      <div className="bg-paper"><VehicleRow eyebrow="Ново в каталога" title="Последно добавени" href="/catalog?sort=newest" items={newest} favs={favs} /></div>
      <VehicleRow eyebrow="Готови за покупка" title="Автомобили с фиксирана цена" href="/catalog?saleType=BUY_NOW" items={fixed} favs={favs} />
      <div className="bg-paper"><VehicleRow eyebrow="Най-търсени" title="SUV модели" href="/catalog?bodyType=SUV" items={suv} favs={favs} /></div>
      <VehicleRow eyebrow="Икономични" title="Хибридни и електрически" href="/catalog?fuel=Електрически" items={electrified} favs={favs} />

      {/* Process */}
      <section className="section bg-navy-900 text-white">
        <div className="container-x">
          <SectionHead eyebrow="Процес" title="Как работи вносът" text="Шест ясни стъпки от първия разговор до ключовете в ръката ви." center />
          <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <li className="list-none border-t border-white/15 pt-6">
                  <span className="text-sm font-bold text-copper-300">0{i + 1}</span>
                  <h3 className="mt-3 text-lg !text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
          <div className="mt-12 text-center"><Button asChild variant="light"><Link href="/how-it-works">Подробно за процеса</Link></Button></div>
        </div>
      </section>

      {/* Why us */}
      <section className="section">
        <div className="container-x">
          <SectionHead eyebrow="Защо ние" title="Работим така, както бихме искали да работят с нас" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w, i) => {
              const Icon = [BadgeCheck, ShieldCheck, Globe2][i % 3];
              return (
                <Reveal key={w.title} delay={(i % 3) * 0.06}>
                  <div className="card h-full p-7"><Icon className="size-6 text-copper-600" /><h3 className="mt-5 text-lg">{w.title}</h3><p className="mt-2 text-sm leading-6 text-ink/70">{w.text}</p></div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Deliveries */}
      {deliveries.length > 0 && (
        <section className="section bg-paper">
          <div className="container-x">
            <SectionHead eyebrow="Реализирани доставки" title="Автомобили, които вече са при собствениците си" href="/deliveries" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {deliveries.map((d) => (
                <div key={d.id} className="card p-6">
                  <div className="flex items-center justify-between"><Badge tone="navy">{REGION_LABEL[d.origin]}</Badge>{d.isDemo && <Badge tone="outline">Демо</Badge>}</div>
                  <h3 className="mt-4 text-lg">{d.title}</h3>
                  <p className="text-sm text-muted">{d.year}{d.city ? ` · ${d.city}` : ''}</p>
                  <p className="mt-5 text-3xl font-extrabold text-navy-900">{d.days} <span className="text-sm font-semibold text-muted">дни</span></p>
                  <p className="text-xs text-muted">предадена на {dateBg(d.deliveredAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionHead eyebrow="Клиентски отзиви" title="Какво казват клиентите ни" href="/reviews" />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="card flex flex-col p-7">
                  <div className="flex gap-0.5 text-copper-600" aria-label={`${r.rating} от 5`}>{Array.from({ length: r.rating }, (_, i) => <Star key={i} className="size-4 fill-current" />)}</div>
                  <blockquote className="mt-4 flex-1 text-[15px] leading-7 text-ink/80">{r.text}</blockquote>
                  <figcaption className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm"><span><strong className="text-navy-900">{r.author}</strong>{r.city ? `, ${r.city}` : ''}</span>{r.isDemo && <Badge tone="outline">Примерен</Badge>}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section bg-paper">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow">Въпроси</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Често задавани въпроси</h2>
            <p className="mt-3 text-muted">Не намирате отговор? Пишете ни и ще ви отговорим лично.</p>
            <Link href="/faq" className="link-arrow mt-6">Всички въпроси <ArrowRight className="size-4" /></Link>
          </div>
          <FaqList items={faqs} />
        </div>
      </section>

      {/* Contact */}
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Контакт</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Разкажете ни какво търсите</h2>
            <p className="mt-3 max-w-md text-muted">Оставете запитване и консултант ще ви предложи конкретни автомобили с пълна разбивка на цената.</p>
            <ul className="mt-8 space-y-2 text-sm"><li><strong className="text-navy-900">{site.phone}</strong></li><li>{site.email}</li><li>{site.address}</li><li className="text-muted">{site.hours}</li></ul>
          </div>
          <div className="card p-7"><InquiryForm type="CONTACT" user={user} submitLabel="Изпрати" /></div>
        </div>
      </section>
    </>
  );
}
