import { PageHero } from '@/components/page-hero';

export function Legal({ title, updated = '1 януари 2026 г.', children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} text={`Последна актуализация: ${updated}`} />
      <div className="container-x max-w-3xl py-12">
        <p className="mb-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Шаблонен текст. Преди публикуване трябва да бъде допълнен с данните на дружеството (наименование, ЕИК, адрес) и прегледан от юрист.</p>
        <div className="prose-bg text-[15px]">{children}</div>
      </div>
    </>
  );
}
