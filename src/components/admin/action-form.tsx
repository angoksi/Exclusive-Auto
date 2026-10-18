'use client';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FormErrorsContext } from '@/components/form-context';
import type { FormState } from '@/lib/actions/types';

type Act = (prev: FormState, fd: FormData) => Promise<FormState>;

/** Обвивка на сървърни действия с показване на грешки/успех и деактивиране при изпращане. */
export function ActionForm({ action, children, submit = 'Запази', className, variant = 'primary' }: { action: Act; children: React.ReactNode | ((s: FormState) => React.ReactNode); submit?: string; className?: string; variant?: 'primary' | 'copper' | 'outline' }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className={cn('space-y-4', className)}>
      <FormErrorsContext.Provider value={state.errors ?? {}}>{typeof children === 'function' ? children(state) : children}</FormErrorsContext.Provider>
      {state.error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-medium text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm font-medium text-ok">{state.message ?? 'Запазено.'}</p>}
      <Button type="submit" variant={variant} disabled={pending}>{pending ? 'Запис…' : submit}</Button>
    </form>
  );
}

export function RunButton({ action, label, variant = 'outline', mono }: { action: () => Promise<FormState>; label: string; variant?: 'outline' | 'primary' | 'copper'; mono?: boolean }) {
  const [state, run, pending] = useActionState(async () => action(), {} as FormState);
  return (
    <form action={run} className="inline-flex flex-col gap-2">
      <Button type="submit" variant={variant} size="sm" disabled={pending}>{pending ? 'Изпълнява се…' : label}</Button>
      {state.error && <p className="max-w-md text-xs font-medium text-danger">{state.error}</p>}
      {state.message && (mono ? <textarea readOnly value={state.message} className="h-64 w-[min(80vw,640px)] rounded-md border border-line bg-paper p-3 font-mono text-[11px]" /> : <p className="max-w-md text-xs text-muted">{state.message}</p>)}
    </form>
  );
}
