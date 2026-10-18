import { db } from '@/lib/db';
import { cache } from 'react';

export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
export const SITE_NAME = 'EXCLUSIVE AUTO TRADE';

export type SiteInfo = { phone: string; email: string; hours: string };
const DEFAULT: SiteInfo = { phone: '+359 88 000 0000', email: 'office@exclusive-auto.example', hours: 'Пон–Пет: 09:00 – 18:00' };

export const getSiteInfo = cache(async (): Promise<SiteInfo> => {
  const row = await db.setting.findUnique({ where: { key: 'site' } });
  return { ...DEFAULT, ...((row?.value as Partial<SiteInfo>) ?? {}) };
});
