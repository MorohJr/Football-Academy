import { useRef, useState } from 'react';
import { db } from '../../db/db';
import { backupFileName, BackupError, exportBackup, markBackupDone, parseBackup, restoreBackup, wipeAll, type ParsedBackup } from '../../services/backup';
import { ensureSeed, updateSettings } from '../../services/entity';
import { changeGameDay, ensureGames } from '../../services/plan';
import { saveFile } from '../../services/platform';
import { ConfirmButton, DAYS_HE, fmtDateFull, HRow, NumInput, Page, Seg, useToast } from '../components/common';
import { useLive, useSettings, useToday } from '../hooks';
import { go } from '../router';
import { SURFACE_HE } from '../labels';

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

      <HRow title="מראה" meta="R-UI-3" />
      <Seg value={s.theme} onChange={(v) => set({ theme: v })} options={[{ v: 'auto', label: 'אוטומטי (לפי הטלפון)' }, { v: 'light', label: 'בהיר' }, { v: 'dark', label: 'כהה' }]} />

      <HRow title="תזונה" />
      <div className="field">
        <div className="lbl">מטרה</div>
        <Seg value={s.goalMode} onChange={(v) => set({ goalMode: v })} options={[{ v: 'auto', label: 'אוטומטי (לפי אחוז שומן)' }, { v: 'cut', label: 'חיטוב' }, { v: 'maintain', label: 'תחזוקה' }]} />
      </div>
      <div className="kv mb">
        <span>קלוריות לתחזוקה</span>
        <span>
          {s.maintenanceOverride ? (
            <>
              {s.maintenanceOverride.kcal} (לפי המציאות, {fmtDateFull(s.maintenanceOverride.date)}){' '}
              <button type="button" className="linkbtn" onClick={() => set({ maintenanceOverride: null })}>
                חזרה לנוסחה
              </button>
            </>
          ) : (
            'לפי נוסחה (מתעדכן לפי 14 יום במסך התזונה)'
          )}
        </span>
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
