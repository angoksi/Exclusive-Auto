import type { Metadata } from 'next';
import { FaqList } from '@/components/faq-list';
import { PageHero } from '@/components/page-hero';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Често задавани въпроси', description: 'Отговори за срокове, цени, плащане, повреди и документи при внос на автомобил.', alternates: { canonical: '/faq' } };
export const revalidate = 600;

export default async function Faq() {
  const items = await db.faq.findMany({ orderBy: { position: 'asc' } });
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) };
  return (
    <>
      <PageHero eyebrow="Въпроси" title="Често задавани въпроси" />
      <div className="container-x max-w-3xl py-12"><FaqList items={items} /></div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </>
  );
}
