import { db } from '@/lib/db';
import { buildWhere, parseFilters } from '@/lib/vehicles';

/** Създава известия за нови автомобили, съвпадащи със запазени търсения. Връща броя на създадените известия. */
export async function notifySavedSearches(userId?: string) {
  const searches = await db.savedSearch.findMany({ where: { notify: true, ...(userId ? { userId } : {}) } });
  let created = 0;
  for (const s of searches) {
    const f = parseFilters(Object.fromEntries(new URLSearchParams(s.query)));
    const base = buildWhere({ ...f, page: undefined });
    const fresh = await db.vehicle.findMany({ where: { AND: [base, { createdAt: { gt: s.lastSeenAt } }] }, select: { slug: true }, take: 50 });
    if (fresh.length) {
      await db.notification.create({
        data: { userId: s.userId, title: `Нови автомобили: ${s.name}`, body: `Намерихме ${fresh.length} ${fresh.length === 1 ? 'нов автомобил' : 'нови автомобила'}, отговарящи на запазеното ви търсене.`, href: `/catalog?${s.query}` },
      });
      created++;
    }
    await db.savedSearch.update({ where: { id: s.id }, data: { lastSeenAt: new Date() } });
  }
  return created;
}
