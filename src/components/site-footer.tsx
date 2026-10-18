import Link from 'next/link';
import { Logo } from '@/components/logo';
import { getSiteInfo, telHref } from '@/lib/site';

const cols = [
  { title: 'Автомобили', links: [['/catalog', 'Всички автомобили'], ['/catalog?saleType=BUY_NOW', 'Фиксирана цена'], ['/find-my-car', 'Намери моя автомобил'], ['/compare', 'Сравнение']] },
  { title: 'Услуги', links: [['/find-my-car', 'Намери моя автомобил'], ['/compare', 'Сравнение'], ['/how-it-works', 'Как работи'], ['/faq', 'Въпроси']] },
  { title: 'Внос', links: [['/import/south-korea', 'От Южна Корея'], ['/deliveries', 'Реализирани доставки']] },
  { title: 'Компания', links: [['/about', 'За нас'], ['/reviews', 'Отзиви'], ['/blog', 'Блог'], ['/faq', 'Въпроси'], ['/contact', 'Контакти']] },
];

export async function SiteFooter() {
  const site = await getSiteInfo();
  return (
    <footer className="bg-navy-950 text-white/70">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-6">Внос на автомобили от Южна Корея — с ясна цена, внимателна селекция и личен консултант.</p>
          <address className="mt-6 space-y-1 text-sm not-italic">
            <a href={telHref(site.phone)} className="block text-white hover:text-copper-300">{site.phone}</a>
            {site.phone2 && <a href={telHref(site.phone2)} className="block text-white hover:text-copper-300">{site.phone2}</a>}
            {site.email && <a href={`mailto:${site.email}`} className="block hover:text-white">{site.email}</a>}
            <span className="block">{site.hours}</span>
          </address>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white">{c.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {c.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EXCLUSIVE AUTO TRADE. Всички права запазени.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Правна информация">
            <Link href="/privacy" className="hover:text-white">Поверителност</Link>
            <Link href="/terms" className="hover:text-white">Общи условия</Link>
            <Link href="/cookies" className="hover:text-white">Бисквитки</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
