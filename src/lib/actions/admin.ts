'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole, STAFF } from '@/lib/auth';
import { getPricing } from '@/lib/pricing-server';
import { DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing';
import { toEur } from '@/lib/price-eur';
import { saveUpload } from '@/lib/upload';
import { syncProviders } from '@/lib/providers/sync';
import { notifySavedSearches } from '@/lib/saved-search';
import { slugify } from '@/lib/utils';
import { stageTitle } from '@/lib/stages';
import { zodErrors, type FormState } from './types';

const staff = () => requireRole(STAFF);
const admin = () => requireRole(['ADMIN']);
const num = (v: FormDataEntryValue | null) => (v === null || v === '' ? undefined : Number(v));
const str = (v: FormDataEntryValue | null) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const fail = (e: unknown): FormState => ({ error: e instanceof Error ? e.message : 'Грешка при записа.' });

/* ---------- Автомобили ---------- */
const vehicleSchema = z.object({
  region: z.literal('KR'), source: z.enum(['ENCAR', 'KCAR', 'AUTOWINI', 'OTHER']),
  make: z.string().trim().min(1, 'Задължително').max(60), model: z.string().trim().min(1, 'Задължително').max(80), trim: z.string().trim().max(80).optional(),
  year: z.coerce.number().int().min(1950).max(2035), vin: z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Невалиден VIN (17 символа)').optional().or(z.literal('')),
  lotNumber: z.string().trim().max(40).optional(), platform: z.string().trim().max(40).optional(),
  saleType: z.enum(['AUCTION', 'BUY_NOW']), currency: z.enum(['USD', 'CAD', 'KRW', 'EUR']),
  currentBid: z.coerce.number().int().min(0).optional(), buyNowPrice: z.coerce.number().int().min(0).optional(),
  auctionDate: z.string().optional(), location: z.string().trim().min(1, 'Задължително').max(80), country: z.string().trim().min(1).max(60),
  odometerKm: z.coerce.number().int().min(0).max(2_000_000), engine: z.string().trim().min(1, 'Задължително').max(120), fuel: z.string().trim().min(1).max(40),
  transmission: z.string().trim().min(1).max(40), drive: z.string().trim().min(1).max(40), bodyType: z.string().trim().min(1).max(40), color: z.string().trim().min(1).max(40),
  condition: z.enum(['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'SALVAGE']), primaryDamage: z.string().trim().max(80).optional(), secondaryDamage: z.string().trim().max(80).optional(),
  description: z.string().trim().min(1, 'Задължително').max(5000), features: z.string().max(2000).optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED']),
});

export async function saveVehicle(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const id = str(fd.get('id'));
  const raw = Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === 'string' && v !== '' && k !== 'images'));
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error.issues), error: 'Проверете маркираните полета.' };
  const d = parsed.data;
  try {
    const cfg = await getPricing();
    const { priceEur, bidEur } = toEur({ currency: d.currency, currentBid: d.currentBid ?? null, buyNowPrice: d.buyNowPrice ?? null }, cfg);
    const data = {
      region: d.region, source: d.source, make: d.make, model: d.model, trim: d.trim ?? null, year: d.year, vin: d.vin || null, lotNumber: d.lotNumber ?? null, platform: d.platform ?? null,
      saleType: d.saleType, currency: d.currency, currentBid: d.currentBid ?? null, buyNowPrice: d.buyNowPrice ?? null, priceEur, bidEur,
      auctionDate: d.auctionDate ? new Date(d.auctionDate) : null, location: d.location, country: d.country, odometerKm: d.odometerKm, engine: d.engine, fuel: d.fuel,
      transmission: d.transmission, drive: d.drive, bodyType: d.bodyType, color: d.color, condition: d.condition, primaryDamage: d.primaryDamage ?? null, secondaryDamage: d.secondaryDamage ?? null,
      runsAndDrives: fd.get('runsAndDrives') === 'on', hasKeys: fd.get('hasKeys') === 'on', description: d.description,
      features: (d.features ?? '').split('\n').map((s) => s.trim()).filter(Boolean), status: d.status, featured: fd.get('featured') === 'on', published: fd.get('published') === 'on',
    };
    const files = (fd.getAll('images') as File[]).filter((f) => f && f.size > 0);
    const urls: string[] = [];
    for (const f of files) urls.push('/uploads/' + (await saveUpload(f, 'public')));

    let vid = id;
    if (id) {
      await db.vehicle.update({ where: { id }, data });
    } else {
      const slug = `${slugify(`${d.make}-${d.model}-${d.year}`)}-${Math.random().toString(36).slice(2, 7)}`;
      vid = (await db.vehicle.create({ data: { ...data, slug } })).id;
    }
    if (urls.length) {
      const last = await db.vehicleImage.findFirst({ where: { vehicleId: vid! }, orderBy: { position: 'desc' } });
      await db.vehicleImage.createMany({ data: urls.map((url, i) => ({ vehicleId: vid!, url, position: (last?.position ?? -1) + 1 + i })) });
    }
    if (!id && data.published) await notifySavedSearches();
    revalidatePath('/catalog');
    revalidatePath('/admin/vehicles');
    if (!id) redirect(`/admin/vehicles/${vid}?created=1`);
    return { ok: true, message: 'Автомобилът е запазен.' };
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e; // redirect
    return fail(e);
  }
}

