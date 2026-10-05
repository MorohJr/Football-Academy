import { useState } from 'react';
import { db } from '../../db/db';
import { MATCHDAY_SCRIPT_FIELDS, MINDSET_INTRO, MINDSET_PARTS, POST_MATCH_ANALYSIS, RELISTEN, SELF_TALK_STEPS, TRAINING_SCRIPT_FIELDS, type Lesson } from '../../content/mindset';
import { weakFootWorkout } from '../../content/weakfoot';
import { diffDays } from '../../domain/dates';
import type { Worksheet } from '../../domain/schemas';
import { nextGame } from '../../services/plan';
import { openLink } from '../../services/platform';
import { ConfirmButton, Empty, fmtDate, HRow, Page, Tabs, useToast } from '../components/common';
import { Icon } from '../components/Icon';
import { useLive, useToday } from '../hooks';
import { go, replace } from '../router';

type Tab = 'lessons' | 'schedule' | 'sheets';
type Kind = Worksheet['kind'];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const now = () => new Date().toISOString();
const ALL_LESSONS = MINDSET_PARTS.flatMap((p) => p.lessons);

export const SHEET_HE: Record<Kind, string> = {
  postMatch: 'ניתוח אחרי משחק',
  trainingScript: 'תסריט אימון',
  matchScript: 'תסריט יום משחק',
  selfTalk: 'שינוי דיבור פנימי',
};

interface Field {
  key: string;
  he: string;
  count: number;
  withWhy?: boolean;
}
const SELF_TALK_FIELDS: Field[] = [
  { key: 'thought', he: 'שלב 1: המשפט השלילי (מיד אחרי האימון/משחק)', count: 1 },
  { key: 'cause', he: 'שלב 2: מה גרם לו?', count: 1 },
  { key: 'positive', he: 'שלב 3: אותה מחשבה בצורה חיובית', count: 1 },
  { key: 'ways', he: '2 דרכים לשפר', count: 2 },
];
const FIELDS: Record<Kind, Field[]> = {
  postMatch: POST_MATCH_ANALYSIS.fields,
  trainingScript: TRAINING_SCRIPT_FIELDS,
  matchScript: MATCHDAY_SCRIPT_FIELDS,
  selfTalk: SELF_TALK_FIELDS,
};

export function MindScreen({ tab }: { tab?: string }) {
  const t = (['lessons', 'schedule', 'sheets'].includes(tab ?? '') ? tab : 'lessons') as Tab;
  return (
    <Page title="מיינדסט" kicker="7 נושאים · 41 שיעורים" sub="הכול מתחיל בראש">
      <Tabs value={t} tabs={[{ v: 'lessons', label: 'שיעורים' }, { v: 'schedule', label: 'האזנה חוזרת' }, { v: 'sheets', label: 'דפי עבודה' }]} onChange={(v) => replace(`/mind/${v}`)} />
      {t === 'lessons' && <Lessons />}
      {t === 'schedule' && <Schedule />}
      {t === 'sheets' && <Sheets />}
    </Page>
  );
}

function LessonRow({ l, heard, onHeard }: { l: Lesson; heard: string | undefined; onHeard: () => void }) {
  return (
    <div className="list-row">
      <button type="button" className="btn ghost sm" aria-label="פתח שיעור" onClick={() => openLink(l.video.url)}>
        <Icon name="play" size="xs" />
      </button>
      <span className="grow small ltr" style={{ textAlign: 'start' }}>
        {l.title}
        {l.video.external && <span className="xs muted"> (יוטיוב · לא מ-Matchfit)</span>}
        {heard && <div className="xs muted" style={{ direction: 'rtl' }}>הקשבתי {fmtDate(heard)}</div>}
      </span>
      <button type="button" className={`btn sm ${heard ? 'sec' : ''}`} onClick={onHeard}>
        {heard ? '✓' : 'הקשבתי'}
      </button>
    </div>
  );
}

