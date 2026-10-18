'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Изображение, което при грешка при зареждане показва неутрален блок вместо счупена иконка. */
export function SafeImg({ src, alt, className, eager }: { src: string; alt: string; className?: string; eager?: boolean }) {
  const [bad, setBad] = useState(false);
  if (bad)
    return <div className={cn('grid place-items-center bg-gradient-to-br from-navy-800 to-navy-950 text-center text-xs font-semibold tracking-wide text-white/70', className)}><span>Снимки при запитване</span></div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBad(true)} className={cn('object-cover', className)} />;
}