export async function deleteVehicle(id: string) {
  await staff();
  await db.vehicle.delete({ where: { id } });
  revalidatePath('/admin/vehicles');
  revalidatePath('/catalog');
}
export async function toggleVehiclePublished(id: string) {
  await staff();
  const v = await db.vehicle.findUniqueOrThrow({ where: { id } });
  await db.vehicle.update({ where: { id }, data: { published: !v.published } });
  revalidatePath('/admin/vehicles');
  revalidatePath('/catalog');
}
export async function moveImage(id: string, dir: -1 | 1) {
  await staff();
  const img = await db.vehicleImage.findUniqueOrThrow({ where: { id } });
  const all = await db.vehicleImage.findMany({ where: { vehicleId: img.vehicleId }, orderBy: { position: 'asc' } });
  const i = all.findIndex((x) => x.id === id), j = i + dir;
  if (j < 0 || j >= all.length) return;
  [all[i], all[j]] = [all[j], all[i]];
  await db.$transaction(all.map((x, p) => db.vehicleImage.update({ where: { id: x.id }, data: { position: p } })));
  revalidatePath(`/admin/vehicles/${img.vehicleId}`);
}
export async function deleteImage(id: string) {
  await staff();
  const img = await db.vehicleImage.delete({ where: { id } });
  revalidatePath(`/admin/vehicles/${img.vehicleId}`);
}
export async function addImageUrl(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ vehicleId: z.string(), url: z.string().url('Невалиден URL').startsWith('https://', 'Само https адреси') }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const last = await db.vehicleImage.findFirst({ where: { vehicleId: p.data.vehicleId }, orderBy: { position: 'desc' } });
  await db.vehicleImage.create({ data: { vehicleId: p.data.vehicleId, url: p.data.url, position: (last?.position ?? -1) + 1 } });
  revalidatePath(`/admin/vehicles/${p.data.vehicleId}`);
  return { ok: true, message: 'Снимката е добавена.' };
}
export async function addHistory(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ vehicleId: z.string(), date: z.string().min(1, 'Задължително'), type: z.string().trim().min(1, 'Задължително').max(80), description: z.string().trim().min(1, 'Задължително').max(500), odometerKm: z.coerce.number().int().min(0).optional(), source: z.string().max(80).optional() }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  await db.vehicleHistoryEvent.create({ data: { ...p.data, date: new Date(p.data.date), odometerKm: p.data.odometerKm ?? null, source: p.data.source ?? null } });
  revalidatePath(`/admin/vehicles/${p.data.vehicleId}`);
  return { ok: true, message: 'Събитието е добавено.' };
}
export async function deleteHistory(id: string) {
  await staff();
  const h = await db.vehicleHistoryEvent.delete({ where: { id } });
  revalidatePath(`/admin/vehicles/${h.vehicleId}`);
}
export async function runSync(): Promise<FormState> {
  await staff();
  const rep = await syncProviders(await getPricing());
  revalidatePath('/admin/vehicles');
  return { ok: true, message: rep.map((r) => `${r.provider}: ${r.status === 'ok' ? `${r.count} обяви` : r.message}`).join(' · ') };
}
export async function probeMissingPhotos(): Promise<FormState> {
  await staff();
  try {
    const [withPhotos, total] = await Promise.all([db.vehicle.count({ where: { isDemo: false, sourceId: { not: null }, images: { some: {} } } }), db.vehicle.count({ where: { isDemo: false, sourceId: { not: null } } })]);
    const v = await db.vehicle.findFirst({ where: { isDemo: false, sourceId: { not: null }, images: { none: {} } }, select: { sourceId: true, make: true, model: true } });
    const head = `Внесени обяви: ${total}, със снимки: ${withPhotos}, без снимки: ${total - withPhotos}.`;
    if (!v?.sourceId) return { ok: true, message: `${head}\nВсички обяви имат снимки.` };
    const { carapisProbe } = await import('@/lib/providers/carapis');
    const r = await carapisProbe(v.sourceId);
    return { ok: true, message: `${head}\nОбява без снимки: ${v.make} ${v.model} (ID ${v.sourceId}). Отговор HTTP ${r.status}, намерени снимки: ${r.found}.\n\n${r.body}` };
  } catch (e) {
    return fail(e);
  }
}
export async function publishAllVehicles(): Promise<FormState> {
  await staff();
  const r = await db.vehicle.updateMany({ where: { published: false }, data: { published: true } });
  revalidatePath('/catalog'); revalidatePath('/admin/vehicles'); revalidatePath('/');
  return { ok: true, message: `Публикувани автомобили: ${r.count}` };
}
export async function testCarapis(): Promise<FormState> {
  await staff();
  try {
    const { carapisPreview } = await import('@/lib/providers/carapis');
    const r = await carapisPreview(2);
    return { ok: r.status === 200, error: r.status === 200 ? undefined : `HTTP ${r.status}`, message: r.body };
  } catch (e) {
    return fail(e);
  }
}
export async function recalcPrices(): Promise<FormState> {
  await admin();
  const cfg = await getPricing();
  const all = await db.vehicle.findMany({ select: { id: true, currency: true, currentBid: true, buyNowPrice: true } });
  await db.$transaction(all.map((v) => db.vehicle.update({ where: { id: v.id }, data: toEur(v, cfg) })));
  revalidatePath('/catalog');
  return { ok: true, message: `Преизчислени цени в EUR: ${all.length}` };
}

