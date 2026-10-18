import 'server-only';
import { headers } from 'next/headers';

// Лек in-memory лимитер. При няколко инстанса заменете хранилището с Redis/Upstash.
const buckets = new Map<string, { count: number; reset: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

/** Връща true, ако заявката е позволена. */
export async function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const id = `${key}:${await clientIp()}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}
