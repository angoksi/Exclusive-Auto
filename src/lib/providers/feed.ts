import type { NormalizedVehicle, ProviderAdapter } from './types';
import { ProviderNotConfigured } from './types';
import type { Region, Source } from '@/generated/prisma/enums';

/**
 * Базов адаптер за ЛИЦЕНЗИРАН JSON фийд/API (по договор с доставчика или оторизиран реселър).
 * Не се използва scraping. Всеки доставчик предоставя собствен формат — съпоставянето се прави
 * във `map()` на конкретния адаптер, докато frontend-ът остава непроменен.
 */
export function createFeedAdapter<Raw>(cfg: {
  id: Source;
  name: string;
  regions: Region[];
  envPrefix: string; // напр. COPART -> COPART_API_URL / COPART_API_KEY
  map: (raw: Raw) => NormalizedVehicle | null;
  extract?: (json: unknown) => Raw[]; // как да се вземе масивът от отговора
}): ProviderAdapter {
  const url = () => process.env[`${cfg.envPrefix}_API_URL`];
  const key = () => process.env[`${cfg.envPrefix}_API_KEY`];
  return {
    id: cfg.id,
    name: cfg.name,
    regions: cfg.regions,
    isConfigured: () => Boolean(url() && key()),
    async fetchListings(opts) {
      if (!url() || !key()) throw new ProviderNotConfigured(cfg.name);
      const u = new URL(url()!);
      if (opts?.since) u.searchParams.set('updated_since', opts.since.toISOString());
      if (opts?.limit) u.searchParams.set('limit', String(opts.limit));
      const res = await fetch(u, { headers: { Authorization: `Bearer ${key()}`, Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`${cfg.name}: HTTP ${res.status}`);
      const json = await res.json();
      const rows = (cfg.extract ? cfg.extract(json) : (json as { items?: Raw[] }).items ?? (json as Raw[])) as Raw[];
      return rows.map(cfg.map).filter((v): v is NormalizedVehicle => v !== null);
    },
  };
}
