import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { PROCESS } from '@/lib/content';

export const metadata: Metadata = { title: 'Как работи вносът на автомобил', description: 'Шест стъпки от консултацията до предаването .', alternates: { canonical: '/how-it-works' } };

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
    </>
  );
}
