import type { PricingConfig } from '@/lib/pricing';

/** Денормализирани цени в EUR — използват се за филтриране и сортиране в базата. */
export function toEur(v: { currency: string; currentBid?: number | null; buyNowPrice?: number | null }, cfg: PricingConfig) {
  const rate = cfg.fx[v.currency] ?? 1;
  const bidEur = v.currentBid != null ? Math.round(v.currentBid * rate) : null;
  const buyEur = v.buyNowPrice != null ? Math.round(v.buyNowPrice * rate) : null;
  return { priceEur: buyEur ?? bidEur ?? 0, bidEur };
}
