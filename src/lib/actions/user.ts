'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUser, requireUser, hashPassword, verifyPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { zodErrors, type FormState } from './types';

export async function toggleFavorite(vehicleId: string) {
  const user = await getUser();
  if (!user) return { needsLogin: true as const };
  const key = { userId_vehicleId: { userId: user.id, vehicleId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) await db.favorite.delete({ where: key });
  else await db.favorite.create({ data: { userId: user.id, vehicleId } });
  revalidatePath('/account/favorites');
  return { needsLogin: false as const, favorite: !existing };
}

export async function saveSearch(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: 'Влезте в профила си, за да запазите търсене.' };
  if (!(await rateLimit('saved-search', 10, 60_000))) return { error: 'Твърде много опити.' };
  const parsed = z.object({ name: z.string().trim().min(2, 'Въведете име').max(60), query: z.string().max(1000), notify: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error.issues) };
  if ((await db.savedSearch.count({ where: { userId: user.id } })) >= 20) return { error: 'Достигнахте лимита от 20 запазени търсения.' };
  await db.savedSearch.create({ data: { userId: user.id, name: parsed.data.name, query: parsed.data.query.replace(/^\?/, ''), notify: parsed.data.notify === 'on' } });
  revalidatePath('/account/searches');
  return { ok: true, message: 'Търсенето е запазено. Ще ви известим при нови съвпадения.' };
}

export async function deleteSavedSearch(id: string) {
  const user = await requireUser();
  await db.savedSearch.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/account/searches');
}

export async function markNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath('/account/notifications');
}

export async function respondToOffer(id: string, accept: boolean) {
  const user = await requireUser();
  await db.offer.updateMany({ where: { id, userId: user.id, status: 'SENT' }, data: { status: accept ? 'ACCEPTED' : 'DECLINED' } });
  revalidatePath('/account/offers');
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z.object({ name: z.string().trim().min(2, 'Въведете име').max(80), phone: z.string().trim().max(30).optional(), notifyEmail: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error.issues) };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null, notifyEmail: parsed.data.notifyEmail === 'on' } });
  revalidatePath('/account/settings');
  return { ok: true, message: 'Профилът е обновен.' };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await rateLimit('pwd', 5, 10 * 60_000))) return { error: 'Твърде много опити.' };
  const parsed = z.object({ current: z.string().min(1), next: z.string().min(8, 'Минимум 8 символа').refine((p) => /[A-Za-zА-Яа-я]/.test(p) && /\d/.test(p), 'Нужни са буква и цифра') }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error.issues) };
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, row.passwordHash))) return { errors: { current: 'Грешна парола' } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  return { ok: true, message: 'Паролата е сменена.' };
}

export async function deleteAccount() {
  const user = await requireUser();
  if (user.role === 'ADMIN' && (await db.user.count({ where: { role: 'ADMIN' } })) <= 1) return;
  await db.user.delete({ where: { id: user.id } });
  const { destroySession } = await import('@/lib/auth');
  await destroySession();
  redirect('/');
}
