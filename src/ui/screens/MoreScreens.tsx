import { useRef, useState, type ReactNode } from 'react';
import { db } from '../../db/db';
import { INSEASON_GUIDELINES, INSEASON_WORKOUTS, FATIGUE_TYPES } from '../../content/inseason';
import { PRESEASON_DAYS, PRESEASON_EQUIPMENT, PRESEASON_NOTES } from '../../content/preseason';
import {
  BODYWEIGHT_AUDIO, BODYWEIGHT_BENEFITS, BODYWEIGHT_NOTES, BODYWEIGHT_WORKOUTS, DYNAMIC_WARMUP, SPEED_COACHING, SPEED_NOTES, SPEED_WORKOUTS, STAMINA_ADAPTATIONS,
  STAMINA_COACHING, STAMINA_NOTES, STAMINA_TYPES, STAMINA_WORKOUTS,
} from '../../content/boosters';
import { CORE_PAIRS, PUSH_LEVELS, PUSHCORE_PLACEMENT } from '../../content/pushcore';
import { weakFootWorkout } from '../../content/weakfoot';
import { getWorkout } from '../../content';
import type { Workout } from '../../content/types';
import { PROGRAMME_HE } from '../../domain/season';
import { backupFileName, BackupError, exportBackup, markBackupDone, parseBackup, restoreBackup, wipeAll, type ParsedBackup } from '../../services/backup';
import { ensureSeed, updateSettings } from '../../services/entity';
import { changeGameDay, ensureGames } from '../../services/plan';
import { saveFile } from '../../services/platform';
import { ConfirmButton, DAYS_HE, fmtDateFull, HRow, NumInput, Page, Seg, useToast, VideoLinks } from '../components/common';
import { Icon } from '../components/Icon';
import { useLive, useNow, useSettings, useToday } from '../hooks';
import { CATEGORY_HE } from '../labels';
import { go } from '../router';
import { SURFACE_HE } from '../labels';

// ---------------------------------------------------------------- more
function Link({ to, icon, title, sub }: { to: string; icon: string; title: string; sub: string }) {
  return (
    <div className="wrow tap" onClick={() => go(to)}>
      <span className="ico">
        <Icon name={icon} size="sm" />
      </span>
      <div className="grow">
        <div className="ttl">{title}</div>
        <div className="meta">{sub}</div>
      </div>
      <Icon name="chev" size="sm" />
    </div>
  );
}

export function MoreScreen() {
  const s = useSettings();
  const now = useNow(60_000);
  const backupDays = s?.lastBackupAt ? Math.floor((now - Date.parse(s.lastBackupAt)) / 86_400_000) : null;
  return (
    <Page title="עוד" kicker="Football Academy">
      {s && (backupDays == null || backupDays > 14) && (
        <div className="warnbox tap" onClick={() => go('/backup')}>
          {backupDays == null ? 'עוד לא עשית גיבוי.' : `הגיבוי האחרון לפני ${backupDays} ימים.`} הנתונים שמורים רק בטלפון. גיבוי ›
        </div>
      )}
      <HRow title="משחק וגוף" />
      <Link to="/games" icon="ball" title="המשחקים שלי" sub="סטטיסטיקה, ניתוחים וגרפים" />
      <Link to="/pitches" icon="location" title="מגרשים" sub="משטח ונעליים" />
      <Link to="/tests" icon="chart" title="בדיקות כושר ויעדי כוח" sub="10 בדיקות · 1RM" />
      <Link to="/body" icon="heart" title="גוף" sub="משקל, מדידות, אחוז שומן, עקיצות" />
      <HRow title="אימון וידע" />
      <Link to="/programs" icon="week" title="התוכניות" sub="פרה-עונה, עונה, מהירות, סטמינה, משקל גוף ותוספות" />
      <Link to="/injury" icon="shield" title="מניעת פציעות ושיקום" sub="4 אימונים, שגרות, 24 סרטוני שיקום" />
      <Link to="/mind" icon="brain" title="מיינדסט" sub="41 שיעורים, האזנה חוזרת, דפי עבודה" />
      <Link to="/library" icon="book" title="ספרייה" sub="95 מאמרי ה-Bible בתקציר" />
      <Link to="/review" icon="week" title="סיכום שבועי" sub="השבוע שעבר, השבוע הזה, 3 מטרות" />
      <HRow title="אפליקציה" />
      <Link to="/settings" icon="settings" title="הגדרות" sub="פרופיל, משחק שבועי, תזונה, תוספות" />
      <Link to="/backup" icon="download" title="גיבוי ושחזור" sub={s?.lastBackupAt ? `אחרון: ${fmtDateFull(s.lastBackupAt.slice(0, 10))}` : 'עוד לא גובה'} />
    </Page>
  );
}

