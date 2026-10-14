// Workout mode (R-WRK): sets, rest and interval timers, kg/reps per set (R-PRG), saved on every change (R-WRK-2).
import { useEffect, useMemo, useState } from 'react';
import { howTo } from '../../content/howto';
import { fmtClock, fullRecovery, parseSeconds } from '../../domain/rx';
import { liftFor, parseReps, suggest, type SetLoad, type Suggestion } from '../../domain/progression';
import { buildSteps, loadsByName, truncateLoads, type Step } from '../../domain/run';
import type { ActiveRun } from '../../domain/schemas';
import { clearRun, loadHistory, openRun, saveRun } from '../../services/runs';
import { beep, keepAwake, scheduleBeep, unlockAudio } from '../../services/platform';
import { logSession } from '../../services/sessions';
import { ConfirmButton, HRow, NumInput, Page, useToast, VideoLinks } from '../components/common';
import { FinishModal } from '../components/forms';
import { useNow, useToday } from '../hooks';
import { go } from '../router';
import { HowToBox, KIND_HE, rxText, useWorkout } from './WorkoutScreens';

type History = Awaited<ReturnType<typeof loadHistory>>;
interface IntervalRun {
  bi: number;
  round: number;
  idx: number;
  phase: 'on' | 'off';
  until: number;
}

