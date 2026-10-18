import Link from 'next/link';
import { Bell, Bookmark, FileText, Heart, Inbox, LayoutDashboard, Package, Settings, Tag, GitCompareArrows, LogOut } from 'lucide-react';
import { logout } from '@/lib/actions/auth';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata = { title: 'Моят профил', robots: { index: false } };

const nav = [
  { href: '/account', label: 'Табло', icon: LayoutDashboard },
  { href: '/account/favorites', label: 'Любими', icon: Heart },
  { href: '/compare', label: 'Сравнение', icon: GitCompareArrows },
  { href: '/account/inquiries', label: 'Запитвания', icon: Inbox },
  { href: '/account/offers', label: 'Оферти', icon: Tag },
  { href: '/account/orders', label: 'Поръчки', icon: Package },
  { href: '/account/documents', label: 'Документи', icon: FileText },
  { href: '/account/searches', label: 'Запазени търсения', icon: Bookmark },
  { href: '/account/notifications', label: 'Известия', icon: Bell },
  { href: '/account/settings', label: 'Настройки', icon: Settings },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('/account');
  const unread = await db.notification.count({ where: { userId: user.id, read: false } });
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-[120px] lg:self-start">
        <div className="card p-5">
          <p className="text-xs text-muted">Здравейте,</p>
          <p className="font-bold text-navy-900">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <nav className="card mt-4 p-2" aria-label="Профил">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-mist">
              <n.icon className="size-4 text-copper-600" /> {n.label}
              {n.href.endsWith('notifications') && unread > 0 && <span className="ml-auto rounded-full bg-copper-600 px-2 text-[11px] text-white">{unread}</span>}
            </Link>
          ))}
          <form action={logout}><button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-muted hover:bg-mist"><LogOut className="size-4" /> Изход</button></form>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
