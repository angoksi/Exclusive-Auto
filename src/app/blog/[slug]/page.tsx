import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { dateBg } from '@/lib/format';
import { SITE_NAME, SITE_URL } from '@/lib/site';

type P = { params: Promise<{ slug: string }> };
const load = (slug: string) => db.blogPost.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await load((await params).slug);
  return p ? { title: p.title, description: p.excerpt, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { type: 'article', title: p.title, description: p.excerpt } } : {};
}

export default async function Post({ params }: P) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.excerpt, datePublished: p.publishedAt?.toISOString(), author: { '@type': 'Organization', name: SITE_NAME }, mainEntityOfPage: `${SITE_URL}/blog/${p.slug}` };
  return (
    <article className="container-x max-w-3xl py-14">
      <Link href="/blog" className="text-sm font-semibold text-copper-700">← Блог</Link>
      <p className="mt-6 text-xs text-muted">{dateBg(p.publishedAt)}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{p.title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted">{p.excerpt}</p>
      <div className="prose-bg mt-10 text-base">{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </article>
  );
}
