import { NextResponse } from 'next/server';
import { fillMissingPhotos } from '@/lib/providers/auto-sync';

// За хостинг без постоянно работещ процес: извиква се от cron с Authorization: Bearer $CRON_SECRET и допълва снимки на обяви без такива.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ filled: await fillMissingPhotos() });
}
