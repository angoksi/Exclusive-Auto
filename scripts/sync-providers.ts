import 'dotenv/config';
import { db } from '../src/lib/db';
import { DEFAULT_PRICING, type PricingConfig } from '../src/lib/pricing';
import { syncProviders } from '../src/lib/providers/sync';

async function main() {
  const row = await db.setting.findUnique({ where: { key: 'pricing' } });
  const cfg = row ? ({ ...DEFAULT_PRICING, ...(row.value as object) } as PricingConfig) : DEFAULT_PRICING;
  for (const r of await syncProviders(cfg)) console.log(`${r.provider}: ${r.status}${r.count != null ? ` (${r.count})` : ''}${r.message ? ` — ${r.message}` : ''}`);
}
main().finally(() => db.$disconnect());
