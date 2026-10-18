import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page-hero';
import { Button } from '@/components/ui/button';
import { PROCESS } from '@/lib/content';
import { STAGES } from '@/lib/stages';

export const metadata: Metadata = { title: 'Как работи вносът на автомобил', description: 'Шест стъпки от консултацията до предаването и десет етапа на проследяване на доставката.', alternates: { canonical: '/how-it-works' } };

export default function How() {
  return (
    <>
      <PageHero eyebrow="Процес" title="Как работи вносът" text="Ясна последователност, в която знаете какво се случва, кой отговаря и колко време отнема." />
      <section className="section">
        <div className="container-x">
          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map((s, i) => (
              <li key={s.title} className="card p-7"><span className="text-sm font-bold text-copper-600">Стъпка 0{i + 1}</span><h2 className="mt-3 text-xl">{s.title}</h2><p className="mt-2 text-sm leading-6 text-ink/70">{s.text}</p></li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section bg-paper">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div><p className="eyebrow">Проследяване</p><h2 className="mt-2 text-3xl">10 етапа, които виждате онлайн</h2><p className="mt-3 text-muted">След покупка получавате номер на поръчка и следите всеки етап заедно с бележките на консултанта.</p><Button asChild variant="copper" className="mt-6"><Link href="/tracking">Към проследяването</Link></Button></div>
          <ol className="grid gap-3 sm:grid-cols-2">{STAGES.map((s) => <li key={s.n} className="card flex gap-3 p-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">{s.n}</span><span><strong className="block text-sm text-navy-900">{s.title}</strong><span className="text-xs text-muted">{s.hint}</span></span></li>)}</ol>
        </div>
      </section>
    </>
  );
}
