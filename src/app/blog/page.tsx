import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/page-hero';
import { db } from '@/lib/db';
import { dateBg } from '@/lib/format';

export const metadata: Metadata = { title: 'Блог — всичко за вноса на автомобили', description: 'Практични статии за цени, мито, ДДС, повреди и избор на автомобил при внос от САЩ, Канада и Южна Корея.', alternates: { canonical: '/blog' } };
export const revalidate = 600;

export default async function Blog() {
  const posts = await db.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: 'desc' } });
  return (
    <>
      <PageHero eyebrow="Блог" title="Знания за по-спокоен внос" />
      <div className="container-x grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="card group flex flex-col p-7 transition-colors hover:border-navy-900">
            <p className="text-xs text-muted">{dateBg(p.publishedAt)}</p>
            <h2 className="mt-3 text-xl group-hover:text-copper-700">{p.title}</h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-ink/70">{p.excerpt}</p>
            <span className="link-arrow mt-5">Прочети →</span>
          </Link>
        ))}
        {posts.length === 0 && <p className="text-muted">Няма публикации.</p>}
      </div>
    </>
  );
}
