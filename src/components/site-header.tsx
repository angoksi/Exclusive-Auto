import Link from 'next/link';
import { ChevronDown, GitCompareArrows, Heart, Phone, User } from 'lucide-react';
import { Logo } from '@/components/logo';
import { MobileNav } from '@/components/mobile-nav';
import { getUser, STAFF } from '@/lib/auth';
import { getCompareSlugs } from '@/lib/compare';
import { getSiteInfo } from '@/lib/site';

const links = [
  { href: '/calculator', label: 'Калкулатор' },
  { href: '/vin-check', label: 'VIN проверка' },
  { href: '/tracking', label: 'Проследяване' },
  { href: '/how-it-works', label: 'Как работи' },
  { href: '/blog', label: 'Блог' },
  { href: '/contact', label: 'Контакти' },
];

export const catalogMenu = [
  { href: '/catalog?region=usca', label: 'САЩ и Канада', hint: 'Copart, IAAI и др.' },
  { href: '/catalog?region=kr', label: 'Южна Корея', hint: 'Encar, K Car, Autowini' },
  { href: '/find-my-car', label: 'Намери моя автомобил', hint: 'Персонализирано търсене' },
];

export async function SiteHeader() {
  const [user, compare, site] = await Promise.all([getUser(), getCompareSlugs(), getSiteInfo()]);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="hidden bg-navy-900 text-[12.5px] text-white/80 md:block">
        <div className="container-x flex h-9 items-center justify-between">
          <span>Внос от САЩ, Канада и Южна Корея — с прозрачна цена и проследяване</span>
          <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-white">
            <Phone className="size-3.5" /> {site.phone} · {site.hours}
          </a>
        </div>
      </div>
      <div className="container-x flex h-[68px] items-center gap-8">
        <Link href="/" aria-label="EXCLUSIVE AUTO TRADE — начало"><Logo /></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Основна навигация">
          <div className="group relative">
            <Link href="/catalog" className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-mist">
              Автомобили <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-0 top-full w-72 translate-y-1 rounded-lg border border-line bg-paper p-2 opacity-0 shadow-xl shadow-navy-900/10 transition-all group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {[{ href: '/catalog', label: 'Всички автомобили', hint: 'Пълен каталог' }, ...catalogMenu].map((m) => (
                <Link key={m.href} href={m.href} className="block rounded-md px-3 py-2.5 hover:bg-mist">
                  <span className="block text-sm font-semibold text-navy-900">{m.label}</span>
                  <span className="text-xs text-muted">{m.hint}</span>
                </Link>
              ))}
            </div>
          </div>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-mist">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/compare" className="relative grid size-10 place-items-center rounded-md hover:bg-mist" aria-label={`Сравнение (${compare.length})`}>
            <GitCompareArrows className="size-[18px]" />
            {compare.length > 0 && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-copper-600 text-[10px] font-bold text-white">{compare.length}</span>}
          </Link>
          <Link href="/account/favorites" className="grid size-10 place-items-center rounded-md hover:bg-mist" aria-label="Любими"><Heart className="size-[18px]" /></Link>
          {user ? (
            <Link href={STAFF.includes(user.role) ? '/admin' : '/account'} className="hidden h-10 items-center gap-2 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 sm:inline-flex">
              <User className="size-4" /> {user.name.split(' ')[0]}
            </Link>
          ) : (
            <Link href="/login" className="hidden h-10 items-center gap-2 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 sm:inline-flex">Вход</Link>
          )}
          <MobileNav links={[{ href: '/catalog', label: 'Всички автомобили' }, ...catalogMenu, ...links]} loggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
