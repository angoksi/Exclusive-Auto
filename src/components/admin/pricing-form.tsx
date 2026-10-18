'use client';
import { ActionForm } from '@/components/admin/action-form';
import { Field, Input, Textarea } from '@/components/ui/form';
import { savePricing } from '@/lib/actions/admin';
import type { PricingConfig } from '@/lib/pricing';

export function PricingForm({ c }: { c: PricingConfig }) {
  const nf = (name: string, label: string, v: number, step = 'any') => <Field label={label}><Input name={name} type="number" step={step} min={0} defaultValue={v} required /></Field>;
  return (
    <ActionForm action={savePricing} submit="Запази конфигурацията" variant="copper">
      {() => (
        <>
          <fieldset className="space-y-3"><legend className="mb-1 text-base font-bold text-navy-900">Валутни курсове (единица → EUR)</legend>
            <div className="grid gap-3 sm:grid-cols-3">{nf('fx_USD', '1 USD = € ', c.fx.USD)}{nf('fx_CAD', '1 CAD = € ', c.fx.CAD)}{nf('fx_KRW', '1 KRW = € ', c.fx.KRW)}</div></fieldset>
          <fieldset className="space-y-3"><legend className="mb-1 text-base font-bold text-navy-900">Данъци и такси</legend>
            <div className="grid gap-3 sm:grid-cols-3">{nf('duty_US', 'Мито САЩ (%)', c.dutyRate.US)}{nf('duty_CA', 'Мито Канада (%)', c.dutyRate.CA)}{nf('duty_KR', 'Мито Корея с произход (%)', c.dutyRate.KR)}{nf('vatRate', 'ДДС (%)', c.vatRate)}{nf('insuranceRate', 'Застраховка (% от стойността)', c.insuranceRate)}{nf('customsFees', 'Митнически такси (€)', c.customsFees)}{nf('portFees', 'Пристанищни такси (€)', c.portFees)}</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="portFeesInVatBase" defaultChecked={c.portFeesInVatBase} className="size-4 accent-[var(--color-copper-600)]" /> Пристанищните такси влизат в данъчната основа за ДДС</label></fieldset>
          <fieldset className="space-y-3"><legend className="mb-1 text-base font-bold text-navy-900">Транспорт до пристанище (€)</legend>
            <div className="grid gap-3 sm:grid-cols-3">{nf('inland_US', 'САЩ', c.inland.US)}{nf('inland_CA', 'Канада', c.inland.CA)}{nf('inland_KR', 'Южна Корея', c.inland.KR)}</div></fieldset>
          <fieldset className="space-y-3"><legend className="mb-1 text-base font-bold text-navy-900">Комисиона на компанията</legend>
            <div className="grid gap-3 sm:grid-cols-3">{(['US', 'CA', 'KR'] as const).map((r) => <div key={r} className="space-y-3">{nf(`comm_${r}`, `${r}: процент (%)`, c.commission[r].percent)}{nf(`commMin_${r}`, `${r}: минимум (€)`, c.commission[r].min)}</div>)}</div></fieldset>
          <Field label="Морски транспорт по държава и дестинация (JSON, €)"><Textarea name="sea" defaultValue={JSON.stringify(c.sea, null, 2)} className="min-h-32 font-mono text-xs" /></Field>
          <Field label="Дестинации (JSON: ключ → име)"><Textarea name="destinations" defaultValue={JSON.stringify(c.destinations, null, 2)} className="min-h-24 font-mono text-xs" /></Field>
          <Field label="Аукционни такси по платформа (JSON: нива с upTo / percent / fixed, плюс flat)"><Textarea name="auctionFees" defaultValue={JSON.stringify(c.auctionFees, null, 2)} className="min-h-56 font-mono text-xs" /></Field>
          <Field label="Допълнителни услуги (JSON)"><Textarea name="extras" defaultValue={JSON.stringify(c.extras, null, 2)} className="min-h-40 font-mono text-xs" /></Field>
          <Field label="Текст за ориентировъчност (показва се в калкулатора)"><Textarea name="disclaimer" defaultValue={c.disclaimer} className="min-h-24" /></Field>
        </>
      )}
    </ActionForm>
  );
}