/* ---------- Запитвания и оферти ---------- */
export async function updateInquiry(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ id: z.string(), status: z.enum(['NEW', 'IN_PROGRESS', 'QUOTED', 'CLOSED']), managerNote: z.string().max(3000).optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: 'Невалидни данни.' };
  await db.inquiry.update({ where: { id: p.data.id }, data: { status: p.data.status, managerNote: p.data.managerNote || null } });
  revalidatePath('/admin/inquiries');
  return { ok: true, message: 'Запазено.' };
}
export async function createOffer(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ inquiryId: z.string().optional(), userEmail: z.string().trim().toLowerCase().email('Невалиден имейл'), title: z.string().trim().min(3, 'Задължително').max(200), totalEur: z.coerce.number().int().min(1, 'Въведете сума'), notes: z.string().max(3000).optional(), validUntil: z.string().optional() }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const user = await db.user.findUnique({ where: { email: p.data.userEmail } });
  if (!user) return { errors: { userEmail: 'Няма регистриран потребител с този имейл. Поканете клиента да се регистрира.' } };
  const inquiry = p.data.inquiryId ? await db.inquiry.findUnique({ where: { id: p.data.inquiryId }, select: { payload: true } }) : null;
  await db.offer.create({ data: { inquiryId: p.data.inquiryId ?? null, userId: user.id, title: p.data.title, totalEur: p.data.totalEur, notes: p.data.notes ?? null, validUntil: p.data.validUntil ? new Date(p.data.validUntil) : null, breakdown: (inquiry?.payload as object | null) ?? undefined } });
  if (p.data.inquiryId) await db.inquiry.update({ where: { id: p.data.inquiryId }, data: { status: 'QUOTED', userId: user.id } });
  await db.notification.create({ data: { userId: user.id, title: 'Нова оферта', body: p.data.title, href: '/account/offers' } });
  revalidatePath('/admin/inquiries');
  return { ok: true, message: 'Офертата е изпратена на клиента.' };
}

