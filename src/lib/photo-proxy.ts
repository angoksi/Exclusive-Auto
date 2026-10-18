import { createHmac, timingSafeEqual } from 'node:crypto';

function secret() {
  const s = process.env.AUTH_SECRET;
  return s && s.length >= 32 ? s : 'dev-only-insecure-secret-do-not-use-in-prod-000';
}
const sign = (u: string) => createHmac('sha256', secret()).update('photo:' + u).digest('base64url').slice(0, 24);

/** Адрес на снимка през сайта ни (скрива източника). Подписан е, за да може да се зареждат само адреси, записани от нас. */
export function signedPhotoUrl(original: string) {
  const u = Buffer.from(original).toString('base64url');
  return `/api/photo?u=${u}&s=${sign(u)}`;
}

export function verifyPhoto(u: string, s: string): string | null {
  const expected = Buffer.from(sign(u));
  const given = Buffer.from(s);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const url = Buffer.from(u, 'base64url').toString();
  return /^https:\/\//.test(url) ? url : null;
}
