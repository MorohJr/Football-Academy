import { useState } from 'react';
import { db } from '../../db/db';
import type { Workout } from '../../content/types';
import { addDaysISO, diffDays, weekday, weekStart } from '../../domain/dates';
import { PROGRAMME_HE, PROGRAMME_SHORT, yearBlocks, type DayPlanResult } from '../../domain/season';
import { BODY_FAT_TARGET } from '../../domain/body';
import { gamesAround, lastPlayedGame, nextGame, planWith, pushCoreContext, resolveItems, type ResolvedItem } from '../../services/plan';
import { bodySummary, loadStatus, pomsOf, sleepHours } from '../../services/queries';
import { logSession } from '../../services/sessions';
import { CHALK, DAYS_HE, DAYS_SHORT, fmtDate, HRow, useToast, VideoLinks } from '../components/common';
import { CheckinModal, FinishModal } from '../components/forms';
import { Icon } from '../components/Icon';
import { useLive, useSettings, useToday } from '../hooks';
import { CATEGORY_HE, categoryColor, LOCATION_HE } from '../labels';
import { go } from '../router';
import { AREA_HE, rehabFor } from './body-areas';

const PROG_COLOR: Record<string, string> = { inseason: '#1f7a3a', stamina: '#2a6fb5', speed: '#145a29', rest: '#9aa59d', preseason: '#145a29', bodyweight: '#7a4bb3' };

function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
}

