import { NextResponse } from 'next/server';
import { notifySavedSearches } from '@/lib/saved-search';

// Извиква се от планировчик (cron) с: Authorization: Bearer $CRON_SECRET
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ notified: await notifySavedSearches() });
}
