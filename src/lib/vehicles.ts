import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';

import { PAGE_SIZE } from '@/lib/vehicle-options';
export * from '@/lib/vehicle-options';

const opt = z.string().trim().max(60).optional().catch(undefined);
const intOpt = z.coerce.number().int().min(0).max(10_000_000).optional().catch(undefined);

export const filterSchema = z.object({
  region: z.enum(['usca', 'us', 'ca', 'kr']).optional().catch(undefined),
  make: opt,
  model: opt,
  yearFrom: intOpt,
  yearTo: intOpt,
  priceFrom: intOpt,
  priceTo: intOpt,
  bidFrom: intOpt,
  bidTo: intOpt,
  kmMax: intOpt,
  fuel: opt,
  transmission: opt,
  bodyType: opt,
  drive: opt,
  color: opt,
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'SALVAGE']).optional().catch(undefined),
  damage: z.enum(['yes', 'no']).optional().catch(undefined),
  runs: z.enum(['yes', 'no']).optional().catch(undefined),
  source: z.enum(['COPART', 'IAAI', 'ENCAR', 'KCAR', 'AUTOWINI', 'OTHER']).optional().catch(undefined),
  saleType: z.enum(['AUCTION', 'BUY_NOW']).optional().catch(undefined),
  location: opt,
  auctionFrom: z.string().date().optional().catch(undefined),
  auctionTo: z.string().date().optional().catch(undefined),
  q: opt,
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'year_desc', 'year_asc', 'km_asc', 'auction_asc']).optional().catch(undefined),
  view: z.enum(['grid', 'list']).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});
export type Filters = z.infer<typeof filterSchema>;

type Raw = Record<string, string | string[] | undefined>;

export function parseFilters(sp: Raw): Filters {
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return filterSchema.parse(Object.fromEntries(Object.entries(flat).filter(([, v]) => v !== '' && v != null)));
}

export function buildWhere(f: Filters): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = [{ published: true }, { status: { in: ['AVAILABLE', 'RESERVED'] } }];
  if (f.region === 'usca') and.push({ region: { in: ['US', 'CA'] } });
  else if (f.region) and.push({ region: f.region.toUpperCase() as 'US' | 'CA' | 'KR' });
  if (f.make) and.push({ make: { equals: f.make, mode: 'insensitive' } });
  if (f.model) and.push({ model: { equals: f.model, mode: 'insensitive' } });
  if (f.yearFrom) and.push({ year: { gte: f.yearFrom } });
  if (f.yearTo) and.push({ year: { lte: f.yearTo } });
  if (f.priceFrom) and.push({ priceEur: { gte: f.priceFrom } });
  if (f.priceTo) and.push({ priceEur: { lte: f.priceTo } });
  if (f.bidFrom) and.push({ bidEur: { gte: f.bidFrom } });
  if (f.bidTo) and.push({ bidEur: { lte: f.bidTo } });
  if (f.kmMax) and.push({ odometerKm: { lte: f.kmMax } });
  if (f.fuel) and.push({ fuel: f.fuel });
  if (f.transmission) and.push({ transmission: f.transmission });
  if (f.bodyType) and.push({ bodyType: f.bodyType });
  if (f.drive) and.push({ drive: f.drive });
  if (f.color) and.push({ color: f.color });
  if (f.condition) and.push({ condition: f.condition });
  if (f.damage === 'yes') and.push({ primaryDamage: { not: null } });
  if (f.damage === 'no') and.push({ primaryDamage: null });
  if (f.runs) and.push({ runsAndDrives: f.runs === 'yes' });
  if (f.source) and.push({ source: f.source });
  if (f.saleType) and.push({ saleType: f.saleType });
  if (f.location) and.push({ location: { contains: f.location, mode: 'insensitive' } });
  if (f.auctionFrom) and.push({ auctionDate: { gte: new Date(f.auctionFrom) } });
  if (f.auctionTo) and.push({ auctionDate: { lte: new Date(f.auctionTo + 'T23:59:59Z') } });
  if (f.q) {
    for (const w of f.q.split(/\s+/).slice(0, 5)) {
      and.push({ OR: [{ make: { contains: w, mode: 'insensitive' } }, { model: { contains: w, mode: 'insensitive' } }, { vin: { contains: w, mode: 'insensitive' } }, { lotNumber: { contains: w, mode: 'insensitive' } }] });
    }
  }
  return { AND: and };
}

export function buildOrder(sort: Filters['sort']): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc': return [{ priceEur: 'asc' }];
    case 'price_desc': return [{ priceEur: 'desc' }];
    case 'year_desc': return [{ year: 'desc' }];
    case 'year_asc': return [{ year: 'asc' }];
    case 'km_asc': return [{ odometerKm: 'asc' }];
    case 'auction_asc': return [{ auctionDate: { sort: 'asc', nulls: 'last' } }];
    default: return [{ createdAt: 'desc' }];
  }
}

export const cardInclude = { images: { orderBy: { position: 'asc' as const }, take: 1 } };
export type VehicleCardData = Prisma.VehicleGetPayload<{ include: typeof cardInclude }>;

export async function searchVehicles(f: Filters) {
  const where = buildWhere(f);
  const page = f.page ?? 1;
  const [total, items] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({ where, orderBy: buildOrder(f.sort), skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: cardInclude }),
  ]);
  return { total, items, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function makeModelMap(region?: Filters['region']) {
  const where: Prisma.VehicleWhereInput = { published: true, status: { in: ['AVAILABLE', 'RESERVED'] } };
  if (region === 'usca') where.region = { in: ['US', 'CA'] };
  else if (region) where.region = region.toUpperCase() as 'US' | 'CA' | 'KR';
  const rows = await db.vehicle.groupBy({ by: ['make', 'model'], where, _count: true, orderBy: [{ make: 'asc' }, { model: 'asc' }] });
  const map: Record<string, string[]> = {};
  for (const r of rows) (map[r.make] ??= []).push(r.model);
  return map;
}

export const latest = (take = 8, extra: Prisma.VehicleWhereInput = {}) =>
  db.vehicle.findMany({ where: { published: true, status: 'AVAILABLE', ...extra }, orderBy: { createdAt: 'desc' }, take, include: cardInclude });

export function toQuery(f: Partial<Record<string, string | number | undefined>>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}
