import { db } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { toEur } from '@/lib/price-eur';
import { ADAPTERS } from './adapters';
import type { NormalizedVehicle } from './types';
import type { PricingConfig } from '@/lib/pricing';

export async function upsertNormalized(v: NormalizedVehicle, cfg: PricingConfig, opts: { isDemo?: boolean; published?: boolean } = {}) {
  const slug = `${slugify(`${v.make}-${v.model}-${v.year}`)}-${slugify(v.sourceId).slice(-10) || Math.random().toString(36).slice(2, 8)}`;
  const { priceEur, bidEur } = toEur(v, cfg);
  const data = {
    region: v.region, source: v.source, sourceId: v.sourceId, isDemo: opts.isDemo ?? false,
    make: v.make, model: v.model, trim: v.trim ?? null, year: v.year, vin: v.vin ?? null, lotNumber: v.lotNumber ?? null, platform: v.platform ?? null,
    saleType: v.saleType, currency: v.currency, currentBid: v.currentBid ?? null, buyNowPrice: v.buyNowPrice ?? null, priceEur, bidEur,
    auctionDate: v.auctionDate ?? null, location: v.location, country: v.country, odometerKm: v.odometerKm, engine: v.engine, fuel: v.fuel,
    transmission: v.transmission, drive: v.drive, bodyType: v.bodyType, color: v.color, condition: v.condition,
    primaryDamage: v.primaryDamage ?? null, secondaryDamage: v.secondaryDamage ?? null, runsAndDrives: v.runsAndDrives, hasKeys: v.hasKeys,
    description: v.description, features: v.features ?? [],
  };
  const existing = await db.vehicle.findFirst({ where: { source: v.source, sourceId: v.sourceId }, select: { id: true } });
  if (existing) {
    await db.vehicle.update({ where: { id: existing.id }, data });
    return existing.id;
  }
  const created = await db.vehicle.create({
    data: {
      ...data, slug, published: opts.published ?? true,
      images: { create: v.images.map((url, position) => ({ url, position })) },
      history: { create: (v.history ?? []).map((h) => ({ date: h.date, type: h.type, description: h.description, odometerKm: h.odometerKm ?? null, source: h.source ?? null })) },
    },
  });
  return created.id;
}

export async function syncProviders(cfg: PricingConfig) {
  const report: { provider: string; status: 'ok' | 'skipped' | 'error'; count?: number; message?: string }[] = [];
  for (const a of ADAPTERS) {
    if (!a.isConfigured()) {
      report.push({ provider: a.name, status: 'skipped', message: 'Няма API ключ — използват се демо данни.' });
      continue;
    }
    try {
      const list = await a.fetchListings();
      const published = process.env.SYNC_PUBLISH !== 'false'; // SYNC_PUBLISH=false — новите обяви се създават скрити
      for (const v of list) await upsertNormalized(v, cfg, { published });
      // Обява, която я няма в пълния списък от доставчика, вече не е налична
      let archived = 0;
      if (list.complete && list.length > 0) {
        const bySource = new Map<string, string[]>();
        for (const v of list) bySource.set(v.source, [...(bySource.get(v.source) ?? []), v.sourceId]);
        for (const [source, ids] of bySource) {
          const r = await db.vehicle.updateMany({ where: { source: source as NormalizedVehicle['source'], isDemo: false, status: 'AVAILABLE', sourceId: { not: null, notIn: ids } }, data: { status: 'ARCHIVED' } });
          archived += r.count;
        }
      }
      report.push({ provider: a.name, status: 'ok', count: list.length, message: archived ? `Архивирани изчезнали обяви: ${archived}` : undefined });
    } catch (e) {
      report.push({ provider: a.name, status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }
  return report;
}
