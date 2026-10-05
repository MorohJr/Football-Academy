import { useState } from 'react';
import { db } from '../../db/db';
import { POMS_QUESTIONS, POMS_SCALE, RPE_SCALE } from '../../content/tracking';
import type { Checkin } from '../../domain/schemas';
import { sleepHours } from '../../services/queries';
import { Modal, NumInput, Scale, useToast } from './common';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** Morning check-in: POMS 5 questions + sleep (R-TRK method 2, R-SLP). */
export function CheckinModal({ open, onClose, date, existing }: { open: boolean; onClose: () => void; date: string; existing?: Checkin }) {
  const toast = useToast();
  const [v, setV] = useState<Record<string, number | null>>(() => ({
    sleep: existing?.sleep ?? null, lookingForward: existing?.lookingForward ?? null, vigorous: existing?.vigorous ?? null, soreness: existing?.soreness ?? null, appetite: existing?.appetite ?? null,
  }));
  const [lightsOut, setLightsOut] = useState(existing?.lightsOut ?? '23:00');
  const [wake, setWake] = useState(existing?.wake ?? '07:00');
  const [nap, setNap] = useState<number | null>(existing?.napMin ?? 0);
  const complete = POMS_QUESTIONS.every((q) => v[q.key] != null);
  const hours = sleepHours({ lightsOut, wake, napMin: nap ?? 0 });
  const save = async () => {
    const t = new Date().toISOString();
    const row: Checkin = {
      id: existing?.id ?? uid(), createdAt: existing?.createdAt ?? t, updatedAt: t, date,
      sleep: v.sleep!, lookingForward: v.lookingForward!, vigorous: v.vigorous!, soreness: v.soreness!, appetite: v.appetite!,
      lightsOut, wake, napMin: nap ?? 0,
    };
    await db.checkins.put(row);
    toast(`נשמר · ${row.sleep + row.lookingForward + row.vigorous + row.soreness + row.appetite}/25`);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="צ'ק-אין בוקר">
      <p className="small muted" style={{ marginTop: 0 }}>
        עונים מיד כשמתעוררים: 1 = ממש לא מסכים, 5 = מסכים מאוד. בכאבי שרירים, 5 = אין כאבים בכלל.
      </p>
      {POMS_QUESTIONS.map((q) => (
        <div key={q.key} className="field">
          <div className="lbl">{q.he}</div>
          <Scale value={v[q.key] ?? null} onChange={(n) => setV({ ...v, [q.key]: n })} />
          {v[q.key] != null && <div className="xs muted">{POMS_SCALE[v[q.key]!]}</div>}
        </div>
      ))}
      <div className="hrow">
        <span className="h">שינה</span>
        <span className="hm">{hours != null ? `${hours} שעות` : ''}</span>
      </div>
      <div className="row">
        <div className="field grow">
          <label>כיבוי אור</label>
          <input className="input ltr" type="time" value={lightsOut} onChange={(e) => setLightsOut(e.target.value)} />
        </div>
        <div className="field grow">
          <label>קימה</label>
          <input className="input ltr" type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
        </div>
        <div className="field" style={{ width: 90 }}>
          <label>נמנום (דק')</label>
          <NumInput value={nap} onChange={setNap} min={0} />
        </div>
      </div>
      {hours != null && hours < 8 && <div className="warnbox">פחות מ-8 שעות. לפי ה-Bible, ספורטאים שישנים פחות מ-8 שעות בסיכון פציעה גבוה פי 1.7.</div>}
      <button type="button" className="btn block mt" disabled={!complete} onClick={save}>
        שמור
      </button>
    </Modal>
  );
}

/** After a session: minutes + RPE 0-10 (R-TRK-1). */
export function FinishModal({ open, onClose, onSave, defaultMinutes, title }: { open: boolean; onClose: () => void; onSave: (minutes: number, rpe: number | null) => void; defaultMinutes: number; title: string }) {
  const [min, setMin] = useState<number | null>(defaultMinutes);
  const [rpe, setRpe] = useState<number | null>(null);
  return (
    <Modal open={open} onClose={onClose} title={`סיימתי: ${title}`}>
      <div className="field">
        <label>כמה דקות?</label>
        <NumInput value={min} onChange={setMin} min={0} />
      </div>
      <div className="field">
        <div className="lbl">כמה קשה היה? (RPE)</div>
        <Scale value={rpe} from={0} to={10} onChange={setRpe} />
        {rpe != null && <div className="xs muted">{RPE_SCALE[rpe]?.label || `${rpe}/10`}</div>}
      </div>
      <p className="xs muted">יחידות אימון = דקות × RPE. רושמים מיד אחרי האימון.</p>
      <button type="button" className="btn block" disabled={!min} onClick={() => onSave(min ?? 0, rpe)}>
        שמור
      </button>
    </Modal>
  );
}
