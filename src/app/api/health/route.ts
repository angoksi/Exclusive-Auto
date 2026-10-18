import { db } from '@/lib/db';

// Диагностика след публикуване: показва кои настройки липсват и дали базата е достъпна (без да разкрива стойности).
export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    AUTH_SECRET: (process.env.AUTH_SECRET?.length ?? 0) >= 32,
    SITE_URL: Boolean(process.env.SITE_URL),
  };
  let database: 'ok' | 'unreachable' | 'tables_missing' = 'unreachable';
  try {
    await db.$queryRaw`SELECT 1`;
    try {
      await db.vehicle.count();
      database = 'ok';
    } catch {
      database = 'tables_missing';
    }
  } catch {
    database = 'unreachable';
  }
  const ok = database === 'ok' && env.DATABASE_URL && env.AUTH_SECRET;
  return Response.json({ ok, env, database }, { status: ok ? 200 : 503 });
}
