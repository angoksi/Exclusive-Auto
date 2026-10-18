import { NextResponse } from 'next/server';
import { getPricing } from '@/lib/pricing-server';
import { syncProviders } from '@/lib/providers/sync';

// Автоматична синхронизация на обяви. Извиква се от планировчик с: Authorization: Bearer $CRON_SECRET
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json({ report: await syncProviders(await getPricing()) });
}
