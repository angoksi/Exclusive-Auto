import type { Listings, NormalizedVehicle, ProviderAdapter } from './types';
import { ProviderNotConfigured } from './types';
import type { Source } from '@/generated/prisma/enums';

/**
 * Адаптер за Carapis Catalog API (Django REST, ключ в заглавка X-API-Key). Платена услуга — преди търговска употреба проверете
 * условията на Carapis и на съответните платформи за ползване и публично показване на данните.
 *
 * Променливи: CARAPIS_API_KEY (задължителна), CARAPIS_API_URL (по подразбиране https://api.carapis.com/apix/catalog_api),
 * CARAPIS_QUERY (допълнителни филтри, напр. "make=Hyundai"), CARAPIS_MAX_LISTINGS (по подразбиране 200).
 * Имената на полетата в отговора се търсят по няколко възможни варианта; проверете резултата с „Тест на Carapis“ в админ панела.
 */
type Raw = Record<string, unknown>;

const baseUrl = () => (process.env.CARAPIS_API_URL ?? 'https://api.carapis.com/apix/catalog_api').replace(/\/$/, '');

const FUEL: Record<string, string> = { gasoline: 'Бензин', petrol: 'Бензин', diesel: 'Дизел', hybrid: 'Хибрид', electric: 'Електрически', ev: 'Електрически', lpg: 'LPG', 'plug-in hybrid': 'Plug-in хибрид' };
const GEAR: Record<string, string> = { automatic: 'Автоматична', auto: 'Автоматична', manual: 'Ръчна' };
const BODY: Record<string, string> = { sedan: 'Седан', suv: 'SUV', hatchback: 'Хечбек', wagon: 'Комби', coupe: 'Купе', convertible: 'Кабрио', cabriolet: 'Кабрио', pickup: 'Пикап', truck: 'Пикап', van: 'Ван', minivan: 'Ван' };

const COLOR: Record<string, string> = { white: 'Бял', black: 'Черен', gray: 'Сив', grey: 'Сив', silver: 'Сребрист', blue: 'Син', red: 'Червен', green: 'Зелен', beige: 'Бежов', brown: 'Кафяв' };

const get = (o: Raw, keys: string[]): unknown => {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};
const text = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v.trim() || undefined;
  if (typeof v === 'number') return String(v);
  if (v && typeof v === 'object') return text(get(v as Raw, ['name', 'title', 'label', 'value', 'en']));
  return undefined;
};
const numeric = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^\d.]/g, '')) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const urls = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x : text(get(x as Raw, ['url', 'src', 'image', 'photo', 'original', 'large']))) ?? '').filter((u) => /^https:\/\//.test(u));
};

