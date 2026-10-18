import { NextResponse, type NextRequest } from 'next/server';

// Първа линия на защита: пренасочва неавтентикирани посетители. Истинската проверка на сесията и ролите
// се прави сървърно във всяка страница и действие (requireUser / requireRole).
export function proxy(req: NextRequest) {
  if (!req.cookies.get('eat_session')?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/account/:path*'] };
