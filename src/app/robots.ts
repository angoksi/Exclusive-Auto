import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/api', '/login', '/register', '/compare'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
