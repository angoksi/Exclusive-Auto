import { db } from '@/lib/db';
import { cache } from 'react';

export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';
export const SITE_NAME = 'EXCLUSIVE AUTO TRADE';

export type SiteInfo = { phone: string; phone2: string; email: string; hours: string };
export const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
const OLD_PLACEHOLDERS = ['+359 88 000 0000', 'office@exclusive-auto.example'];
const DEFAULT: SiteInfo = { phone: '+359 896 547 850', phone2: '+359 895 948 420', email: '', hours: 'Пон–Пет: 09:00 – 18:00' };

export const getSiteInfo = cache(async (): Promise<SiteInfo> => {
  const row = await db.setting.findUnique({ where: { key: 'site' } });
  const saved = Object.fromEntries(Object.entries((row?.value as Partial<SiteInfo>) ?? {}).filter(([, v]) => typeof v === 'string' && v.trim() && !OLD_PLACEHOLDERS.includes(v))) as Partial<SiteInfo>;
  return { ...DEFAULT, ...saved };
});
