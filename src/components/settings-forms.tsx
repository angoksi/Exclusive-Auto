'use client';
import { useActionState } from 'react';
import { changePassword, updateProfile } from '@/lib/actions/user';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import type { FormState } from '@/lib/actions/types';

export function ProfileForm({ user }: { user: { name: string; email: string; phone: string | null; notifyEmail: boolean } }) {
  const [s, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="text-lg">Профил</h2>
      <Field label="Имейл"><Input value={user.email} disabled readOnly /></Field>
      <Field label="Име" error={s.errors?.name}><Input name="name" defaultValue={user.name} required /></Field>
      <Field label="Телефон" error={s.errors?.phone}><Input name="phone" defaultValue={user.phone ?? ''} type="tel" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notifyEmail" defaultChecked={user.notifyEmail} className="size-4 accent-[var(--color-copper-600)]" /> Получавай известия по имейл</label>
      {s.ok && <p role="status" className="text-sm font-medium text-ok">{s.message}</p>}
      <Button disabled={pending}>Запази</Button>
    </form>
  );
}

export function PasswordForm() {
  const [s, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="text-lg">Смяна на парола</h2>
      <Field label="Текуща парола" error={s.errors?.current}><Input name="current" type="password" autoComplete="current-password" required /></Field>
      <Field label="Нова парола" error={s.errors?.next} hint="Минимум 8 символа, с буква и цифра."><Input name="next" type="password" autoComplete="new-password" required minLength={8} /></Field>
      {s.error && <p role="alert" className="text-sm font-medium text-danger">{s.error}</p>}
      {s.ok && <p role="status" className="text-sm font-medium text-ok">{s.message}</p>}
      <Button disabled={pending}>Смени паролата</Button>
    </form>
  );
}
