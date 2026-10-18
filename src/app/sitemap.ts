import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { MARKETS } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vehicles, posts] = await Promise.all([
    db.vehicle.findMany({ where: { published: true, status: { in: ['AVAILABLE', 'RESERVED'] } }, select: { slug: true, updatedAt: true } }),
    db.blogPost.findMany({ where: { published: true }, select: { slug: true, createdAt: true } }),
  ]);
  const staticPaths = ['', '/catalog', '/catalog?saleType=BUY_NOW', '/catalog?saleType=AUCTION', '/calculator', '/vin-check', '/tracking', '/find-my-car', '/how-it-works', '/about', '/deliveries', '/reviews', '/blog', '/faq', '/contact', '/privacy', '/terms', '/cookies', ...Object.keys(MARKETS).map((m) => `/import/${m}`)];
  return [
    ...staticPaths.map((p) => ({ url: SITE_URL + p, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...vehicles.map((v) => ({ url: `${SITE_URL}/catalog/${v.slug}`, lastModified: v.updatedAt, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.createdAt, priority: 0.5 })),
  ];
}