export function RunScreen({ id }: { id: string }) {
  const w = useWorkout(id);
  const today = useToday();
  const toast = useToast();
  const [run, setRun] = useState<ActiveRun | null>(null);
  const [hist, setHist] = useState<History | null>(null);
  const [interval, setIntervalRun] = useState<IntervalRun | null>(null);
  const [finish, setFinish] = useState(false);
  const [openHow, setOpenHow] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, SetLoad>>({});
  const now = useNow(250);
  const steps = useMemo(() => (w ? buildSteps(w) : []), [w]);
  const wid = w?.id;

  // Open (or resume) the saved run and load the exercise history.
  useEffect(() => {
    if (!w || !wid) return;
    let alive = true;
    void (async () => {
      const r = await openRun(wid, today);
      const h = await loadHistory(w);
      if (!alive) return;
      setRun(r);
      setHist(h);
      if (Object.keys(r.sets).length) toast('ממשיכים מאיפה שעצרת');
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per workout/day; `w` changes identity on every live query
  }, [wid, today]);

  useEffect(() => {
    let release: () => void = () => {};
    void keepAwake().then((r) => (release = r));
    return () => release();
  }, []);

  // R-WRK-3: the end-of-rest beep is scheduled ahead on the audio clock.
  const restUntil = run?.rest?.until ?? null;
  useEffect(() => {
    if (!restUntil || restUntil <= Date.now()) return;
    return scheduleBeep(restUntil, 2);
  }, [restUntil]);
  const intervalUntil = interval?.until ?? null;
  useEffect(() => {
    if (!intervalUntil) return;
    return scheduleBeep(intervalUntil, 1);
  }, [intervalUntil]);

  // Interval timer for timed blocks: on → off → next exercise; rounds. Driven by the clock tick.
  useEffect(() => {
    if (!interval || !w || !run) return;
    if (now < interval.until) return;
    const b = w.blocks[interval.bi]!;
    const on = parseSeconds(b.timeOn) ?? 30;
    const off = parseSeconds(b.timeOff) ?? 0;
    const rounds = Number.parseInt(b.rounds ?? '1', 10) || 1;
    if (interval.phase === 'on' && off > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the state machine advances on the clock tick
      setIntervalRun({ ...interval, phase: 'off', until: now + off * 1000 });
      return;
    }
    const key = `${interval.bi}.${interval.idx}`;
    const sets = { ...run.sets, [key]: Math.min(rounds, (run.sets[key] ?? 0) + 1) };
    setRun({ ...run, sets });
    void saveRun({ sets });
    let idx = interval.idx + 1;
    let round = interval.round;
    if (idx >= b.exercises.length) {
      idx = 0;
      round += 1;
    }
    if (round > rounds) {
      setIntervalRun(null);
      beep(3);
      return;
    }
    setIntervalRun({ bi: interval.bi, round, idx, phase: 'on', until: now + on * 1000 });
  }, [now, interval, w, run]);

  if (!w || !run || !hist) return null;

  const update = (patch: Partial<Pick<ActiveRun, 'sets' | 'loads' | 'rest'>>) => {
    setRun({ ...run, ...patch });
    void saveRun(patch);
  };
  const elapsed = Math.floor((now - run.startedAt) / 1000);
  const suggestionFor = (st: Step): Suggestion => {
    const lift = liftFor(st.ex.name);
    return suggest(parseReps(st.ex.reps, st.sets), st.sets, hist.history[st.ex.name] ?? [], today, lift ? hist.manual[lift] : null);
  };
  const valueFor = (st: Step, sug: Suggestion): SetLoad => {
    const n = run.sets[st.key] ?? 0;
    return draft[st.key] ?? sug.sets[Math.min(n, sug.sets.length - 1)] ?? { kg: null, reps: null };
  };

  const tapSet = (st: Step, sug: Suggestion | null) => {
    unlockAudio();
    const n = run.sets[st.key] ?? 0;
    if (n >= st.sets) return;
    const patch: Partial<Pick<ActiveRun, 'sets' | 'loads' | 'rest'>> = { sets: { ...run.sets, [st.key]: n + 1 } };
    if (st.loadable && sug) {
      const v = valueFor(st, sug);
      patch.loads = { ...run.loads, [st.key]: [...truncateLoads(run.loads[st.key], n), { kg: v.kg, reps: v.reps }] };
      // Keep the weight just used for the next set, unless the prescription sets it per set (% ladder).
      const pct = parseReps(st.ex.reps, st.sets).kind === 'pct';
      setDraft({ ...draft, [st.key]: pct ? (sug.sets[n + 1] ?? v) : { kg: v.kg, reps: sug.sets[n + 1]?.reps ?? v.reps } });
    }
    if (st.block.kind !== 'superset') {
      const restSec = parseSeconds(st.ex.rest);
      const t = now;
      if (fullRecovery(st.ex.rest)) patch.rest = { until: null, since: t, label: 'התאוששות מלאה' };
      else if (restSec) patch.rest = { until: t + restSec * 1000, since: t, label: `מנוחה ${st.ex.rest}` };
    }
    update(patch);
  };
  const untick = (st: Step, i: number) => update({ sets: { ...run.sets, [st.key]: i }, loads: { ...run.loads, [st.key]: truncateLoads(run.loads[st.key], i) } });

  const totalSets = steps.reduce((a, s) => a + s.sets, 0);
  const doneSets = Object.values(run.sets).reduce((a, b) => a + b, 0);
  const rest = run.rest;
  let curInterval: { name: string; phase: string; left: number; round: number; rounds: number } | null = null;
  if (interval) {
    const b = w.blocks[interval.bi]!;
    curInterval = { name: b.exercises[interval.idx]!.name, phase: interval.phase === 'on' ? 'עבודה' : 'מנוחה', left: (interval.until - now) / 1000, round: interval.round, rounds: Number.parseInt(b.rounds ?? '1', 10) || 1 };
  }
  const deload = w.notes?.[0]?.startsWith('שבוע הורדת עומס');

  return (
    <Page title={w.subtitle?.split(' · ')[0] ?? w.title} kicker={`מצב אימון · ${w.title}`} sub={`${fmtClock(elapsed)} · ${doneSets}/${totalSets} סטים · המסך נשאר דלוק · נשמר אוטומטית`} backTo={`/w/${w.id}`} sub2>
      {deload && <div className="okbox mb">שבוע הורדת עומס: חצי מהסטים, אותו משקל (R-DLD).</div>}
      {rest && (
        <div className={`card white center sticky-timer ${rest.until && now >= rest.until ? 'flash' : ''}`}>
          <div className="run-phase">{rest.label}</div>
          <div className="run-timer">{rest.until ? fmtClock((rest.until - now) / 1000) : fmtClock((now - rest.since) / 1000)}</div>
          <div className="row" style={{ justifyContent: 'center' }}>
            {rest.until && (
              <button type="button" className="btn ghost sm" onClick={() => update({ rest: { ...rest, until: rest.until! + 15000 } })}>
                +15 שנ'
              </button>
            )}
            <button type="button" className="btn sm" onClick={() => update({ rest: null })}>
              {rest.until && now < rest.until ? 'דלג' : 'ממשיכים'}
            </button>
          </div>
        </div>
      )}
      {curInterval && (
        <div className={`card white center flash sticky-timer ${curInterval.phase === 'עבודה' ? 'on' : ''}`}>
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
              <button
                type="button"
                className="btn sm"
                onClick={() => {
                  unlockAudio();
                  setIntervalRun({ bi, round: 1, idx: 0, phase: 'on', until: Date.now() + (parseSeconds(b.timeOn) ?? 30) * 1000 });
                }}
              >
                ▶ טיימר {b.timeOn}/{b.timeOff}
              </button>
            )}
          </div>
          {b.note && <div className="xs muted mb">{b.note}</div>}
          {steps
            .filter((st) => st.bi === bi)
            .map((st) => {
              const n = run.sets[st.key] ?? 0;
              const h = howTo(st.ex.name);
              const sug = st.loadable ? suggestionFor(st) : null;
              const v = sug ? valueFor(st, sug) : null;
              return (
                <div key={st.key} className="list-row" style={{ display: 'block' }}>
                  <div className="row">
                    <div className="grow">
                      <div className="b small ltr" style={{ textAlign: 'start' }}>{st.ex.name}</div>
                      <div className="xs muted">{rxText(st.ex)}</div>
                    </div>
                    {h && (
                      <button type="button" className="chip" onClick={() => setOpenHow(openHow === st.key ? null : st.key)}>
                        איך?
                      </button>
                    )}
                  </div>
                  {h?.cues?.length && openHow !== st.key ? <div className="xs accent">💡 {h.cues[0]}</div> : null}
                  {openHow === st.key && h && <HowToBox h={h} />}
                  {sug && v && n < st.sets && (
                    <div className="loadbox">
                      {sug.last && <div className="xs muted">פעם קודמת: <span className="ltr">{sug.last}</span></div>}
                      {sug.text && <div className="xs accent">{sug.text}</div>}
                      <div className="row">
                        <label className="xs grow">
                          ק"ג (סט {n + 1})
                          <NumInput value={v.kg} step={2.5} min={0} placeholder="משקל גוף" onChange={(kg) => setDraft({ ...draft, [st.key]: { ...v, kg } })} />
                        </label>
                        <label className="xs grow">
                          חזרות
                          <NumInput value={v.reps} min={0} onChange={(reps) => setDraft({ ...draft, [st.key]: { ...v, reps: reps == null ? null : Math.round(reps) } })} />
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="setbox">
                    {Array.from({ length: st.sets }, (_, i) => {
                      const l = run.loads[st.key]?.[i];
                      return (
                        <button key={i} type="button" className={i < n ? 'on' : ''} onClick={() => (i < n ? untick(st, i) : tapSet(st, sug))}>
                          {b.kind === 'timed' ? `סבב ${i + 1}` : b.kind === 'sequence' ? '✓' : l && i < n ? <span className="ltr">{`${l.reps ?? '?'} × ${l.kg ?? 'BW'}`}</span> : `סט ${i + 1}`}
                        </button>
                      );
                    })}
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
      <div className="center mt">
        <ConfirmButton
          label="יציאה בלי לשמור"
          confirm="למחוק את האימון הפתוח?"
          onConfirm={async () => {
            await clearRun();
            go('/');
          }}
        />
      </div>
      {finish && (
        <FinishModal
          open
          onClose={() => setFinish(false)}
          defaultMinutes={Math.max(1, Math.round(elapsed / 60))}
          title={w.subtitle?.split(' · ')[0] ?? w.title}
          onSave={async (minutes, rpe) => {
            await logSession({ date: today, workoutId: w.id, title: w.title, minutes, rpe, sets: run.sets, loads: loadsByName(steps, run.loads) });
            await clearRun();
            toast('האימון נרשם ✓');
            go('/');
          }}
        />
      )}
    </Page>
  );
}
