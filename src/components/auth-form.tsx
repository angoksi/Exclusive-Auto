'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { login, register } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import type { FormState } from '@/lib/actions/types';

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === 'login' ? login : register, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />
      {mode === 'register' && <Field label="Име и фамилия" error={e.name}><Input name="name" autoComplete="name" required /></Field>}
      <Field label="Имейл" error={e.email}><Input name="email" type="email" autoComplete="email" required /></Field>
      {mode === 'register' && <Field label="Телефон (по желание)" error={e.phone}><Input name="phone" type="tel" autoComplete="tel" /></Field>}
      <Field label="Парола" error={e.password} hint={mode === 'register' ? 'Минимум 8 символа, с буква и цифра.' : undefined}>
        <Input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : 1} />
      </Field>
      {mode === 'register' && (
        <div>
          <label className="flex items-start gap-2.5 text-xs leading-5 text-muted">
            <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[var(--color-copper-600)]" />
            <span>Съгласен/на съм с <Link href="/terms" className="font-semibold text-copper-700 underline">Общите условия</Link> и обработването на личните ми данни съгласно <Link href="/privacy" className="font-semibold text-copper-700 underline">Политиката за поверителност</Link>.</span>
          </label>
          {e.consent && <p role="alert" className="mt-1 text-xs font-medium text-danger">{e.consent}</p>}
        </div>
      )}
      {state.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? 'Моля, изчакайте…' : mode === 'login' ? 'Вход' : 'Създай профил'}</Button>
    </form>
  );
}
