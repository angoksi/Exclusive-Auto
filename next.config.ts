import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // BUILD_STANDALONE=1 — самостоятелна папка за хостинг с cPanel Node.js (в Railway не се ползва)
  ...(process.env.BUILD_STANDALONE ? { output: 'standalone' as const } : {}),
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async redirects() {
    return [
      { source: '/import/usa', destination: '/import/south-korea', permanent: true },
      { source: '/import/canada', destination: '/import/south-korea', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default config;
