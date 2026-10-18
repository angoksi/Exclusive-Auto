'use client';
import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { InquiryForm } from '@/components/inquiry-form';
import { Field, Input, Select } from '@/components/ui/form';
import { calculateImport, platformKeyFor, type CalcInput, type PricingConfig } from '@/lib/pricing';
import { eur, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Region } from '@/generated/prisma/enums';

const GROUPS = [
  { id: 'vehicle', label: 'Автомобил', color: 'bg-navy-900' },
  { id: 'transport', label: 'Транспорт', color: 'bg-navy-600' },
  { id: 'tax', label: 'Данъци и такси', color: 'bg-copper-600' },
  { id: 'service', label: 'Услуги', color: 'bg-copper-300' },
] as const;

export type CalcPreset = { price?: number; currency?: string; platform?: string; vehicleSlug?: string; vehicleTitle?: string };

export function ImportCalculator({ config, preset = {}, user }: { config: PricingConfig; preset?: CalcPreset; user?: { name: string; email: string } | null }) {
  const region: Region = 'KR';
  const [currency, setCurrency] = useState(preset.currency ?? 'KRW');
  const [price, setPrice] = useState(preset.price ?? 20_000_000);
  const [platform, setPlatform] = useState(preset.platform ?? platformKeyFor('ENCAR', region));
  const [manualFee, setManualFee] = useState(false);
  const [fee, setFee] = useState(0);
  const [manualInland, setManualInland] = useState(false);
  const [inland, setInland] = useState(0);
  const [manualSea, setManualSea] = useState(false);
  const [sea, setSea] = useState(0);
  const [destination, setDestination] = useState('varna');
  const [insurance, setInsurance] = useState(true);
  const [originProof, setOriginProof] = useState(true);
  const [extras, setExtras] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const input: CalcInput = {
    region, price: Number(price) || 0, currency, platform, destination, insurance, originProof, extras,
    auctionFeeOverride: manualFee ? Number(fee) || 0 : null,
    inlandOverride: manualInland ? Number(inland) || 0 : null,
    seaOverride: manualSea ? Number(sea) || 0 : null,
  };
  const res = useMemo(() => calculateImport(input, config), [input, config]); // eslint-disable-line react-hooks/exhaustive-deps

  const platforms = ['KOREA', 'OTHER'];
  const groupSum = (g: string) => res.lines.filter((l) => l.group === g).reduce((s, l) => s + l.amount, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Валута на цената">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="KRW">Южнокорейски вон (₩)</option><option value="USD">Щатски долар ($)</option><option value="EUR">Евро (€)</option>
            </Select>
          </Field>
          <Field label={`Покупна цена (${currency})`}>
            <Input type="number" min={0} step={currency === 'KRW' ? 100000 : 100} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <Field label="Източник на автомобила">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {platforms.map((k) => <option key={k} value={k}>{config.auctionFees[k]?.label ?? k}</option>)}
            </Select>
          </Field>
          <Field label="Дестинация (пристанище)">
            <Select value={destination} onChange={(e) => setDestination(e.target.value)}>
              {Object.entries(config.destinations).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </Field>
        </div>

        <div className="space-y-4 border-t border-line pt-5">
          <Override label={`Такси на платформата (${currency})`} manual={manualFee} onToggle={setManualFee} value={fee} onChange={setFee} auto={`≈ ${money(Math.round(res.lines.find((l) => l.key === 'auction')!.amount / res.currencyRate), currency)}`} />
          <Override label="Транспорт до пристанище (€)" manual={manualInland} onToggle={setManualInland} value={inland} onChange={setInland} auto={eur(res.lines.find((l) => l.key === 'inland')!.amount)} />
          <Override label="Морски транспорт (€)" manual={manualSea} onToggle={setManualSea} value={sea} onChange={setSea} auto={eur(res.lines.find((l) => l.key === 'sea')!.amount)} />
        </div>

        <div className="space-y-3 border-t border-line pt-5">
          <Check checked={insurance} onChange={setInsurance} label={`Застраховка на товара (${config.insuranceRate}% от стойността)`} />
          <Check checked={originProof} onChange={setOriginProof} label="Налично доказателство за корейски произход (преференциално мито по ССТ ЕС–Корея)" />
        </div>

        <fieldset className="space-y-3 border-t border-line pt-5">
          <legend className="mb-1 text-xs font-semibold text-navy-900/80">Допълнителни услуги</legend>
          {config.extras.map((e) => (
            <Check key={e.id} checked={extras.includes(e.id)} onChange={(c) => setExtras(c ? [...extras, e.id] : extras.filter((x) => x !== e.id))} label={`${e.label} — ${eur(e.price)}`} />
          ))}
        </fieldset>
      </div>

      <div className="lg:sticky lg:top-[120px] lg:self-start">
        <div className="card overflow-hidden">
          <div className="bg-navy-900 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-copper-300">Очаквана обща стойност</p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums" aria-live="polite">{eur(res.total)}</p>
            <p className="mt-1 text-xs text-white/60">Ориентировъчна оценка · курсове от {config.fxUpdatedAt}</p>
            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label="Разпределение на цената">
              {GROUPS.map((g) => <div key={g.id} className={cn(g.color === 'bg-navy-600' ? 'bg-[#4b6a96]' : g.color)} style={{ width: `${(groupSum(g.id) / res.total) * 100}%` }} />)}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/75">
              {GROUPS.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><i className={cn('size-2 rounded-full', g.color === 'bg-navy-600' ? 'bg-[#4b6a96]' : g.color)} />{g.label}</span><span className="tabular-nums">{eur(groupSum(g.id))}</span></li>
              ))}
            </ul>
          </div>
          <dl className="divide-y divide-line px-6">
            {res.lines.map((l) => (
              <div key={l.key} className="flex items-start justify-between gap-4 py-3 text-sm">
                <dt><span className="text-ink/85">{l.label}</span>{l.note && <span className="block text-xs text-muted">{l.note}</span>}</dt>
                <dd className="font-semibold tabular-nums text-navy-900">{eur(l.amount)}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between py-4 text-base font-extrabold text-navy-900"><dt>Общо</dt><dd className="tabular-nums">{eur(res.total)}</dd></div>
          </dl>
          <div className="space-y-4 border-t border-line bg-cream/60 p-6">
            <p className="flex gap-2 text-xs leading-5 text-muted"><Info className="mt-0.5 size-4 shrink-0 text-copper-600" />{config.disclaimer}</p>
            {!showForm ? (
              <button type="button" onClick={() => setShowForm(true)} className="h-11 w-full rounded-md bg-copper-600 text-sm font-semibold text-white hover:bg-copper-700">Изпрати калкулацията като запитване</button>
            ) : (
              <InquiryForm type="CALCULATOR" compact vehicleSlug={preset.vehicleSlug} payload={{ input }} user={user} defaultMessage={preset.vehicleTitle ? `Запитване за ${preset.vehicleTitle} с калкулация ${eur(res.total)}.` : `Моля за оферта според калкулация ${eur(res.total)}.`} submitLabel="Изпрати запитването" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/85">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-copper-600)]" />
      <span>{label}</span>
    </label>
  );
}

function Override({ label, manual, onToggle, value, onChange, auto }: { label: string; manual: boolean; onToggle: (v: boolean) => void; value: number; onChange: (n: number) => void; auto: string }) {
  return (
    <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
      <Field label={label} hint={manual ? undefined : `Автоматично: ${auto}`}>
        <Input type="number" min={0} disabled={!manual} value={manual ? value : ''} placeholder={manual ? '0' : 'автоматично'} onChange={(e) => onChange(Number(e.target.value))} />
      </Field>
      <label className="flex h-11 items-center gap-2 text-xs font-semibold text-navy-900"><input type="checkbox" checked={manual} onChange={(e) => onToggle(e.target.checked)} className="size-4 accent-[var(--color-copper-600)]" /> Ръчно</label>
    </div>
  );
}
