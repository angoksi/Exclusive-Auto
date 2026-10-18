import { NextResponse } from 'next/server';
import { verifyPhoto } from '@/lib/photo-proxy';

// Подава снимките на обявите от нашия адрес. Приема само подписани адреси (създадени при синхронизация).
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const url = verifyPhoto(sp.get('u') ?? '', sp.get('s') ?? '');
  if (!url) return new NextResponse('Not found', { status: 404 });
  try {
    const up = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: 'follow' });
    const type = up.headers.get('content-type') ?? '';
    if (!up.ok || !type.startsWith('image/') || Number(up.headers.get('content-length') ?? 0) > 10_000_000) return new NextResponse('Not found', { status: 404 });
    const buf = await up.arrayBuffer();
    if (buf.byteLength > 10_000_000) return new NextResponse('Not found', { status: 404 });
    return new NextResponse(buf, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
