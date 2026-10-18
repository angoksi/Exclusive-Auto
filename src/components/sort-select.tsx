'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select } from '@/components/ui/form';

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <Select
      aria-label="Сортиране"
      className="h-10 w-auto min-w-52"
      value={value}
      onChange={(e) => {
        const p = new URLSearchParams(sp);
        p.set('sort', e.target.value);
        p.delete('page');
        router.replace(`${pathname}?${p}`, { scroll: false });
      }}
    >
      <option value="newest">Най-нови обяви</option>
      <option value="price_asc">Цена: ниска → висока</option>
      <option value="price_desc">Цена: висока → ниска</option>
      <option value="year_desc">Година: най-нова</option>
      <option value="year_asc">Година: най-стара</option>
      <option value="km_asc">Пробег: най-нисък</option>
      <option value="auction_asc">Дата на търга: най-близка</option>
    </Select>
  );
}
