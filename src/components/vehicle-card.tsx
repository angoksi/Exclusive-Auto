import Link from 'next/link';
import { Calendar, Gauge, MapPin, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Photo } from '@/components/photo';
import { FavoriteButton } from '@/components/favorite-button';
import { CompareButton } from '@/components/compare-button';
import { cn } from '@/lib/utils';
import { CONDITION_LABEL, REGION_LABEL, SALE_LABEL, dateBg, eur, money, num } from '@/lib/format';
import type { VehicleCardData } from '@/lib/vehicles';

export function vehiclePrice(v: VehicleCardData) {
  const native = v.saleType === 'BUY_NOW' ? v.buyNowPrice : v.currentBid;
  return { label: v.saleType === 'BUY_NOW' ? 'Цена' : v.currentBid != null ? 'Текуща цена' : 'Цена', eur: v.priceEur, native: native != null ? money(native, v.currency) : null };
}

export function VehicleCard({ v, favorite = false, layout = 'grid' }: { v: VehicleCardData; favorite?: boolean; layout?: 'grid' | 'list' }) {
  const title = `${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`;
  const damaged = v.condition === 'DAMAGED' || v.condition === 'SALVAGE';
  return (
    <article className={cn('group card overflow-hidden transition-shadow hover:shadow-lg hover:shadow-navy-900/8', layout === 'list' && 'sm:flex')}>
      <div className={cn('relative aspect-[3/2] overflow-hidden bg-mist', layout === 'list' && 'sm:aspect-auto sm:w-[320px] sm:shrink-0')}>
        <Link href={`/catalog/${v.slug}`} aria-label={title} className="absolute inset-0">
          <Photo src={v.images[0]?.url} alt={title} sizes="(min-width:1024px) 360px, 100vw" className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="navy">{REGION_LABEL[v.region]}</Badge>
          {v.isDemo && <Badge tone="outline">Демо</Badge>}
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <FavoriteButton vehicleId={v.id} initial={favorite} />
          <CompareButton slug={v.slug} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] leading-snug"><Link href={`/catalog/${v.slug}`} className="hover:text-copper-700">{title}</Link></h3>
            <p className="mt-0.5 text-xs text-muted">{v.engine}</p>
          </div>
          <Badge tone={damaged ? 'warn' : v.status === 'RESERVED' ? 'copper' : 'ok'}>{v.status === 'RESERVED' ? 'Резервиран' : CONDITION_LABEL[v.condition]}</Badge>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-ink/75">
          <li className="flex items-center gap-1.5"><Calendar className="size-3.5 text-copper-600" />{v.year}</li>
          <li className="flex items-center gap-1.5"><Gauge className="size-3.5 text-copper-600" />{num(v.odometerKm)} км</li>
          <li className="flex items-center gap-1.5"><Zap className="size-3.5 text-copper-600" />{v.fuel}</li>
          <li className="flex items-center gap-1.5"><MapPin className="size-3.5 text-copper-600" />{v.location}</li>
        </ul>
        <div className="mt-5 flex flex-1 items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Цена · {SALE_LABEL[v.saleType]}</p>
            <p className="text-xl font-extrabold text-navy-900">При запитване</p>
            {v.saleType === 'AUCTION' && v.auctionDate && <p className="text-xs text-muted">търг {dateBg(v.auctionDate)}</p>}
          </div>
          <Link href={`/catalog/${v.slug}`} className="inline-flex h-9 items-center rounded-md bg-navy-900 px-4 text-[13px] font-semibold text-white hover:bg-navy-800">Детайли</Link>
        </div>
      </div>
    </article>
  );
}
