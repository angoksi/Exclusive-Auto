import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page-hero';
import { Button } from '@/components/ui/button';
import { WHY } from '@/lib/content';

export const metadata: Metadata = { title: 'За нас', description: 'EXCLUSIVE AUTO TRADE — внос на автомобили от САЩ, Канада и Южна Корея с прозрачна цена и личен консултант.', alternates: { canonical: '/about' } };

export default function About() {
  return (
    <>
      <PageHero eyebrow="За нас" title="Внос, при който знаете всичко предварително" text="Създадохме EXCLUSIVE AUTO TRADE, за да направим вноса на автомобили разбираем: ясна цена, честно описание на състоянието и човек, който отговаря за поръчката ви от първия до последния ден." />
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div className="prose-bg">
            <h2 className="text-2xl">Нашият подход</h2>
            <p>Вносът от САЩ, Канада и Южна Корея може да е изгоден, но само когато е добре подготвен. Затова всяка оферта започва с реалистична калкулация: аукционни такси, транспорт, застраховка, мито, ДДС и такси при оформянето.</p>
            <p>Не обещаваме „най-ниската цена“ на всяка цена. Обещаваме да ви кажем какво знаем, какво не знаем и какъв е рискът — особено при автомобили с повреди.</p>
            <p>Работим по писмен договор, а за всяка поръчка поддържаме история на събитията, която клиентът вижда онлайн.</p>
            <Button asChild variant="copper" className="mt-2"><Link href="/contact">Свържете се с нас</Link></Button>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {WHY.slice(0, 4).map((w) => <div key={w.title} className="card p-6"><dt className="font-bold text-navy-900">{w.title}</dt><dd className="mt-2 text-sm leading-6 text-ink/70">{w.text}</dd></div>)}
          </dl>
        </div>
      </section>
    </>
  );
}
