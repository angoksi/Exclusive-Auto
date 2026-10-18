import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function SectionHead({ eyebrow, title, text, href, hrefLabel = 'Виж всички', center }: { eyebrow?: string; title: string; text?: string; href?: string; hrefLabel?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'flex flex-wrap items-end justify-between gap-4'}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
        {text && <p className="mt-3 max-w-2xl text-muted">{text}</p>}
      </div>
      {href && <Link href={href} className="link-arrow">{hrefLabel} <ArrowRight className="size-4" /></Link>}
    </div>
  );
}
