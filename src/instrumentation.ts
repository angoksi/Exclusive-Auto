export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return;
  try {
    const { ensureSchema } = await import('@/lib/bootstrap-db');
    if (await ensureSchema()) console.log('[eat] Таблиците са създадени автоматично.');
  } catch (e) {
    console.error('[eat] Неуспешно създаване на таблиците:', e instanceof Error ? e.message : e);
    return;
  }
  const { startAutoSync } = await import('@/lib/providers/auto-sync');
  startAutoSync();
}
