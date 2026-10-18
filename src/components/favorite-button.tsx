'use client';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/lib/actions/user';
import { cn } from '@/lib/utils';

export function FavoriteButton({ vehicleId, initial, variant = 'icon' }: { vehicleId: string; initial: boolean; variant?: 'icon' | 'full' }) {
  const router = useRouter();
  const [fav, setFav] = useOptimistic(initial, (_, v: boolean) => v);
  const [, start] = useTransition();
  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    start(async () => {
      setFav(!fav);
      const r = await toggleFavorite(vehicleId);
      if (r.needsLogin) router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    });
  };
  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={fav}
      aria-label={fav ? 'Премахни от любими' : 'Добави в любими'}
      className={cn(
        variant === 'icon'
          ? 'grid size-9 place-items-center rounded-full bg-white/95 text-navy-900 shadow-sm ring-1 ring-black/5 hover:bg-white'
          : 'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-paper px-4 text-sm font-semibold text-navy-900 hover:bg-mist',
      )}
    >
      <Heart className={cn('size-4', fav && 'fill-copper-600 text-copper-600')} />
      {variant === 'full' && (fav ? 'В любими' : 'Любими')}
    </button>
  );
}
