import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { hashPassword, verifyPassword } from '@/lib/auth-hash';
import { db } from '@/lib/db';
import type { Role } from '@/generated/prisma/enums';

const COOKIE = 'eat_session';
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET трябва да е зададен (мин. 32 символа).');
    return new TextEncoder().encode('dev-only-insecure-secret-do-not-use-in-prod-000');
  }
  return new TextEncoder().encode(s);
}

export type SessionUser = { id: string; email: string; name: string; role: Role };

export { hashPassword, verifyPassword };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Връща потребителя от сесията, като ролята се взима от базата (не от токена), за да важат промени веднага. */
export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const u = await db.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true, role: true } });
    return u;
  } catch {
    return null;
  }
}

export async function requireUser(next = '/account') {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export const STAFF: Role[] = ['ADMIN', 'MANAGER'];

export async function requireRole(roles: Role[], next = '/admin') {
  const u = await requireUser(next);
  if (!roles.includes(u.role)) redirect('/account');
  return u;
}
