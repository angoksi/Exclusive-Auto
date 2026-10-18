'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { InquiryForm } from '@/components/inquiry-form';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { BODIES, FUELS } from '@/lib/vehicle-options';
import { cn } from '@/lib/utils';

const REGIONS = [['US', 'САЩ'], ['CA', 'Канада'], ['KR', 'Южна Корея'], ['ANY', 'Нямам предпочитание']];
const URGENCY = [['asap', 'Възможно най-скоро'], ['2m', 'До 2 месеца'], ['3m+', 'Над 3 месеца — не бързам']];
const CONDITION = [['clean', 'Без повреди'], ['minor', 'Допустими леки повреди'], ['any', 'Готов съм и за автомобил с повреди']];

export function Wizard({ user }: { user?: { name: string; email: string } | null }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ budget: 25000, regions: ['ANY'] as string[], bodies: [] as string[], fuels: [] as string[], make: '', yearFrom: '2019', condition: 'clean', urgency: '2m' });
  const toggle = (k: 'regions' | 'bodies' | 'fuels', v: string) => setD((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const steps = ['Бюджет и държава', 'Предпочитания', 'Срок и състояние', 'Контакт'];
  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition-colors', on ? 'border-navy-900 bg-navy-900 text-white' : 'border-line bg-paper hover:bg-mist')}>{children}</button>
  );

  return (
    <div className="card mx-auto max-w-3xl p-6 sm:p-10">
      <ol className="mb-8 flex gap-2" aria-label="Стъпки">
        {steps.map((s, i) => (
          <li key={s} className="flex-1"><div className={cn('h-1.5 rounded-full', i <= step ? 'bg-copper-600' : 'bg-line')} /><p className={cn('mt-2 hidden text-xs font-semibold sm:block', i === step ? 'text-navy-900' : 'text-muted')}>{s}</p></li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-6">
          <Field label={`Бюджет до крайна цена в България: ${new Intl.NumberFormat('bg-BG').format(d.budget)} €`}>
            <input type="range" min={8000} max={80000} step={1000} value={d.budget} onChange={(e) => setD({ ...d, budget: +e.target.value })} className="w-full accent-[var(--color-copper-600)]" />
          </Field>
          <div><p className="mb-2 text-xs font-semibold text-navy-900/80">Държава на произход</p><div className="flex flex-wrap gap-2">{REGIONS.map(([v, l]) => <Chip key={v} on={d.regions.includes(v)} onClick={() => toggle('regions', v)}>{l}</Chip>)}</div></div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-6">
          <div><p className="mb-2 text-xs font-semibold text-navy-900/80">Тип превозно средство</p><div className="flex flex-wrap gap-2">{BODIES.map((b) => <Chip key={b} on={d.bodies.includes(b)} onClick={() => toggle('bodies', b)}>{b}</Chip>)}</div></div>
          <div><p className="mb-2 text-xs font-semibold text-navy-900/80">Гориво</p><div className="flex flex-wrap gap-2">{FUELS.map((b) => <Chip key={b} on={d.fuels.includes(b)} onClick={() => toggle('fuels', b)}>{b}</Chip>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Предпочитана марка / модел"><Input value={d.make} onChange={(e) => setD({ ...d, make: e.target.value })} placeholder="напр. Hyundai Tucson" maxLength={80} /></Field>
            <Field label="Година от"><Select value={d.yearFrom} onChange={(e) => setD({ ...d, yearFrom: e.target.value })}>{Array.from({ length: 12 }, (_, i) => String(2025 - i)).map((y) => <option key={y}>{y}</option>)}</Select></Field>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <div><p className="mb-2 text-xs font-semibold text-navy-900/80">Кога ви е необходим автомобилът?</p><div className="flex flex-wrap gap-2">{URGENCY.map(([v, l]) => <Chip key={v} on={d.urgency === v} onClick={() => setD({ ...d, urgency: v })}>{l}</Chip>)}</div></div>
          <div><p className="mb-2 text-xs font-semibold text-navy-900/80">Състояние</p><div className="flex flex-wrap gap-2">{CONDITION.map(([v, l]) => <Chip key={v} on={d.condition === v} onClick={() => setD({ ...d, condition: v })}>{l}</Chip>)}</div></div>
        </div>
      )}
      {step === 3 && (
        <div>
          <p className="mb-5 rounded-md bg-mist p-4 text-sm text-ink/80">Бюджет до <strong>{new Intl.NumberFormat('bg-BG').format(d.budget)} €</strong> · {d.regions.map((r) => REGIONS.find((x) => x[0] === r)?.[1]).join(', ')} · {d.bodies.join(', ') || 'всички типове'}</p>
          <InquiryForm type="WIZARD" payload={d} user={user} submitLabel="Изпрати заявката" defaultMessage={d.make ? `Търся: ${d.make}.` : ''} />
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}><ArrowLeft /> Назад</Button>
        {step < 3 && <Button type="button" onClick={() => setStep(step + 1)}>Напред <ArrowRight /></Button>}
      </div>
    </div>
  );
}
