import { useState } from 'react';
import { db } from '../../db/db';
import { getWorkout } from '../../content';
import { DIY_DRINKS, EATING_SCHEDULES, HALF_TIME_SNACKS, POST_MATCH, PRE_MATCH_MEALS, PRE_MATCH_SNACKS, type KickoffSlot } from '../../content/nutrition';
import { MINDSET_PARTS, RELISTEN } from '../../content/mindset';
import { YOGA } from '../../content/boosters';
import { addDaysISO, diffDays, weekday } from '../../domain/dates';
import type { Game, Pitch } from '../../domain/schemas';
import { bodySummary } from '../../services/queries';
import { ConfirmButton, DAYS_HE, Empty, fmtDate, HRow, Modal, NumInput, Page, Scale, useToast, VideoLinks } from '../components/common';
import { Chart, ChartBox } from '../components/charts';
import { useLive, useToday } from '../hooks';
import { HARD_SURFACES, SURFACE_HE, SURFACE_SHOES } from '../labels';
import { go } from '../router';
import { WorksheetForm } from './MindScreens';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const now = () => new Date().toISOString();

export function GamesScreen() {
  const data = useLive(async () => {
    const games = (await db.games.toArray()).sort((a, b) => b.date.localeCompare(a.date));
    const pitches = await db.pitches.toArray();
    const sheets = await db.worksheets.where('kind').equals('postMatch').toArray();
    return { games, pitches, sheets };
  }, []);
  const today = useToday();
  if (!data) return null;
  const played = data.games.filter((g) => g.status === 'played');
  const rated = played.filter((g) => g.rating);
  const chrono = [...played].reverse();
  const pitchName = (id: string | null) => data.pitches.find((p) => p.id === id)?.name ?? 'בלי מגרש';
  const byPitch = new Map<string, Game[]>();
  for (const g of played) byPitch.set(pitchName(g.pitchId), [...(byPitch.get(pitchName(g.pitchId)) ?? []), g]);
  return (
    <Page title="המשחקים שלי" kicker="R-STA · סטטיסטיקה וניתוחים" sub={`${played.length} משחקים שנרשמו`}>
      <div className="tiles">
        <div className="tile">
          <b>{played.length}</b>
          <span>משחקים</span>
        </div>
        <div className="tile l">
          <b>{played.reduce((a, g) => a + g.goals, 0)}</b>
          <span>שערים</span>
        </div>
        <div className="tile l">
          <b>{played.reduce((a, g) => a + g.assists, 0)}</b>
          <span>בישולים</span>
        </div>
        <div className="tile y">
          <b>{rated.length ? (rated.reduce((a, g) => a + g.rating!, 0) / rated.length).toFixed(1) : '—'}</b>
          <span>ציון ממוצע</span>
        </div>
      </div>
      {chrono.length > 1 && (
        <>
          <ChartBox title="ציון לאורך זמן">
            <Chart data={chrono.map((g) => ({ d: fmtDate(g.date), rating: g.rating }))} x="d" series={[{ key: 'rating', label: 'ציון', type: 'line' }]} yDomain={[0, 10]} />
          </ChartBox>
          <ChartBox title="שערים ובישולים" legend={[{ label: 'שערים', color: '#1f7a3a' }, { label: 'בישולים', color: '#2a6fb5' }]}>
            <Chart data={chrono.map((g) => ({ d: fmtDate(g.date), goals: g.goals, assists: g.assists }))} x="d" series={[{ key: 'goals', label: 'שערים', type: 'bar' }, { key: 'assists', label: 'בישולים', type: 'bar', color: '#2a6fb5' }]} />
          </ChartBox>
          <ChartBox title="דקות ו-RPE במשחקים" legend={[{ label: 'דקות', color: '#1f7a3a' }, { label: 'RPE', color: '#7a4bb3' }]}>
            <Chart data={chrono.map((g) => ({ d: fmtDate(g.date), minutes: g.minutes, rpe: g.rpe }))} x="d" series={[{ key: 'minutes', label: 'דקות', type: 'bar' }, { key: 'rpe', label: 'RPE', type: 'line', color: '#7a4bb3', right: true }]} />
          </ChartBox>
        </>
      )}
      <HRow title="כל המשחקים" meta="ניתוח אחרי משחק" />
      {data.games
        .filter((g) => g.status !== 'cancelled')
        .map((g) => {
          const hasSheet = data.sheets.some((s) => s.gameId === g.id);
          const future = g.date > today;
          return (
            <div key={g.id} className="wrow tap" onClick={() => go(`/game/${g.id}`)}>
              <div className="grow">
                <div className="ttl">
                  {DAYS_HE[weekday(g.date)]} {fmtDate(g.date)} · {pitchName(g.pitchId)}
                </div>
                <div className="meta">{g.status === 'played' ? `${g.minutes ?? '—'}′ · ${g.goals} ש׳ · ${g.assists} ב׳ · ציון ${g.rating ?? '—'}` : future ? `מתוכנן · ${g.time}` : 'לא נרשם'}</div>
              </div>
              <div className="when" style={{ color: hasSheet ? 'var(--g2)' : future ? 'var(--muted)' : 'var(--danger)' }}>{hasSheet ? '✓ ניתוח' : future ? '' : 'חסר ניתוח'}</div>
            </div>
          );
        })}
      {!data.games.length && <Empty>עוד אין משחקים.</Empty>}
      {byPitch.size > 0 && (
        <>
          <HRow title="לפי מגרש" />
          <div className="card">
            {[...byPitch.entries()].map(([p, gs]) => (
              <div key={p} className="kv">
                <span>{p}</span>
                <span>
                  {gs.length} משחקים · {gs.reduce((a, g) => a + g.goals, 0)} ש׳ · ציון {gs.some((g) => g.rating) ? (gs.filter((g) => g.rating).reduce((a, g) => a + g.rating!, 0) / gs.filter((g) => g.rating).length).toFixed(1) : '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <button type="button" className="btn sec block mt" onClick={() => go('/pitches')}>
        המגרשים שלי
      </button>
    </Page>
  );
}

export function GameScreen({ id }: { id: string }) {
  const toast = useToast();
  const g = useLive(() => db.games.get(id), [id]);
  const pitches = useLive(() => db.pitches.toArray(), []);
  const [draft, setDraft] = useState<Game | null>(null);
  if (!g || !pitches) return null;
  const v = draft ?? g;
  const set = (patch: Partial<Game>) => setDraft({ ...v, ...patch });
  const lost = v.weightBefore && v.weightAfter ? Math.round((v.weightBefore - v.weightAfter) * 10) / 10 : null;
  const save = async () => {
    const played = v.minutes != null && v.minutes > 0;
    await db.games.put({ ...v, status: played ? 'played' : v.status, updatedAt: now() });
    if (played) {
      const existing = await db.sessions.where('gameId').equals(v.id).first();
      const t = now();
      const row = { date: v.date, kind: 'game' as const, workoutId: null, addOn: null, title: 'משחק', minutes: v.minutes!, rpe: v.rpe, sets: {}, gameId: v.id };
      if (existing) await db.sessions.update(existing.id, { ...row, updatedAt: t });
      else await db.sessions.add({ id: uid(), createdAt: t, updatedAt: t, ...row });
    }
    setDraft(null);
    toast('המשחק נשמר');
  };
  return (
    <Page title={`משחק · ${DAYS_HE[weekday(v.date)]} ${fmtDate(v.date)}`} kicker={`${v.status === 'played' ? 'שוחק' : 'מתוכנן'} · ${v.time}`} backTo="/games" sub2>
      <div className="row">
        <button type="button" className="btn grow" onClick={() => go(`/gamemode/${v.id}`)}>
          מצב משחק
        </button>
        <button type="button" className="btn sec grow" onClick={() => go(`/analysis/${v.id}`)}>
          ניתוח אחרי משחק
        </button>
      </div>
      <HRow title="מתי ואיפה" />
      <div className="row">
        <div className="field grow">
          <label>תאריך (הזזה מחליפה את האימון של היום החדש)</label>
          <input className="input ltr" type="date" value={v.date} min={addDaysISO(v.defaultDate, -6)} max={v.defaultDate} onChange={(e) => set({ date: e.target.value })} />
        </div>
        <div className="field" style={{ width: 140 }}>
          <label>שעה</label>
          <input className="input ltr" type="time" value={v.time} onChange={(e) => set({ time: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>מגרש</label>
        <select className="input" value={v.pitchId ?? ''} onChange={(e) => set({ pitchId: e.target.value || null })}>
          <option value="">—</option>
          {pitches.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({SURFACE_HE[p.surface]})
            </option>
          ))}
        </select>
      </div>
      <HRow title="אחרי המשחק" meta="נכנס למעקב: דקות × RPE" />
      <div className="row">
        <div className="field grow">
          <label>דקות</label>
          <NumInput value={v.minutes} onChange={(m) => set({ minutes: m })} />
        </div>
        <div className="field grow">
          <label>שערים</label>
          <NumInput value={v.goals} onChange={(m) => set({ goals: m ?? 0 })} />
        </div>
        <div className="field grow">
          <label>בישולים</label>
          <NumInput value={v.assists} onChange={(m) => set({ assists: m ?? 0 })} />
        </div>
      </div>
      <div className="field">
        <div className="lbl">כמה קשה היה (RPE)</div>
        <Scale value={v.rpe} from={0} to={10} onChange={(n) => set({ rpe: n })} />
      </div>
      <div className="field">
        <div className="lbl">הציון שלך (1-10)</div>
        <Scale value={v.rating} from={1} to={10} onChange={(n) => set({ rating: n })} />
      </div>
      <div className="row">
        <div className="field grow">
          <label>עמדה</label>
          <input className="input" value={v.position} onChange={(e) => set({ position: e.target.value })} />
        </div>
        <div className="field grow">
          <label>תוצאה</label>
          <input className="input ltr" value={v.result} onChange={(e) => set({ result: e.target.value })} placeholder="5-3" />
        </div>
      </div>
      <div className="row">
        <div className="field grow">
          <label>משקל לפני</label>
          <NumInput value={v.weightBefore} onChange={(m) => set({ weightBefore: m })} step={0.1} />
        </div>
        <div className="field grow">
          <label>משקל אחרי</label>
          <NumInput value={v.weightAfter} onChange={(m) => set({ weightAfter: m })} step={0.1} />
        </div>
      </div>
      {lost != null && lost > 0 && <div className="okbox">ירדו {lost} ק"ג = {lost} ליטר נוזלים. לשתות {Math.round(lost * 1.5 * 10) / 10} ליטר בשעות הקרובות (Bible: 150%).</div>}
      <div className="field mt">
        <label>הערות</label>
        <textarea className="input" value={v.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>
      <button type="button" className="btn block" disabled={!draft} onClick={save}>
        שמור
      </button>
      <div className="row mt">
        <ConfirmButton
          label={v.status === 'cancelled' ? 'החזר משחק' : 'אין משחק השבוע'}
          confirm={v.status === 'cancelled' ? 'להחזיר?' : 'לבטל?'}
          onConfirm={() => void db.games.update(v.id, { status: v.status === 'cancelled' ? 'planned' : 'cancelled', date: v.defaultDate, updatedAt: now() })}
        />
      </div>
    </Page>
  );
}

function slotOf(time: string): KickoffSlot {
  const h = Number(time.slice(0, 2));
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
const minus = (time: string, mins: number) => {
  const t = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) - mins;
  const m = ((t % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

interface CheckItem {
  id: string;
  when: string;
  text: string;
  sub?: string;
  links?: { label: string; url: string; external?: boolean }[];
  go?: string;
}

/** R-GMD (SPEC 14.1): prep checklist from kickoff time. */
export function GameModeScreen({ id }: { id: string }) {
  const today = useToday();
  const g = useLive(() => db.games.get(id), [id]);
  const body = useLive(() => bodySummary(today), [today]);
  if (!g || !body) return null;
  const ko = g.time;
  const slot = slotOf(ko);
  const lessons = (when: string) => RELISTEN.find((r) => r.when === when)!.lessons.map((lid) => MINDSET_PARTS.flatMap((p) => p.lessons).find((l) => l.id === lid)!).map((l) => ({ label: l.title, url: l.video.url, external: l.video.external }));
  const w = body.weight ?? 72;
  const yoga = YOGA.find((y) => y.id === 'yoga-pre-match')!;
  const pre = getWorkout('pre-match');
  const daysTo = diffDays(g.date, today);

  const dayBefore: CheckItem[] = [
    { id: 'db-mind', when: 'ערב לפני', text: '8 שיעורי מיינדסט של "יום לפני משחק"', links: lessons('day-before') },
    { id: 'db-script', when: 'ערב לפני', text: 'למלא תסריט יום משחק', go: '/sheet/matchScript' },
    { id: 'db-dinner', when: 'ערב לפני', text: slot === 'evening' ? 'מתחילים להעמיס פחמימות (24 שעות לפני): ארוחת ערב עשירה בפחמימות, GI נמוך, פחות שומן' : 'ארוחת ערב עשירה בפחמימות GI נמוך, פחות שומן', sub: `24 שעות לפני: ${Math.round(w * 8)}-${Math.round(w * 10)} ג' פחמימות (Bible)` },
    { id: 'db-water', when: 'ערב לפני', text: 'יותר מים ומינרלים, בלי אלכוהול' },
  ];
  const sched = EATING_SCHEDULES[slot];
  const gameDay: CheckItem[] = [
    { id: 'gd-weigh', when: 'בוקר', text: 'שקילה לפני המשחק (לחישוב השתייה אחריו)' },
    { id: 'gd-fluids', when: 'עד המשחק', text: '1-2 ליטר נוזלים בין ארוחת הבוקר למשחק, משקאות קרים עם נתרן' },
    ...sched.filter((x) => !/מחצית|אחרי משחק|ערב \(|לפני השינה|נשנוש ערב/.test(x)).map((x, i) => ({ id: `gd-eat-${i}`, when: /3 שעות/.test(x) ? minus(ko, 180) : /1-1.5/.test(x) ? minus(ko, 90) : x.slice(0, 5).includes(':') ? x.slice(0, 5) : 'יום המשחק', text: x, sub: /3 שעות/.test(x) ? `${Math.round(w * 2)} ג' פחמימות, עד 500 קלוריות, דל סיבים ושומן. רעיונות: ${PRE_MATCH_MEALS.slice(0, 4).map((m) => m.name).join(', ')}…` : /1-1.5/.test(x) ? `נשנוש: ${PRE_MATCH_SNACKS.slice(0, 5).join(', ')}` : undefined })),
    { id: 'gd-6h', when: minus(ko, 360), text: '7 שיעורי מיינדסט: 6 שעות לפני / בדרך', links: lessons('six-hours') },
    { id: 'gd-hypo', when: minus(ko, 120), text: `משקה היפוטוני: ${DIY_DRINKS[0]!.recipe}` },
    { id: 'gd-prematch', when: `${minus(ko, 180)}-${minus(ko, 90)}`, text: 'שגרת לפני משחק: רולר, שחרור, הפעלת שרירים, מיני-בנד', go: pre ? '/w/pre-match' : undefined },
    { id: 'gd-yoga', when: minus(ko, 60), text: 'יוגה לפני משחק · 5 דק\'', links: yoga.videos },
    { id: 'gd-urine', when: minus(ko, 30), text: 'שתן בהיר וצהוב-חיוור = בתוך 1% מהידרציה מיטבית' },
  ];
  const half: CheckItem[] = [{ id: 'ht', when: 'מחצית', text: `20-40 ג' פחמימות + 500 מ"ל (איזוטוני: ${DIY_DRINKS[1]!.recipe})`, sub: HALF_TIME_SNACKS.slice(0, 6).join(', ') }];
  const after: CheckItem[] = [
    { id: 'af-15', when: '+15 דק\'', text: 'סוכרים פשוטים מיד (תוך 15 דקות)', sub: POST_MATCH[2] },
    { id: 'af-shake', when: '+30 דק\'', text: `30-40 ג' חלבון + ${Math.round(w)} ג' פחמימות תוך שעה (שייק פרווה אם אכלת בשר לפני פחות משעתיים)` },
    { id: 'af-drink', when: 'אחרי', text: `משקה היפרטוני: ${DIY_DRINKS[2]!.recipe}. שקילה: 1.5 ליטר לכל ק"ג שירד` },
    { id: 'af-log', when: 'אחרי', text: 'לרשום דקות, RPE, שערים, בישולים וציון', go: `/game/${g.id}` },
    { id: 'af-honesty', when: 'אחרי', text: 'שיעור "Brutal Honesty"', links: lessons('after-match') },
    { id: 'af-analysis', when: 'אחרי', text: 'ניתוח אחרי משחק (עם מישהו שראה אותך)', go: `/analysis/${g.id}` },
    ...(slot === 'evening' ? [{ id: 'af-sleep', when: 'לפני השינה', text: 'משחק ערב פוגע בשינה: שגרת לילה קבועה, מדיטציה, בלי טלפון 30 דק\' לפני (Bible)' }] : []),
  ];
  const toggle = (k: string) => void db.games.update(g.id, { checklist: { ...g.checklist, [k]: !g.checklist[k] }, updatedAt: now() });
  const section = (title: string, items: CheckItem[]) => (
    <>
      <HRow title={title} meta={`${items.filter((i) => g.checklist[i.id]).length}/${items.length}`} />
      {items.map((it) => (
        <div key={it.id} className="card" style={{ opacity: g.checklist[it.id] ? 0.55 : 1 }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <button type="button" aria-label="בוצע" onClick={() => toggle(it.id)} style={{ width: 24, height: 24, borderRadius: 7, border: '2px solid var(--g1)', background: g.checklist[it.id] ? 'var(--g1)' : '#fff', color: '#fff', flex: 'none' }}>
              {g.checklist[it.id] ? '✓' : ''}
            </button>
            <div className="grow">
              <div className="xs b ltr" style={{ color: 'var(--g2)', textAlign: 'start' }}>{it.when}</div>
              <div className="small">{it.text}</div>
              {it.sub && <div className="xs muted">{it.sub}</div>}
              {it.links && <VideoLinks videos={it.links} compact />}
              {it.go && (
                <button type="button" className="linkbtn" onClick={() => go(it.go!)}>
                  פתח ›
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
  return (
    <Page title="מצב משחק" kicker={`${DAYS_HE[weekday(g.date)]} ${fmtDate(g.date)} · פתיחה ${ko}`} sub={daysTo > 0 ? `עוד ${daysTo} ימים` : daysTo === 0 ? 'היום!' : 'המשחק עבר'} backTo sub2>
      {daysTo >= 1 && section('יום/ערב לפני', dayBefore)}
      {section('יום המשחק', gameDay)}
      {section('במחצית', half)}
      {section('אחרי המשחק', after)}
    </Page>
  );
}

export function AnalysisScreen({ gameId }: { gameId: string }) {
  const data = useLive(async () => ({ g: await db.games.get(gameId), existing: await db.worksheets.where('gameId').equals(gameId).filter((w) => w.kind === 'postMatch').first() }), [gameId]);
  if (!data?.g) return null;
  return (
    <Page title="ניתוח אחרי משחק" kicker={`משחק ${fmtDate(data.g.date)}`} backTo sub2>
      <WorksheetForm kind="postMatch" gameId={gameId} date={data.g.date} existing={data.existing} onSaved={() => go('/games')} />
    </Page>
  );
}

export function PitchesScreen() {
  const pitches = useLive(() => db.pitches.toArray(), []);
  const games = useLive(() => db.games.filter((g) => g.status === 'played').toArray(), []);
  const [edit, setEdit] = useState<Pitch | null>(null);
  if (!pitches || !games) return null;
  const blank = (): Pitch => ({ id: uid(), createdAt: now(), updatedAt: now(), name: '', note: '', surface: 'synthetic' });
  return (
    <Page title="מגרשים" kicker="R-PIT · משטח ונעליים" backTo sub2>
      {pitches.map((p) => {
        const gs = games.filter((g) => g.pitchId === p.id);
        return (
          <div key={p.id} className="card tap" onClick={() => setEdit(p)}>
            <div className="ch">
              {p.name} <span>{SURFACE_HE[p.surface]}</span>
            </div>
            <div className="small">👟 נעליים: {SURFACE_SHOES[p.surface]}</div>
            {HARD_SURFACES.has(p.surface) && <div className="warnbox">משטח קשה: גורם פציעה בחומר. אחרי משחק כאן: רולר לשוקיים ולכפות הרגליים.</div>}
            {p.note && <div className="xs muted">{p.note}</div>}
            <div className="xs muted mt">{gs.length} משחקים כאן</div>
          </div>
        );
      })}
      {!pitches.length && <Empty>עוד אין מגרשים. הוסף את המגרש של המשחק השבועי.</Empty>}
      <button type="button" className="btn block" onClick={() => setEdit(blank())}>
        + מגרש
      </button>
      <p className="xs muted">המלצות הנעליים כלליות, לא מ-Matchfit.</p>
      {edit && <PitchEditor p={edit} onClose={() => setEdit(null)} />}
    </Page>
  );
}

function PitchEditor({ p, onClose }: { p: Pitch; onClose: () => void }) {
  const [v, setV] = useState(p);
  const toast = useToast();
  return (
    <Modal open onClose={onClose} title={p.name || 'מגרש חדש'}>
      <div className="field">
        <label>שם</label>
        <input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </div>
      <div className="field">
        <label>משטח</label>
        <select className="input" value={v.surface} onChange={(e) => setV({ ...v, surface: e.target.value as Pitch['surface'] })}>
          {Object.entries(SURFACE_HE).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="xs muted mb">נעליים מומלצות: {SURFACE_SHOES[v.surface]}</div>
      <div className="field">
        <label>הערה (מיקום, שעות…)</label>
        <input className="input" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} />
      </div>
      <div className="row">
        <button
          type="button"
          className="btn grow"
          disabled={!v.name}
          onClick={async () => {
            await db.pitches.put({ ...v, updatedAt: now() });
            const s = await db.settings.toCollection().first();
            if (s && !s.defaultPitchId) await db.settings.update(s.id, { defaultPitchId: v.id });
            toast('נשמר');
            onClose();
          }}
        >
          שמור
        </button>
        <ConfirmButton label="מחק" confirm="למחוק?" onConfirm={() => void db.pitches.delete(p.id).then(onClose)} />
      </div>
    </Modal>
  );
}
