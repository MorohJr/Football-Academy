import type { Diagram, Mark } from '../../content/drills';

const COLOR: Record<Mark, string> = { cone: '#f0b43a', pole: '#f2e94e', hurdle: '#f2e94e', ball: '#ffffff', start: '#ffffff', mannequin: '#2a6fb5' };

/** A small chalk-on-grass drawing of a pitch drill (SPEC 14.13). */
export function DrillDiagram({ d }: { d: Diagram }) {
  const xs = [...d.items.map((i) => i.x), ...d.dims.flatMap((m) => [m.x1, m.x2]), ...(d.circle ? [d.circle.cx - d.circle.r, d.circle.cx + d.circle.r] : [])];
  const ys = [...d.items.map((i) => i.y), ...d.dims.flatMap((m) => [m.y1, m.y2]), ...(d.circle ? [d.circle.cy - d.circle.r, d.circle.cy + d.circle.r] : [])];
  const minX = Math.min(...xs) - 3;
  const maxX = Math.max(...xs) + 3;
  const minY = Math.min(...ys) - 3;
  const maxY = Math.max(...ys) + 3;
  const w = maxX - minX;
  const h = Math.max(maxY - minY, w * 0.28);
  const k = 300 / w;
  const X = (x: number) => (x - minX) * k;
  const Y = (y: number) => (y - minY) * k + (h - (maxY - minY)) * k * 0.5;
  const H = h * k;
  const fs = 11;
  return (
    <figure style={{ margin: '0 0 8px' }}>
      <svg viewBox={`0 0 300 ${H}`} style={{ width: '100%', borderRadius: 12, background: 'repeating-linear-gradient(90deg,#1f7a3a 0 30px,#1b7034 30px 60px)', direction: 'ltr' }} role="img" aria-label="שרטוט מגרש">
        {d.circle && <circle cx={X(d.circle.cx)} cy={Y(d.circle.cy)} r={d.circle.r * k} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" />}
        {d.path && <polyline points={d.path.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} fill="none" stroke="#ffe27a" strokeWidth="2" strokeDasharray="6 4" />}
        {d.dims.map((m, i) => {
          const mx = (X(m.x1) + X(m.x2)) / 2;
          const my = (Y(m.y1) + Y(m.y2)) / 2;
          return (
            <g key={i}>
              <line x1={X(m.x1)} y1={Y(m.y1)} x2={X(m.x2)} y2={Y(m.y2)} stroke="rgba(255,255,255,.85)" strokeWidth="1" />
              <rect x={mx - 20} y={my - 8} width="40" height="15" rx="4" fill="rgba(0,0,0,.35)" />
              <text x={mx} y={my + 3.5} textAnchor="middle" fill="#fff" fontSize={fs} fontFamily="Rubik">
                {m.label}
              </text>
            </g>
          );
        })}
        {d.items.map((it, i) => {
          const cx = X(it.x);
          const cy = Y(it.y);
          switch (it.t) {
            case 'cone':
              return <path key={i} d={`M${cx} ${cy - 5} L${cx + 5} ${cy + 4} L${cx - 5} ${cy + 4} Z`} fill={COLOR.cone} stroke="#fff" strokeWidth="0.8" />;
            case 'pole':
              return <rect key={i} x={cx - 1.6} y={cy - 9} width="3.2" height="13" rx="1" fill={COLOR.pole} stroke="#333" strokeWidth="0.5" />;
            case 'hurdle':
              return <path key={i} d={`M${cx - 5} ${cy + 3} V${cy - 3} H${cx + 5} V${cy + 3}`} fill="none" stroke={COLOR.hurdle} strokeWidth="2" />;
            case 'ball':
              return <circle key={i} cx={cx} cy={cy} r="4" fill="#fff" stroke="#222" strokeWidth="1" />;
            case 'mannequin':
              return <rect key={i} x={cx - 3} y={cy - 8} width="6" height="12" rx="3" fill={COLOR.mannequin} stroke="#fff" />;
            case 'start':
            default:
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="6" fill="#ffe27a" stroke="#145a29" strokeWidth="1.5" />
                  <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#145a29">
                    S
                  </text>
                </g>
              );
          }
        })}
      </svg>
      {d.caption && <figcaption className="xs muted" style={{ marginTop: 3 }}>{d.caption} · שרטוט מקורב</figcaption>}
    </figure>
  );
}
