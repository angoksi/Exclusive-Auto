import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Снимка с авто-оптимизация. Демо изображенията (SVG) се показват директно. */
export function Photo({ src, alt, className, priority, sizes = '(min-width:1024px) 33vw, 100vw' }: { src?: string | null; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  if (!src) return <div className={cn('grid place-items-center bg-mist text-xs text-muted', className)}>Няма снимка</div>;
  const direct = src.startsWith('/api/demo-image') || src.endsWith('.svg');
  if (direct) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" className={cn('object-cover', className)} />;
  }
  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </span>
  );
}
