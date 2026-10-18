'use client';
import { useEffect, useRef, useState, useTransition, useActionState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bookmark, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { saveSearch } from '@/lib/actions/user';
import { BODIES, COLORS, DRIVES, FUELS, TRANSMISSIONS } from '@/lib/vehicle-options';
import { cn } from '@/lib/utils';
import type { FormState } from '@/lib/actions/types';

type Values = Record<string, string>;

export function CatalogFilters({ values, makeModels, keepParams, loggedIn }: { values: Values; makeModels: Record<string, string[]>; keepParams: Values; loggedIn: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [v, setV] = useState<Values>(values);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  useEffect(() => setV(values), [values]);

  const push = (next: Values) => {
    const p = new URLSearchParams();
    for (const [k, val] of Object.entries({ ...keepParams, ...next })) if (val) p.set(k, val);
    start(() => router.replace(`${pathname}${p.size ? `?${p}` : ''}`, { scroll: false }));
  };
  const set = (k: string, val: string, immediate = true) => {
    const next = { ...v, [k]: val, ...(k === 'make' ? { model: '' } : {}) };
    setV(next);
    clearTimeout(timer.current);
    first.current = false;
    if (immediate) push(next);
    else timer.current = setTimeout(() => push(next), 450);
  };
  const reset = () => {
    setV({});
    push({});
  };
  const active = Object.entries(v).filter(([k, val]) => val && !['sort', 'view', 'page', 'region'].includes(k)).length;
  const models = v.make ? makeModels[v.make] ?? [] : [];
  const sel = (k: string, label: string, opts: string[] | [string, string][]) => (
    <Field label={label}>
      <Select value={v[k] ?? ''} onChange={(e) => set(k, e.target.value)}>
        <option value="">Всички</option>
        {opts.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}
      </Select>
    </Field>
  );
  const range = (a: string, b: string, label: string, ph: [string, string]) => (
    <Field label={label}>
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" inputMode="numeric" min={0} placeholder={ph[0]} value={v[a] ?? ''} onChange={(e) => set(a, e.target.value, false)} />
        <Input type="number" inputMode="numeric" min={0} placeholder={ph[1]} value={v[b] ?? ''} onChange={(e) => set(b, e.target.value, false)} />
      </div>
    </Field>
  );

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="mb-4 flex h-11 w-full items-center justify-between rounded-md border border-line bg-paper px-4 text-sm font-semibold lg:hidden" aria-expanded={open}>
        <span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-4" /> Филтри {active > 0 && <span className="rounded-full bg-copper-600 px-2 text-xs text-white">{active}</span>}</span>
        {open ? <X className="size-4" /> : null}
      </button>
      <aside className={cn('card space-y-5 p-5 lg:sticky lg:top-[120px] lg:block lg:max-h-[calc(100dvh-140px)] lg:overflow-y-auto', open ? 'block' : 'hidden', pending && 'opacity-70')} aria-label="Филтри">
        <div className="flex items-center justify-between">
          <h2 className="text-base">Филтри</h2>
          {active > 0 && <button type="button" onClick={reset} className="text-xs font-semibold text-copper-700 hover:underline">Изчисти ({active})</button>}
        </div>
        <Field label="Търсене"><Input placeholder="Марка, модел, VIN, лот…" value={v.q ?? ''} onChange={(e) => set('q', e.target.value, false)} /></Field>
        <Field label="Марка">
          <Select value={v.make ?? ''} onChange={(e) => set('make', e.target.value)}>
            <option value="">Всички марки</option>
            {Object.keys(makeModels).map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Модел">
          <Select value={v.model ?? ''} onChange={(e) => set('model', e.target.value)} disabled={!v.make}>
            <option value="">{v.make ? 'Всички модели' : 'Първо изберете марка'}</option>
            {models.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        {range('yearFrom', 'yearTo', 'Година (от / до)', ['2018', '2024'])}
        {range('priceFrom', 'priceTo', 'Цена в € (от / до)', ['5 000', '40 000'])}
        <Field label="Пробег до (км)"><Input type="number" inputMode="numeric" min={0} placeholder="напр. 80000" value={v.kmMax ?? ''} onChange={(e) => set('kmMax', e.target.value, false)} /></Field>
        {sel('fuel', 'Гориво', FUELS)}
        {sel('transmission', 'Скоростна кутия', TRANSMISSIONS)}
        {sel('bodyType', 'Тип купе', BODIES)}
        {sel('drive', 'Задвижване', DRIVES)}
        {sel('color', 'Цвят', COLORS)}
        <details className="group border-t border-line pt-4" open={Boolean(v.condition || v.damage || v.runs || v.source || v.saleType || v.location || v.bidFrom || v.bidTo || v.auctionFrom || v.auctionTo)}>
          <summary className="cursor-pointer list-none text-sm font-semibold text-navy-900">Състояние, търг и локация <span className="text-copper-600 group-open:hidden">+</span><span className="hidden text-copper-600 group-open:inline">−</span></summary>
          <div className="mt-4 space-y-5">
            {sel('condition', 'Състояние', [['NEW', 'Нов'], ['EXCELLENT', 'Отлично'], ['GOOD', 'Добро'], ['FAIR', 'Задоволително'], ['DAMAGED', 'Повреден'], ['SALVAGE', 'Salvage']])}
            {sel('damage', 'Наличие на повреди', [['yes', 'С повреди'], ['no', 'Без повреди']])}
            {sel('runs', 'В движение', [['yes', 'В движение'], ['no', 'Не е в движение']])}
            {sel('source', 'Платформа', [['COPART', 'Copart'], ['IAAI', 'IAAI'], ['ENCAR', 'Encar'], ['KCAR', 'K Car'], ['AUTOWINI', 'Autowini']])}
            {sel('saleType', 'Тип продажба', [['AUCTION', 'Търг'], ['BUY_NOW', 'Buy Now']])}
            {range('bidFrom', 'bidTo', 'Текуща цена на наддаване в € (от / до)', ['0', '20 000'])}
            <Field label="Дата на търга (от / до)">
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={v.auctionFrom ?? ''} onChange={(e) => set('auctionFrom', e.target.value)} />
                <Input type="date" value={v.auctionTo ?? ''} onChange={(e) => set('auctionTo', e.target.value)} />
              </div>
            </Field>
            <Field label="Локация"><Input placeholder="напр. Houston, Seoul" value={v.location ?? ''} onChange={(e) => set('location', e.target.value, false)} /></Field>
          </div>
        </details>
        <SaveSearch loggedIn={loggedIn} query={new URLSearchParams(Object.entries(v).filter(([k, x]) => x && !['page', 'view'].includes(k))).toString()} />
        <Button type="button" variant="outline" className="w-full" onClick={reset}>Изчисти филтрите</Button>
      </aside>
    </div>
  );
}

function SaveSearch({ loggedIn, query }: { loggedIn: boolean; query: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSearch, {});
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button type="button" variant="ghost" className="w-full justify-start px-0 text-copper-700" onClick={() => setOpen(true)}>
        <Bookmark /> Запази това търсене
      </Button>
    );
  if (!loggedIn) return <p className="rounded-md bg-mist p-3 text-xs text-ink/80"><a href="/login?next=/catalog" className="font-semibold text-copper-700 underline">Влезте</a>, за да запазите търсене и да получавате известия.</p>;
  return (
    <form action={action} className="space-y-3 rounded-md bg-mist p-3">
      <input type="hidden" name="query" value={query} />
      <Field label="Име на търсенето" error={state.errors?.name}><Input name="name" required placeholder="напр. Tucson до 25 000 €" /></Field>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="notify" defaultChecked className="accent-[var(--color-copper-600)]" /> Известявай ме за нови автомобили</label>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {state.ok ? <p className="text-xs font-medium text-ok">{state.message}</p> : <Button size="sm" disabled={pending} className="w-full">Запази</Button>}
    </form>
  );
}
