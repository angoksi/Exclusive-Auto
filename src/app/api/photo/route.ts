import { NextResponse } from 'next/server';
import { sniffImageType, verifyPhoto } from '@/lib/photo-proxy';

const MAX = 10_000_000;

// Подава снимките на обявите от нашия адрес. Приема само подписани адреси (създадени при синхронизация).
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const url = verifyPhoto(sp.get('u') ?? '', sp.get('s') ?? '');
  if (!url) return new NextResponse('Not found', { status: 404 });
  try {
    const up = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'follow', headers: { Accept: 'image/avif,image/webp,image/*,*/*;q=0.8', 'User-Agent': 'Mozilla/5.0 (compatible; ExclusiveAutoTrade/1.0)' } });
    if (!up.ok) return new NextResponse('Upstream error', { status: 404 });
    const buf = await up.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX) return new NextResponse('Not found', { status: 404 });
    // Типът се определя по съдържанието, а не само по заглавката на отдалечения сървър
    const type = sniffImageType(new Uint8Array(buf, 0, Math.min(16, buf.byteLength))) ?? ((up.headers.get('content-type') ?? '').startsWith('image/') && !(up.headers.get('content-type') ?? '').includes('svg') ? up.headers.get('content-type')! : null);
    if (!type) return new NextResponse('Not an image', { status: 404 });
    return new NextResponse(buf, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
