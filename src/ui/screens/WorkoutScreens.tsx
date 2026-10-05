import { useEffect, useMemo, useRef, useState } from 'react';
import type { Block, ExerciseRx, Workout } from '../../content/types';
import { howTo } from '../../content/howto';
import { diagramFor } from '../../content/drills';
import { fmtClock, fullRecovery, parseSeconds, parseSets } from '../../domain/rx';
import { pushCoreContext, resolveWorkout } from '../../services/plan';
import { beep, keepAwake } from '../../services/platform';
import { logSession } from '../../services/sessions';
import { HRow, Page, useToast, VideoLinks } from '../components/common';
import { DrillDiagram } from '../components/DrillDiagram';
import { FinishModal } from '../components/forms';
import { useLive, useNow, useToday } from '../hooks';
import { CATEGORY_HE, LOCATION_HE } from '../labels';
import { back, go } from '../router';

const KIND_HE: Record<Block['kind'], string> = {
  straight: 'כל הסטים של תרגיל לפני הבא',
  superset: 'סופרסט: זוגות, כל הסטים של הזוג ואז הזוג הבא, בלי מנוחה',
  circuit: 'מעגל: סט מכל תרגיל ואז סבב נוסף',
  timed: 'זמני עבודה ומנוחה',
  sequence: 'לפי הסדר',
  runs: 'ריצות במגרש',
};

export function useWorkout(id: string): Workout | undefined | null {
  const today = useToday();
  return useLive(async () => {
    const pc = await pushCoreContext(today);
    return resolveWorkout({ workoutId: id }, pc) ?? null;
  }, [id, today]);
}

