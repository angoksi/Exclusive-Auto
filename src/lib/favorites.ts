import 'server-only';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function getFavoriteIds(): Promise<Set<string>> {
  const user = await getUser();
  if (!user) return new Set();
  const rows = await db.favorite.findMany({ where: { userId: user.id }, select: { vehicleId: true } });
  return new Set(rows.map((r) => r.vehicleId));
}
