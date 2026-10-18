'use client';
import { ActionForm } from '@/components/admin/action-form';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { saveVehicle } from '@/lib/actions/admin';
import { BODIES, COLORS, DRIVES, FUELS, TRANSMISSIONS } from '@/lib/vehicle-options';

type V = Partial<{ id: string; region: string; source: string; make: string; model: string; trim: string | null; year: number; vin: string | null; lotNumber: string | null; platform: string | null; saleType: string; currency: string; currentBid: number | null; buyNowPrice: number | null; auctionDate: Date | null; location: string; country: string; odometerKm: number; engine: string; fuel: string; transmission: string; drive: string; bodyType: string; color: string; condition: string; primaryDamage: string | null; secondaryDamage: string | null; runsAndDrives: boolean; hasKeys: boolean; description: string; features: string[]; status: string; featured: boolean; published: boolean }>;

const toLocal = (d?: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

export function VehicleForm({ v = {} }: { v?: V }) {
  return (
    <ActionForm action={saveVehicle} submit={v.id ? 'Запази промените' : 'Създай автомобил'} variant="copper">
      {(s) => {
        const e = s.errors ?? {};
        const f = (name: string, label: string, props: React.ComponentProps<typeof Input> = {}) => (
          <Field label={label} error={e[name]}><Input name={name} defaultValue={(v as Record<string, unknown>)[name] as string ?? ''} {...props} /></Field>
        );
        const sel = (name: string, label: string, opts: (string | [string, string])[], def?: string) => (
          <Field label={label} error={e[name]}>
            <Select name={name} defaultValue={((v as Record<string, unknown>)[name] as string) ?? def}>{opts.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}</Select>
          </Field>
        );
        return (
          <>
            {v.id && <input type="hidden" name="id" value={v.id} />}
            <div className="grid gap-4 sm:grid-cols-3">
              <input type="hidden" name="region" value="KR" />
              {sel('source', 'Източник', [['ENCAR', 'Encar'], ['KCAR', 'K Car'], ['AUTOWINI', 'Autowini'], ['OTHER', 'Друг източник / дилър']], 'ENCAR')}
              {f('platform', 'Платформа (етикет)')}
              {f('make', 'Марка', { required: true })}{f('model', 'Модел', { required: true })}{f('trim', 'Модификация')}
              {f('year', 'Година', { type: 'number', required: true })}{f('vin', 'VIN', { maxLength: 17, className: 'font-mono uppercase' })}{f('lotNumber', 'Номер на лот / търг')}
              {sel('saleType', 'Тип продажба', [['BUY_NOW', 'Фиксирана цена'], ['AUCTION', 'Търг']], 'BUY_NOW')}
              {sel('currency', 'Валута', ['KRW', 'USD', 'EUR'], 'KRW')}
              {f('auctionDate', 'Дата на търга', { type: 'datetime-local', defaultValue: toLocal(v.auctionDate) })}
              {f('currentBid', 'Текуща цена на наддаване (само при търг)', { type: 'number', min: 0 })}{f('buyNowPrice', 'Фиксирана цена', { type: 'number', min: 0 })}
              {f('location', 'Локация (град)', { required: true })}<input type="hidden" name="country" value="Южна Корея" />{f('odometerKm', 'Пробег (км)', { type: 'number', required: true, min: 0 })}
              {f('engine', 'Двигател', { required: true })}
              {sel('fuel', 'Гориво', FUELS)}{sel('transmission', 'Трансмисия', TRANSMISSIONS)}{sel('drive', 'Задвижване', DRIVES)}{sel('bodyType', 'Тип купе', BODIES)}{sel('color', 'Цвят', COLORS)}
              {sel('condition', 'Състояние', [['NEW', 'Нов'], ['EXCELLENT', 'Отлично'], ['GOOD', 'Добро'], ['FAIR', 'Задоволително'], ['DAMAGED', 'Повреден'], ['SALVAGE', 'Salvage']], 'GOOD')}
              {f('primaryDamage', 'Основна повреда')}{f('secondaryDamage', 'Вторична повреда')}
              {sel('status', 'Статус', [['AVAILABLE', 'Наличен'], ['RESERVED', 'Резервиран'], ['SOLD', 'Продаден'], ['ARCHIVED', 'Архивиран']], 'AVAILABLE')}
            </div>
            <Field label="Описание" error={e.description}><Textarea name="description" defaultValue={v.description} required /></Field>
            <Field label="Екипировка (по една на ред)"><Textarea name="features" defaultValue={(v.features ?? []).join('\n')} className="min-h-24" /></Field>
            <Field label="Качване на снимки (JPG, PNG, WEBP до 6 MB)"><Input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple className="h-auto py-2.5" /></Field>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {([['runsAndDrives', 'В движение', v.runsAndDrives ?? true], ['hasKeys', 'Налични ключове', v.hasKeys ?? true], ['featured', 'Препоръчан', v.featured ?? false], ['published', 'Публикуван', v.published ?? true]] as const).map(([n, l, d]) => (
                <label key={n} className="flex items-center gap-2"><input type="checkbox" name={n} defaultChecked={d} className="size-4 accent-[var(--color-copper-600)]" />{l}</label>
              ))}
            </div>
          </>
        );
      }}
    </ActionForm>
  );
}
