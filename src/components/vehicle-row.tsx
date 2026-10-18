import { VehicleCard } from '@/components/vehicle-card';
import { SectionHead } from '@/components/section-head';
import type { VehicleCardData } from '@/lib/vehicles';

export function VehicleRow({ eyebrow, title, text, href, items, favs, cols = 4 }: { eyebrow?: string; title: string; text?: string; href?: string; items: VehicleCardData[]; favs: Set<string>; cols?: 3 | 4 }) {
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="container-x">
        <SectionHead eyebrow={eyebrow} title={title} text={text} href={href} />
        <div className={`mt-10 grid gap-5 sm:grid-cols-2 ${cols === 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {items.map((v) => <VehicleCard key={v.id} v={v} favorite={favs.has(v.id)} />)}
        </div>
      </div>
    </section>
  );
}