/* ---------- Поръчки ---------- */
export async function createOrder(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ userEmail: z.string().trim().toLowerCase().email('Невалиден имейл'), vehicleTitle: z.string().trim().min(3, 'Задължително').max(200), vin: z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Невалиден VIN'), estimatedDelivery: z.string().optional() }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const user = await db.user.findUnique({ where: { email: p.data.userEmail } });
  if (!user) return { errors: { userEmail: 'Няма потребител с този имейл' } };
  const year = new Date().getFullYear();
  const count = await db.order.count({ where: { number: { startsWith: `EAT-${year}-` } } });
  const number = `EAT-${year}-${String(count + 1).padStart(4, '0')}`;
  const order = await db.order.create({ data: { number, userId: user.id, vehicleTitle: p.data.vehicleTitle, vin: p.data.vin, estimatedDelivery: p.data.estimatedDelivery ? new Date(p.data.estimatedDelivery) : null, events: { create: { stage: 1, title: stageTitle(1) } } } });
  await db.notification.create({ data: { userId: user.id, title: `Поръчка ${number}`, body: 'Създадена е поръчка за вашия автомобил.', href: `/account/orders/${number}` } });
  redirect(`/admin/orders/${order.id}`);
}
export async function updateOrder(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ id: z.string(), stage: z.coerce.number().int().min(1).max(10), estimatedDelivery: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: 'Невалидни данни.' };
  const o = await db.order.findUniqueOrThrow({ where: { id: p.data.id } });
  await db.order.update({ where: { id: o.id }, data: { stage: p.data.stage, estimatedDelivery: p.data.estimatedDelivery ? new Date(p.data.estimatedDelivery) : null } });
  if (p.data.stage !== o.stage) {
    await db.orderEvent.create({ data: { orderId: o.id, stage: p.data.stage, title: stageTitle(p.data.stage) } });
    await db.notification.create({ data: { userId: o.userId, title: `Поръчка ${o.number}: ${stageTitle(p.data.stage)}`, body: 'Етапът на доставката е променен.', href: `/account/orders/${o.number}` } });
  }
  revalidatePath(`/admin/orders/${o.id}`);
  return { ok: true, message: 'Поръчката е обновена.' };
}
export async function addOrderEvent(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ orderId: z.string(), title: z.string().trim().min(2, 'Задължително').max(200), note: z.string().max(2000).optional(), location: z.string().max(120).optional(), lat: z.coerce.number().min(-90).max(90).optional(), lng: z.coerce.number().min(-180).max(180).optional() }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const o = await db.order.findUniqueOrThrow({ where: { id: p.data.orderId } });
  await db.orderEvent.create({ data: { orderId: o.id, stage: o.stage, title: p.data.title, note: p.data.note ?? null, location: p.data.location ?? null, lat: p.data.lat ?? null, lng: p.data.lng ?? null, isPublic: fd.get('isPublic') === 'on' } });
  revalidatePath(`/admin/orders/${o.id}`);
  return { ok: true, message: 'Събитието е добавено.' };
}
export async function deleteOrderEvent(id: string) {
  await staff();
  const e = await db.orderEvent.delete({ where: { id } });
  revalidatePath(`/admin/orders/${e.orderId}`);
}
export async function uploadDocument(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const orderId = str(fd.get('orderId')), name = str(fd.get('name')), file = fd.get('file') as File | null;
  if (!orderId || !name || !file || !file.size) return { error: 'Въведете име и изберете файл.' };
  try {
    const o = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    const key = await saveUpload(file, 'private');
    await db.document.create({ data: { userId: o.userId, orderId, name, url: key } });
    await db.notification.create({ data: { userId: o.userId, title: 'Нов документ', body: name, href: `/account/orders/${o.number}` } });
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true, message: 'Документът е качен.' };
  } catch (e) {
    return fail(e);
  }
}

/* ---------- Потребители ---------- */
export async function setUserRole(id: string, role: 'ADMIN' | 'MANAGER' | 'CUSTOMER') {
  const me = await admin();
  if (id === me.id) return; // не може да променя собствената си роля
  await db.user.update({ where: { id }, data: { role } });
  revalidatePath('/admin/users');
}

