import Link from 'next/link';
import { Bell, Heart, Inbox, Package, Tag } from 'lucide-react';
import { OrderTimeline } from '@/components/order-timeline';
import { requireUser, STAFF } from '@/lib/auth';
import { db } from '@/lib/db';
import { eur } from '@/lib/format';

export default async function Dashboard() {
  const user = await requireUser('/account');
  const [fav, inq, offers, orders, notif, active] = await Promise.all([
    db.favorite.count({ where: { userId: user.id } }),
    db.inquiry.count({ where: { userId: user.id } }),
    db.offer.findMany({ where: { userId: user.id, status: 'SENT' } }),
    db.order.count({ where: { userId: user.id } }),
    db.notification.count({ where: { userId: user.id, read: false } }),
    db.order.findFirst({ where: { userId: user.id, stage: { lt: 10 } }, orderBy: { createdAt: 'desc' }, include: { events: { orderBy: { createdAt: 'desc' } } } }),
  ]);
  const tiles = [
    { href: '/account/favorites', icon: Heart, n: fav, l: 'Любими' },
    { href: '/account/inquiries', icon: Inbox, n: inq, l: 'Запитвания' },
    { href: '/account/offers', icon: Tag, n: offers.length, l: 'Чакащи оферти' },
    { href: '/account/orders', icon: Package, n: orders, l: 'Поръчки' },
    { href: '/account/notifications', icon: Bell, n: notif, l: 'Нови известия' },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Табло</h1>
        {STAFF.includes(user.role) && <p className="mt-2 text-sm"><Link href="/admin" className="link-arrow">Към админ панела →</Link></p>}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.l} href={t.href} className="card p-5 transition-colors hover:border-navy-900">
            <t.icon className="size-5 text-copper-600" /><p className="mt-4 text-3xl font-extrabold text-navy-900">{t.n}</p><p className="text-xs text-muted">{t.l}</p>
          </Link>
        ))}
      </div>
      {offers.length > 0 && (
        <div className="rounded-lg border border-copper-300 bg-copper-100/50 p-5 text-sm">
          Имате {offers.length} чакаща оферта на обща стойност до <strong>{eur(Math.max(...offers.map((o) => o.totalEur)))}</strong>. <Link href="/account/offers" className="link-arrow">Прегледай →</Link>
        </div>
      )}
      <section>
        <h2 className="mb-4 text-xl">Активна поръчка</h2>
        {active ? <OrderTimeline order={active} showNotes /> : <p className="card p-6 text-sm text-muted">Нямате активни поръчки. <Link href="/catalog" className="link-arrow">Разгледайте каталога →</Link></p>}
      </section>
    </div>
  );
}
