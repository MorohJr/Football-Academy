import { useState } from 'react';
import { db } from '../../db/db';
import { addDaysISO, weekStart } from '../../domain/dates';
import { plannedCount } from '../../domain/season';
import type { Game, Pitch, WeekReview } from '../../domain/schemas';
import { planWith } from '../../services/plan';
import { loadStatus, pomsOf, sleepHours } from '../../services/queries';
import { DAYS_HE, fmtDate, HRow, Page, useToast } from '../components/common';
import { useLive, useSettings, useToday } from '../hooks';
import { go } from '../router';

interface ReviewData {
  planned: number;
  done: number;
  units: number;
  acwr: Awaited<ReturnType<typeof loadStatus>>['acwr'];
  poms: number | null;
  sleep: number | null;
  lastGame: Game | undefined;
  thisGame: Game | undefined;
  pitch: Pitch | undefined;
  review: WeekReview | undefined;
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** R-REV (SPEC 14.10): Sunday review, 2-3 minutes. */
export function ReviewScreen() {
  const today = useToday();
  const s = useSettings();
  const ws = weekStart(today);
  const data = useLive(async (): Promise<ReviewData | null> => {
    if (!s) return null;
    const prev = addDaysISO(ws, -7);
    const prevEnd = addDaysISO(ws, -1);
    const games = await db.games.toArray();
    let planned = 0;
    for (let i = 0; i < 7; i++) planned += plannedCount(planWith(addDaysISO(prev, i), s, games));
    const sessions = await db.sessions.where('date').between(prev, prevEnd, true, true).toArray();
    const checkins = await db.checkins.where('date').between(prev, prevEnd, true, true).toArray();
    const sleeps = checkins.map(sleepHours).filter((h): h is number => h != null);
    const load = await loadStatus(prevEnd);
    const lastGame = games.filter((g) => g.date >= prev && g.date <= prevEnd && g.status === 'played')[0];
    const thisGame = games.filter((g) => g.date >= ws && g.date <= addDaysISO(ws, 6) && g.status !== 'cancelled')[0];
    const pitch = thisGame?.pitchId ? await db.pitches.get(thisGame.pitchId) : undefined;
    const review = await db.reviews.where('week').equals(ws).first();
    return {
      planned,
      done: sessions.filter((x) => x.kind === 'workout').length,
      units: load.weekUnits,
      acwr: load.acwr,
      poms: checkins.length ? Math.round((checkins.reduce((a, c) => a + pomsOf(c), 0) / checkins.length) * 10) / 10 : null,
      sleep: sleeps.length ? Math.round((sleeps.reduce((a, b) => a + b, 0) / sleeps.length) * 10) / 10 : null,
      lastGame,
      thisGame,
      pitch,
      review,
    };
  }, [s, ws]);
  if (!s || !data) return null;
  return <ReviewForm key={data.review?.id ?? 'new'} ws={ws} data={data} />;
}

function ReviewForm({ ws, data }: { ws: string; data: ReviewData }) {
  const toast = useToast();
  const [goals, setGoals] = useState<WeekReview['goals']>(data.review?.goals.length ? data.review.goals : [{ text: '', done: false }]);
  const tile = (v: string | number | null, label: string, cls = '') => (
    <div className={`tile ${cls}`}>
      <b>{v ?? '—'}</b>
      <span>{label}</span>
    </div>
  );
  const save = async () => {
    const t = new Date().toISOString();
    const clean = goals.filter((g) => g.text.trim()).slice(0, 3);
    await db.reviews.put({ id: data.review?.id ?? uid(), createdAt: data.review?.createdAt ?? t, updatedAt: t, week: ws, goals: clean, doneAt: t });
    toast('הסיכום נשמר');
    go('/');
  };
  return (
    <Page title="סיכום שבועי" kicker={`שבוע ${fmtDate(ws)}`} sub="2-3 דקות · R-REV" backTo sub2>
      <HRow title="1. השבוע שעבר" />
      <div className="tiles">
        {tile(`${data.done}/${data.planned}`, 'אימונים')}
        {tile(data.units, 'יחידות', 'l')}
        {tile(data.acwr.ratio != null ? data.acwr.ratio.toFixed(2) : null, 'עומס (ACWR)', data.acwr.zone === 'high' ? 'r' : 'l')}
      </div>
      <div className="tiles mt">
        {tile(data.poms, 'POMS ממוצע', 'w')}
        {tile(data.sleep, 'שעות שינה', data.sleep != null && data.sleep < 8 ? 'y' : 'w')}
        {tile(data.lastGame ? `${data.lastGame.minutes ?? '—'}′` : null, data.lastGame ? `${data.lastGame.goals} ש׳ · ציון ${data.lastGame.rating ?? '—'}` : 'משחק', 'w')}
      </div>
      {data.acwr.zone === 'high' && <div className="warnbox">עומס חריג: פי 1.4 ומעלה מהממוצע. השבוע: פחות סטים/חזרות/משקל, או להחליף אימון במניעת פציעות.</div>}
      <HRow title="2. השבוע הזה" />
      <div className="card tap" onClick={() => (data.thisGame ? go(`/game/${data.thisGame.id}`) : go('/week'))}>
        {data.thisGame ? (
          <div className="small">
            ⚽ משחק {DAYS_HE[new Date(data.thisGame.date + 'T12:00').getDay()]} {fmtDate(data.thisGame.date)} · <span className="ltr">{data.thisGame.time}</span>
            {data.pitch ? ` · ${data.pitch.name}` : ' · בלי מגרש'}
          </div>
        ) : (
          <div className="small">אין משחק השבוע.</div>
        )}
        <div className="xs muted">לאשר יום, שעה ומגרש, או להזיז ›</div>
      </div>
      <button type="button" className="btn sec block" onClick={() => go('/week')}>
        האימונים של השבוע
      </button>
      <HRow title="3. עד 3 מטרות לשבוע" meta="למשל: 2 × 10 דק' ברגל החלשה" />
      {goals.map((g, i) => (
        <div key={i} className="row" style={{ marginBottom: 6 }}>
          <input type="checkbox" checked={g.done} onChange={() => setGoals(goals.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />
          <input className="input grow" value={g.text} onChange={(e) => setGoals(goals.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder={`מטרה ${i + 1}`} />
        </div>
      ))}
      {goals.length < 3 && (
        <button type="button" className="btn ghost sm" onClick={() => setGoals([...goals, { text: '', done: false }])}>
          + מטרה
        </button>
      )}
      <button type="button" className="btn block mt" onClick={save}>
        סיימתי
      </button>
    </Page>
  );
}
