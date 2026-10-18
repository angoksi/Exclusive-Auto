import type { Listings, NormalizedVehicle, ProviderAdapter } from './types';
import { ProviderNotConfigured } from './types';
import type { Source } from '@/generated/prisma/enums';

/**
 * Адаптер за Carapis API (https://docs.carapis.com/api/getting-started) — платена услуга за обяви от корейски платформи.
 * Преди търговска употреба проверете условията на Carapis и на съответната платформа за ползване и показване на данните.
 *
 * Променливи: CARAPIS_API_KEY (задължителна), CARAPIS_API_URL (по подразбиране https://api.carapis.com/v2),
 * CARAPIS_SOURCES (платформи, разделени със запетая, по подразбиране "encar"), CARAPIS_QUERY (допълнителни филтри, напр. "make=Hyundai"),
 * CARAPIS_MAX_LISTINGS (макс. обяви на платформа за една синхронизация, по подразбиране 200).
 */
type Row = {
  id: string; source?: string; make?: string; model?: string; trim?: string; year?: number; mileage?: number; price?: number; currency?: string;
  location?: string; fuel_type?: string; transmission?: string; photos?: string[]; dealer?: string; url?: string;
  inspection_sheet?: unknown; accident_history?: unknown; price_history?: unknown;
};
type Page = { count?: number; page?: number; limit?: number; results?: Row[] };

const SOURCE_MAP: Record<string, Source> = { encar: 'ENCAR', kcar: 'KCAR', autowini: 'AUTOWINI' };
const FUEL: Record<string, string> = { gasoline: 'Бензин', petrol: 'Бензин', diesel: 'Дизел', hybrid: 'Хибрид', electric: 'Електрически', lpg: 'LPG', 'plug-in hybrid': 'Plug-in хибрид' };
const GEAR: Record<string, string> = { automatic: 'Автоматична', manual: 'Ръчна' };
const PLATFORM: Record<string, string> = { ENCAR: 'Encar', KCAR: 'K Car', AUTOWINI: 'Autowini', OTHER: 'Друг източник' };

function map(r: Row, slug: string): NormalizedVehicle | null {
  if (!r.id || !r.make || !r.model || !r.year) return null;
  const source = SOURCE_MAP[slug] ?? 'OTHER';
  const currency = (r.currency === 'USD' || r.currency === 'EUR' || r.currency === 'KRW' ? r.currency : 'KRW') as NormalizedVehicle['currency'];
  return {
    source, sourceId: String(r.id), region: 'KR', make: r.make, model: r.model, trim: r.trim, year: r.year, platform: PLATFORM[source],
    saleType: 'BUY_NOW', currency, buyNowPrice: r.price && r.price > 0 ? Math.round(r.price) : undefined,
    location: r.location ?? '—', country: 'Южна Корея', odometerKm: Math.round(r.mileage ?? 0),
    engine: '—', fuel: FUEL[(r.fuel_type ?? '').toLowerCase()] ?? (r.fuel_type || '—'), transmission: GEAR[(r.transmission ?? '').toLowerCase()] ?? (r.transmission || '—'),
    drive: '—', bodyType: '—', color: '—', condition: 'GOOD', runsAndDrives: true, hasKeys: true,
    description: `${r.year} ${r.make} ${r.model}${r.trim ? ' ' + r.trim : ''} от ${PLATFORM[source]}${r.dealer ? `, продавач: ${r.dealer}` : ''}. Свържете се с консултант за пълна информация, снимки и оферта за доставка.`,
    images: (r.photos ?? []).filter((u) => /^https:\/\//.test(u)).slice(0, 12),
  };
}

const baseUrl = () => (process.env.CARAPIS_API_URL ?? 'https://api.carapis.com/v2').replace(/\/$/, '');
const sources = () => (process.env.CARAPIS_SOURCES ?? 'encar').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export const carapis: ProviderAdapter & { slugs: () => string[] } = {
  id: 'ENCAR',
  name: 'Carapis',
  regions: ['KR'],
  slugs: sources,
  isConfigured: () => Boolean(process.env.CARAPIS_API_KEY),
  async fetchListings(opts) {
    const key = process.env.CARAPIS_API_KEY;
    if (!key) throw new ProviderNotConfigured('Carapis');
    const max = Math.max(1, opts?.limit ?? Number(process.env.CARAPIS_MAX_LISTINGS ?? 200));
    const extra = new URLSearchParams(process.env.CARAPIS_QUERY ?? '');
    const out: NormalizedVehicle[] = [];
    let complete = true;
    for (const slug of sources()) {
      let page = 1;
      let got = 0;
      for (;;) {
        const u = new URL(`${baseUrl()}/listings`);
        extra.forEach((v, k) => u.searchParams.set(k, v));
        u.searchParams.set('source', slug);
        u.searchParams.set('limit', String(Math.min(50, max - got)));
        u.searchParams.set('page', String(page));
        const res = await fetch(u, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
        if (res.status === 429) throw new Error('Carapis: надвишен лимит на заявките (429). Опитайте по-късно.');
        if (!res.ok) throw new Error(`Carapis: HTTP ${res.status}`);
        const json = (await res.json()) as Page;
        const rows = json.results ?? [];
        for (const r of rows) {
          const v = map(r, slug);
          if (v) out.push(v);
        }
        got += rows.length;
        if (!rows.length || (json.count != null && got >= json.count)) break; // всичко е получено
        if (got >= max) { complete = false; break; }
        page++;
      }
    }
    return Object.assign(out, { complete });
  },
};
