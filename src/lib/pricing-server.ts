import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';
import { DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing';

export const getPricing = cache(async (): Promise<PricingConfig> => {
  const row = await db.setting.findUnique({ where: { key: 'pricing' } });
  return row ? ({ ...DEFAULT_PRICING, ...(row.value as object) } as PricingConfig) : DEFAULT_PRICING;
});
