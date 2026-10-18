import { db } from '@/lib/db';
import { DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing';
import { syncProviders } from './sync';
import { ADAPTERS } from './adapters';
import { carapisCooldownUntil } from './carapis';
import { signedPhotoUrl } from '@/lib/photo-proxy';

let running = false;
let filling = false;
const triedEmpty = new Map<string, number>(); // обяви, за които Carapis няма снимки — не се питат отново 6 часа

/** Една синхронизация с всички конфигурирани доставчици (нови обяви се публикуват веднага; изчезналите се архивират). */
export async function runSyncOnce() {
  if (running) return null;
  running = true;
  try {
    const row = await db.setting.findUnique({ where: { key: 'pricing' } });
    const cfg = row ? ({ ...DEFAULT_PRICING, ...(row.value as object) } as PricingConfig) : DEFAULT_PRICING;
    const report = await syncProviders(cfg);
    const done = report.filter((r) => r.status !== 'skipped');
    if (done.length) console.log('[eat] Синхронизация:', done.map((r) => `${r.provider}: ${r.status}${r.count != null ? ` (${r.count})` : ''}${r.message ? ` — ${r.message}` : ''}`).join(' · '));
    return report;
  } catch (e) {
    console.error('[eat] Грешка при синхронизация:', e instanceof Error ? e.message : e);
    return null;
  } finally {
    running = false;
  }
}

/** Допълва снимки на обяви без такива — по малки порции, докато има недовършени (по подразбиране 30 обяви на всеки 2 мин.). */
export async function fillMissingPhotos() {
  const adapter = ADAPTERS.find((a) => a.fetchImages && a.isConfigured());
  if (!adapter?.fetchImages || filling || running || Date.now() < carapisCooldownUntil()) return 0;
  filling = true;
  let filled = 0;
  try {
    const batch = Math.max(1, Number(process.env.CARAPIS_PHOTO_BATCH ?? 10));
    const now = Date.now();
    const rows = await db.vehicle.findMany({ where: { isDemo: false, sourceId: { not: null }, images: { none: {} } }, select: { id: true, sourceId: true }, orderBy: { createdAt: 'desc' }, take: batch * 3 });
    for (const v of rows) {
      if (filled + 0 >= batch) break;
      const last = triedEmpty.get(v.id);
      if (last && now - last < 6 * 3600_000) continue;
      try {
        const urls = await adapter.fetchImages(v.sourceId!);
        if (!urls.length) { triedEmpty.set(v.id, now); continue; }
        await db.vehicleImage.createMany({ data: urls.map((u, position) => ({ vehicleId: v.id, url: signedPhotoUrl(u), position })) });
        filled++;
      } catch (e) {
        if (e instanceof Error && /429/.test(e.message)) break; // лимит — спира, без да маркира обявата
        triedEmpty.set(v.id, now);
      }
    }
    if (filled) console.log(`[eat] Допълнени снимки на ${filled} обяви.`);
  } finally {
    filling = false;
  }
  return filled;
}

/** Стартира автоматична синхронизация на интервал (по подразбиране 30 мин.; SYNC_INTERVAL_MINUTES, минимум 5). */
export function startAutoSync() {
  const g = globalThis as { __eatAutoSync?: boolean };
  if (g.__eatAutoSync || !process.env.CARAPIS_API_KEY) return;
  g.__eatAutoSync = true;
  const minutes = Math.max(5, Number(process.env.SYNC_INTERVAL_MINUTES ?? 30) || 30);
  setTimeout(runSyncOnce, 20_000);
  setInterval(runSyncOnce, minutes * 60_000);
  setInterval(fillMissingPhotos, 2 * 60_000); // докато има обяви без снимки, ги допълва на порции
  console.log(`[eat] Автоматична синхронизация на всеки ${minutes} мин.`);
}
