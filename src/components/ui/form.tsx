'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { useFieldError } from '@/components/form-context';

const field =
  'w-full rounded-md border border-line bg-paper px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-navy-900/30 focus:border-copper-600 focus:outline-none focus:ring-2 focus:ring-copper-600/20 disabled:opacity-60';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(field, 'h-11', className)} {...p} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-28 py-3', className)} {...p} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...p }, ref) => (
  <select ref={ref} className={cn(field, 'h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%277%27 fill=%27none%27%3E%3Cpath d=%27m1 1 5 5 5-5%27 stroke=%27%23667085%27 stroke-width=%271.6%27 stroke-linecap=%27round%27/%3E%3C/svg%3E")] bg-[length:12px_7px] bg-[right_14px_center] bg-no-repeat pr-9', className)} {...p}>
    {children}
  </select>
));
Select.displayName = 'Select';

export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-xs font-semibold text-navy-900/80', className)} {...p} />;
}

export function Field({ label, error, name, children, className, hint }: { label: string; error?: string; name?: string; children: React.ReactNode; className?: string; hint?: string }) {
  const ctxError = useFieldError(name);
  error = error ?? ctxError;
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Consent({ name = 'consent' }: { name?: string }) {
  return (
    <label className="flex items-start gap-2.5 text-xs leading-5 text-muted">
      <input type="checkbox" name={name} required className="mt-1 size-4 rounded border-line accent-[var(--color-copper-600)]" />
      <span>
        Съгласен/на съм личните ми данни да бъдат обработвани с цел отговор на запитването ми съгласно{' '}
        <a href="/privacy" className="font-semibold text-copper-700 underline">Политиката за поверителност</a>.
      </span>
    </label>
  );
}
