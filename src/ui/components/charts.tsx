import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface Series {
  key: string;
  label: string;
  type: 'bar' | 'line' | 'area';
  color?: string;
  /** second Y axis (right) */
  right?: boolean;
}

const G = '#1f7a3a';
const PALETTE = ['#1f7a3a', '#2a6fb5', '#7a4bb3', '#1f8a8a', '#8a5a00'];

/** One chart for everything (bar / line / area / combo), left-to-right like the sheet. */
export function Chart({ data, x, series, height = 170, refY, yDomain }: { data: Record<string, unknown>[]; x: string; series: Series[]; height?: number; refY?: { y: number; label: string }; yDomain?: [number, number] }) {
  const hasRight = series.some((s) => s.right);
  if (!data.length || data.every((d) => series.every((s) => d[s.key] == null))) return <div className="empty">אין עדיין נתונים בטווח הזה</div>;
  return (
    <div style={{ direction: 'ltr', width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: hasRight ? 0 : 6, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#e3ebe5" vertical={false} />
          <XAxis dataKey={x} tick={{ fontSize: 10, fill: '#6c786f' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={14} />
          <YAxis yAxisId="l" tick={{ fontSize: 10, fill: '#6c786f' }} tickLine={false} axisLine={false} width={42} domain={yDomain ?? ['auto', 'auto']} />
          {hasRight && <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: '#6c786f' }} tickLine={false} axisLine={false} width={36} />}
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, direction: 'rtl' }} labelStyle={{ fontWeight: 700 }} />
          {refY && <ReferenceLine yAxisId="l" y={refY.y} stroke="#c0392b" strokeDasharray="4 3" label={{ value: refY.label, fontSize: 10, fill: '#c0392b', position: 'insideTopRight' }} />}
          {series.map((s, i) => {
            const color = s.color ?? PALETTE[i % PALETTE.length] ?? G;
            const common = { dataKey: s.key, name: s.label, yAxisId: s.right ? 'r' : 'l', isAnimationActive: false };
            if (s.type === 'bar') return <Bar key={s.key} {...common} fill={color} radius={[4, 4, 0, 0]} maxBarSize={22} />;
            if (s.type === 'area') return <Area key={s.key} {...common} type="monotone" stroke={color} fill={color} fillOpacity={0.25} connectNulls={false} />;
            return <Line key={s.key} {...common} type="monotone" stroke={color} strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />;
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartBox({ title, insight, children, legend }: { title: string; insight?: string; children: React.ReactNode; legend?: { label: string; color: string }[] }) {
  return (
    <section className="chartbox">
      <div className="ct">{title}</div>
      {children}
      {legend && (
        <div className="row wrap xs" style={{ padding: '2px 8px', gap: 10 }}>
          {legend.map((l) => (
            <span key={l.label}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: l.color, marginInlineEnd: 4 }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      {insight && <div className="ci">{insight}</div>}
    </section>
  );
}
