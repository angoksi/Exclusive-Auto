import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { markNotificationsRead } from '@/lib/actions/user';
import { dateBg } from '@/lib/format';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Известия' };

export default async function Notifications() {
  const user = await requireUser('/account/notifications');
  const rows = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  const unread = rows.filter((r) => !r.read).length;
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="text-3xl">Известия</h1>{unread > 0 && <form action={markNotificationsRead}><Button variant="outline" size="sm">Маркирай всички като прочетени</Button></form>}</div>
      <ul className="card mt-6 divide-y divide-line">
        {rows.length === 0 && <li className="p-8 text-center text-sm text-muted">Няма известия.</li>}
        {rows.map((n) => (
          <li key={n.id} className={cn('p-4', !n.read && 'bg-copper-100/40')}>
            <p className="text-xs text-muted">{dateBg(n.createdAt, true)}</p>
            <p className="font-bold text-navy-900">{n.title}</p>
            <p className="text-sm text-ink/75">{n.body}</p>
            {n.href && <Link href={n.href} className="link-arrow mt-1">Виж →</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}