// ---------------------------------------------------------------- programmes
const PROGS = [
  { id: 'preseason', he: PROGRAMME_HE.preseason, sub: '70 יום · 10 שבועות' },
  { id: 'inseason', he: PROGRAMME_HE.inseason, sub: '10 שבועות · משחק בשבוע' },
  { id: 'speed', he: PROGRAMME_HE.speed, sub: '4 שבועות · 3 ימים' },
  { id: 'stamina', he: PROGRAMME_HE.stamina, sub: '4 שבועות · 4 ימים' },
  { id: 'bodyweight', he: PROGRAMME_HE.bodyweight, sub: '4 שבועות · משקל גוף ויוגה' },
  { id: 'injury', he: 'מניעת פציעות ושיקום', sub: 'כל השנה' },
  { id: 'pushcore', he: 'שכיבות סמיכה וליבה', sub: 'תוספת (R-PC)' },
  { id: 'weakfoot', he: 'רגל חלשה ונגיעה ראשונה', sub: 'תוספת (R-WKF)' },
] as const;

function WList({ list }: { list: Workout[] }) {
  return (
    <>
      {list.map((w) => (
        <div key={w.id} className="wrow tap" onClick={() => go(`/w/${w.id}`)}>
          <div className="grow">
            <div className="ttl ltr" style={{ textAlign: 'start' }}>
              {w.title}
            </div>
            <div className="meta">
              {w.subtitle ?? CATEGORY_HE[w.category]}
              {w.durationMin ? ` · ${w.durationMin} דק'` : ''}
            </div>
          </div>
          <div className="when">›</div>
        </div>
      ))}
    </>
  );
}

const Notes = ({ items }: { items: readonly string[] }) => (
  <ul className="clean small">
    {items.map((x) => (
      <li key={x}>{x}</li>
    ))}
  </ul>
);

function Fold({ title, children, open: initial = false }: { title: string; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="card">
      <div className="ch tap" onClick={() => setOpen(!open)}>
        {title} <span>{open ? '−' : '+'}</span>
      </div>
      {open && children}
    </div>
  );
}

