import { useState } from 'react';
import { db } from '../../db/db';
import { getWorkout } from '../../content';
import { diffDays } from '../../domain/dates';
import { BODY_FAT_TARGET, leanMass, MEASURE_RULES, MEASURE_SITES, navyBodyFatFemale, navyBodyFatMale, trendWeight } from '../../domain/body';
import type { BodyEntry, Niggle } from '../../domain/schemas';
import { bodySummary } from '../../services/queries';
import { Chart, ChartBox } from '../components/charts';
import { ConfirmButton, Empty, fmtDate, HRow, Modal, NumInput, Page, Scale, Seg, Tabs, useToast, VideoLinks } from '../components/common';
import { useLive, useSettings, useToday } from '../hooks';
import { go, replace } from '../router';
import { AREA_HE, AREAS, MAP_POINTS, rehabFor } from './body-areas';

type Tab = 'weight' | 'measure' | 'niggles';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const now = () => new Date().toISOString();

export function BodyScreen({ tab }: { tab?: string }) {
  const t = (['weight', 'measure', 'niggles'].includes(tab ?? '') ? tab : 'weight') as Tab;
  return (
    <Page title="גוף" kicker="R-BOD · R-NIG" sub="משקל, מדידות בסרט מטר ויומן עקיצות">
      <Tabs value={t} tabs={[{ v: 'weight', label: 'משקל' }, { v: 'measure', label: 'מדידות ושומן' }, { v: 'niggles', label: 'עקיצות' }]} onChange={(v) => replace(`/body/${v}`)} />
      {t === 'weight' && <Weight />}
      {t === 'measure' && <Measure />}
      {t === 'niggles' && <Niggles />}
    </Page>
  );
}

async function upsertBody(date: string, patch: Partial<BodyEntry>) {
  const ex = await db.body.where('date').equals(date).first();
  if (ex) await db.body.update(ex.id, { ...patch, updatedAt: now() });
  else await db.body.add({ id: uid(), createdAt: now(), updatedAt: now(), date, weight: null, sites: {}, ...patch });
}

function Weight() {
  const today = useToday();
  const toast = useToast();
  const data = useLive(() => bodySummary(today), [today]);
  const [w, setW] = useState<number | null>(null);
  const [date, setDate] = useState(today);
  if (!data) return null;
  const rows = data.weighIns.slice(-90).map((x) => ({ d: fmtDate(x.date), w: x.weight, trend: trendWeight(data.weighIns, x.date) }));
  return (
    <>
      <div className="tiles">
        <div className="tile">
          <b>{data.trend ?? '—'}</b>
          <span>משקל מגמה</span>
        </div>
        <div className="tile l">
          <b>{data.lastWeighIn?.weight ?? '—'}</b>
          <span>שקילה אחרונה</span>
        </div>
        <div className="tile l">
          <b>{data.monthDelta != null ? `${data.monthDelta > 0 ? '+' : ''}${data.monthDelta}` : '—'}</b>
          <span>שינוי בחודש</span>
        </div>
      </div>
      <div className="card">
        <div className="ch">שקילה</div>
        <div className="row">
          <input className="input ltr" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} style={{ width: 150 }} />
          <div className="grow">
            <NumInput value={w} onChange={setW} step={0.1} placeholder='ק"ג' />
          </div>
          <button
            type="button"
            className="btn"
            disabled={!w || w < 30 || w > 250}
            onClick={async () => {
              await upsertBody(date, { weight: w });
              setW(null);
              toast('נשמר');
            }}
          >
            שמור
          </button>
        </div>
        <p className="xs muted">בבוקר, אחרי שירותים, לפני אוכל. משקל המגמה = ממוצע 7 הימים האחרונים (לפחות 3 שקילות). ממנו מחושבים החלבון והפחמימות.</p>
      </div>
      <ChartBox title="משקל ומגמה" legend={[{ label: 'שקילה', color: '#9aa59d' }, { label: 'מגמה', color: '#1f7a3a' }]}>
        <Chart data={rows} x="d" series={[{ key: 'w', label: 'שקילה', type: 'line', color: '#9aa59d' }, { key: 'trend', label: 'מגמה', type: 'line', color: '#1f7a3a' }]} />
      </ChartBox>
      <HRow title="שקילות" />
      {[...data.weighIns]
        .reverse()
        .slice(0, 20)
        .map((x) => (
          <div key={x.date} className="list-row">
            <span className="grow small">{fmtDate(x.date)}</span>
            <b className="num">{x.weight}</b>
            <ConfirmButton
              label="מחק"
              confirm="למחוק?"
              onConfirm={async () => {
                const e = await db.body.where('date').equals(x.date).first();
                if (!e) return;
                if (Object.keys(e.sites).length) await db.body.update(e.id, { weight: null, updatedAt: now() });
                else await db.body.delete(e.id);
              }}
            />
          </div>
        ))}
    </>
  );
}

