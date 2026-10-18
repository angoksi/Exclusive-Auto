type Pt = { lat: number; lng: number; label?: string | null };

const W = 800;
const H = 380;
const proj = (p: Pt) => ({ x: ((p.lng + 180) / 360) * W, y: ((90 - p.lat) / 180) * H });

/** Схематична карта на маршрута по координатите на събитията (без външни карти). */
export function RouteMap({ points, destination = { lat: 43.2, lng: 27.9, label: 'Варна' } }: { points: Pt[]; destination?: Pt }) {
  if (!points.length) return null;
  const pts = points.map(proj);
  const d = proj(destination);
  const last = pts[pts.length - 1];
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <figure className="card overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Схематичен маршрут на доставката" className="block w-full bg-navy-900">
        {Array.from({ length: 11 }, (_, i) => <line key={`v${i}`} x1={(i * W) / 10} y1="0" x2={(i * W) / 10} y2={H} stroke="#fff" strokeOpacity=".06" />)}
        {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1="0" y1={(i * H) / 6} x2={W} y2={(i * H) / 6} stroke="#fff" strokeOpacity=".06" />)}
        <path d={path} fill="none" stroke="#dcb08a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${last.x} ${last.y} L${d.x} ${d.y}`} fill="none" stroke="#dcb08a" strokeOpacity=".5" strokeWidth="2" strokeDasharray="6 6" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 7 : 4} fill={i === pts.length - 1 ? '#b87b4b' : '#fff'} stroke="#0f1b2d" strokeWidth="2" />)}
        <circle cx={d.x} cy={d.y} r="6" fill="none" stroke="#fff" strokeWidth="2" />
        <text x={d.x + 10} y={d.y + 4} fill="#fff" fontSize="13" fontWeight="700">{destination.label}</text>
        {points[points.length - 1].label && <text x={last.x + 12} y={last.y - 10} fill="#f3e4d6" fontSize="13" fontWeight="700">{points[points.length - 1].label}</text>}
      </svg>
      <figcaption className="border-t border-line px-5 py-3 text-xs text-muted">Схематичен маршрут по последните известни координати. Не е навигационна карта.</figcaption>
    </figure>
  );
}
