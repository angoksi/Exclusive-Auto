'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { BODIES, FUELS } from '@/lib/vehicle-options';

export function HeroSearch({ makeModels }: { makeModels: Record<string, string[]> }) {
  const router = useRouter();
  const [make, setMake] = useState('');
  const years = Array.from({ length: 14 }, (_, i) => String(new Date().getFullYear() - i));

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p = new URLSearchParams();
    for (const [k, v] of fd) if (typeof v === 'string' && v) p.set(k, v);
    router.push(`/catalog${p.size ? `?${p}` : ''}`);
  };

  return (
    <form onSubmit={submit} className="rounded-lg bg-paper p-4 shadow-2xl shadow-navy-950/30 sm:p-5" aria-label="Бързо търсене">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Гориво">
          <Select name="fuel" defaultValue=""><option value="">Всички</option>{FUELS.map((f) => <option key={f}>{f}</option>)}</Select>
        </Field>
        <Field label="Марка">
          <Select name="make" value={make} onChange={(e) => setMake(e.target.value)}>
            <option value="">Всички марки</option>
            {Object.keys(makeModels).map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Модел">
          <Select name="model" key={make} disabled={!make}>
            <option value="">{make ? 'Всички модели' : 'Изберете марка'}</option>
            {(makeModels[make] ?? []).map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Тип превозно средство">
          <Select name="bodyType" defaultValue=""><option value="">Всички типове</option>{BODIES.map((b) => <option key={b}>{b}</option>)}</Select>
        </Field>
        <Field label="Година от"><Select name="yearFrom" defaultValue=""><option value="">Всички</option>{years.map((y) => <option key={y}>{y}</option>)}</Select></Field>
        <Field label="Година до"><Select name="yearTo" defaultValue=""><option value="">Всички</option>{years.map((y) => <option key={y}>{y}</option>)}</Select></Field>
        <div className="flex items-end"><Button type="submit" variant="copper" size="lg" className="w-full"><Search /> Търси автомобили</Button></div>
      </div>
    </form>
  );
}
