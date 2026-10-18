import type { Metadata } from 'next';
import { Wizard } from '@/components/wizard';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Намери моя автомобил — персонализирано търсене',
  description: 'Опишете бюджет, предпочитания и срок — ще предложим подходящи автомобили от Южна Корея с пълна разбивка на цената.',
  alternates: { canonical: '/find-my-car' },
};

export default async function FindMyCar() {
  const user = await getUser();
  return (
    <div className="container-x py-14">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow">Персонализирано търсене</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Намери моя автомобил</h1>
        <p className="mt-3 text-muted">Отговорете на няколко въпроса — консултант ще подбере автомобили според вашия бюджет и очаквания.</p>
      </div>
      <Wizard user={user} />
    </div>
  );
}