export function mapCarapis(r: Raw): NormalizedVehicle | null {
  const id = text(get(r, ['id', 'uuid', 'external_id', 'listing_id', 'pk']));
  const make = text(get(r, ['make', 'brand', 'brand_name', 'manufacturer']));
  const model = text(get(r, ['model', 'model_name']));
  const year = numeric(get(r, ['year', 'model_year', 'production_year', 'manufacture_year']));
  if (!id || !make || !model || !year) return null;
  const sourceRaw = (text(get(r, ['source', 'source_slug', 'platform'])) ?? 'encar').toLowerCase();
  const source: Source = sourceRaw.includes('encar') ? 'ENCAR' : sourceRaw.includes('kcar') || sourceRaw.includes('k-car') ? 'KCAR' : sourceRaw.includes('autowini') ? 'AUTOWINI' : 'OTHER';
  const currencyRaw = (text(get(r, ['currency', 'price_currency'])) ?? 'KRW').toUpperCase();
  const currency = (['KRW', 'USD', 'EUR'].includes(currencyRaw) ? currencyRaw : 'KRW') as NormalizedVehicle['currency'];
  const price = numeric(get(r, ['price', 'price_krw', 'asking_price', 'sale_price']));
  const fuel = (text(get(r, ['fuel_type', 'fuel'])) ?? '').toLowerCase();
  const gear = (text(get(r, ['transmission', 'gearbox'])) ?? '').toLowerCase();
  const body = (text(get(r, ['body_type', 'body', 'category'])) ?? '').toLowerCase();
  const trim = text(get(r, ['trim', 'grade', 'badge', 'version']));
  const dealer = text(get(r, ['dealer', 'dealer_name', 'seller']));
  const label = { ENCAR: 'Encar', KCAR: 'K Car', AUTOWINI: 'Autowini', OTHER: 'Друг източник' }[source];
  return {
    source, sourceId: id, region: 'KR', make, model, trim, year, vin: text(get(r, ['vin', 'vin_number'])), platform: label,
    saleType: 'BUY_NOW', currency, buyNowPrice: price && price > 0 ? Math.round(price) : undefined,
    location: text(get(r, ['location', 'city', 'region', 'address'])) ?? '—', country: 'Южна Корея',
    odometerKm: Math.round(numeric(get(r, ['mileage', 'mileage_km', 'odometer', 'odometer_km'])) ?? 0),
    engine: text(get(r, ['engine', 'engine_type', 'displacement'])) ?? '—', fuel: FUEL[fuel] ?? (fuel || '—'), transmission: GEAR[gear] ?? (gear || '—'),
    drive: text(get(r, ['drive', 'drive_type', 'drivetrain'])) ?? '—', bodyType: BODY[body] ?? '—', color: ((c) => (c ? COLOR[c.toLowerCase()] ?? c : '—'))(text(get(r, ['color', 'colour', 'exterior_color']))),
    condition: 'GOOD', runsAndDrives: true, hasKeys: true,
    description: `${year} ${make} ${model}${trim ? ' ' + trim : ''} от ${label}${dealer ? `, продавач: ${dealer}` : ''}. Свържете се с консултант за пълна информация, снимки и оферта за доставка.`,
    images: urls(get(r, ['photos', 'images', 'photo_urls', 'image_urls', 'pictures'])).slice(0, 12),
  };
}

function headers() {
  const key = process.env.CARAPIS_API_KEY;
  if (!key) throw new ProviderNotConfigured('Carapis');
  return { 'X-API-Key': key, Accept: 'application/json' };
}

function pageUrl(page: number, size: number) {
  const u = new URL(`${baseUrl()}/vehicles/`);
  new URLSearchParams(process.env.CARAPIS_QUERY ?? '').forEach((v, k) => u.searchParams.set(k, v));
  u.searchParams.set('page', String(page));
  u.searchParams.set('page_size', String(size));
  if (!u.searchParams.has('available_only')) u.searchParams.set('available_only', 'true');
  return u;
}

/** Суров отговор (първите няколко обяви) за проверка на формата — вика се от админ панела. */
export async function carapisPreview(size = 2) {
  const res = await fetch(pageUrl(1, size), { headers: headers(), signal: AbortSignal.timeout(20_000) });
  const body = await res.text();
  return { status: res.status, body: body.slice(0, 8000) };
}

export const carapis: ProviderAdapter = {
  id: 'ENCAR',
  name: 'Carapis',
  regions: ['KR'],
  isConfigured: () => Boolean(process.env.CARAPIS_API_KEY),
  async fetchListings(opts) {
    const h = headers();
    const max = Math.max(1, opts?.limit ?? Number(process.env.CARAPIS_MAX_LISTINGS ?? 200));
    const out: NormalizedVehicle[] = [];
    let complete = true;
    let page = 1;
    for (;;) {
      const res = await fetch(pageUrl(page, Math.min(50, max - out.length || 1)), { headers: h, signal: AbortSignal.timeout(30_000) });
      if (res.status === 401 || res.status === 403) throw new Error('Carapis: невалиден ключ или няма достъп (' + res.status + ').');
      if (res.status === 429) throw new Error('Carapis: надвишен лимит на заявките (429). Опитайте по-късно.');
      if (!res.ok) throw new Error(`Carapis: HTTP ${res.status}`);
      const json = (await res.json()) as { results?: Raw[]; next?: string | null } | Raw[];
      const rows = Array.isArray(json) ? json : json.results ?? [];
      for (const r of rows) {
        const v = mapCarapis(r);
        if (v) out.push(v);
      }
      const hasNext = !Array.isArray(json) && Boolean(json.next);
      if (!rows.length || !hasNext) break;
      if (out.length >= max) { complete = false; break; }
      page++;
    }
    return Object.assign(out, { complete }) as Listings;
  },
};