function useHeard() {
  const today = useToday();
  const logs = useLive(() => db.lessons.toArray(), []);
  const last = new Map<string, string>();
  for (const l of logs ?? []) if (!last.has(l.lessonId) || last.get(l.lessonId)! < l.date) last.set(l.lessonId, l.date);
  const mark = async (lessonId: string) => {
    const t = now();
    await db.lessons.add({ id: uid(), createdAt: t, updatedAt: t, date: today, lessonId });
  };
  return { last, mark, ready: !!logs };
}

function Lessons() {
  const { last, mark, ready } = useHeard();
  const [open, setOpen] = useState<string | null>(MINDSET_PARTS[0]!.id);
  if (!ready) return null;
  return (
    <>
      <ul className="clean small">
        {MINDSET_INTRO.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <div className="xs muted mt">
        הקשבת ל-{ALL_LESSONS.filter((l) => last.has(l.id)).length} מתוך {ALL_LESSONS.length}
      </div>
      {MINDSET_PARTS.map((p) => (
        <div key={p.id} className="card">
          <div className="ch tap" onClick={() => setOpen(open === p.id ? null : p.id)}>
            {p.he}
            <span>
              {p.lessons.filter((l) => last.has(l.id)).length}/{p.lessons.length} {open === p.id ? '−' : '+'}
            </span>
          </div>
          {open === p.id && p.lessons.map((l) => <LessonRow key={l.id} l={l} heard={last.get(l.id)} onHeard={() => void mark(l.id)} />)}
        </div>
      ))}
    </>
  );
}

function Schedule() {
  const today = useToday();
  const { last, mark, ready } = useHeard();
  const ng = useLive(() => nextGame(today), [today]);
  if (!ready) return null;
  const days = ng ? diffDays(ng.date, today) : null;
  const focus = days === 1 ? 'day-before' : days === 0 ? 'six-hours' : null;
  return (
    <>
      {ng && (
        <div className="okbox">
          המשחק הבא: {fmtDate(ng.date)} {ng.time}
          {days === 1 ? ' · מחר. הערב: 8 השיעורים של "יום לפני".' : days === 0 ? ' · היום. 6 שעות לפני: 7 השיעורים.' : ` · בעוד ${days} ימים`}
        </div>
      )}
      {RELISTEN.map((r) => (
        <div key={r.when} className="card" style={focus === r.when ? { borderInlineStart: '4px solid var(--g1)' } : undefined}>
          <div className="ch">
            {r.he} <span>{r.lessons.length} שיעורים</span>
          </div>
          {r.lessons.map((id) => {
            const l = ALL_LESSONS.find((x) => x.id === id)!;
            return <LessonRow key={id} l={l} heard={last.get(id)} onHeard={() => void mark(id)} />;
          })}
        </div>
      ))}
      <div className="card">
        <div className="ch">רגל חלשה ונגיעה ראשונה (14.12)</div>
        <div className="small">2 × 10 דקות בשבוע, בימים הקלים. ממשיך את דף "שינוי דיבור פנימי".</div>
        <button type="button" className="linkbtn" onClick={() => go(`/w/${weakFootWorkout.id}`)}>
          לאימון ›
        </button>
      </div>
    </>
  );
}

function Sheets() {
  const list = useLive(async () => (await db.worksheets.toArray()).sort((a, b) => b.date.localeCompare(a.date)), []);
  if (!list) return null;
  return (
    <>
      <div className="stack">
        {(Object.keys(SHEET_HE) as Kind[]).map((k) => (
          <button key={k} type="button" className="btn sec block" onClick={() => go(k === 'postMatch' ? '/games' : `/sheet/${k}`)}>
            + {SHEET_HE[k]}
            {k === 'postMatch' ? ' (מתוך משחק)' : ''}
          </button>
        ))}
      </div>
      <HRow title="מה מילאתי" meta={`${list.length}`} />
      {list.map((w) => (
        <div key={w.id} className="wrow tap" onClick={() => go(w.kind === 'postMatch' && w.gameId ? `/analysis/${w.gameId}` : `/sheet/${w.kind}/${w.id}`)}>
          <div className="when">{fmtDate(w.date)}</div>
          <div className="grow">
            <div className="ttl">{SHEET_HE[w.kind]}</div>
            <div className="meta">{Object.values(w.data).flat().filter(Boolean)[0] ?? ''}</div>
          </div>
        </div>
      ))}
      {!list.length && <Empty>עוד לא מילאת דפי עבודה.</Empty>}
    </>
  );
}

export function WorksheetScreen({ kind, id }: { kind: string; id?: string }) {
  const today = useToday();
  const k = (kind in SHEET_HE ? kind : 'trainingScript') as Kind;
  const existing = useLive(async () => (id ? ((await db.worksheets.get(id)) ?? null) : null), [id]);
  if (existing === undefined) return null;
  return (
    <Page title={SHEET_HE[k]} kicker="דף עבודה · מיינדסט" backTo="/mind/sheets" sub2>
      <WorksheetForm kind={k} gameId={null} date={existing?.date ?? today} existing={existing ?? undefined} onSaved={() => go('/mind/sheets')} />
    </Page>
  );
}

/** One form for all 4 worksheets (SPEC 9). Post-match analysis is attached to a game. */
export function WorksheetForm({ kind, gameId, date, existing, onSaved }: { kind: Kind; gameId: string | null; date: string; existing?: Worksheet; onSaved: () => void }) {
  const toast = useToast();
  const fields = FIELDS[kind];
  const [data, setData] = useState<Record<string, string[]>>(existing?.data ?? {});
  const setAt = (key: string, i: number, val: string) => {
    const arr = [...(data[key] ?? [])];
    arr[i] = val;
    setData({ ...data, [key]: arr });
  };
  return (
    <>
      {kind === 'postMatch' && <p className="small muted" style={{ marginTop: 0 }}>{POST_MATCH_ANALYSIS.intro}</p>}
      {kind === 'selfTalk' && (
        <div className="card">
          {SELF_TALK_STEPS.map((s) => (
            <div key={s.step} className="small" style={{ marginBottom: 6 }}>
              <b>{s.step}.</b> {s.he}
              {s.example && <div className="xs muted">דוגמה: {s.example}</div>}
            </div>
          ))}
        </div>
      )}
      {fields.map((f) => (
        <div key={f.key} className="field">
          <label>{f.he}</label>
          {Array.from({ length: f.count }, (_, i) => (
            <div key={i} className="stack" style={{ marginBottom: 6 }}>
              <textarea className="input" rows={2} placeholder={f.count > 1 ? `${i + 1}` : ''} value={data[f.key]?.[f.withWhy ? i * 2 : i] ?? ''} onChange={(e) => setAt(f.key, f.withWhy ? i * 2 : i, e.target.value)} />
              {f.withWhy && <input className="input" placeholder="למה?" value={data[f.key]?.[i * 2 + 1] ?? ''} onChange={(e) => setAt(f.key, i * 2 + 1, e.target.value)} />}
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        className="btn block"
        disabled={!Object.values(data).flat().some((x) => x?.trim())}
        onClick={async () => {
          const t = now();
          await db.worksheets.put({ id: existing?.id ?? uid(), createdAt: existing?.createdAt ?? t, updatedAt: t, date, kind, gameId: existing?.gameId ?? gameId, data });
          toast('נשמר');
          onSaved();
        }}
      >
        שמור
      </button>
      {existing && (
        <div className="row mt">
          <ConfirmButton label="מחק" confirm="למחוק?" onConfirm={() => void db.worksheets.delete(existing.id).then(onSaved)} />
        </div>
      )}
    </>
  );
}
