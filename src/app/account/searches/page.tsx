import Link from 'next/link';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteSavedSearch } from '@/lib/actions/user';
import { notifySavedSearches } from '@/lib/saved-search';
import { dateBg } from '@/lib/format';

export const metadata = { title: 'Запазени търсения' };

export default async function Searches() {
  const user = await requireUser('/account/searches');
  await notifySavedSearches(user.id);
  const rows = await db.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h1 className="text-3xl">Запазени търсения</h1>
      <p className="mt-2 text-sm text-muted">Получавате известие, когато в каталога се появи нов автомобил, отговарящ на търсенето.</p>
      <ul className="mt-6 space-y-3">
        {rows.length === 0 && <li className="card p-8 text-center text-sm text-muted">Нямате запазени търсения. Използвайте „Запази това търсене“ във филтрите на <Link href="/catalog" className="link-arrow">каталога</Link>.</li>}
        {rows.map((s) => (
          <li key={s.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div><Link href={`/catalog?${s.query}`} className="font-bold text-navy-900 hover:text-copper-700">{s.name}</Link><p className="mt-0.5 flex items-center gap-2 text-xs text-muted">{s.notify && <Bell className="size-3.5 text-copper-600" />}{dateBg(s.createdAt)}</p></div>
            <form action={deleteSavedSearch.bind(null, s.id)}><Button variant="danger" size="sm"><Trash2 /> Изтрий</Button></form>
          </li>
        ))}
      </ul>
    </div>
  );
}
