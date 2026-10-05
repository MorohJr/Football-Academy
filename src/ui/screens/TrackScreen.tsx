import { useState } from 'react';
import { db } from '../../db/db';
import { CHART_INSIGHTS, FITNESS_TESTS, TRACKING_VIDEO } from '../../content/tracking';
import { addDaysISO, monthKey, weekStart, type ISODate } from '../../domain/dates';
import { acwr, dailyLoads, monthlySummaries, weeklySummaries } from '../../domain/tracking';
import { totalsByDate } from '../../domain/nutrition';
import { navyBodyFatMale } from '../../domain/body';
import { toPoms, toTrackSessions, sleepHours } from '../../services/queries';
import { fmtDate, Page, Seg, Tabs, VideoLinks } from '../components/common';
import { Chart, ChartBox } from '../components/charts';
import { useLive, useSettings, useToday } from '../hooks';
import { go } from '../router';

type Range = '7' | '30' | '90' | '365';
type Tab = 'load' | 'state' | 'food' | 'body' | 'tests';
const RANGES: { v: Range; label: string }[] = [
  { v: '7', label: 'שבוע' },
  { v: '30', label: 'חודש' },
  { v: '90', label: '3 חודשים' },
  { v: '365', label: 'שנה' },
];
const C = { g: '#1f7a3a', b: '#2a6fb5', p: '#7a4bb3', t: '#1f8a8a', y: '#8a5a00' };

