import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/lib/db';

/** Създава таблиците от prisma/init.sql, ако базата е празна (идемпотентно — не пипа съществуваща схема). */
export async function ensureSchema() {
  const rows = await db.$queryRaw<{ t: string | null }[]>`SELECT to_regclass('public."User"')::text AS t`;
  if (rows[0]?.t) return false;
  const sql = await fs.readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), 'prisma', 'init.sql'), 'utf8');
  const statements = sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const s of statements) await db.$executeRawUnsafe(s);
  return true;
}
