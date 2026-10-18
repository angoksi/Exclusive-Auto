import Image from 'next/image';
import { SafeImg } from '@/components/safe-img';
import { cn } from '@/lib/utils';

/** Снимка с авто-оптимизация. Демо изображенията (SVG) се показват директно. */
export function Photo({ src, alt, className, priority, sizes = '(min-width:1024px) 33vw, 100vw' }: { src?: string | null; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  if (!src) return <div className={cn('grid place-items-center bg-gradient-to-br from-navy-800 to-navy-950 text-center text-xs font-semibold tracking-wide text-white/70', className)}><span>Снимки при запитване</span></div>;
  const direct = src.startsWith('/api/demo-image') || src.startsWith('/api/photo') || src.endsWith('.svg');
  if (direct) return <SafeImg src={src} alt={alt} eager={priority} className={className} />;
  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </span>
  );
}