export function TrackScreen({ tab: tab0 }: { tab?: string }) {
  const today = useToday();
  const s = useSettings();
  const [tab, setTab] = useState<Tab>((tab0 as Tab) ?? 'load');
  const [range, setRange] = useState<Range>('30');
  const from = addDaysISO(today, -Number(range) + 1);
  const data = useLive(async () => {
    const wideFrom = addDaysISO(weekStart(from), -35);
    const sessions = await db.sessions.where('date').between(wideFrom, today, true, true).toArray();
    const checkins = await db.checkins.where('date').between(wideFrom, today, true, true).toArray();
    const food = await db.foodLogs.where('date').between(from, today, true, true).toArray();
    const body = (await db.body.toArray()).sort((a, b) => a.date.localeCompare(b.date));
    const tests = await db.tests.toArray();
    const allSessions = await db.sessions.toArray();
    const allCheckins = await db.checkins.toArray();
    return { sessions, checkins, food, body, tests, allSessions, allCheckins };
  }, [from, today]);
  if (!data || !s) return null;

  const days: ISODate[] = [];
  for (let d = from; d <= today; d = addDaysISO(d, 1)) days.push(d);
  const loads = dailyLoads(toTrackSessions(data.sessions));
  const checkByDate = new Map(data.checkins.map((c) => [c.date, c]));
  const foodByDate = totalsByDate(data.food.map((f) => ({ ...f })));
  const daily = days.map((d) => {
    const l = loads.get(d);
    const c = checkByDate.get(d);
    const f = foodByDate.get(d);
    return {
      d: fmtDate(d),
      rpe: l && l.rpeTotal > 0 ? l.rpeTotal : null,
      minutes: l?.minutes || null,
      units: l?.units || null,
      sleep: c?.sleep ?? null,
      lookingForward: c?.lookingForward ?? null,
      vigorous: c?.vigorous ?? null,
      soreness: c?.soreness ?? null,
      appetite: c?.appetite ?? null,
      sleepH: c ? sleepHours(c) : null,
      rpeAvg: l?.rpeAvg ?? null,
      kcal: f ? Math.round(f.kcal) : null,
      protein: f ? Math.round(f.protein) : null,
      carbs: f ? Math.round(f.carbs) : null,
      fat: f ? Math.round(f.fat) : null,
    };
  });
  const weeks = weeklySummaries(toTrackSessions(data.sessions), toPoms(data.checkins)).filter((w) => w.weekStart >= weekStart(from));
  const weekly = weeks.map((w) => ({ w: fmtDate(w.weekStart), minutes: w.minutes || null, rpe: w.rpe || null, units: w.units || null, poms: w.poms, acwr: acwr(weeklySummaries(toTrackSessions(data.sessions), toPoms(data.checkins)), w.weekStart).ratio }));
  const months = monthlySummaries(toTrackSessions(data.allSessions), toPoms(data.allCheckins)).filter((m) => m.month >= monthKey(from));
  const monthly = months.map((m) => ({ m: `${m.month.slice(5)}/${m.month.slice(2, 4)}`, units: m.units || null, poms: m.poms }));

  return (
    <Page title="מעקב" kicker="True Tracking System · כל הגרפים של הגיליון" sub="נמלא אוטומטית מהאימונים, הצ'ק-אין והתזונה">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { v: 'load', label: 'עומס' },
          { v: 'state', label: 'מצב ושינה' },
          { v: 'food', label: 'תזונה' },
          { v: 'body', label: 'גוף' },
          { v: 'tests', label: 'בדיקות' },
        ]}
      />
      {tab !== 'tests' && (
        <div className="mb">
          <Seg value={range} options={RANGES} onChange={setRange} />
        </div>
      )}
      {tab === 'load' && (
        <>
          <ChartBox title="1 · RPE יומי" insight={CHART_INSIGHTS['rpe-daily']}>
            <Chart data={daily} x="d" series={[{ key: 'rpe', label: 'RPE', type: 'bar' }]} />
          </ChartBox>
          <ChartBox title="7 · דקות אימון ביום">
            <Chart data={daily} x="d" series={[{ key: 'minutes', label: 'דקות', type: 'bar', color: C.b }]} />
          </ChartBox>
          <ChartBox title="8 · יחידות אימון ביום (דקות × RPE)">
            <Chart data={daily} x="d" series={[{ key: 'units', label: 'יחידות', type: 'bar', color: C.p }]} />
          </ChartBox>
          <ChartBox title="10 · דקות שבועיות מול RPE שבועי" insight={CHART_INSIGHTS['minutes-vs-rpe-weekly']} legend={[{ label: 'דקות', color: C.g }, { label: 'RPE', color: C.b }]}>
            <Chart data={weekly} x="w" series={[{ key: 'minutes', label: 'דקות', type: 'bar' }, { key: 'rpe', label: 'RPE', type: 'line', color: C.b, right: true }]} />
          </ChartBox>
          <ChartBox title="16 · יחידות אימון (שבועי)">
            <Chart data={weekly} x="w" series={[{ key: 'units', label: 'יחידות', type: 'bar', color: C.p }]} />
          </ChartBox>
          <ChartBox title="17 · דקות אימון (שבועי)">
            <Chart data={weekly} x="w" series={[{ key: 'minutes', label: 'דקות', type: 'bar', color: C.b }]} />
          </ChartBox>
          <ChartBox title="18 · עומס חריג (ACWR)" insight="עומס השבוע חלקי הממוצע של 4 השבועות הקודמים. מעל 1.4 הסיכון לפציעה עולה מאוד (Bible). צריך 4 שבועות של נתונים.">
            <Chart data={weekly} x="w" series={[{ key: 'acwr', label: 'ACWR', type: 'line', color: C.y }]} refY={{ y: 1.4, label: '1.4' }} />
          </ChartBox>
          <ChartBox title="9 · עומס חודשי (יחידות)">
            <Chart data={monthly} x="m" series={[{ key: 'units', label: 'יחידות', type: 'bar' }]} />
          </ChartBox>
        </>
      )}
      {tab === 'state' && (
        <>
          <ChartBox title="2 · ישנתי טוב בלילה (1-5)" insight={CHART_INSIGHTS['poms-sleep']}>
            <Chart data={daily} x="d" series={[{ key: 'sleep', label: 'שינה', type: 'line' }]} yDomain={[0, 5]} />
          </ChartBox>
          <ChartBox title="19 · שעות שינה מול RPE" insight="לילות קצרים ו-RPE גבוה באותם ימים: השינה פוגעת בהתאוששות. פחות מ-8 שעות = סיכון פציעה פי 1.7 (Bible)." legend={[{ label: 'שעות שינה', color: C.b }, { label: 'RPE ממוצע', color: C.g }]}>
            <Chart data={daily} x="d" series={[{ key: 'sleepH', label: 'שעות שינה', type: 'bar', color: C.b }, { key: 'rpeAvg', label: 'RPE', type: 'line', right: true }]} refY={{ y: 8, label: '8 ש\'' }} />
          </ChartBox>
          <ChartBox title="3 · מחכה לאימון של היום">
            <Chart data={daily} x="d" series={[{ key: 'lookingForward', label: 'מחכה לאימון', type: 'area', color: C.t }]} yDomain={[0, 5]} />
          </ChartBox>
          <ChartBox title="4 · מלא מרץ ואנרגיה">
            <Chart data={daily} x="d" series={[{ key: 'vigorous', label: 'אנרגיה', type: 'line', color: C.p }]} yDomain={[0, 5]} />
          </ChartBox>
          <ChartBox title="5 · כמעט אין כאבי שרירים (5 = אין)">
            <Chart data={daily} x="d" series={[{ key: 'soreness', label: 'כאבי שרירים', type: 'line', color: C.y }]} yDomain={[0, 5]} />
          </ChartBox>
          <ChartBox title="6 · התיאבון מצוין">
            <Chart data={daily} x="d" series={[{ key: 'appetite', label: 'תיאבון', type: 'line', color: C.b }]} yDomain={[0, 5]} />
          </ChartBox>
          <ChartBox title="11 · דקות שבועיות מול POMS שבועי" insight={CHART_INSIGHTS['minutes-vs-poms-weekly']} legend={[{ label: 'דקות', color: C.g }, { label: 'POMS', color: C.p }]}>
            <Chart data={weekly} x="w" series={[{ key: 'minutes', label: 'דקות', type: 'bar' }, { key: 'poms', label: 'POMS', type: 'line', color: C.p, right: true }]} />
          </ChartBox>
        </>
      )}
      {tab === 'food' && (
        <>
          {([
            ['12', 'carbs', 'פחמימות (ג\')', CHART_INSIGHTS['units-vs-carbs']],
            ['13', 'fat', 'שומן (ג\')', undefined],
            ['14', 'kcal', 'קלוריות', undefined],
            ['15', 'protein', 'חלבון (ג\')', undefined],
          ] as const).map(([n, key, label, ins]) => (
            <ChartBox key={key} title={`${n} · יחידות אימון מול ${label}`} insight={ins} legend={[{ label: 'יחידות', color: C.g }, { label, color: C.b }]}>
              <Chart data={daily} x="d" series={[{ key: 'units', label: 'יחידות', type: 'bar' }, { key, label, type: 'line', color: C.b, right: true }]} />
            </ChartBox>
          ))}
          <button type="button" className="btn sec block" onClick={() => go('/food/charts')}>
            עוד גרפים במסך התזונה
          </button>
        </>
      )}
      {tab === 'body' && <BodyCharts body={data.body} from={from} heightCm={s.heightCm} />}
      {tab === 'tests' && <YearlyTracker tests={data.tests} sessionsMonthly={monthlySummaries(toTrackSessions(data.allSessions), toPoms(data.allCheckins))} today={today} />}
      <VideoLinks videos={[TRACKING_VIDEO]} />
    </Page>
  );
}