function Measure() {
  const today = useToday();
  const s = useSettings();
  const toast = useToast();
  const data = useLive(() => bodySummary(today), [today]);
  const [vals, setVals] = useState<Record<string, number | null>>({});
  const [open, setOpen] = useState<string | null>(null);
  if (!data || !s) return null;
  const measures = data.entries.filter((e) => Object.keys(e.sites).length > 0);
  const first = measures[0];
  const last = measures[measures.length - 1];
  const prev = measures[measures.length - 2];
  const bf = (e: BodyEntry) => {
    if (!s.heightCm || !e.sites.waist || !e.sites.neck) return null;
    return s.sex === 'male' ? navyBodyFatMale(e.sites.waist, e.sites.neck, s.heightCm) : e.sites.hips ? navyBodyFatFemale(e.sites.waist, e.sites.hips, e.sites.neck, s.heightCm) : null;
  };
  const lm = data.weight && data.bodyFat != null ? leanMass(data.weight, data.bodyFat) : null;
  const chart = measures.map((e) => ({ d: fmtDate(e.date), bf: bf(e), waist: e.sites.waist ?? null }));
  return (
    <>
      <div className="card" style={{ borderInlineStart: '4px solid var(--g1)' }}>
        <div className="ch">
          אחוז שומן (שיטת הצי האמריקאי) <span>יעד {BODY_FAT_TARGET[0]}-{BODY_FAT_TARGET[1]}%</span>
        </div>
        {data.bodyFat != null ? (
          <>
            <b style={{ fontSize: 26, color: 'var(--g2)' }}>{data.bodyFat}%</b>
            <span className="small"> {data.bodyFat > BODY_FAT_TARGET[1] ? '· מצב חיטוב' : data.bodyFat < BODY_FAT_TARGET[0] ? '· מתחת ליעד' : '· בטווח היעד'}</span>
            {lm && (
              <div className="xs muted">
                מסה רזה {lm.lean} ק"ג · שומן {lm.fat} ק"ג
              </div>
            )}
            <div className="xs muted">סטייה אפשרית של 3-4%. מדויק למגמה. (לא מ-Matchfit)</div>
          </>
        ) : (
          <div className="small muted">{!s.heightCm ? 'צריך גובה בהגדרות, ' : ''}צריך מדידת צוואר ומותניים{s.sex === 'female' ? ' ואגן' : ''}.</div>
        )}
      </div>
      {chart.length > 1 && (
        <ChartBox title="אחוז שומן ומותניים" legend={[{ label: 'שומן %', color: '#1f7a3a' }, { label: 'מותניים', color: '#2a6fb5' }]}>
          <Chart data={chart} x="d" series={[{ key: 'bf', label: 'שומן %', type: 'line' }, { key: 'waist', label: 'מותניים', type: 'line', color: '#2a6fb5', right: true }]} />
        </ChartBox>
      )}
      <HRow title="מדידה חדשה (ס&quot;מ)" meta="כל 2-4 שבועות" />
      <ul className="clean xs muted">
        {MEASURE_RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {MEASURE_SITES.map((site) => {
        const l = last?.sites[site.key];
        const p = prev?.sites[site.key];
        const f = first?.sites[site.key];
        return (
          <div key={site.key} className="list-row">
            <span className="grow small tap" onClick={() => setOpen(open === site.key ? null : site.key)}>
              {site.he} {open === site.key ? '' : 'ⓘ'}
              {open === site.key && <div className="xs muted">{site.how}</div>}
              {l != null && (
                <div className="xs muted">
                  אחרון {l}
                  {p != null && p !== l ? ` · ${l - p > 0 ? '+' : ''}${Math.round((l - p) * 10) / 10} מהקודם` : ''}
                  {f != null && first !== last && f !== l ? ` · ${l - f > 0 ? '+' : ''}${Math.round((l - f) * 10) / 10} מההתחלה` : ''}
                </div>
              )}
            </span>
            <div style={{ width: 90 }}>
              <NumInput value={vals[site.key] ?? null} onChange={(v) => setVals({ ...vals, [site.key]: v })} step={0.1} />
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="btn block mt"
        disabled={!Object.values(vals).some((v) => v)}
        onClick={async () => {
          const sites = Object.fromEntries(Object.entries(vals).filter(([, v]) => v != null && v > 0)) as Record<string, number>;
          const ex = await db.body.where('date').equals(today).first();
          await upsertBody(today, { sites: { ...(ex?.sites ?? {}), ...sites } });
          setVals({});
          toast('המדידה נשמרה');
        }}
      >
        שמור מדידה
      </button>
      {measures.length > 0 && (
        <>
          <HRow title="היסטוריה" />
          {[...measures].reverse().map((e) => (
            <div key={e.id} className="list-row">
              <span className="grow small">
                {fmtDate(e.date)} · {Object.keys(e.sites).length} אזורים{bf(e) != null ? ` · ${bf(e)}%` : ''}
              </span>
              <ConfirmButton label="מחק" confirm="למחוק?" onConfirm={() => void (e.weight != null ? db.body.update(e.id, { sites: {}, updatedAt: now() }) : db.body.delete(e.id))} />
            </div>
          ))}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- niggles (R-NIG)
const TYPE_HE = { tight: 'תפוס', sharp: 'חד', dull: 'עמום' } as const;
const WHEN_HE = { game: 'במשחק', training: 'באימון', after: 'אחרי', other: 'אחר' } as const;
const SIDE_HE = { L: 'שמאל', R: 'ימין', C: 'מרכז' } as const;

function BodyMap({ view, selected, active, onPick }: { view: 'front' | 'back'; selected: string | null; active: Set<string>; onPick: (k: string, side: 'L' | 'R' | 'C') => void }) {
  return (
    <svg viewBox="0 0 100 232" style={{ width: 150, height: 348 }} aria-label={view === 'front' ? 'מלפנים' : 'מאחור'}>
      <g fill="#eef3ef" stroke="#9aa59d" strokeWidth="1">
        <circle cx="50" cy="14" r="10" />
        <rect x="30" y="26" width="40" height="56" rx="10" />
        <rect x="17" y="28" width="11" height="50" rx="5" />
        <rect x="72" y="28" width="11" height="50" rx="5" />
        <rect x="31" y="80" width="17" height="128" rx="7" />
        <rect x="52" y="80" width="17" height="128" rx="7" />
      </g>
      {Object.entries(MAP_POINTS).map(([k, p]) => {
        const pt = p[view];
        if (!pt) return null;
        const pts: [number, number][] = [pt, [100 - pt[0], pt[1]]];
        // Front view: the dot on the image's left is the body's right. Back view: same side.
        const sideOf = (i: number): 'L' | 'R' => (view === 'front' ? (i === 0 ? 'R' : 'L') : i === 0 ? 'L' : 'R');
        return pts.map(([x, y], i) => (
          <circle
            key={`${k}-${i}`}
            cx={x}
            cy={y}
            r={selected === k ? 4.6 : 3.6}
            fill={selected === k ? '#1f7a3a' : active.has(k) ? '#c0392b' : '#fff'}
            stroke={active.has(k) ? '#c0392b' : '#1f7a3a'}
            strokeWidth="1.5"
            style={{ cursor: 'pointer' }}
            onClick={() => onPick(k, k === 'lowback' ? 'C' : sideOf(i))}
          >
            <title>{AREA_HE[k]}</title>
          </circle>
        ));
      })}
      <text x="50" y="229" textAnchor="middle" fontSize="7" fill="#6c786f">
        {view === 'front' ? 'מלפנים' : 'מאחור'}
      </text>
    </svg>
  );
}

function Niggles() {
  const today = useToday();
  const list = useLive(async () => (await db.niggles.toArray()).sort((a, b) => b.start.localeCompare(a.start)), []);
  const [edit, setEdit] = useState<Niggle | null>(null);
  if (!list) return null;
  const open = list.filter((n) => !n.closed);
  const closed = list.filter((n) => n.closed);
  const activeAreas = new Set(open.map((n) => n.area));
  const blank = (area: string, side: Niggle['side']): Niggle => ({ id: uid(), createdAt: now(), updatedAt: now(), start: today, area, side, intensity: 3, type: 'tight', when: 'training', note: '', closed: null });
  return (
    <>
      <p className="small muted" style={{ marginTop: 0 }}>
        לוחצים על אזור במפה כדי לרשום עקיצה. אדום = עקיצה פעילה.
      </p>
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
        <BodyMap view="front" selected={null} active={activeAreas} onPick={(k, side) => setEdit(blank(k, side))} />
        <BodyMap view="back" selected={null} active={activeAreas} onPick={(k, side) => setEdit(blank(k, side))} />
      </div>
      <HRow title="פעילות" meta={`${open.length}`} />
      {open.map((n) => (
        <NiggleCard key={n.id} n={n} today={today} onEdit={() => setEdit(n)} />
      ))}
      {!open.length && <Empty>אין עקיצות פעילות.</Empty>}
      {closed.length > 0 && (
        <>
          <HRow title="היסטוריה לפי אזור" />
          {AREAS.filter((a) => closed.some((n) => n.area === a.key)).map((a) => (
            <div key={a.key} className="card">
              <div className="ch">
                {a.he} <span>{closed.filter((n) => n.area === a.key).length} פעמים</span>
              </div>
              {closed
                .filter((n) => n.area === a.key)
                .map((n) => (
                  <div key={n.id} className="xs muted">
                    {fmtDate(n.start)}-{fmtDate(n.closed!)} · {SIDE_HE[n.side]} · עוצמה {n.intensity} · {TYPE_HE[n.type]}
                    {n.note ? ` · ${n.note}` : ''}
                  </div>
                ))}
            </div>
          ))}
        </>
      )}
      {edit && <NiggleEditor n={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function NiggleCard({ n, today, onEdit }: { n: Niggle; today: string; onEdit: () => void }) {
  const days = diffDays(today, n.start) + 1;
  const physio = n.intensity >= 5 || days > 3;
  const area = AREAS.find((a) => a.key === n.area);
  const ip = area ? getWorkout(area.ip) : undefined;
  return (
    <div className="card">
      <div className="ch">
        {AREA_HE[n.area]} · {SIDE_HE[n.side]}{' '}
        <span>
          יום {days} · עוצמה {n.intensity} · {TYPE_HE[n.type]} · {WHEN_HE[n.when]}
        </span>
      </div>
      {n.note && <div className="small">{n.note}</div>}
      {physio && <div className="warnbox">עוצמה 5+ או יותר מ-3 ימים, או כאב עם קליק/נפיחות: לפנות לפיזיותרפיסט (Bible).</div>}
      <VideoLinks videos={rehabFor(n.area)} />
      {ip && (
        <button type="button" className="linkbtn" onClick={() => go(`/w/${ip.id}`)}>
          אימון מניעה: {ip.title} ›
        </button>
      )}
      <div className="row mt">
        <button type="button" className="btn sm" onClick={() => void db.niggles.update(n.id, { closed: today, updatedAt: now() })}>
          עבר ✓
        </button>
        <button type="button" className="btn ghost sm" onClick={onEdit}>
          עריכה
        </button>
      </div>
    </div>
  );
}

function NiggleEditor({ n, onClose }: { n: Niggle; onClose: () => void }) {
  const [v, setV] = useState(n);
  const exists = useLive(async () => !!(await db.niggles.get(n.id)), [n.id]);
  const toast = useToast();
  const set = (p: Partial<Niggle>) => setV({ ...v, ...p });
  return (
    <Modal open onClose={onClose} title={`עקיצה: ${AREA_HE[v.area]}`}>
      <div className="field">
        <label>אזור</label>
        <select className="input" value={v.area} onChange={(e) => set({ area: e.target.value })}>
          {AREAS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.he}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <div className="lbl">צד</div>
        <Seg value={v.side} onChange={(x) => set({ side: x })} options={[{ v: 'L', label: 'שמאל' }, { v: 'R', label: 'ימין' }, { v: 'C', label: 'מרכז' }]} />
      </div>
      <div className="field">
        <div className="lbl">עוצמה (1-10)</div>
        <Scale value={v.intensity} from={1} to={10} onChange={(x) => set({ intensity: x })} />
      </div>
      <div className="field">
        <div className="lbl">סוג</div>
        <Seg value={v.type} onChange={(x) => set({ type: x })} options={[{ v: 'tight', label: 'תפוס' }, { v: 'sharp', label: 'חד' }, { v: 'dull', label: 'עמום' }]} />
      </div>
      <div className="field">
        <div className="lbl">מתי</div>
        <Seg value={v.when} onChange={(x) => set({ when: x })} options={[{ v: 'game', label: 'במשחק' }, { v: 'training', label: 'באימון' }, { v: 'after', label: 'אחרי' }, { v: 'other', label: 'אחר' }]} />
      </div>
      <div className="field">
        <label>תאריך התחלה</label>
        <input className="input ltr" type="date" value={v.start} onChange={(e) => set({ start: e.target.value || v.start })} />
      </div>
      <div className="field">
        <label>הערה (קליק, נפיחות…)</label>
        <input className="input" value={v.note} onChange={(e) => set({ note: e.target.value })} />
      </div>
      <div className="row">
        <button
          type="button"
          className="btn grow"
          onClick={async () => {
            await db.niggles.put({ ...v, updatedAt: now() });
            toast('נשמר');
            onClose();
          }}
        >
          שמור
        </button>
        {exists ? <ConfirmButton label="מחק" confirm="למחוק?" onConfirm={() => void db.niggles.delete(n.id).then(onClose)} /> : null}
      </div>
    </Modal>
  );
}
