import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUser, STAFF } from '@/lib/auth';
import { MIME_BY_EXT, readUpload } from '@/lib/upload';

// Документите са лични данни — достъпни само за собственика и служителите.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  const doc = await db.document.findUnique({ where: { id: (await params).id } });
  if (!doc || (doc.userId !== user.id && !STAFF.includes(user.role))) return new NextResponse('Not found', { status: 404 });
  const buf = await readUpload('private', doc.url);
  if (!buf) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(new Uint8Array(buf), { headers: { 'Content-Type': MIME_BY_EXT[doc.url.split('.').pop()!], 'Content-Disposition': `inline; filename="${encodeURIComponent(doc.name)}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