function BodyCharts({ body, from, heightCm }: { body: { date: string; weight: number | null; sites: Record<string, number> }[]; from: string; heightCm: number | null }) {
  const rows = body.filter((b) => b.date >= from).map((b) => ({
    d: fmtDate(b.date),
    weight: b.weight,
    fat: heightCm && b.sites.waist && b.sites.neck ? navyBodyFatMale(b.sites.waist, b.sites.neck, heightCm) : null,
    waist: b.sites.waist ?? null,
  }));
  return (
    <>
      <ChartBox title="20 · משקל (ק&quot;ג)">
        <Chart data={rows} x="d" series={[{ key: 'weight', label: 'משקל', type: 'line' }]} />
      </ChartBox>
      <ChartBox title="אחוז שומן (מסרט מטר)" insight="יעד 8-12% (Bible). השיטה מדויקת למגמה, סטייה אפשרית של 3-4%.">
        <Chart data={rows} x="d" series={[{ key: 'fat', label: 'שומן %', type: 'line', color: '#7a4bb3' }]} refY={{ y: 12, label: '12%' }} />
      </ChartBox>
      <ChartBox title="היקף מותניים (ס&quot;מ)">
        <Chart data={rows} x="d" series={[{ key: 'waist', label: 'מותניים', type: 'line', color: '#2a6fb5' }]} />
      </ChartBox>
    </>
  );
}

const MONTHS_HE = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

/** R-TST-4: the yearly tracker of the sheet: month × test + monthly workload + monthly POMS. */
function YearlyTracker({ tests, sessionsMonthly, today }: { tests: { date: string; testId: string; value: number; side: 'L' | 'R' | null }[]; sessionsMonthly: { month: string; units: number; poms: number | null }[]; today: string }) {
  const year = today.slice(0, 4);
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  const cell = (testId: string, m: string) => {
    const t = tests.filter((x) => x.testId === testId && x.date.startsWith(m)).sort((a, b) => b.date.localeCompare(a.date));
    return t.length ? t.map((x) => `${x.value}${x.side ? x.side : ''}`).join('/') : '';
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'start', padding: 4 }}>{year}</th>
            {months.map((m, i) => (
              <th key={m} style={{ padding: 4, color: 'var(--g2)' }}>
                {MONTHS_HE[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FITNESS_TESTS.map((t) => (
            <tr key={t.id} style={{ borderTop: '1px solid var(--line)' }}>
              <td style={{ padding: 4, whiteSpace: 'nowrap' }}>{t.he}</td>
              {months.map((m) => (
                <td key={m} className="center num" style={{ padding: 4 }}>
                  {cell(t.id, m)}
                </td>
              ))}
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid var(--g1)' }}>
            <td style={{ padding: 4 }}>עומס חודשי</td>
            {months.map((m) => (
              <td key={m} className="center num" style={{ padding: 4 }}>
                {sessionsMonthly.find((x) => x.month === m)?.units || ''}
              </td>
            ))}
          </tr>
          <tr style={{ borderTop: '1px solid var(--line)' }}>
            <td style={{ padding: 4 }}>POMS חודשי</td>
            {months.map((m) => (
              <td key={m} className="center num" style={{ padding: 4 }}>
                {sessionsMonthly.find((x) => x.month === m)?.poms ?? ''}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="xs muted">L/R = שמאל/ימין.</p>
      <button type="button" className="btn block mt" onClick={() => go('/tests')}>
        לבדיקות הכושר
      </button>
    </div>
  );
}