export function ProgramsScreen({ prog }: { prog?: string }) {
  const p = PROGS.find((x) => x.id === prog);
  if (prog === 'injury') {
    go('/injury');
    return null;
  }
  if (!p) {
    return (
      <Page title="התוכניות" kicker="Matchfit MESSI-N" sub="כל האימונים, לעיון">
        {PROGS.map((x) => (
          <div key={x.id} className="wrow tap" onClick={() => go(x.id === 'injury' ? '/injury' : `/programs/${x.id}`)}>
            <div className="grow">
              <div className="ttl">{x.he}</div>
              <div className="meta">{x.sub}</div>
            </div>
            <div className="when">›</div>
          </div>
        ))}
      </Page>
    );
  }
  return (
    <Page title={p.he} kicker="תוכנית" sub={p.sub} backTo="/programs" sub2>
      {p.id === 'preseason' && <Preseason />}
      {p.id === 'inseason' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={INSEASON_GUIDELINES} />
          </Fold>
          <Fold title="4 סוגי עייפות">
            {FATIGUE_TYPES.map((f) => (
              <div key={f.name} className="small">
                <b>{f.name}:</b> {f.text}
              </div>
            ))}
          </Fold>
          <HRow title="אימונים" meta={`${INSEASON_WORKOUTS.length}`} />
          <WList list={INSEASON_WORKOUTS} />
        </>
      )}
      {p.id === 'speed' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={SPEED_NOTES} />
            <VideoLinks videos={[DYNAMIC_WARMUP, ...SPEED_COACHING]} />
          </Fold>
          <WList list={SPEED_WORKOUTS} />
        </>
      )}
      {p.id === 'stamina' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={STAMINA_NOTES} />
            {STAMINA_TYPES.map((t) => (
              <div key={t.name} className="small mt">
                <b className="ltr">{t.name}:</b> {t.text}
              </div>
            ))}
            <VideoLinks videos={STAMINA_COACHING} />
          </Fold>
          <Fold title="מה משתפר">
            <Notes items={STAMINA_ADAPTATIONS} />
          </Fold>
          <WList list={STAMINA_WORKOUTS} />
        </>
      )}
      {p.id === 'bodyweight' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={BODYWEIGHT_NOTES} />
            <VideoLinks videos={BODYWEIGHT_AUDIO} />
          </Fold>
          <Fold title="יתרונות">
            <Notes items={BODYWEIGHT_BENEFITS} />
          </Fold>
          <WList list={BODYWEIGHT_WORKOUTS} />
        </>
      )}
      {p.id === 'pushcore' && (
        <>
          <Fold title="5 רמות שכיבות (לפי בדיקת השכיבות)" open>
            {PUSH_LEVELS.map((l) => (
              <div key={l.level} className="small" style={{ marginBottom: 4 }}>
                <b>
                  {l.level}. {l.he}
                </b>{' '}
                <span className="xs muted">(מ-{l.fromMax} שכיבות)</span>
                <div className="xs muted">{l.cue}</div>
              </div>
            ))}
          </Fold>
          <Fold title="איפה זה בכל תקופה">
            {Object.entries(PUSHCORE_PLACEMENT).map(([k, v]) => (
              <div key={k} className="small" style={{ marginBottom: 4 }}>
                <b>{PROGRAMME_HE[k as keyof typeof PROGRAMME_HE]}:</b> {v.he}
              </div>
            ))}
          </Fold>
          <HRow title="3 זוגות ליבה" meta="מתחלפים" />
          {CORE_PAIRS.map((c) => (
            <div key={c.id} className="wrow tap" onClick={() => go(`/w/pc-${c.id}`)}>
              <div className="grow">
                <div className="ttl">זוג {c.id}</div>
                <div className="meta">
                  {c.focus} · <span className="ltr">{c.ex.map((e) => e.name).join(' + ')}</span>
                </div>
              </div>
              <div className="when">›</div>
            </div>
          ))}
        </>
      )}
      {p.id === 'weakfoot' && <WList list={[weakFootWorkout]} />}
    </Page>
  );
}