export function WorkoutScreen({ id }: { id: string }) {
  const w = useWorkout(id);
  const today = useToday();
  const toast = useToast();
  const [finish, setFinish] = useState(false);
  if (w === undefined) return null;
  if (w === null) return <Page title="האימון לא נמצא" backTo>{null}</Page>;
  return (
    <Page title={w.subtitle?.split(' · ')[0] ?? w.title} kicker={`${CATEGORY_HE[w.category]} · ${w.title}`} sub={w.subtitle?.split(' · ').slice(1).join(' · ')} backTo sub2>
      <div className="chips">
        {w.durationMin ? <span className="chip">⏱ {w.durationMin} דק'</span> : null}
        <span className="chip">📍 {LOCATION_HE[w.location]}</span>
        {w.equipment?.map((e) => (
          <span key={e} className="chip">
            🧰 {e}
          </span>
        ))}
      </div>
      <VideoLinks videos={w.videos} />
      {w.notes?.length ? (
        <div className="note mt">
          {w.notes.map((n, i) => (
            <div key={i}>• {n}</div>
          ))}
        </div>
      ) : null}
      {w.blocks.map((b, bi) => (
        <BlockView key={bi} b={b} />
      ))}
      {w.category === 'testing' && (
        <button type="button" className="btn block mt" onClick={() => go('/tests/new')}>
          פתח את אשף הבדיקות
        </button>
      )}
      <div className="row mt" style={{ position: 'sticky', bottom: 'calc(var(--safe-b) + 8px)', background: '#fff', padding: '8px 0' }}>
        <button type="button" className="btn grow" onClick={() => go(`/run/${w.id}`)}>
          ▶ התחל אימון
        </button>
        <button type="button" className="btn sec grow" onClick={() => setFinish(true)}>
          ✓ סיימתי
        </button>
      </div>
      {finish && (
        <FinishModal
          open
          onClose={() => setFinish(false)}
          defaultMinutes={w.durationMin ?? 30}
          title={w.subtitle?.split(' · ')[0] ?? w.title}
          onSave={async (minutes, rpe) => {
            await logSession({ date: today, workoutId: w.id, title: w.title, minutes, rpe });
            toast('נרשם ✓');
            setFinish(false);
            back('/');
          }}
        />
      )}
    </Page>
  );
}

function BlockView({ b }: { b: Block }) {
  const diagram = diagramFor(b.diagram);
  return (
    <div className="card mt">
      <div className="ch">
        {b.title ?? KIND_HE[b.kind]}
        <span>{b.title ? KIND_HE[b.kind] : ''}</span>
      </div>
      {b.kind === 'timed' && (
        <div className="chips mb">
          <span className="chip on">{b.timeOn} עבודה</span>
          <span className="chip">{b.timeOff === '0' ? 'בלי מנוחה' : `${b.timeOff} מנוחה`}</span>
          <span className="chip">{b.rounds} סבבים</span>
        </div>
      )}
      {b.note && <div className="note mb">{b.note}</div>}
      {diagram && <DrillDiagram d={diagram} />}
      {b.exercises.map((e, i) => (
        <ExerciseRow key={i} e={e} superset={b.kind === 'superset'} />
      ))}
      <VideoLinks videos={b.videos} />
    </div>
  );
}

function rxText(e: ExerciseRx) {
  const parts = [];
  if (e.sets && e.reps) parts.push(`${e.sets} × ${e.reps}`);
  else if (e.reps) parts.push(e.reps);
  else if (e.sets) parts.push(`${e.sets} סטים`);
  if (e.rest) parts.push(`מנוחה ${e.rest}`);
  return parts.join(' · ');
}

export function ExerciseRow({ e, superset }: { e: ExerciseRx; superset?: boolean }) {
  const [open, setOpen] = useState(false);
  const h = howTo(e.name);
  return (
    <div className="list-row" style={{ display: 'block' }}>
      <div className="row">
        <div className="grow">
          <div className="b small ltr" style={{ textAlign: 'start' }}>
            {superset ? '↔ ' : ''}
            {e.name}
          </div>
          <div className="xs muted">{rxText(e)}</div>
        </div>
        {h && (
          <button type="button" className="chip" onClick={() => setOpen(!open)}>
            איך עושים {open ? '▴' : '▾'}
          </button>
        )}
      </div>
      {e.note && <div className="xs" style={{ color: 'var(--ink2)', marginTop: 3 }}>{e.note}</div>}
      {e.diagram && diagramFor(e.diagram) && <div className="mt"><DrillDiagram d={diagramFor(e.diagram)!} /></div>}
      {open && h && <HowToBox h={h} />}
    </div>
  );
}

export function HowToBox({ h }: { h: NonNullable<ReturnType<typeof howTo>> }) {
  return (
    <div className="howto">
      {h.why && (
        <div>
          <b>למה:</b> {h.why}
        </div>
      )}
      {h.start && (
        <div style={{ marginTop: 4 }}>
          <b>תנוחת התחלה:</b> {h.start}
        </div>
      )}
      {h.steps?.length ? (
        <div style={{ marginTop: 4 }}>
          <b>ביצוע:</b>
          {h.steps.map((s, i) => (
            <div key={i}>
              {i + 1}. {s}
            </div>
          ))}
        </div>
      ) : null}
      {h.cues?.length ? (
        <div style={{ marginTop: 4 }}>
          <b>דגשים:</b> {h.cues.join(' ')}
        </div>
      ) : null}
      {h.mistake && (
        <div className="mis" style={{ marginTop: 4 }}>
          <b>טעות נפוצה:</b> {h.mistake}
        </div>
      )}
      {(h.easier || h.harder) && (
        <div style={{ marginTop: 4 }}>
          <b>הקלה / הקשה:</b> {h.easier ?? '—'} / {h.harder ?? '—'}
        </div>
      )}
      {h.video && <div className="xs muted" style={{ marginTop: 4 }}>דפוס הצעדים המדויק מופיע בסרטון.</div>}
    </div>
  );
}

// ================= workout mode (R-WRK) =================
interface Step {
  bi: number;
  ei: number;
  ex: ExerciseRx;
  block: Block;
  sets: number;
  /** for timed blocks: seconds on/off and rounds */
  on?: number;
  off?: number;
}

function buildSteps(w: Workout): Step[] {
  const out: Step[] = [];
  w.blocks.forEach((b, bi) => {
    if (b.kind === 'timed') {
      b.exercises.forEach((ex, ei) => out.push({ bi, ei, ex, block: b, sets: Number(b.rounds ?? 1), on: parseSeconds(b.timeOn) ?? 30, off: parseSeconds(b.timeOff) ?? 0 }));
    } else {
      b.exercises.forEach((ex, ei) => out.push({ bi, ei, ex, block: b, sets: b.kind === 'sequence' ? 1 : parseSets(ex.sets) }));
    }
  });
  return out;
}

export function RunScreen({ id }: { id: string }) {
  const w = useWorkout(id);
  const today = useToday();
  const toast = useToast();
  const [startedAt] = useState(() => Date.now());
  const [sets, setSets] = useState<Record<string, number>>({});
  const [rest, setRest] = useState<{ until: number | null; since: number; label: string } | null>(null);
  const [interval, setIntervalRun] = useState<{ bi: number; round: number; idx: number; phase: 'on' | 'off'; until: number } | null>(null);
  const [finish, setFinish] = useState(false);
  const [openHow, setOpenHow] = useState<string | null>(null);
  const now = useNow(250);
  const beeped = useRef<number | null>(null);
  const steps = useMemo(() => (w ? buildSteps(w) : []), [w]);

  useEffect(() => {
    let release: () => void = () => {};
    void keepAwake().then((r) => (release = r));
    return () => release();
  }, []);

  // Rest countdown end → beep once.
  useEffect(() => {
    if (rest?.until && now >= rest.until && beeped.current !== rest.until) {
      beeped.current = rest.until;
      beep(2);
    }
  }, [now, rest]);

  // Interval timer for timed blocks (core, bodyweight): on → off → next exercise; rounds.
  useEffect(() => {
    if (!interval || !w) return;
    if (now < interval.until) return;
    const b = w.blocks[interval.bi]!;
    const on = parseSeconds(b.timeOn) ?? 30;
    const off = parseSeconds(b.timeOff) ?? 0;
    const rounds = Number(b.rounds ?? 1);
    const n = b.exercises.length;
    beep(1);
    if (interval.phase === 'on' && off > 0) {
      // The interval timer is a state machine driven by the clock tick; advancing it here is intended.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntervalRun({ ...interval, phase: 'off', until: now + off * 1000 });
      return;
    }
    // next exercise
    const key = `${interval.bi}.${interval.idx}`;
    setSets((s) => ({ ...s, [key]: Math.min(rounds, (s[key] ?? 0) + (interval.phase === 'on' || off > 0 ? 1 : 0)) }));
    let idx = interval.idx + 1;
    let round = interval.round;
    if (idx >= n) {
      idx = 0;
      round += 1;
    }
    if (round > rounds) {
      setIntervalRun(null);
      beep(3);
      return;
    }
    setIntervalRun({ bi: interval.bi, round, idx, phase: 'on', until: now + on * 1000 });
  }, [now, interval, w]);

  if (!w) return null;
  const elapsed = Math.floor((now - startedAt) / 1000);
  const tapSet = (st: Step) => {
    const key = `${st.bi}.${st.ei}`;
    const doneN = (sets[key] ?? 0) + 1;
    if (doneN > st.sets) return;
    setSets({ ...sets, [key]: doneN });
    const restSec = parseSeconds(st.ex.rest);
    if (st.block.kind === 'superset') return; // no rest between the pair
    if (fullRecovery(st.ex.rest)) setRest({ until: null, since: now, label: 'התאוששות מלאה' });
    else if (restSec) setRest({ until: now + restSec * 1000, since: now, label: `מנוחה ${st.ex.rest}` });
  };
  const totalSets = steps.reduce((a, s) => a + s.sets, 0);
  const doneSets = Object.values(sets).reduce((a, b) => a + b, 0);

  let curInterval: { name: string; phase: string; left: number; round: number; rounds: number } | null = null;
  if (interval) {
    const b = w.blocks[interval.bi]!;
    curInterval = { name: b.exercises[interval.idx]!.name, phase: interval.phase === 'on' ? 'עבודה' : 'מנוחה', left: (interval.until - now) / 1000, round: interval.round, rounds: Number(b.rounds ?? 1) };
  }

  return (
    <Page title={w.subtitle?.split(' · ')[0] ?? w.title} kicker={`מצב אימון · ${w.title}`} sub={`${fmtClock(elapsed)} · ${doneSets}/${totalSets} סטים · המסך נשאר דלוק`} backTo={`/w/${w.id}`} sub2>
      {rest && (
        <div className={`card white center ${rest.until && now >= rest.until ? 'flash' : ''}`} style={{ position: 'sticky', top: 8, zIndex: 5, boxShadow: '0 4px 14px rgba(0,0,0,.12)' }}>
          <div className="run-phase">{rest.label}</div>
          <div className="run-timer">{rest.until ? fmtClock((rest.until - now) / 1000) : fmtClock((now - rest.since) / 1000)}</div>
          <div className="row" style={{ justifyContent: 'center' }}>
            {rest.until && <button type="button" className="btn ghost sm" onClick={() => setRest({ ...rest, until: rest.until! + 15000 })}>+15 שנ'</button>}
            <button type="button" className="btn sm" onClick={() => setRest(null)}>
              {rest.until && now < rest.until ? 'דלג' : 'ממשיכים'}
            </button>
          </div>
        </div>
      )}
      {curInterval && (
        <div className="card white center flash" style={{ position: 'sticky', top: 8, zIndex: 5, boxShadow: '0 4px 14px rgba(0,0,0,.12)', borderColor: curInterval.phase === 'עבודה' ? 'var(--g1)' : 'var(--line)' }}>
          <div className="run-phase">
            סבב {curInterval.round}/{curInterval.rounds} · {curInterval.phase}
          </div>
          <div className="b ltr">{curInterval.name}</div>
          <div className="run-timer">{fmtClock(curInterval.left)}</div>
          <button type="button" className="btn ghost sm" onClick={() => setIntervalRun(null)}>
            עצור
          </button>
        </div>
      )}
      {w.blocks.map((b, bi) => (
        <div key={bi} className="card mt">
          <div className="ch">
            {b.title ?? KIND_HE[b.kind]}
            {b.kind === 'timed' && !interval && (
              <button type="button" className="btn sm" onClick={() => setIntervalRun({ bi, round: 1, idx: 0, phase: 'on', until: Date.now() + (parseSeconds(b.timeOn) ?? 30) * 1000 })}>
                ▶ טיימר {b.timeOn}/{b.timeOff}
              </button>
            )}
          </div>
          {b.note && <div className="xs muted mb">{b.note}</div>}
          {steps
            .filter((st) => st.bi === bi)
            .map((st) => {
              const key = `${st.bi}.${st.ei}`;
              const n = sets[key] ?? 0;
              const h = howTo(st.ex.name);
              return (
                <div key={key} className="list-row" style={{ display: 'block' }}>
                  <div className="row">
                    <div className="grow">
                      <div className="b small ltr" style={{ textAlign: 'start' }}>{st.ex.name}</div>
                      <div className="xs muted">{rxText(st.ex)}</div>
                    </div>
                    {h && (
                      <button type="button" className="chip" onClick={() => setOpenHow(openHow === key ? null : key)}>
                        איך?
                      </button>
                    )}
                  </div>
                  {h?.cues?.length && openHow !== key ? <div className="xs" style={{ color: 'var(--g2)' }}>💡 {h.cues[0]}</div> : null}
                  {openHow === key && h && <HowToBox h={h} />}
                  <div className="setbox">
                    {Array.from({ length: st.sets }, (_, i) => (
                      <button key={i} type="button" className={i < n ? 'on' : ''} onClick={() => (i < n ? setSets({ ...sets, [key]: i }) : tapSet(st))}>
                        {b.kind === 'timed' ? `סבב ${i + 1}` : b.kind === 'sequence' ? '✓' : `סט ${i + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          <VideoLinks videos={b.videos} />
        </div>
      ))}
      <VideoLinks videos={w.videos} />
      <HRow title="" />
      <button type="button" className="btn block" onClick={() => setFinish(true)}>
        סיים ורשום
      </button>
      {finish && (
        <FinishModal
          open
          onClose={() => setFinish(false)}
          defaultMinutes={Math.max(1, Math.round(elapsed / 60))}
          title={w.subtitle?.split(' · ')[0] ?? w.title}
          onSave={async (minutes, rpe) => {
            await logSession({ date: today, workoutId: w.id, title: w.title, minutes, rpe, sets });
            toast('האימון נרשם ✓');
            go('/');
          }}
        />
      )}
    </Page>
  );
}
