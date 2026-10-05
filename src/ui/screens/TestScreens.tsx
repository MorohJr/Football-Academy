import { useState } from 'react';
import { db } from '../../db/db';
import { FITNESS_TESTS, TESTING_SAFETY, TESTING_WHEN, TESTS_BY_PROGRAMME, type FitnessTest, type TestId } from '../../content/tracking';
import { STRENGTH_TARGETS, strengthStatus, type Lift } from '../../domain/body';
import { PROGRAMME_HE } from '../../domain/season';
import { bodySummary } from '../../services/queries';
import { ConfirmButton, fmtDate, HRow, NumInput, Page, Seg, useToast, VideoLinks } from '../components/common';
import { useLive, useToday } from '../hooks';
import { go } from '../router';

const UNIT_HE = { kg: 'ק"ג', reps: 'חזרות', sec: 'שניות', cm: 'ס"מ', level: 'רמה' } as const;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function best(values: { value: number }[], t: FitnessTest) {
  if (!values.length) return null;
  return values.reduce((a, b) => (t.lowerIsBetter ? (b.value < a.value ? b : a) : b.value > a.value ? b : a));
}

export function TestsScreen() {
  const today = useToday();
  const data = useLive(async () => ({ tests: (await db.tests.toArray()).sort((a, b) => b.date.localeCompare(a.date)), strength: await db.strength.toArray(), body: await bodySummary(today) }), [today]);
  const [open, setOpen] = useState<TestId | null>(null);
  if (!data) return null;
  return (
    <Page title="בדיקות כושר" kicker="10 בדיקות · Testing Guide" sub="R-TST: שיא ושינוי מהבדיקה הקודמת">
      <button type="button" className="btn block" onClick={() => go('/tests/new')}>
        ▶ יום בדיקות (אשף)
      </button>
      <HRow title="התוצאות" meta="לחיצה: הוראות והיסטוריה" />
      {FITNESS_TESTS.map((t) => {
        const rows = data.tests.filter((r) => r.testId === t.id);
        const last = rows[0];
        const prev = rows[1];
        const pb = best(rows, t);
        const delta = last && prev ? Math.round((last.value - prev.value) * 100) / 100 : null;
        const better = delta != null && (t.lowerIsBetter ? delta < 0 : delta > 0);
        return (
          <div key={t.id} className="card">
            <div className="row tap" onClick={() => setOpen(open === t.id ? null : t.id)}>
              <div className="grow">
                <div className="b small">{t.he}</div>
                <div className="xs muted ltr" style={{ textAlign: 'start' }}>{t.name}</div>
              </div>
              <div className="center">
                <b className="num">{last ? last.value : '—'}</b> <span className="xs">{UNIT_HE[t.unit]}</span>
                {delta != null && delta !== 0 && <div className="xs" style={{ color: better ? 'var(--g1)' : 'var(--danger)' }}>{better ? '▲' : '▼'} {Math.abs(delta)}</div>}
              </div>
            </div>
            {open === t.id && (
              <div className="mt">
                <div className="small muted">בודק: {t.assesses} · {t.where === 'gym' ? 'חדר כושר' : 'מגרש'} · {t.lowerIsBetter ? 'נמוך = טוב' : 'גבוה = טוב'}</div>
                <ul className="clean">
                  {t.howTo.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
                <VideoLinks videos={t.videos} />
                {pb && <div className="okbox">שיא: {pb.value} {UNIT_HE[t.unit]}</div>}
                {rows.map((r) => (
                  <div key={r.id} className="list-row">
                    <span className="grow small">
                      {fmtDate(r.date)} · <b>{r.value}</b> {r.side ? (r.side === 'L' ? '(שמאל)' : '(ימין)') : ''}
                    </span>
                    <ConfirmButton label="מחק" confirm="למחוק?" onConfirm={() => void db.tests.delete(r.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <StrengthTargets strength={data.strength} weight={data.body.weight} tests={data.tests} />
      <HRow title="מתי בודקים" />
      <ul className="clean">
        {TESTING_WHEN.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <HRow title="איזה בדיקות לכל תוכנית" />
      {Object.entries(TESTS_BY_PROGRAMME).map(([p, ids]) => (
        <div key={p} className="kv">
          <span>{p === 'injury' ? 'מניעת פציעות' : PROGRAMME_HE[p as keyof typeof PROGRAMME_HE]}</span>
          <span className="xs">{ids.map((id) => FITNESS_TESTS.find((t) => t.id === id)!.he.split(' (')[0]).join(', ')}</span>
        </div>
      ))}
    </Page>
  );
}

function StrengthTargets({ strength, weight, tests }: { strength: { id: string; date: string; lift: string; kg: number }[]; weight: number | null; tests: { testId: string; value: number; date: string }[] }) {
  const toast = useToast();
  const today = useToday();
  const [lift, setLift] = useState<'squat' | 'deadlift' | 'bench'>('squat');
  const [kg, setKg] = useState<number | null>(null);
  const latest = (l: string) => strength.filter((x) => x.lift === l).sort((a, b) => b.date.localeCompare(a.date))[0];
  const trap = tests.filter((t) => t.testId === 'trapbar').sort((a, b) => b.date.localeCompare(a.date))[0];
  const rows: { lift: Lift; kg: number | undefined }[] = [
    { lift: 'squat', kg: latest('squat')?.kg },
    { lift: 'deadlift', kg: latest('deadlift')?.kg },
    { lift: 'trapbar', kg: trap?.value },
    { lift: 'bench', kg: latest('bench')?.kg },
  ];
  return (
    <>
      <HRow title="יעדי כוח (Bible)" meta={weight ? `משקל ${weight} ק"ג` : 'צריך משקל גוף'} />
      {rows.map((r) => {
        const st = r.kg && weight ? strengthStatus(r.lift, r.kg, weight) : null;
        const [lo, hi] = STRENGTH_TARGETS[r.lift].range;
        return (
          <div key={r.lift} className="card">
            <div className="row between small">
              <b>{STRENGTH_TARGETS[r.lift].he}</b>
              <span>
                יעד {lo}-{hi}× משקל גוף
              </span>
            </div>
            {st ? (
              <>
                <div className="meter mt">
                  <i style={{ width: `${Math.min(100, (st.ratio / hi) * 100)}%` }} />
                </div>
                <div className="xs muted">
                  1RM {r.kg} ק"ג = {st.ratio}× · {st.enough ? 'מספיק: לא צריך להתאמן כמו מרים משקולות (Bible)' : st.toLow > 0 ? `חסרים ${st.toLow} ק"ג ל-${lo}×` : 'בטווח היעד'}
                </div>
              </>
            ) : (
              <div className="xs muted">{weight ? 'אין עדיין 1RM' : 'הזן משקל גוף במסך הגוף'}</div>
            )}
          </div>
        );
      })}
      <div className="card">
        <div className="ch">הוספת 1RM (או הערכה ממחשבון)</div>
        <Seg value={lift} onChange={setLift} options={[{ v: 'squat', label: 'סקוואט' }, { v: 'deadlift', label: 'דדליפט' }, { v: 'bench', label: 'לחיצת חזה' }]} />
        <div className="row mt">
          <div className="grow">
            <NumInput value={kg} onChange={setKg} placeholder='ק"ג' />
          </div>
          <button
            type="button"
            className="btn"
            disabled={!kg}
            onClick={async () => {
              const t = new Date().toISOString();
              await db.strength.add({ id: uid(), createdAt: t, updatedAt: t, date: today, lift, kg: kg! });
              setKg(null);
              toast('נשמר');
            }}
          >
            שמור
          </button>
        </div>
        <p className="xs muted">1RM תמיד עם שותף לביטחון. דרך הכי בטוחה: לעלות במשקל בקפיצות קטנות ולעצור בחזרה הראשונה שנכשלת (Bible).</p>
      </div>
    </>
  );
}

/** R-TST-2: light to heavy; split pitch and gym days. */
export function TestWizard() {
  const today = useToday();
  const toast = useToast();
  const [where, setWhere] = useState<'pitch' | 'gym'>('pitch');
  const [vals, setVals] = useState<Record<string, number | null>>({});
  const [safe, setSafe] = useState(false);
  const order: TestId[] = where === 'pitch' ? ['broadjump', 'sprint10', 'flying30', 'ttest', 'test505', 'yoyo'] : ['pushups', 'plank', 'trapbar', 'legpress'];
  const save = async () => {
    const t = new Date().toISOString();
    const rows = Object.entries(vals)
      .filter(([, v]) => v != null && v > 0)
      .map(([k, v]) => {
        const [testId, side] = k.split('|');
        return { id: uid(), createdAt: t, updatedAt: t, date: today, testId: testId!, value: v!, side: (side as 'L' | 'R' | undefined) ?? null, note: '' };
      });
    await db.tests.bulkAdd(rows);
    toast(`נשמרו ${rows.length} תוצאות`);
    go('/tests');
  };
  return (
    <Page title="יום בדיקות" kicker="מהקלות לקשות · Testing Guide" backTo="/tests" sub2>
      <Seg value={where} onChange={setWhere} options={[{ v: 'pitch', label: 'מגרש' }, { v: 'gym', label: 'חדר כושר / בית' }]} />
      {!safe ? (
        <div className="card mt">
          <div className="ch">לפני שמתחילים</div>
          <ul className="clean">
            {TESTING_SAFETY.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <button type="button" className="btn block mt" onClick={() => setSafe(true)}>
            הבנתי, אני מחומם
          </button>
        </div>
      ) : (
        <>
          {order.map((id, i) => {
            const t = FITNESS_TESTS.find((x) => x.id === id)!;
            const sides = t.sides ? (['', 'L', 'R'] as const) : (['' as const]);
            return (
              <div key={id} className="card mt">
                <div className="ch">
                  {i + 1}. {t.he} <span>{UNIT_HE[t.unit]}</span>
                </div>
                <ul className="clean small">
                  {t.howTo.map((x, j) => (
                    <li key={j}>{x}</li>
                  ))}
                </ul>
                <VideoLinks videos={t.videos} />
                <div className="row mt">
                  {sides.map((sd) => (
                    <div key={sd} className="grow">
                      <div className="xs muted">{sd === 'L' ? 'שמאל' : sd === 'R' ? 'ימין' : 'תוצאה'}</div>
                      <NumInput value={vals[`${id}${sd ? '|' + sd : ''}`] ?? null} onChange={(v) => setVals({ ...vals, [`${id}${sd ? '|' + sd : ''}`]: v })} step={t.unit === 'sec' ? 0.01 : 0.1} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <button type="button" className="btn block mt" onClick={save} disabled={!Object.values(vals).some((v) => v)}>
            שמור תוצאות
          </button>
        </>
      )}
    </Page>
  );
}
