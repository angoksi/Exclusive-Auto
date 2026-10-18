import Link from 'next/link';
import { BarChart3, Car, FileText, HelpCircle, Inbox, Package, Settings2, Users, Newspaper, Percent } from 'lucide-react';
import { requireRole, STAFF } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/format';

export const metadata = { title: 'Админ панел', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(STAFF, '/admin');
  const nav = [
    { href: '/admin', label: 'Статистики', icon: BarChart3 },
    { href: '/admin/vehicles', label: 'Автомобили', icon: Car },
    { href: '/admin/inquiries', label: 'Запитвания и оферти', icon: Inbox },
    { href: '/admin/orders', label: 'Поръчки и доставки', icon: Package },
    { href: '/admin/blog', label: 'Блог', icon: Newspaper },
    { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/admin/content', label: 'Отзиви, доставки, контакти', icon: FileText },
    ...(user.role === 'ADMIN' ? [{ href: '/admin/pricing', label: 'Цени и мито', icon: Percent }, { href: '/admin/users', label: 'Потребители', icon: Users }] : []),
  ];
  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[250px_1fr]">
      <aside className="lg:sticky lg:top-[120px] lg:self-start">
        <div className="card flex items-center gap-3 p-4"><Settings2 className="size-5 text-copper-600" /><div><p className="text-sm font-bold text-navy-900">Админ панел</p><p className="text-xs text-muted">{ROLE_LABEL[user.role]} · {user.name}</p></div></div>
        <nav className="card mt-3 p-2" aria-label="Админ навигация">
          {nav.map((n) => <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-mist"><n.icon className="size-4 text-copper-600" />{n.label}</Link>)}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
