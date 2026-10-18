import { db } from '@/lib/db';
import { DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing';
import { syncProviders } from './sync';

let running = false;

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

/** Стартира автоматична синхронизация на интервал (по подразбиране 30 мин.; SYNC_INTERVAL_MINUTES, минимум 5). */
export function startAutoSync() {
  const g = globalThis as { __eatAutoSync?: boolean };
  if (g.__eatAutoSync || !process.env.CARAPIS_API_KEY) return;
  g.__eatAutoSync = true;
  const minutes = Math.max(5, Number(process.env.SYNC_INTERVAL_MINUTES ?? 30) || 30);
  setTimeout(runSyncOnce, 20_000);
  setInterval(runSyncOnce, minutes * 60_000);
  console.log(`[eat] Автоматична синхронизация на всеки ${minutes} мин.`);
}
