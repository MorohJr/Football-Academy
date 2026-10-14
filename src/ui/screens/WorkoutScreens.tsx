import { useState } from 'react';
import { db } from '../../db/db';
import { SETTINGS_ID } from '../../domain/schemas';
import { deloadWorkout, isDeloadWeek } from '../../domain/deload';
import type { Block, ExerciseRx, Workout } from '../../content/types';
import { howTo } from '../../content/howto';
import { diagramFor } from '../../content/drills';
import { pushCoreContext, resolveWorkout } from '../../services/plan';
import { logSession } from '../../services/sessions';
import { Page, useToast, VideoLinks } from '../components/common';
import { DrillDiagram } from '../components/DrillDiagram';
import { FinishModal } from '../components/forms';
import { useLive, useToday } from '../hooks';
import { CATEGORY_HE, LOCATION_HE } from '../labels';
import { back, go } from '../router';

export const KIND_HE: Record<Block['kind'], string> = {
  straight: 'כל הסטים של תרגיל לפני הבא',
  superset: 'סופרסט: זוגות, כל הסטים של הזוג ואז הזוג הבא, בלי מנוחה',
  circuit: 'מעגל: סט מכל תרגיל ואז סבב נוסף',
  timed: 'זמני עבודה ומנוחה',
  sequence: 'לפי הסדר',
  runs: 'ריצות במגרש',
};

/** The workout as it is today: in a deload week with half the sets (R-DLD). */
export function useWorkout(id: string): Workout | undefined | null {
  const today = useToday();
  return useLive(async () => {
    const pc = await pushCoreContext(today);
    const w = resolveWorkout({ workoutId: id }, pc);
    if (!w) return null;
    const s = await db.settings.get(SETTINGS_ID);
    return s && isDeloadWeek(today, s.deloadWeeks ?? []) && w.category !== 'prematch' ? deloadWorkout(w) : w;
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
      <div className="row mt sticky-bar">
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

export function rxText(e: ExerciseRx) {
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