/* ---------- Съдържание ---------- */
export async function saveBlog(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ id: z.string().optional(), title: z.string().trim().min(3, 'Задължително').max(200), excerpt: z.string().trim().min(10, 'Поне 10 символа').max(400), body: z.string().trim().min(20, 'Поне 20 символа') }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const published = fd.get('published') === 'on';
  if (p.data.id) {
    const cur = await db.blogPost.findUniqueOrThrow({ where: { id: p.data.id } });
    await db.blogPost.update({ where: { id: p.data.id }, data: { title: p.data.title, excerpt: p.data.excerpt, body: p.data.body, published, publishedAt: published ? cur.publishedAt ?? new Date() : null } });
  } else {
    await db.blogPost.create({ data: { slug: `${slugify(p.data.title)}-${Math.random().toString(36).slice(2, 6)}`, title: p.data.title, excerpt: p.data.excerpt, body: p.data.body, published, publishedAt: published ? new Date() : null } });
  }
  revalidatePath('/admin/blog'); revalidatePath('/blog');
  return { ok: true, message: 'Публикацията е запазена.' };
}
export async function deleteBlog(id: string) { await staff(); await db.blogPost.delete({ where: { id } }); revalidatePath('/admin/blog'); revalidatePath('/blog'); }

export async function saveFaq(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ id: z.string().optional(), question: z.string().trim().min(5, 'Поне 5 символа').max(300), answer: z.string().trim().min(5, 'Поне 5 символа').max(3000), position: z.coerce.number().int().min(0).max(999).default(0) }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const { id, ...data } = p.data;
  if (id) await db.faq.update({ where: { id }, data }); else await db.faq.create({ data });
  revalidatePath('/admin/faq'); revalidatePath('/faq'); revalidatePath('/');
  return { ok: true, message: 'Запазено.' };
}
export async function deleteFaq(id: string) { await staff(); await db.faq.delete({ where: { id } }); revalidatePath('/admin/faq'); revalidatePath('/faq'); }

export async function saveReview(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ id: z.string().optional(), author: z.string().trim().min(2, 'Задължително').max(80), city: z.string().max(60).optional(), vehicle: z.string().max(80).optional(), rating: z.coerce.number().int().min(1).max(5), text: z.string().trim().min(10, 'Поне 10 символа').max(1000) }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const { id, ...rest } = p.data;
  const data = { ...rest, city: rest.city ?? null, vehicle: rest.vehicle ?? null, published: fd.get('published') === 'on', isDemo: fd.get('isDemo') === 'on' };
  if (id) await db.review.update({ where: { id }, data }); else await db.review.create({ data });
  revalidatePath('/admin/content'); revalidatePath('/reviews'); revalidatePath('/');
  return { ok: true, message: 'Запазено.' };
}
export async function deleteReview(id: string) { await staff(); await db.review.delete({ where: { id } }); revalidatePath('/admin/content'); revalidatePath('/reviews'); }

export async function saveDelivery(_: FormState, fd: FormData): Promise<FormState> {
  await staff();
  const p = z.object({ id: z.string().optional(), title: z.string().trim().min(3, 'Задължително').max(120), year: z.coerce.number().int().min(1990).max(2035), origin: z.literal('KR').default('KR'), days: z.coerce.number().int().min(1).max(365), city: z.string().max(60).optional(), deliveredAt: z.string().min(1, 'Задължително') }).safeParse(Object.fromEntries([...fd].filter(([, v]) => v !== '')));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  const { id, ...rest } = p.data;
  const data = { ...rest, city: rest.city ?? null, deliveredAt: new Date(rest.deliveredAt), isDemo: fd.get('isDemo') === 'on' };
  if (id) await db.completedDelivery.update({ where: { id }, data }); else await db.completedDelivery.create({ data });
  revalidatePath('/admin/content'); revalidatePath('/deliveries'); revalidatePath('/');
  return { ok: true, message: 'Запазено.' };
}
export async function deleteDelivery(id: string) { await staff(); await db.completedDelivery.delete({ where: { id } }); revalidatePath('/admin/content'); revalidatePath('/deliveries'); }