function Preseason() {
  return (
    <>
      <Fold title="הנחיות" open>
        <Notes items={PRESEASON_NOTES} />
      </Fold>
      <Fold title="ציוד">
        <div className="small">
          <b>מגרש:</b> {PRESEASON_EQUIPMENT.pitch.join(', ')}
        </div>
        <div className="small">
          <b>חדר כושר / בית:</b> {PRESEASON_EQUIPMENT.gym.join(', ')}
        </div>
      </Fold>
      {Array.from({ length: 10 }, (_, wk) => (
        <div key={wk}>
          <HRow title={`שבוע ${wk + 1}`} />
          {PRESEASON_DAYS.slice(wk * 7, wk * 7 + 7).map((d) => {
            const w = d.sessions[0] ? getWorkout(d.sessions[0].workoutId) : undefined;
            return (
              <div key={d.day} className={`wrow ${w ? 'tap' : ''}`} onClick={() => w && go(`/w/${w.id}`)}>
                <div className="when">יום {d.day}</div>
                <div className="grow">
                  <div className="ttl ltr" style={{ textAlign: 'start' }}>
                    {w ? w.title : 'מנוחה'}
                  </div>
                  {w?.subtitle && <div className="meta">{w.subtitle}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- settings
const ACTIVITY = [
  { v: '1.4', label: 'קל' },
  { v: '1.6', label: 'בינוני' },
  { v: '1.75', label: 'גבוה' },
  { v: '1.9', label: 'גבוה מאוד' },
];

export function SettingsScreen() {
  const s = useSettings();
  const today = useToday();
  const toast = useToast();
  const pitches = useLive(() => db.pitches.toArray(), []);
  if (!s || !pitches) return null;
  const set = (patch: Parameters<typeof updateSettings>[0]) => void updateSettings(patch);
  return (
    <Page title="הגדרות" kicker="Football Academy" backTo="/more" sub2>
      <HRow title="פרופיל" meta="לחישוב קלוריות וחלבון" />
      <div className="field">
        <label>שם</label>
        <input className="input" value={s.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="field">
        <div className="lbl">מין</div>
        <Seg value={s.sex} onChange={(v) => set({ sex: v })} options={[{ v: 'male', label: 'גבר' }, { v: 'female', label: 'אישה' }]} />
      </div>
      <div className="row">
        <div className="field grow">
          <label>שנת לידה</label>
          <NumInput value={s.birthYear} onChange={(v) => set({ birthYear: v == null ? null : Math.round(v) })} />
        </div>
        <div className="field grow">
          <label>גובה (ס"מ)</label>
          <NumInput value={s.heightCm} onChange={(v) => set({ heightCm: v })} />
        </div>
        <div className="field grow">
          <label>משקל (ק"ג)</label>
          <NumInput value={s.weightKg} onChange={(v) => set({ weightKg: v })} step={0.1} />
        </div>
      </div>
      <p className="xs muted" style={{ marginTop: -4 }}>
        המשקל כאן משמש רק עד שיש שקילות. אחר כך משקל המגמה ממסך הגוף.
      </p>
      <div className="field">
        <div className="lbl">רמת פעילות (מקדם לתחזוקה)</div>
        <Seg value={String(s.activity)} onChange={(v) => set({ activity: Number(v) })} options={ACTIVITY.some((a) => a.v === String(s.activity)) ? ACTIVITY : [...ACTIVITY, { v: String(s.activity), label: String(s.activity) }]} />
      </div>

      <HRow title="תזונה" />
      <div className="field">
        <div className="lbl">מטרה</div>
        <Seg value={s.goalMode} onChange={(v) => set({ goalMode: v })} options={[{ v: 'auto', label: 'אוטומטי (לפי אחוז שומן)' }, { v: 'cut', label: 'חיטוב' }, { v: 'maintain', label: 'תחזוקה' }]} />
      </div>
      <div className="field">
        <label>גירעון בחיטוב: {s.deficit} קלוריות (Bible: 250-500)</label>
        <input type="range" min={250} max={500} step={25} value={s.deficit} onChange={(e) => set({ deficit: Number(e.target.value) })} />
      </div>
      <div className="field">
        <label>המתנה מבשרי לחלבי (דקות)</label>
        <NumInput value={s.kosherWaitMin} onChange={(v) => v != null && v >= 0 && set({ kosherWaitMin: Math.round(v) })} />
      </div>

      <HRow title="המשחק השבועי" meta="R-GAM" />
      <div className="field">
        <div className="lbl">יום קבוע</div>
        <div className="chips">
          {DAYS_HE.map((d, i) => (
            <button
              key={d}
              type="button"
              className={`chip ${s.gameWeekday === i ? 'on' : ''}`}
              onClick={async () => {
                if (i === s.gameWeekday) return;
                await changeGameDay(today, i);
                toast(`המשחק הקבוע עבר ליום ${d}. התוכנית הותאמה`);
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <div className="field grow">
          <label>שעה</label>
          <input
            className="input ltr"
            type="time"
            value={s.gameTime}
            onChange={async (e) => {
              if (!e.target.value) return;
              await changeGameDay(today, s.gameWeekday, e.target.value);
            }}
          />
        </div>
        <div className="field grow">
          <label>מגרש קבוע</label>
          <select
            className="input"
            value={s.defaultPitchId ?? ''}
            onChange={async (e) => {
              const id = e.target.value || null;
              await updateSettings({ defaultPitchId: id });
              const future = await db.games.where('date').aboveOrEqual(today).toArray();
              await db.games.bulkPut(future.filter((g) => g.status === 'planned').map((g) => ({ ...g, pitchId: id, updatedAt: new Date().toISOString() })));
            }}
          >
            <option value="">—</option>
            {pitches.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({SURFACE_HE[p.surface]})
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="button" className="btn ghost sm" onClick={() => go('/pitches')}>
        ניהול מגרשים ›
      </button>

      <HRow title="תוספות" />
      <label className="row small" style={{ marginBottom: 8 }}>
        <input type="checkbox" checked={s.pushCore} onChange={(e) => set({ pushCore: e.target.checked })} /> שכיבות סמיכה וליבה (R-PC)
      </label>
      <label className="row small">
        <input type="checkbox" checked={s.weakFoot} onChange={(e) => set({ weakFoot: e.target.checked })} /> רגל חלשה ונגיעה ראשונה (R-WKF)
      </label>

      <HRow title="לוח העונה" />
      <button type="button" className="btn sec block" onClick={() => go('/season')}>
        עריכת תאריכי התקופות ›
      </button>
      <p className="xs muted mt">הסרטונים נפתחים ב-Vimeo (או יוטיוב כשמסומן). האפליקציה לא שולחת שום נתון החוצה, חוץ ממספר ברקוד בסריקה.</p>
    </Page>
  );
}

// ---------------------------------------------------------------- backup
const ERR_HE: Record<string, string> = {
  not_a_backup: 'זה לא קובץ גיבוי של Football Academy.',
  newer_version: 'הגיבוי מגרסה חדשה יותר של האפליקציה. עדכן קודם את האפליקציה.',
  invalid_data: 'הקובץ פגום.',
};

export function BackupScreen() {
  const s = useSettings();
  const today = useToday();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedBackup | null>(null);
  const [confirm, setConfirm] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  if (!s) return null;
  const doExport = async () => {
    const json = await exportBackup();
    await saveFile(backupFileName(today), json);
    await markBackupDone();
    toast('הגיבוי נשמר');
  };
  return (
    <Page title="גיבוי ושחזור" kicker="הנתונים שמורים רק במכשיר" backTo="/more" sub2>
      <div className="card">
        <div className="ch">
          גיבוי <span>{s.lastBackupAt ? `אחרון ${fmtDateFull(s.lastBackupAt.slice(0, 10))}` : 'עוד לא גובה'}</span>
        </div>
        <p className="small" style={{ marginTop: 0 }}>
          קובץ אחד עם הכול: אימונים, משחקים, מעקב, תזונה, מזווה, גוף ודפי עבודה. באייפון: "שמור בקבצים" או iCloud Drive.
        </p>
        <button type="button" className="btn block" onClick={() => void doExport()}>
          שמור גיבוי
        </button>
      </div>
      <div className="card">
        <div className="ch">שחזור מגיבוי</div>
        <p className="small" style={{ marginTop: 0 }}>
          מחליף את <b>כל</b> הנתונים במכשיר בנתונים מהקובץ.
        </p>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            setErr(null);
            setConfirm(0);
            try {
              setParsed(await parseBackup(await f.text()));
            } catch (x) {
              setParsed(null);
              setErr(x instanceof BackupError ? (ERR_HE[x.code] ?? x.message) : 'לא הצלחתי לקרוא את הקובץ.');
            }
          }}
        />
        <button type="button" className="btn sec block" onClick={() => file.current?.click()}>
          בחר קובץ גיבוי
        </button>
        {err && <div className="warnbox">{err}</div>}
        {parsed && (
          <div className="mt">
            <div className="small">
              גיבוי מ-{fmtDateFull(parsed.exportedAt.slice(0, 10))}: {parsed.counts.sessions} אימונים, {parsed.counts.games} משחקים, {parsed.counts.checkins} צ'ק-אינים, {parsed.counts.foodLogs} רישומי אוכל, {parsed.counts.pantry} פריטי מזווה.
            </div>
            {confirm === 0 && (
              <button type="button" className="btn danger block mt" onClick={() => setConfirm(1)}>
                שחזר
              </button>
            )}
            {confirm === 1 && (
              <>
                <div className="warnbox">בטוח? כל מה שבמכשיר עכשיו יימחק ויוחלף.</div>
                <div className="row">
                  <button
                    type="button"
                    className="btn danger grow"
                    onClick={async () => {
                      await restoreBackup(parsed);
                      setParsed(null);
                      setConfirm(0);
                      toast('השחזור הושלם');
                      go('/');
                    }}
                  >
                    כן, החלף הכול
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setConfirm(0)}>
                    ביטול
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="card">
        <div className="ch">מחיקת כל הנתונים</div>
        <p className="small" style={{ marginTop: 0 }}>
          מומלץ לשמור גיבוי קודם. המזווה וההגדרות חוזרים לברירת המחדל.
        </p>
        <ConfirmButton
          label="מחק הכול"
          confirm="למחוק את כל הנתונים?"
          className="btn ghost sm"
          onConfirm={async () => {
            await wipeAll();
            await ensureSeed();
            const st = await db.settings.toCollection().first();
            if (st) await ensureGames(today, st);
            toast('הנתונים נמחקו');
            go('/');
          }}
        />
      </div>
    </Page>
  );
}
