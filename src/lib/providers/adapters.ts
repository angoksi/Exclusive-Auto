import { createFeedAdapter } from './feed';
import { carapis } from './carapis';
import type { NormalizedVehicle } from './types';
import type { Condition, Region, SaleType, Source } from '@/generated/prisma/enums';

/**
 * Очакван формат на лицензирания фийд (примерен договор). При реален доставчик съпоставката
 * в map() се коригира според документацията му — останалата система не се променя.
 */
type FeedRow = {
  id: string; vin?: string; lot?: string; make: string; model: string; trim?: string; year: number;
  odometer_km?: number; odometer_mi?: number; engine?: string; fuel?: string; transmission?: string; drive?: string; body?: string; color?: string;
  sale_type?: 'auction' | 'buy_now'; current_bid?: number; buy_now?: number; currency?: string; auction_at?: string;
  location?: string; country?: string; primary_damage?: string; secondary_damage?: string; runs?: boolean; keys?: boolean;
  condition?: string; description?: string; images?: string[];
};

const mapFeed = (source: Source, region: Region, platform: string) => (r: FeedRow): NormalizedVehicle | null => {
  if (!r.id || !r.make || !r.model || !r.year) return null;
  const km = r.odometer_km ?? Math.round((r.odometer_mi ?? 0) * 1.609344);
  const damaged = Boolean(r.primary_damage);
  return {
    source, sourceId: String(r.id), region, make: r.make, model: r.model, trim: r.trim, year: r.year, vin: r.vin, lotNumber: r.lot, platform,
    saleType: (r.sale_type === 'buy_now' ? 'BUY_NOW' : 'AUCTION') as SaleType,
    currency: (r.currency as NormalizedVehicle['currency']) ?? (region === 'KR' ? 'KRW' : region === 'CA' ? 'CAD' : 'USD'),
    currentBid: r.current_bid, buyNowPrice: r.buy_now, auctionDate: r.auction_at ? new Date(r.auction_at) : undefined,
    location: r.location ?? '—', country: r.country ?? 'Южна Корея',
    odometerKm: km, engine: r.engine ?? '—', fuel: r.fuel ?? '—', transmission: r.transmission ?? '—', drive: r.drive ?? '—', bodyType: r.body ?? '—', color: r.color ?? '—',
    condition: (damaged ? 'DAMAGED' : (r.condition?.toUpperCase() as Condition) ?? 'GOOD'),
    primaryDamage: r.primary_damage, secondaryDamage: r.secondary_damage, runsAndDrives: r.runs ?? true, hasKeys: r.keys ?? true,
    description: r.description ?? '', images: r.images ?? [],
  };
};

export const encar = createFeedAdapter<FeedRow>({ id: 'ENCAR', name: 'Encar', regions: ['KR'], envPrefix: 'ENCAR', map: (r) => mapFeed('ENCAR', 'KR', 'Encar')(r) });
export const kcar = createFeedAdapter<FeedRow>({ id: 'KCAR', name: 'K Car', regions: ['KR'], envPrefix: 'KCAR', map: (r) => mapFeed('KCAR', 'KR', 'K Car')(r) });
export const autowini = createFeedAdapter<FeedRow>({ id: 'AUTOWINI', name: 'Autowini', regions: ['KR'], envPrefix: 'AUTOWINI', map: (r) => mapFeed('AUTOWINI', 'KR', 'Autowini')(r) });

export const ADAPTERS = [carapis, encar, kcar, autowini];
