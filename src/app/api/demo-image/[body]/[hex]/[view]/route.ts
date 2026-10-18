import { NextResponse } from 'next/server';

// Генерира ясно обозначени ДЕМО изображения (векторни), докато няма реални снимки от доставчик/качени от администратор.
const SHAPES: Record<string, { body: string; glass: string; roof: number }> = {
  sedan: {
    body: 'M190 520 C190 492 208 474 248 466 L402 442 C452 384 522 344 622 338 L752 338 C826 344 878 386 918 442 L984 456 C1010 463 1018 486 1018 520 L1018 548 L190 548 Z',
    glass: 'M430 440 C470 392 530 362 616 358 L742 358 C800 364 842 398 876 440 Z',
    roof: 338,
  },
  suv: {
    body: 'M190 520 L194 440 C198 420 228 412 258 408 L322 322 C338 296 362 288 392 288 L790 288 C826 288 850 302 872 334 L930 412 L990 436 C1012 446 1018 480 1018 520 L1018 552 L190 552 Z',
    glass: 'M350 408 L396 330 C406 316 420 310 438 310 L786 310 C808 310 822 318 838 340 L892 408 Z',
    roof: 288,
  },
  hatch: {
    body: 'M190 520 L196 462 C200 442 226 432 258 428 L354 396 C398 350 456 330 540 328 L742 328 C820 332 868 380 904 432 L984 448 C1010 456 1018 482 1018 520 L1018 548 L190 548 Z',
    glass: 'M392 426 C430 378 482 352 546 350 L738 350 C792 356 832 390 862 426 Z',
    roof: 328,
  },
  wagon: {
    body: 'M190 520 L194 460 C198 440 226 432 258 428 L346 392 C384 350 440 330 520 328 L852 328 C872 332 884 346 900 372 L930 424 L990 444 C1012 452 1018 482 1018 520 L1018 550 L190 550 Z',
    glass: 'M380 424 C416 378 460 352 524 350 L848 350 L888 424 Z',
    roof: 328,
  },
  coupe: {
    body: 'M190 524 C190 498 206 482 244 474 L420 452 C470 398 536 364 618 360 L720 360 C806 366 868 406 910 452 L986 464 C1010 470 1018 492 1018 524 L1018 548 L190 548 Z',
    glass: 'M452 450 C490 408 546 382 618 378 L712 378 C776 384 828 414 858 450 Z',
    roof: 360,
  },
  pickup: {
    body: 'M190 520 L194 452 C198 436 220 430 250 428 L560 428 L584 346 C594 320 612 312 640 312 L760 312 C800 312 826 330 846 366 L890 432 L990 456 C1012 462 1018 486 1018 520 L1018 552 L190 552 Z',
    glass: 'M612 428 L634 346 C640 332 650 330 664 330 L752 330 C780 332 796 346 812 372 L840 428 Z',
    roof: 340,
  },
  van: {
    body: 'M190 520 L194 330 C196 300 218 286 250 286 L810 286 C846 288 870 306 890 346 L940 430 L992 450 C1012 458 1018 486 1018 520 L1018 552 L190 552 Z',
    glass: 'M740 312 L806 312 C832 314 846 328 862 356 L896 416 L740 416 Z M330 312 L470 312 L470 416 L330 416 Z M490 312 L720 312 L720 416 L490 416 Z',
    roof: 286,
  },
};

const BGS = [
  ['#e9e6e0', '#c9c5bd'],
  ['#1d2a40', '#0a1322'],
  ['#dcd8d0', '#b9b4aa'],
  ['#25354f', '#0f1b2d'],
];

function shade(hex: string, amt: number) {
  const n = parseInt(hex, 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
}

export async function GET(_: Request, { params }: { params: Promise<{ body: string; hex: string; view: string }> }) {
  const { body, hex, view } = await params;
  const h = /^[0-9a-f]{6}$/i.test(hex) ? hex : '666666';
  const v = Math.max(0, Math.min(3, parseInt(view) || 0));
  const s = SHAPES[body] ?? SHAPES.sedan;
  const [bg1, bg2] = BGS[v];
  const dark = v === 1 || v === 3;
  const base = `#${h}`;
  const wheel = (cx: number) => `<g><circle cx="${cx}" cy="552" r="66" fill="#0c0f14"/><circle cx="${cx}" cy="552" r="44" fill="#9aa1ac"/><circle cx="${cx}" cy="552" r="38" fill="#2b313b"/><g stroke="#aab0ba" stroke-width="6" stroke-linecap="round">${[0, 72, 144, 216, 288].map((a) => `<line x1="${cx}" y1="552" x2="${cx + 34 * Math.cos((a * Math.PI) / 180)}" y2="${552 + 34 * Math.sin((a * Math.PI) / 180)}"/>`).join('')}</g><circle cx="${cx}" cy="552" r="8" fill="#c8cdd5"/></g>`;
  const transform = v === 1 ? 'translate(1200 0) scale(-1 1)' : v === 2 ? 'translate(-420 -320) scale(1.55)' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800" role="img">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(h, 38)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${shade(h, -42)}"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fb0c4"/><stop offset="1" stop-color="#2a3647"/></linearGradient>
<radialGradient id="floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1200" height="800" fill="url(#bg)"/>
<rect y="610" width="1200" height="190" fill="${dark ? '#070d18' : '#b4afa5'}" opacity=".55"/>
${v === 3 ? '<rect x="0" y="606" width="1200" height="3" fill="#b87b4b" opacity=".8"/>' : ''}
<g transform="${transform}">
<ellipse cx="604" cy="606" rx="460" ry="30" fill="url(#floor)"/>
<path d="${s.body}" fill="url(#body)"/>
<path d="${s.glass}" fill="url(#glass)" opacity=".92"/>
<path d="M200 520 L1010 520" stroke="#000" stroke-opacity=".18" stroke-width="3"/>
<rect x="978" y="476" width="34" height="14" rx="5" fill="#fff6dc" opacity=".95"/>
<rect x="194" y="474" width="22" height="12" rx="4" fill="#d33" opacity=".85"/>
${wheel(330)}${wheel(880)}
</g>
<text x="32" y="768" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="${dark ? '#ffffff' : '#0f1b2d'}" opacity=".55" letter-spacing="3">ДЕМО ИЗОБРАЖЕНИЕ</text>
</svg>`;
  return new NextResponse(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