export async function saveSite(_: FormState, fd: FormData): Promise<FormState> {
  await admin();
  const p = z.object({ phone: z.string().trim().min(5).max(40), email: z.string().trim().email(), hours: z.string().trim().min(3).max(80) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error.issues) };
  await db.setting.upsert({ where: { key: 'site' }, update: { value: p.data }, create: { key: 'site', value: p.data } });
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Контактите са обновени.' };
}

/* ---------- Цени и митнически правила ---------- */
const tier = z.object({ upTo: z.number().nullable(), percent: z.number().min(0).max(100), fixed: z.number().min(0) });
const pricingSchema = z.object({
  fx: z.record(z.string(), z.number().positive()), fxUpdatedAt: z.string(),
  auctionFees: z.record(z.string(), z.object({ label: z.string(), currency: z.string(), tiers: z.array(tier).min(1), flat: z.number().min(0) })),
  inland: z.object({ US: z.number().min(0), CA: z.number().min(0), KR: z.number().min(0) }),
  sea: z.record(z.string(), z.record(z.string(), z.number().min(0))),
  destinations: z.record(z.string(), z.string()), insuranceRate: z.number().min(0).max(20),
  dutyRate: z.object({ US: z.number().min(0).max(100), CA: z.number().min(0).max(100), KR: z.number().min(0).max(100) }),
  vatRate: z.number().min(0).max(40), customsFees: z.number().min(0), portFees: z.number().min(0), portFeesInVatBase: z.boolean(),
  commission: z.record(z.string(), z.object({ percent: z.number().min(0).max(50), min: z.number().min(0) })),
  extras: z.array(z.object({ id: z.string().min(1).max(30), label: z.string().min(1).max(120), price: z.number().min(0) })), disclaimer: z.string().min(10).max(1000),
});

export async function savePricing(_: FormState, fd: FormData): Promise<FormState> {
  await admin();
  try {
    const cur = await getPricing();
    const n = (k: string) => Number(fd.get(k));
    const json = (k: string) => JSON.parse(String(fd.get(k) ?? ''));
    const next: PricingConfig = {
      ...cur,
      fx: { EUR: 1, USD: n('fx_USD'), CAD: n('fx_CAD'), KRW: n('fx_KRW') }, fxUpdatedAt: new Date().toISOString().slice(0, 10),
      inland: { US: n('inland_US'), CA: n('inland_CA'), KR: n('inland_KR') },
      dutyRate: { US: n('duty_US'), CA: n('duty_CA'), KR: n('duty_KR') },
      commission: { US: { percent: n('comm_US'), min: n('commMin_US') }, CA: { percent: n('comm_CA'), min: n('commMin_CA') }, KR: { percent: n('comm_KR'), min: n('commMin_KR') } },
      vatRate: n('vatRate'), insuranceRate: n('insuranceRate'), customsFees: n('customsFees'), portFees: n('portFees'), portFeesInVatBase: fd.get('portFeesInVatBase') === 'on',
      sea: json('sea'), auctionFees: json('auctionFees'), extras: json('extras'), destinations: json('destinations'), disclaimer: String(fd.get('disclaimer') ?? ''),
    };
    const parsed = pricingSchema.safeParse(next);
    if (!parsed.success) return { error: 'Невалидна конфигурация: ' + parsed.error.issues.map((i) => `${i.path.join('.')} — ${i.message}`).slice(0, 3).join('; ') };
    await db.setting.upsert({ where: { key: 'pricing' }, update: { value: parsed.data }, create: { key: 'pricing', value: parsed.data } });
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Конфигурацията е запазена. Използвайте „Преизчисли цените“, за да обновите EUR цените на обявите.' };
  } catch (e) {
    return { error: e instanceof SyntaxError ? 'Невалиден JSON в едно от полетата.' : 'Невалидни данни.' };
  }
}
export async function resetPricing(): Promise<FormState> {
  await admin();
  await db.setting.upsert({ where: { key: 'pricing' }, update: { value: DEFAULT_PRICING as object }, create: { key: 'pricing', value: DEFAULT_PRICING as object } });
  revalidatePath('/admin/pricing');
  return { ok: true, message: 'Върнати са стойностите по подразбиране.' };
}
