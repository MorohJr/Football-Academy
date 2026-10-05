import { useState } from 'react';
import { db } from '../../db/db';
import { addDaysISO, diffDays, weekday, weekStart } from '../../domain/dates';
import type { Game } from '../../domain/schemas';
import { DEFAULT_CALENDAR, PROGRAMME_HE, PROGRAMME_WEEKS, yearBlocks, type SeasonBlock } from '../../domain/season';
import type { ProgrammeId } from '../../content/types';
import { updateSettings } from '../../services/entity';
import { changeGameDay, gamesAround, planWith, pushCoreContext, resolveItems } from '../../services/plan';
import { logSession } from '../../services/sessions';
import { ConfirmButton, DAYS_HE, fmtDate, fmtDateFull, HRow, Modal, NumInput, Page, Seg, useToast } from '../components/common';
import { FinishModal } from '../components/forms';
import { Icon } from '../components/Icon';
import { useLive, useSettings, useToday } from '../hooks';
import { categoryColor, LOCATION_HE } from '../labels';
import { go } from '../router';

export function WeekScreen() {
  const today = useToday();
  const s = useSettings();
  const [offset, setOffset] = useState(0);
  const [moving, setMoving] = useState<Game | null>(null);
  const toast = useToast();
  const ws = addDaysISO(weekStart(today), offset * 7);
  const data = useLive(async () => {
    if (!s) return null;
    const games = await gamesAround(ws);
    const pc = await pushCoreContext(today);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDaysISO(ws, i);
      const plan = planWith(d, s, games);
      const items = resolveItems(plan, pc);
      const logs = await db.sessions.where('date').equals(d).toArray();
      const game = games.find((g) => g.date === d && g.status !== 'cancelled');
      days.push({ d, plan, items, logs, game });
    }
    const weekGames = games.filter((g) => g.defaultDate >= addDaysISO(ws, -6) && g.defaultDate <= addDaysISO(ws, 13));
    return { days, weekGames };
  }, [s, ws, today]);
  if (!s || !data) return null;
  const first = data.days[0]!.plan;
  return (
    <Page title={offset === 0 ? 'השבוע' : `שבוע ${fmtDate(ws)}`} kicker={`${PROGRAMME_HE[first.period.programme]} · ${first.label}`} sub={`${fmtDate(ws)} – ${fmtDate(addDaysISO(ws, 6))}`}>
      <div className="row between mb">
        <button type="button" className="btn ghost sm" onClick={() => setOffset(offset - 1)}>
          <Icon name="chevR" size="sm" /> קודם
        </button>
        {offset !== 0 && (
          <button type="button" className="btn ghost sm" onClick={() => setOffset(0)}>
            השבוע
          </button>
        )}
        <button type="button" className="btn ghost sm" onClick={() => setOffset(offset + 1)}>
          הבא <Icon name="chev" size="sm" />
        </button>
      </div>
      {data.days.map(({ d, plan, items, logs, game }) => {
        const isToday = d === today;
        const doneIds = new Set(logs.map((l) => l.workoutId));
        return (
          <div key={d} className={`card ${isToday ? 'white' : ''}`} style={isToday ? { borderColor: 'var(--g1)', borderWidth: 2 } : undefined}>
            <div className="ch tap" onClick={() => go(`/day/${d}`)}>
              {DAYS_HE[weekday(d)]} {fmtDate(d)} {isToday ? '· היום' : ''}
              <span>{plan.rest && !game ? 'מנוחה' : plan.label}</span>
            </div>
            {game && (
              <div className="row mb">
                <span>⚽</span>
                <span className="grow small b">
                  משחק <span className="ltr">{game.time}</span>
                  {game.date !== game.defaultDate ? ` · הוזז מ${DAYS_HE[weekday(game.defaultDate)]}` : ''}
                </span>
                <button type="button" className="btn sec sm" onClick={() => setMoving(game)}>
                  הזז / בטל
                </button>
              </div>
            )}
            {plan.replaced?.length ? <div className="xs muted mb">המשחק מחליף היום: {plan.replaced.length} אימונים (R-GAM-2)</div> : null}
            {items
              .filter((i) => i.workout)
              .map((it, i) => (
                <div key={i} className={`wrow tap ${doneIds.has(it.workout!.id) ? 'done' : ''}`} style={{ ['--c' as string]: categoryColor(it.workout!.category), background: '#fff' }} onClick={() => go(`/w/${it.workout!.id}`)}>
                  <div className="step">{doneIds.has(it.workout!.id) ? '✓' : i + 1}</div>
                  <div className="grow">
                    <div className="ttl">{it.workout!.subtitle?.split(' · ')[0] ?? it.workout!.title}</div>
                    <div className="meta">
                      {it.workout!.title} · {LOCATION_HE[it.workout!.location]}
                    </div>
                  </div>
                  {it.item.timing && <div className="when">{it.item.timing}</div>}
                </div>
              ))}
          </div>
        );
      })}
      {data.weekGames
        .filter((g) => g.status === 'cancelled' && g.defaultDate >= ws && g.defaultDate <= addDaysISO(ws, 6))
        .map((g) => (
          <div key={g.id} className="card warn row">
            <span className="grow small">המשחק של {fmtDate(g.defaultDate)} בוטל</span>
            <button type="button" className="btn sm" onClick={() => void db.games.update(g.id, { status: 'planned', date: g.defaultDate, updatedAt: new Date().toISOString() })}>
              החזר
            </button>
          </div>
        ))}
      <button type="button" className="btn sec block mt" onClick={() => go('/season')}>
        לוח העונה
      </button>
      {moving && (
        <Modal open onClose={() => setMoving(null)} title="הזזת המשחק">
          <p className="small" style={{ marginTop: 0 }}>
            המשחק מחליף את האימון שהיה מתוכנן ביום החדש (R-GAM-2). האימון לא עובר ליום אחר.
          </p>
          <div className="stack">
            {Array.from({ length: 7 }, (_, i) => addDaysISO(moving.defaultDate, i - 6)).map((d) => (
              <button
                key={d}
                type="button"
                className={`btn ${d === moving.date ? '' : 'sec'}`}
                onClick={async () => {
                  await db.games.update(moving.id, { date: d, status: moving.status === 'cancelled' ? 'planned' : moving.status, updatedAt: new Date().toISOString() });
                  setMoving(null);
                  toast('המשחק הוזז');
                }}
              >
                {DAYS_HE[weekday(d)]} {fmtDate(d)} {d === moving.defaultDate ? '(היום הקבוע)' : ''}
              </button>
            ))}
            <button
              type="button"
              className="btn danger"
              onClick={async () => {
                await db.games.update(moving.id, { status: 'cancelled', date: moving.defaultDate, updatedAt: new Date().toISOString() });
                setMoving(null);
                toast('המשחק בוטל השבוע');
              }}
            >
              אין משחק השבוע
            </button>
          </div>
        </Modal>
      )}
    </Page>
  );
}

