'use client';
import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/utils';

const COOKIE = 'eat_compare';
const MAX = 4;

function read(): string[] {
  const m = document.cookie.split('; ').find((c) => c.startsWith(COOKIE + '='));
  return m ? decodeURIComponent(m.split('=')[1]).split(',').filter(Boolean) : [];
}
function write(list: string[]) {
  document.cookie = `${COOKIE}=${encodeURIComponent(list.join(','))}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  window.dispatchEvent(new Event('compare-change'));
}
const subscribe = (cb: () => void) => {
  window.addEventListener('compare-change', cb);
  return () => window.removeEventListener('compare-change', cb);
};

export function CompareButton({ slug, variant = 'icon', initial = false }: { slug: string; variant?: 'icon' | 'full'; initial?: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const on = useSyncExternalStore(subscribe, () => read().includes(slug), () => initial);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const list = read();
    if (list.includes(slug)) write(list.filter((s) => s !== slug));
    else if (list.length >= MAX) return setMsg(`Максимум ${MAX} автомобила`);
    else write([...list, slug]);
    setMsg('');
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={msg || (on ? 'Премахни от сравнението' : 'Сравни')}
      className={cn(
        variant === 'icon'
          ? 'grid size-9 place-items-center rounded-full bg-white/95 text-navy-900 shadow-sm ring-1 ring-black/5 hover:bg-white'
          : 'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-paper px-4 text-sm font-semibold text-navy-900 hover:bg-mist',
        on && 'ring-2 ring-copper-600',
      )}
    >
      <GitCompareArrows className={cn('size-4', on && 'text-copper-600')} />
      {variant === 'full' && (msg || (on ? 'В сравнението' : 'Сравни'))}
    </button>
  );
}