export function TodayScreen() {
  const today = useToday();
  const s = useSettings();
  const toast = useToast();
  const [checkin, setCheckin] = useState(false);
  const [finish, setFinish] = useState<ResolvedItem | null>(null);

  const data = useLive(async () => {
    if (!s) return null;
    const games = await gamesAround(today);
    const plan = planWith(today, s, games);
    const pc = await pushCoreContext(today);
    const items = resolveItems(plan, pc);
    const sessions = await db.sessions.where('date').equals(today).toArray();
    const week: { date: string; plan: DayPlanResult; done: boolean }[] = [];
    const ws = weekStart(today);
    for (let i = 0; i < 7; i++) {
      const d = addDaysISO(ws, i);
      const done = (await db.sessions.where('date').equals(d).count()) > 0;
      week.push({ date: d, plan: planWith(d, s, games), done });
    }
    const yesterday = planWith(addDaysISO(today, -1), s, games);
    const checkinToday = await db.checkins.where('date').equals(today).first();
    const load = await loadStatus(today);
    const ng = await nextGame(today);
    const lg = await lastPlayedGame(addDaysISO(today, -1));
    const lgAnalysis = lg ? await db.worksheets.where('gameId').equals(lg.id).filter((w) => w.kind === 'postMatch').count() : 0;
    const season = await db.games.filter((g) => g.status === 'played').toArray();
    const pitches = await db.pitches.toArray();
    const body = await bodySummary(today);
    const niggles = (await db.niggles.toArray()).filter((n) => !n.closed);
    const review = weekday(today) === 0 ? await db.reviews.where('week').equals(today).first() : null;
    return { plan, items, sessions, week, yesterday, checkinToday, load, ng, lg, lgAnalysis, season, pitches, body, niggles, pc, review };
  }, [s, today]);

  if (!s || !data) return null;
  const { plan, items, sessions, week, checkinToday, load, ng, lg, season, pitches, body, niggles, pc } = data;
  const doneIds = new Set(sessions.map((x) => x.workoutId));
  const trainItems = items.filter((i) => i.item.kind !== 'game');
  const todo = trainItems.filter((i) => !doneIds.has(i.workout?.id ?? ''));
  const done = trainItems.filter((i) => doneIds.has(i.workout?.id ?? ''));
  const ordered = [...todo, ...done];
  const totalMin = trainItems.reduce((a, i) => a + (i.workout?.durationMin ?? 0), 0);
  const pitchName = (id: string | null) => pitches.find((p) => p.id === id)?.name;
  const gameToday = items.some((i) => i.item.kind === 'game');
  const heavyYesterday = gameToday && data.yesterday.items.some((i) => /in-lower|pre-max|pre-se|pre-ss/.test(i.workoutId ?? ''));
  const blocks = yearBlocks(today, s.calendar);
  const yearDays = blocks.reduce((a, b) => a + b.lengthDays, 0);

  const saveFinish = async (minutes: number, rpe: number | null) => {
    if (!finish?.workout) return;
    const id = await logSession({ date: today, workoutId: finish.workout.id, title: finish.workout.title, minutes, rpe });
    setFinish(null);
    toast({ text: 'נרשם ✓', undo: () => void db.sessions.delete(id) });
  };

  return (
    <div className="screen">
      <header className="grass ghead">
        {CHALK}
        <div className="k">
          {PROGRAMME_HE[plan.period.programme]} · {plan.label} · {DAYS_HE[weekday(today)]} {fmtDate(today)}
        </div>
        <h1>{greet()}, {s.name}</h1>
        <div className="acts">
          <button type="button" aria-label="הגדרות" onClick={() => go('/settings')}>
            <Icon name="settings" size="sm" />
          </button>
        </div>
      </header>
      <main className="sheet">
        {data.review === undefined && (
          <div className="card mint tap" onClick={() => go('/review')}>
            <div className="row">
              <Icon name="week" />
              <span className="grow b">סיכום שבועי · 2 דקות</span>
              <Icon name="chev" size="sm" />
            </div>
          </div>
        )}

        {ng && (
          <div className="card mint tap" onClick={() => go(`/game/${ng.id}`)}>
            <div className="row between">
              <div>
                ⚽ <b style={{ color: 'var(--g2)' }}>{ng.date === today ? 'היום' : DAYS_HE[weekday(ng.date)]} <span className="ltr">{ng.time}</span></b>
                {pitchName(ng.pitchId) ? ` · ${pitchName(ng.pitchId)}` : ''}
              </div>
              <b style={{ color: 'var(--g2)' }}>{ng.date === today ? 'משחק היום' : diffDays(ng.date, today) === 1 ? 'מחר' : `עוד ${diffDays(ng.date, today)} ימים`}</b>
            </div>
            {diffDays(ng.date, today) <= 1 && (
              <button type="button" className="btn sm mt" onClick={(e) => { e.stopPropagation(); go(`/gamemode/${ng.id}`); }}>
                מצב משחק: רשימת הכנה
              </button>
            )}
          </div>
        )}

        {heavyYesterday && <div className="warnbox">אתמול היו רגליים כבדות: חימום ארוך ושגרת לפני משחק מלאה (R-GAM-5).</div>}
        {load.acwr.zone === 'high' && (
          <div className="warnbox">
            עומס חריג: השבוע {load.acwr.acute} יחידות, פי {load.acwr.ratio} מהממוצע של 4 השבועות הקודמים (מעל 1.4 הסיכון לפציעה עולה). אפשר להוריד סטים/חזרות/משקל, או להחליף אימון במניעת פציעות או התאוששות פעילה.
            {load.pomsDrop && ' גם מצב הבוקר ירד השבוע: כדאי לתכנן מנוחה.'}
          </div>
        )}

        <HRow title={gameToday ? 'היום · יום משחק' : plan.rest ? 'היום · מנוחה' : `היום · ${trainItems.length} אימונים`} meta={trainItems.length ? `כ-${totalMin} דק' · ${done.length} מתוך ${trainItems.length}` : plan.transition ? plan.label : undefined} />

        {gameToday && (
          <div className="next" style={{ ['--c' as string]: 'var(--g1)' }}>
            <div className="top">
              <div className="step">⚽</div>
              <div>
                <div className="cat">משחק · {ng?.time}</div>
                <div className="ttl">המשחק השבועי</div>
                {plan.replaced?.length ? <div className="en">במקום: {plan.replaced.length} אימונים של היום (R-GAM-2)</div> : null}
              </div>
            </div>
            <div className="btns">
              <button type="button" className="btn" onClick={() => ng && go(`/gamemode/${ng.id}`)}>מצב משחק</button>
              <button type="button" className="btn sec" onClick={() => ng && go(`/game/${ng.id}`)}>רישום המשחק</button>
            </div>
          </div>
        )}

        {ordered.map((it, idx) => {
          const w = it.workout;
          if (!w) return null;
          const isDone = doneIds.has(w.id);
          const n = trainItems.indexOf(it) + 1;
          const c = categoryColor(w.category);
          if (idx === 0 && !isDone) return <NextCard key={it.key + idx} w={w} n={n} timing={it.item.timing} color={c} onFinish={() => setFinish(it)} />;
          return (
            <div key={it.key + idx} className={`wrow tap ${isDone ? 'done' : ''}`} style={{ ['--c' as string]: c }} onClick={() => go(`/w/${w.id}`)}>
              <div className="step">{isDone ? '✓' : n}</div>
              <div className="grow">
                <div className="ttl">{w.subtitle?.split(' · ')[0] ?? w.title}</div>
                <div className="meta">
                  {w.title} {w.durationMin ? `· ${w.durationMin} דק'` : ''} · {LOCATION_HE[w.location]}
                </div>
              </div>
              <div className="when">{isDone ? 'בוצע' : it.item.timing ?? ''}</div>
            </div>
          );
        })}
        {!trainItems.length && !gameToday && (
          <div className="note">{plan.transition ? `${plan.label}. אפשר התאוששות פעילה, רולר ומתיחות.` : 'יום מנוחה. הכושר משתפר בזמן ההתאוששות: אוכל טוב, שתייה ושינה.'}</div>
        )}
        {trainItems.some((i) => i.item.kind === 'pushcore') && !pc.tested && (
          <div className="warnbox tap" onClick={() => go('/tests')}>
            שכיבות הסמיכה מחושבות לפי 10 חזרות כי עוד אין בדיקה. עשה בדיקת שכיבות סמיכה עד כשל כדי לקבל רמה ומינון נכונים.
          </div>
        )}

        <div className="tiles mt">
          <button type="button" className="tile" style={{ textAlign: 'start' }} onClick={() => setCheckin(true)}>
            <b className="num">{checkinToday ? `${pomsOf(checkinToday)}/25` : '—'}</b>
            <span>{checkinToday ? 'מצב בוקר' : 'צ\'ק-אין בוקר'}</span>
          </button>
          <button type="button" className="tile l" style={{ textAlign: 'start' }} onClick={() => setCheckin(true)}>
            <b className="num ltr" style={{ textAlign: 'start' }}>{checkinToday ? sleepHours(checkinToday) ?? '—' : '—'}</b>
            <span>שינה {checkinToday?.lightsOut ? `(${checkinToday.lightsOut})` : ''}</span>
          </button>
          <button type="button" className={`tile ${load.acwr.zone === 'high' ? 'r' : 'y'}`} style={{ textAlign: 'start' }} onClick={() => go('/track')}>
            <b className="num">{load.acwr.ratio ?? load.weekUnits}</b>
            <span>{load.acwr.ratio != null ? 'עומס (ACWR)' : 'יחידות השבוע'}</span>
          </button>
        </div>

        {lg && (
          <div className="card mt tap" onClick={() => go('/games')}>
            <div className="ch">
              המשחק האחרון <span>{DAYS_HE[weekday(lg.date)]} {fmtDate(lg.date)}{pitchName(lg.pitchId) ? ` · ${pitchName(lg.pitchId)}` : ''} ›</span>
            </div>
            <div className="tiles">
              {[[lg.minutes ?? '—', 'דקות'], [lg.goals, 'שערים'], [lg.assists, 'בישולים'], [lg.rating ?? '—', 'ציון']].map(([v, l]) => (
                <div key={l} className="tile w center">
                  <b>{v}</b>
                  <span className="muted">{l}</span>
                </div>
              ))}
            </div>
            <div className="kv mt">
              <span>העונה</span>
              <span>
                {season.length} משחקים · {season.reduce((a, g) => a + g.goals, 0)} שערים · {season.reduce((a, g) => a + g.assists, 0)} בישולים
                {season.some((g) => g.rating) ? ` · ציון ${(season.filter((g) => g.rating).reduce((a, g) => a + g.rating!, 0) / season.filter((g) => g.rating).length).toFixed(1)}` : ''}
              </span>
            </div>
            {data.lgAnalysis === 0 && (
              <button type="button" className="btn block sm mt" onClick={(e) => { e.stopPropagation(); go(`/analysis/${lg.id}`); }}>
                מלא ניתוח אחרי משחק
              </button>
            )}
          </div>
        )}

        <div className="card tap" onClick={() => go('/body')}>
          <div className="ch">
            גוף ועקיצות <span>{body.lastWeighIn ? `שקילה אחרונה ${fmtDate(body.lastWeighIn.date)}` : 'אין שקילות עדיין'}</span>
          </div>
          <div className="row">
            <div>
              <b style={{ fontSize: 20, color: 'var(--g2)' }}>{body.weight ?? '—'}</b> <span className="xs">ק"ג</span>
              {body.monthDelta != null && <div className="xs muted">{body.monthDelta < 0 ? '▼' : '▲'} {Math.abs(body.monthDelta)} בחודש</div>}
            </div>
            <Spark points={body.weighIns.slice(-14).map((w) => w.weight)} />
            <div className="center">
              <b style={{ fontSize: 18, color: 'var(--g2)' }}>{body.bodyFat != null ? `${body.bodyFat}%` : '—'}</b>
              <div className="xs muted">שומן · יעד {BODY_FAT_TARGET[0]}-{BODY_FAT_TARGET[1]}</div>
            </div>
          </div>
          {body.lastMeasure && (
            <div className="kv">
              <span>מדידה אחרונה ({fmtDate(body.lastMeasure.date)})</span>
              <span>
                {body.lastMeasure.sites.waist ? `מותניים ${body.lastMeasure.sites.waist}` : ''} {body.lastMeasure.sites.neck ? `· צוואר ${body.lastMeasure.sites.neck}` : ''}
              </span>
            </div>
          )}
          {niggles.map((n) => {
            const vids = rehabFor(n.area);
            return (
              <div key={n.id} className="row mt" style={{ background: '#fff', borderRadius: 12, padding: 8 }} onClick={(e) => e.stopPropagation()}>
                <Icon name="bandage" />
                <div className="grow">
                  <div className="b small">
                    עקיצה: {AREA_HE[n.area] ?? n.area} {n.side === 'L' ? 'שמאל' : n.side === 'R' ? 'ימין' : ''} · {n.intensity}/10
                  </div>
                  <div className="xs muted">{diffDays(today, n.start)} ימים{(n.intensity >= 5 || diffDays(today, n.start) > 3) && ' · כדאי פיזיותרפיסט'}</div>
                  <VideoLinks videos={vids} compact />
                </div>
              </div>
            );
          })}
        </div>

        <div className="wk">
          {week.map((d) => {
            const isToday = d.date === today;
            const game = d.plan.items.some((i) => i.kind === 'game');
            const first = d.plan.items.find((i) => i.kind === 'session');
            const lbl = game ? '⚽' : d.plan.rest ? '–' : (first?.workoutId ?? '').replace(/^(in|pre|spd|sta)-/, '').slice(0, 2).toUpperCase() || '•';
            return (
              <div key={d.date} className={isToday ? 'now' : game ? 'gm' : d.done ? 'done' : ''} onClick={() => go(`/day/${d.date}`)}>
                <span>{DAYS_SHORT[weekday(d.date)]}</span>
                <b>{d.done && !isToday ? '✓' : lbl}</b>
              </div>
            );
          })}
        </div>

        <div className="season mt" onClick={() => go('/season')}>
          {blocks.map((b, i) => (
            <div key={i} style={{ flex: b.lengthDays / yearDays, background: PROG_COLOR[b.programme] }}>
              {PROGRAMME_SHORT[b.programme]}
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', height: 18 }}>
          <div style={{ position: 'absolute', insetInlineStart: `${Math.max(0, Math.min(92, (diffDays(today, blocks[0]!.start) / yearDays) * 100))}%`, top: 2, fontSize: 10, color: 'var(--g2)', fontWeight: 700 }}>▲ אתה כאן</div>
        </div>
      </main>
      <CheckinModal key={checkinToday?.id ?? 'new'} open={checkin} onClose={() => setCheckin(false)} date={today} existing={checkinToday} />
      {finish?.workout && <FinishModal open onClose={() => setFinish(null)} onSave={saveFinish} defaultMinutes={finish.workout.durationMin ?? 30} title={finish.workout.subtitle?.split(' · ')[0] ?? finish.workout.title} />}
    </div>
  );
}

function NextCard({ w, n, timing, color, onFinish }: { w: Workout; n: number; timing?: string; color: string; onFinish: () => void }) {
  const exs = w.blocks.flatMap((b) => b.exercises.map((e) => ({ e, b }))).slice(0, 3);
  const firstBlock = w.blocks.find((b) => b.exercises.length);
  const ex0 = firstBlock?.exercises[0];
  return (
    <div className="next" style={{ ['--c' as string]: color }}>
      <div className="top tap" onClick={() => go(`/w/${w.id}`)}>
        <div className="step">{n}</div>
        <div className="grow">
          <div className="cat">
            {CATEGORY_HE[w.category]}
            {timing ? ` · ${timing}` : ''}
          </div>
          <div className="ttl">{w.subtitle?.split(' · ')[0] ?? w.title}</div>
          <div className="en">{w.title}</div>
        </div>
      </div>
      <div className="chips">
        {w.durationMin ? <span className="chip">⏱ {w.durationMin} דק'</span> : null}
        <span className="chip">📍 {LOCATION_HE[w.location]}</span>
        {ex0?.sets && <span className="chip">{w.blocks.reduce((a, b) => a + b.exercises.length, 0)} תרגילים · {ex0.reps}×{ex0.sets}</span>}
        {firstBlock?.timeOn && <span className="chip">{firstBlock.timeOn} עבודה / {firstBlock.timeOff} מנוחה</span>}
        {ex0?.rest && <span className="chip">מנוחה {ex0.rest}</span>}
      </div>
      {exs.length > 0 && (
        <div className="exl">
          {exs.map(({ e }, i) => (
            <div key={i}>
              <span>{e.name}</span>
              <span>{e.sets && e.reps ? `${e.sets} × ${e.reps}` : e.reps ?? ''}</span>
            </div>
          ))}
        </div>
      )}
      <div className="btns">
        <button type="button" className="btn" onClick={() => go(`/run/${w.id}`)}>
          ▶ התחל אימון
        </button>
        <button type="button" className="btn sec" onClick={() => go(`/w/${w.id}`)}>
          פרטים והסבר
        </button>
        <button type="button" className="btn sec" onClick={onFinish}>
          ✓ סיימתי
        </button>
      </div>
    </div>
  );
}

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="grow" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pts = points.map((p, i) => `${(i / (points.length - 1)) * 120},${36 - ((p - min) / span) * 30}`).join(' ');
  return (
    <svg viewBox="0 0 120 40" className="grow" style={{ height: 38 }} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#1f7a3a" strokeWidth="2.5" />
    </svg>
  );
}