export function DayScreen({ date }: { date: string }) {
  const s = useSettings();
  const toast = useToast();
  const [other, setOther] = useState(false);
  const [otherTitle, setOtherTitle] = useState('');
  const data = useLive(async () => {
    if (!s) return null;
    const games = await gamesAround(date);
    const plan = planWith(date, s, games);
    const items = resolveItems(plan, await pushCoreContext(date));
    const logs = await db.sessions.where('date').equals(date).toArray();
    return { plan, items, logs };
  }, [s, date]);
  if (!s || !data) return null;
  return (
    <Page title={`${DAYS_HE[weekday(date)]} ${fmtDateFull(date)}`} kicker={`${PROGRAMME_HE[data.plan.period.programme]} · ${data.plan.label}`} backTo="/week" sub2>
      <HRow title="מה מתוכנן" />
      {data.items.map((it, i) =>
        it.workout ? (
          <div key={i} className="wrow tap" style={{ ['--c' as string]: categoryColor(it.workout.category) }} onClick={() => go(`/w/${it.workout!.id}`)}>
            <div className="step">{i + 1}</div>
            <div className="grow">
              <div className="ttl">{it.workout.subtitle?.split(' · ')[0] ?? it.workout.title}</div>
              <div className="meta">{it.workout.title}</div>
            </div>
            {it.item.timing && <div className="when">{it.item.timing}</div>}
          </div>
        ) : (
          <div key={i} className="card mint">⚽ משחק</div>
        ),
      )}
      {!data.items.length && <div className="note">מנוחה.</div>}
      {data.plan.replaced?.length ? (
        <div className="note mt">
          המשחק החליף: {data.plan.replaced.map((r) => r.workoutId).join(', ')}
        </div>
      ) : null}
      <HRow title="מה נרשם" meta={`${data.logs.reduce((a, l) => a + l.minutes, 0)} דק'`} />
      {data.logs.map((l) => (
        <div key={l.id} className="list-row">
          <div className="grow">
            <div className="small b">{l.title}</div>
            <div className="xs muted">
              {l.minutes} דק' · RPE {l.rpe ?? '—'} · {l.rpe != null ? Math.round(l.minutes * l.rpe) : 0} יחידות
            </div>
          </div>
          <ConfirmButton label="מחק" confirm="למחוק?" onConfirm={() => void db.sessions.delete(l.id)} />
        </div>
      ))}
      {!data.logs.length && <div className="empty">עוד לא נרשם כלום ביום הזה.</div>}
      <div className="field mt">
        <label>פעילות אחרת (למשל משחק נוסף או ריצה)</label>
        <input className="input" value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} placeholder="שם הפעילות" />
      </div>
      <button type="button" className="btn sec block" disabled={!otherTitle} onClick={() => setOther(true)}>
        רשום פעילות
      </button>
      {other && (
        <FinishModal
          open
          onClose={() => setOther(false)}
          defaultMinutes={45}
          title={otherTitle}
          onSave={async (minutes, rpe) => {
            await logSession({ date, workoutId: null, title: otherTitle, minutes, rpe, kind: 'other' });
            setOther(false);
            setOtherTitle('');
            toast('נרשם ✓');
          }}
        />
      )}
    </Page>
  );
}

