import type { Listings, NormalizedVehicle, ProviderAdapter } from './types';
import { ProviderNotConfigured } from './types';
import type { Source } from '@/generated/prisma/enums';

/**
 * Адаптер за Carapis Catalog API (Django REST, ключ в заглавка X-API-Key). Платена услуга — преди търговска употреба проверете
 * условията на Carapis и на съответните платформи за ползване и публично показване на данните.
 *
 * Променливи: CARAPIS_API_KEY (задължителна), CARAPIS_API_URL (по подразбиране https://api.carapis.com/apix/catalog_api),
 * CARAPIS_SOURCE (платформи по source_code, по подразбиране "encar"), CARAPIS_QUERY (допълнителни филтри),
 * CARAPIS_MAX_LISTINGS (по подразбиране 200; 0 = без ограничение), CARAPIS_MAX_PAGES (макс. страници по 50 за една синхронизация, по подразбиране 100; 0 = без ограничение), CARAPIS_DETAIL_LIMIT (снимки от детайла на обява, по подразбиране 50 на синхронизация).
 */
type Raw = Record<string, unknown>;

const baseUrl = () => (process.env.CARAPIS_API_URL ?? 'https://api.carapis.com/apix/catalog_api').replace(/\/$/, '');
const allowedSources = () => (process.env.CARAPIS_SOURCE ?? 'encar').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);

const FUEL: Record<string, string> = { gasoline: 'Бензин', petrol: 'Бензин', diesel: 'Дизел', hybrid: 'Хибрид', electric: 'Електрически', ev: 'Електрически', lpg: 'LPG', 'plug-in hybrid': 'Plug-in хибрид', phev: 'Plug-in хибрид' };
const GEAR: Record<string, string> = { automatic: 'Автоматична', auto: 'Автоматична', manual: 'Ръчна' };
const BODY: Record<string, string> = { sedan: 'Седан', suv: 'SUV', hatchback: 'Хечбек', wagon: 'Комби', estate: 'Комби', coupe: 'Купе', convertible: 'Кабрио', cabriolet: 'Кабрио', pickup: 'Пикап', truck: 'Пикап', van: 'Ван', minivan: 'Ван' };
const COLOR: Record<string, string> = { white: 'Бял', black: 'Черен', gray: 'Сив', grey: 'Сив', silver: 'Сребрист', blue: 'Син', red: 'Червен', green: 'Зелен', beige: 'Бежов', brown: 'Кафяв' };
const DRIVE: Record<string, string> = { fwd: 'Предно', ff: 'Предно', rwd: 'Задно', fr: 'Задно', awd: '4x4 / AWD', '4wd': '4x4 / AWD', '4x4': '4x4 / AWD' };

