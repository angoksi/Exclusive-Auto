'use client';
import { useActionState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitInquiry } from '@/lib/actions/inquiry';
import { Button } from '@/components/ui/button';
import { Consent, Field, Input, Textarea } from '@/components/ui/form';
import type { FormState } from '@/lib/actions/types';

type Props = {
  type: 'VEHICLE' | 'CALCULATOR' | 'WIZARD' | 'CONTACT';
  vehicleSlug?: string;
  defaultMessage?: string;
  payload?: unknown;
  submitLabel?: string;
  compact?: boolean;
  user?: { name: string; email: string } | null;
};

export function InquiryForm({ type, vehicleSlug, defaultMessage, payload, submitLabel = 'Изпрати запитване', compact, user }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitInquiry, {});
  if (state.ok)
    return (
      <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <CheckCircle2 className="mb-2 size-6" />
        {state.message}
      </div>
    );
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <input type="hidden" name="type" value={type} />
      {vehicleSlug && <input type="hidden" name="vehicleSlug" value={vehicleSlug} />}
      {payload != null && <input type="hidden" name="payload" value={JSON.stringify(payload)} />}
      <div className="hidden" aria-hidden><input tabIndex={-1} autoComplete="off" name="website" /></div>
      <div className={compact ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
        <Field label="Име" error={e.name}><Input name="name" required autoComplete="name" defaultValue={user?.name} /></Field>
        <Field label="Имейл" error={e.email}><Input name="email" type="email" required autoComplete="email" defaultValue={user?.email} /></Field>
      </div>
      <Field label="Телефон" error={e.phone}><Input name="phone" type="tel" autoComplete="tel" placeholder="+359 …" /></Field>
      <Field label="Съобщение" error={e.message}><Textarea name="message" defaultValue={defaultMessage} placeholder="Разкажете ни какво търсите…" /></Field>
      <div>
        <Consent />
        {e.consent && <p role="alert" className="mt-1 text-xs font-medium text-danger">{e.consent}</p>}
      </div>
      {state.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      <Button type="submit" variant="copper" disabled={pending} className="w-full sm:w-auto">{pending ? 'Изпращане…' : submitLabel}</Button>
    </form>
  );
}
