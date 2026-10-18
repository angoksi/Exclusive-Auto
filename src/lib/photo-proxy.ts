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

/** Определя типа на изображение по първите байтове (някои сървъри връщат грешен Content-Type). */
export function sniffImageType(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'image/avif';
  return null;
}