/** Число от настройка; 0 или отрицателно = без ограничение. */
const limitOf = (v: string | undefined, fallback: number) => {
  const n = Number(v ?? fallback);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
};

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
  if (v && typeof v === 'object') return text(get(v as Raw, ['name', 'title', 'label', 'slug', 'code', 'value', 'en']));
  return undefined;
};
const numeric = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(/[^\d.]/g, '')) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/** Адреси на снимки. Взема url (Carapis CDN) от photos[], подредени по position. Адресите на оригиналния сайт (original_url) НЕ се ползват. */
function photoUrls(r: Raw): string[] {
  const arr = get(r, ['photos', 'images', 'pictures', 'photo_urls', 'image_urls']);
  const out: string[] = [];
  if (Array.isArray(arr)) {
    const items = [...arr].sort((a, b) => (numeric((a as Raw)?.position) ?? 0) - (numeric((b as Raw)?.position) ?? 0));
    for (const x of items) {
      const u = typeof x === 'string' ? x : text(get(x as Raw, ['url', 'thumb_url', 'src', 'image']));
      if (u && /^https:\/\//.test(u) && !out.includes(u)) out.push(u);
    }
    if (out.length) return out.slice(0, 12);
  }
  // резервен вариант: търси по цялия отговор, но без адреси на оригиналния сайт
  const found = new Set<string>();
  const walk = (v: unknown, hint: boolean, d: number) => {
    if (d > 6 || found.size >= 12) return;
    if (typeof v === 'string') {
      if (/^https:\/\//.test(v) && (hint || /\.(jpe?g|png|webp)(\?|$)/i.test(v)) && !/\.(svg|gif)(\?|$)/i.test(v)) found.add(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, hint, d + 1));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!/original|listing|source_url/i.test(k)) walk(x, hint || /photo|image|img|picture|thumb/i.test(k), d + 1);
  };
  walk(r, false, 0);
  return [...found];
}

const sourceCode = (r: Raw) => text(get(r, ['source_code', 'source', 'source_slug', 'source_name', 'platform']))?.toLowerCase();
const countryIso = (r: Raw) => text(get((r.source_location as Raw) ?? {}, ['iso2', 'country_code']))?.toUpperCase();

/** Само избраните платформи и само автомобили от Южна Корея. */
const isAllowed = (r: Raw) => {
  const sc = sourceCode(r);
  if (sc && !allowedSources().some((a) => sc.includes(a))) return false;
  const iso = countryIso(r);
  if (iso && iso !== 'KR') return false;
  return true;
};

export function mapCarapis(r: Raw): NormalizedVehicle | null {
  const id = text(get(r, ['id', 'uuid', 'external_id', 'listing_id', 'pk']));
  const make = text(get(r, ['brand_name', 'make', 'brand', 'manufacturer']));
  const model = text(get(r, ['model_name', 'model']));
  const year = numeric(get(r, ['year', 'model_year', 'production_year', 'manufacture_year']));
  if (!id || !make || !model || !year) return null;

  const sc = sourceCode(r) ?? 'encar';
  const source: Source = sc.includes('encar') ? 'ENCAR' : sc.includes('kcar') || sc.includes('k-car') ? 'KCAR' : sc.includes('autowini') ? 'AUTOWINI' : 'OTHER';

  // цена: оригиналната (вон/долар/евро), иначе price_usd
  const origCur = (text(get(r, ['price_original_currency', 'currency'])) ?? '').toUpperCase();
  const orig = numeric(get(r, ['price_original', 'price']));
  let price: number | undefined;
  let currency: NormalizedVehicle['currency'] = 'KRW';
  if (orig && ['KRW', 'USD', 'EUR'].includes(origCur)) { price = orig; currency = origCur as NormalizedVehicle['currency']; }
  else if (numeric(get(r, ['price_usd']))) { price = numeric(get(r, ['price_usd'])); currency = 'USD'; }
  else if (orig) price = orig;

  const fuel = (text(get(r, ['fuel_type', 'fuel'])) ?? '').toLowerCase();
  const gear = (text(get(r, ['transmission', 'gearbox'])) ?? '').toLowerCase();
  const body = (text(get(r, ['body_type', 'body'])) ?? '').toLowerCase();
  const drive = (text(get(r, ['drive_type', 'drive'])) ?? '').toLowerCase();
  const color = (text(get(r, ['color', 'colour'])) ?? '').toLowerCase();
  const trim = text(get(r, ['trim', 'grade', 'version']));
  const cc = numeric(get(r, ['engine_cc']));
  const accident = r.has_accident === true;
  const features = Array.isArray(r.features) ? r.features.map((f) => text(f)).filter((f): f is string => !!f).slice(0, 12) : [];

  return {
    source, sourceId: id, region: 'KR', make, model, trim, year, vin: text(get(r, ['vin', 'vin_number'])),
    saleType: 'BUY_NOW', currency, buyNowPrice: price && price > 0 ? Math.round(price) : undefined,
    location: text(get(r, ['city', 'location'])) ?? 'Южна Корея', country: 'Южна Корея',
    odometerKm: Math.round(numeric(get(r, ['mileage', 'mileage_km', 'odometer', 'odometer_km'])) ?? 0),
    engine: cc ? `${new Intl.NumberFormat('bg-BG').format(cc)} куб.см` : '—', fuel: FUEL[fuel] ?? (fuel || '—'), transmission: GEAR[gear] ?? (gear || '—'),
    drive: DRIVE[drive] ?? '—', bodyType: BODY[body] ?? '—', color: COLOR[color] ?? '—',
    condition: accident ? 'FAIR' : 'GOOD', primaryDamage: accident ? 'Има история на ПТП' : undefined, runsAndDrives: true, hasKeys: true,
    description: `${year} ${make} ${model}${trim ? ' ' + trim : ''}. Свържете се с консултант за пълна информация, снимки и оферта за доставка.`,
    features, images: photoUrls(r), // показват се през нашия адрес /api/photo
  };
}

function headers() {
  const key = process.env.CARAPIS_API_KEY;
  if (!key) throw new ProviderNotConfigured('Carapis');
  return { 'X-API-Key': key, Accept: 'application/json' };
}

/* ---- Ограничаване на честотата към Carapis: пауза между заявките и повторен опит при 429 ---- */
let lastRequest = 0;
let cooldownUntil = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** До кога е на пауза (след многократен 429) — другите фонови задачи (снимки) трябва да изчакат. */
export const carapisCooldownUntil = () => cooldownUntil;
export class CarapisRateLimit extends Error {
  constructor() {
    super('Carapis: надвишен лимит на заявките (429).');
  }
}

async function cfetch(url: URL | string, timeout = 30_000): Promise<Response> {
  const h = headers();
  const gap = Number(process.env.CARAPIS_DELAY_MS ?? 500);
  for (let attempt = 0; ; attempt++) {
    const wait = lastRequest + gap - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    const res = await fetch(url, { headers: h, signal: AbortSignal.timeout(timeout) });
    if (res.status !== 429) return res;
    const ra = Number(res.headers.get('retry-after'));
    if (attempt >= 3) {
      cooldownUntil = Date.now() + 10 * 60_000; // 10 минути пауза за всички фонови заявки
      return res;
    }
    await sleep(Math.min(ra > 0 ? ra * 1000 : 4000 * 2 ** attempt, 60_000));
  }
}

// Допълнителни филтри, които API-то може да не приема; при HTTP 400 се махат един по един и се помни кои работят
const OPTIONAL = ['source_code', 'source', 'available_only'];
const dropped = new Set<string>();

function pageUrl(page: number, size: number) {
  const u = new URL(`${baseUrl()}/vehicles/`);
  new URLSearchParams(process.env.CARAPIS_QUERY ?? '').forEach((v, k) => u.searchParams.set(k, v));
  u.searchParams.set('page', String(page));
  u.searchParams.set('page_size', String(size));
  if (!u.searchParams.has('available_only') && !dropped.has('available_only')) u.searchParams.set('available_only', 'true');
  const src = allowedSources();
  if (src.length === 1) {
    if (!u.searchParams.has('source') && !dropped.has('source')) u.searchParams.set('source', src[0]);
    if (!u.searchParams.has('source_code') && !dropped.has('source_code')) u.searchParams.set('source_code', src[0]);
  }
  return u;
}

/** GET на страница от списъка; при 400 махва по един от допълнителните филтри и опитва пак (без филтър се прави само клиентско филтриране). */
async function getPage(page: number, size: number, timeout = 30_000): Promise<Response> {
  for (;;) {
    const res = await cfetch(pageUrl(page, size), timeout);
    if (res.status !== 400) return res;
    const next = OPTIONAL.find((k) => !dropped.has(k));
    if (!next) {
      const msg = (await res.text()).slice(0, 300);
      throw new Error(`Carapis: HTTP 400 — ${msg}`);
    }
    dropped.add(next);
    console.warn(`[eat] Carapis върна 400; пробвам без параметър "${next}".`);
  }
}

/** Суров отговор (първите няколко обяви) за проверка на формата — вика се от админ панела. */
export async function carapisPreview(size = 2) {
  const res = await getPage(1, size, 20_000);
  const body = await res.text();
  let summary = dropped.size ? `Не се подават филтри: ${[...dropped].join(', ')} (API-то ги отхвърли).` : '';
  try {
    const json = JSON.parse(body) as { count?: number; results?: Raw[] } | Raw[];
    const rows = Array.isArray(json) ? json : json.results ?? [];
    const first = rows[0];
    if (!Array.isArray(json)) summary += ` Полета на отговора: ${Object.keys(json).join(', ')}.`;
    summary += ` Общо по филтъра: ${Array.isArray(json) ? rows.length : json.count ?? '?'}. Платформа на първата: ${first ? sourceCode(first) ?? '?' : '-'}; държава: ${first ? countryIso(first) ?? '?' : '-'}; снимки в списъка: ${first ? photoUrls(first).length : 0}.`;
  } catch {
    /* остава само суровият отговор */
  }
  return { status: res.status, body: `${summary}\n\n${body}`.slice(0, 8000) };
}

/** Снимки от страницата на конкретна обява (когато списъкът не ги съдържа). */
export async function fetchCarapisImages(sourceId: string): Promise<string[]> {
  const res = await cfetch(`${baseUrl()}/vehicles/${encodeURIComponent(sourceId)}/`, 20_000);
  if (res.status === 429) throw new CarapisRateLimit();
  if (!res.ok) return [];
  return photoUrls((await res.json()) as Raw);
}

/** Диагностика за обява без снимки. */
export async function carapisProbe(sourceId: string) {
  const res = await cfetch(`${baseUrl()}/vehicles/${encodeURIComponent(sourceId)}/`, 20_000);
  const body = await res.text();
  let found = 0;
  try { found = photoUrls(JSON.parse(body) as Raw).length; } catch { /* не е JSON */ }
  return { status: res.status, found, body: body.slice(0, 6000) };
}

export const carapis: ProviderAdapter = {
  id: 'ENCAR',
  name: 'Carapis',
  regions: ['KR'],
  isConfigured: () => Boolean(process.env.CARAPIS_API_KEY),
  fetchImages: fetchCarapisImages,
  async fetchListings(opts) {
    headers(); // проверка за ключа
    if (Date.now() < cooldownUntil) throw new Error(`Carapis: пауза заради лимит на заявките до ${new Date(cooldownUntil).toLocaleTimeString('bg-BG')}.`);
    const max = opts?.limit ?? limitOf(process.env.CARAPIS_MAX_LISTINGS, 200);
    const maxPages = limitOf(process.env.CARAPIS_MAX_PAGES, 100);
    const out: NormalizedVehicle[] = [];
    const seenIds = new Set<string>();
    let complete = true;
    let page = 1;
    let seen = 0;
    for (;;) {
      const res = await getPage(page, 50);
      if (res.status === 404 && page > 1) break; // страница след последната
      if (res.status === 401 || res.status === 403) throw new Error('Carapis: невалиден ключ или няма достъп (' + res.status + ').');
      if (res.status === 429) {
        if (out.length === 0) throw new Error('Carapis: надвишен лимит на заявките (429). Ще опитам отново автоматично след малко.');
        complete = false; // запазва вече получените обяви и продължава следващия път
        break;
      }
      if (!res.ok) throw new Error(`Carapis: HTTP ${res.status}`);
      const json = (await res.json()) as Raw | Raw[];
      const rows = (Array.isArray(json) ? json : (json.results ?? json.data ?? json.items ?? [])) as Raw[];
      const fresh = rows.filter((r) => { const k = text(get(r, ['id', 'uuid', 'pk'])); if (!k || seenIds.has(k)) return false; seenIds.add(k); return true; });
      if (!rows.length || !fresh.length) break; // празна страница или API-то игнорира номера на страницата
      seen += rows.length;
      for (const r of fresh) {
        if (!isAllowed(r)) continue; // само Encar и само Южна Корея
        const v = mapCarapis(r);
        if (v && out.length < max) out.push(v);
      }
      // Има ли още: по общия брой, по поле next, а ако няма нито едното — докато идват обяви
      const meta = Array.isArray(json) ? {} : json;
      const total = numeric(meta.count ?? meta.total ?? (meta.pagination as Raw | undefined)?.total ?? (meta.meta as Raw | undefined)?.total);
      const nextRaw = 'next' in meta ? meta.next : (meta.links as Raw | undefined)?.next ?? (meta.pagination as Raw | undefined)?.next;
      const more = total !== undefined ? seen < total : nextRaw !== undefined ? Boolean(nextRaw) : !Array.isArray(json);
      if (!more) break;
      if (out.length >= max || page >= maxPages) { complete = false; break; }
      page++;
    }
    return Object.assign(out, { complete }) as Listings;
  },
};
