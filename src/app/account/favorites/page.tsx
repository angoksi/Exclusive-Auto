import Link from 'next/link';
import { VehicleCard } from '@/components/vehicle-card';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { cardInclude } from '@/lib/vehicles';

export const metadata = { title: 'Любими автомобили' };

export default async function Favorites() {
  const user = await requireUser('/account/favorites');
  const rows = await db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { vehicle: { include: cardInclude } } });
  return (
    <div>
      <h1 className="text-3xl">Любими автомобили</h1>
      {rows.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map((r) => <VehicleCard key={r.vehicleId} v={r.vehicle} favorite />)}</div>
      ) : (
        <p className="card mt-6 p-8 text-center text-sm text-muted">Още нямате любими. <Link href="/catalog" className="link-arrow">Към каталога →</Link></p>
      )}
    </div>
  );
}
