import 'server-only';
import { cookies } from 'next/headers';

export const COMPARE_COOKIE = 'eat_compare';
export const COMPARE_MAX = 4;

export async function getCompareSlugs(): Promise<string[]> {
  const v = (await cookies()).get(COMPARE_COOKIE)?.value;
  return v ? v.split(',').filter(Boolean).slice(0, COMPARE_MAX) : [];
}
