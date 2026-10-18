import 'server-only';

export type ExternalHistory = { provider: string; events: { date: string; type: string; description: string; odometerKm?: number }[]; raw?: unknown };

/**
 * Свързване с лицензиран доставчик на VIN история. Конфигурира се с VIN_HISTORY_API_URL/KEY.
 * Не се прави scraping. Очакван отговор: { provider?: string, events: [{ date, type, description, odometerKm? }] }.
 */
export async function fetchExternalHistory(vin: string): Promise<ExternalHistory | null> {
  const url = process.env.VIN_HISTORY_API_URL;
  const key = process.env.VIN_HISTORY_API_KEY;
  if (!url || !key) return null;
  try {
    const u = new URL(url);
    u.searchParams.set('vin', vin);
    const res = await fetch(u, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal: AbortSignal.timeout(10_000), next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { provider?: string; events?: ExternalHistory['events'] };
    return { provider: json.provider ?? 'Външен доставчик', events: Array.isArray(json.events) ? json.events : [] };
  } catch {
    return null;
  }
}

export const isHistoryConfigured = () => Boolean(process.env.VIN_HISTORY_API_URL && process.env.VIN_HISTORY_API_KEY);