const PROGS: ProgrammeId[] = ['stamina', 'speed', 'inseason', 'rest', 'preseason', 'bodyweight'];
const PROG_INFO: Record<ProgrammeId, string> = {
  stamina: 'סטמינה לכדורגל: ספרינטים חוזרים ומנוחות קצרות. 4 אימונים בשבוע.',
  speed: 'מהירות: האצה, שינוי כיוון ובלימה. 3 ימים בשבוע, חדר כושר ומגרש.',
  inseason: 'עונה: לשמור על הכול ולהשתפר. עליון, תחתון, ליבה, מהירות, סטמינה ומניעת פציעות סביב המשחק.',
  rest: 'פגרה: מנוחה. שבועיים אחרונים: תחזוקה קלה של שכיבות וליבה.',
  preseason: 'פרה-עונה: 70 יום עם עלייה הדרגתית. בדיקות בימים 1, 36 ו-70.',
  bodyweight: 'משקל גוף ושריפת שומן + יוגה. 4 אימונים בשבוע, בלי ציוד.',
};

export function SeasonScreen() {
  const today = useToday();
  const s = useSettings();
  const [edit, setEdit] = useState<SeasonBlock[] | null>(null);
  if (!s) return null;
  const blocks = yearBlocks(today, s.calendar);
  const cal = edit ?? s.calendar;
  return (
    <Page title="לוח העונה" kicker="התקופות של השנה" sub="מניעת פציעות, תזונה ומיינדסט: כל השנה" backTo="/week">
      {blocks.map((b, i) => {
        const now = today >= b.start && today <= b.end;
        return (
          <div key={i} className={`card ${now ? 'white' : ''}`} style={now ? { borderColor: 'var(--g1)', borderWidth: 2 } : undefined}>
            <div className="ch tap" onClick={() => go(`/programs/${b.programme}`)}>
              {PROGRAMME_HE[b.programme]} {now ? '· אתה כאן' : ''}
              <span>
                {fmtDate(b.start)} – {fmtDate(b.end)} · {b.lengthDays} ימים{PROGRAMME_WEEKS[b.programme] ? ` · תוכנית ${PROGRAMME_WEEKS[b.programme]} שבועות` : ''}
              </span>
            </div>
            <div className="small">{PROG_INFO[b.programme]}</div>
            {now && <div className="xs muted mt">עוד {diffDays(b.end, today) + 1} ימים בתקופה</div>}
          </div>
        );
      })}
      <HRow title="עריכת הלוח" meta="ברירת המחדל: הדוגמה של Matchfit" />
      {!edit ? (
        <button type="button" className="btn sec block" onClick={() => setEdit(s.calendar.map((b) => ({ ...b })))}>
          ערוך תאריכים
        </button>
      ) : (
        <>
          {cal.map((b, i) => (
            <div key={i} className="card">
              <div className="field">
                <select className="input" value={b.programme} onChange={(e) => setEdit(cal.map((x, j) => (j === i ? { ...x, programme: e.target.value as ProgrammeId } : x)))}>
                  {PROGS.map((p) => (
                    <option key={p} value={p}>
                      {PROGRAMME_HE[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row">
                <span className="small">מתחיל ב-</span>
                <div style={{ width: 70 }}>
                  <NumInput value={b.startDay} onChange={(v) => setEdit(cal.map((x, j) => (j === i ? { ...x, startDay: Math.min(28, Math.max(1, v ?? 1)) } : x)))} />
                </div>
                <span>/</span>
                <div style={{ width: 70 }}>
                  <NumInput value={b.startMonth} onChange={(v) => setEdit(cal.map((x, j) => (j === i ? { ...x, startMonth: Math.min(12, Math.max(1, v ?? 1)) } : x)))} />
                </div>
                <button type="button" className="btn ghost sm" onClick={() => setEdit(cal.filter((_, j) => j !== i))}>
                  הסר
                </button>
              </div>
            </div>
          ))}
          <div className="row wrap">
            <button type="button" className="btn ghost sm" onClick={() => setEdit([...cal, { programme: 'inseason', startMonth: 1, startDay: 1 }])}>
              + תקופה
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setEdit(DEFAULT_CALENDAR.map((b) => ({ ...b })))}>
              ברירת מחדל
            </button>
            <button
              type="button"
              className="btn sm"
              disabled={cal.length < 2}
              onClick={async () => {
                await updateSettings({ calendar: [...cal].sort((a, b) => a.startMonth * 40 + a.startDay - (b.startMonth * 40 + b.startDay)) });
                setEdit(null);
              }}
            >
              שמור
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setEdit(null)}>
              ביטול
            </button>
          </div>
        </>
      )}
      <HRow title="יום המשחק הקבוע" />
      <Seg
        value={String(s.gameWeekday)}
        options={DAYS_HE.map((d, i) => ({ v: String(i), label: d.slice(0, 3) }))}
        onChange={(v) => void changeGameDay(today, Number(v))}
      />
      <p className="xs muted">אם משנים את היום, השבוע של כל התוכניות מתיישר מחדש סביבו (R-GAM-4).</p>
    </Page>
  );
}
