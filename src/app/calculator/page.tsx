import type { Metadata } from 'next';
import { ImportCalculator } from '@/components/import-calculator';
import { getUser } from '@/lib/auth';
import { getPricing } from '@/lib/pricing-server';

export const metadata: Metadata = {
  title: 'Калкулатор за внос на автомобил до България',
  description: 'Изчислете ориентировъчната крайна цена на автомобил от САЩ, Канада или Южна Корея: аукционни такси, транспорт, застраховка, мито, ДДС и комисиона — с пълна разбивка.',
  alternates: { canonical: '/calculator' },
};

export default async function CalculatorPage() {
  const [config, user] = await Promise.all([getPricing(), getUser()]);
  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x py-12">
          <p className="eyebrow">Калкулатор</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Каква е реалната цена до България?</h1>
          <p className="mt-3 max-w-2xl text-muted">Данъчната основа се определя от митническата стойност — цената на автомобила, аукционните такси, транспорта до границата на ЕС и застраховката. Виждате всеки ред поотделно.</p>
        </div>
      </section>
      <div className="container-x py-10"><ImportCalculator config={config} user={user} /></div>
    </>
  );
}
