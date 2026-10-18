'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { Photo } from '@/components/photo';
import { cn } from '@/lib/utils';

export function Gallery({ images, title }: { images: { url: string; alt?: string | null }[]; title: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    if (full) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full, go]);

  if (!n) return <div className="grid aspect-[3/2] place-items-center rounded-lg bg-mist text-muted">Няма снимки</div>;

  const swipe = {
    onPointerDown: (e: React.PointerEvent) => { startX.current = e.clientX; },
    onPointerUp: (e: React.PointerEvent) => {
      if (startX.current == null) return;
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      startX.current = null;
    },
  };

  return (
    <div>
      <div className="group relative aspect-[3/2] touch-pan-y select-none overflow-hidden rounded-lg bg-mist" {...swipe} role="group" aria-roledescription="галерия" aria-label={`Снимки на ${title}`}>
        <Photo src={images[i].url} alt={images[i].alt ?? `${title} — снимка ${i + 1}`} priority sizes="(min-width:1024px) 60vw, 100vw" className="pointer-events-none size-full" />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Предишна снимка" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 opacity-0 shadow transition-opacity hover:bg-white focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100"><ChevronLeft className="size-5" /></button>
            <button type="button" onClick={() => go(1)} aria-label="Следваща снимка" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 opacity-0 shadow transition-opacity hover:bg-white focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100"><ChevronRight className="size-5" /></button>
          </>
        )}
        <button type="button" onClick={() => setFull(true)} aria-label="На цял екран" className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-2 rounded-md bg-white/90 px-3 text-xs font-semibold shadow hover:bg-white"><Expand className="size-4" /> {i + 1} / {n}</button>
      </div>
      {n > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, k) => (
            <li key={k} className="shrink-0">
              <button type="button" onClick={() => setI(k)} aria-label={`Снимка ${k + 1}`} aria-current={k === i} className={cn('block h-16 w-24 overflow-hidden rounded-md border-2 transition-colors', k === i ? 'border-copper-600' : 'border-transparent opacity-70 hover:opacity-100')}>
                <Photo src={im.url} alt="" sizes="96px" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog.Root open={full} onOpenChange={setFull}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-navy-950/95" />
          <Dialog.Content className="fixed inset-0 z-[61] flex flex-col outline-none" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{title} — галерия</Dialog.Title>
            <div className="flex items-center justify-between p-4 text-white">
              <span className="text-sm font-semibold">{title} · {i + 1} / {n}</span>
              <Dialog.Close className="grid size-10 place-items-center rounded-md hover:bg-white/10" aria-label="Затвори"><X /></Dialog.Close>
            </div>
            <div className="relative flex-1 touch-pan-y select-none px-4 pb-4" {...swipe}>
              <div className="relative mx-auto h-full max-w-6xl">
                <Photo src={images[i].url} alt={images[i].alt ?? title} sizes="100vw" className="pointer-events-none size-full !object-contain" />
              </div>
              {n > 1 && (
                <>
                  <button type="button" onClick={() => go(-1)} aria-label="Предишна" className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronLeft /></button>
                  <button type="button" onClick={() => go(1)} aria-label="Следваща" className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronRight /></button>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
