// R-ONB (SPEC 15.5): rotating intro panels, then 3 setup steps. Shown to a new user and after "delete everything".
import { useEffect, useRef, useState } from 'react';
import { db } from '../../db/db';
import type { Settings } from '../../domain/schemas';
import { nowIso, newId, stamp, updateSettings } from '../../services/entity';
import { changeGameDay } from '../../services/plan';
import { CHALK, DAYS_HE, NumInput, Seg } from '../components/common';
import { useToday } from '../hooks';

const SLIDES: { icon: string; title: string; text: string; points?: string[] }[] = [
  {
    icon: '⚽',
    title: 'ברוך הבא ל-Football Academy',
    text: 'תוכנית אימונים לשנה שלמה מחבילת Matchfit, שהופכת ל"מה עושים היום".',
    points: ['תקופות: סטמינה, מהירות, עונה, פגרה, פרה-עונה, משקל גוף.', 'מניעת פציעות, תזונה ומיינדסט: כל השנה.'],
  },
  {
    icon: '📋',
    title: 'מסך היום',
    text: 'האימונים של היום לפי הסדר, עם זמן, מקום ומינון.',
    points: ['"התחל אימון": טיימרים, סימון סטים, ק"ג וחזרות לכל סט.', 'האפליקציה מציעה את המשקל של הפעם הבאה.', 'האימון נשמר גם אם האפליקציה נסגרת באמצע.'],
  },
  {
    icon: '🏟️',
    title: 'המשחק השבועי',
    text: 'משחק קבוע בשבוע. המשחק מחליף את האימון של אותו יום.',
    points: ['אפשר להזיז או לבטל משחק במסך השבוע.', 'מיום לפני: מצב משחק עם רשימת הכנה ושעות.'],
  },
  {
    icon: '📈',
    title: 'מעקב',
    text: 'שתי פעולות קטנות כל יום, ומהן נבנים העומס והגרפים.',
    points: ['בבוקר: מדד רווחה (5 שאלות) ושינה.', 'אחרי כל אימון: כמה דקות וכמה קשה (RPE 0-10).', 'אזהרה כשהעומס קופץ מהר מדי.'],
  },
  {
    icon: '🥗',
    title: 'תזונה כשרה, לחיטוב',
    text: 'יעדים לפי סוג היום: אימון עצים, יום קל, מנוחה, לפני משחק ויום משחק.',
    points: ['מזווה, ארוחות, "אכלתי", רשימת קניות וברקוד.', 'אחרי 14 יום של רישום ושקילות, הקלוריות מתעדכנות לפי המציאות.'],
  },
  {
    icon: '🔒',
    title: 'הנתונים רק אצלך',
    text: 'אין שרת ואין חשבון. הכול נשמר בטלפון בלבד.',
    points: ['לכן חשוב לשמור גיבוי מדי פעם: עוד ← גיבוי ושחזור.', 'אפשר לראות את ההסבר הזה שוב: עוד ← איך משתמשים.'],
  },
];

const ROTATE_MS = 7000;

/** The rotating panels. `onDone` is the last button. */
export function IntroSlides({ onDone, doneLabel, onSkip }: { onDone: () => void; doneLabel: string; onSkip?: () => void }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const last = i === SLIDES.length - 1;

  useEffect(() => {
    if (paused || last) return;
    const t = setTimeout(() => setI((x) => Math.min(SLIDES.length - 1, x + 1)), ROTATE_MS);
    return () => clearTimeout(t);
  }, [i, paused, last]);

  const goTo = (n: number) => {
    setPaused(true);
    setI(Math.max(0, Math.min(SLIDES.length - 1, n)));
  };
  const sl = SLIDES[i]!;
  return (
    <>
      <div
        className="slide"
        aria-live="polite"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current == null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          // RTL: swiping to the right brings the next panel.
          if (dx > 40) goTo(i + 1);
          else if (dx < -40) goTo(i - 1);
        }}
      >
        <div className="big" aria-hidden="true">
          {sl.icon}
        </div>
        <h2>{sl.title}</h2>
        <p>{sl.text}</p>
        {sl.points && (
          <ul>
            {sl.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="dots" role="tablist" aria-label="חלוניות">
        {SLIDES.map((s, n) => (
          <button key={s.title} type="button" role="tab" aria-selected={n === i} aria-label={s.title} className={n === i ? 'on' : ''} onClick={() => goTo(n)} />
        ))}
      </div>
      <div className="row">
        {i > 0 && (
          <button type="button" className="btn ghost" onClick={() => goTo(i - 1)}>
            הקודם
          </button>
        )}
        {last ? (
          <button type="button" className="btn grow" onClick={onDone}>
            {doneLabel}
          </button>
        ) : (
          <button type="button" className="btn grow" onClick={() => goTo(i + 1)}>
            הבא
          </button>
        )}
      </div>
      {onSkip && !last && (
        <button type="button" className="linkbtn mt" style={{ alignSelf: 'center' }} onClick={onSkip}>
          דלג להגדרות
        </button>
      )}
    </>
  );
}

function Shell({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <div className="screen sub onb">
      <header className="grass ghead">
        {CHALK}
        {kicker && <div className="k">{kicker}</div>}
        <h1>{title}</h1>
      </header>
      <main className="sheet">{children}</main>
    </div>
  );
}

/** Seen again from "More" (no setup). */
export function IntroScreen({ onClose }: { onClose: () => void }) {
  return (
    <Shell title="איך משתמשים" kicker="Football Academy">
      <IntroSlides onDone={onClose} doneLabel="סגור" />
    </Shell>
  );
}

/** First start: panels → profile → weekly game → starting point. */
export function Onboarding({ s }: { s: Settings }) {
  const today = useToday();
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ name: s.name, sex: s.sex, birthYear: s.birthYear, heightCm: s.heightCm, weightKg: s.weightKg });
  const [game, setGame] = useState({ day: s.gameWeekday, time: s.gameTime });
  const [start, setStart] = useState<{ pushups: number | null; squat: number | null; deadlift: number | null; bench: number | null }>({ pushups: null, squat: null, deadlift: null, bench: null });

  if (step === 0)
    return (
      <Shell title="ברוך הבא" kicker="Football Academy">
        <IntroSlides onDone={() => setStep(1)} doneLabel="בוא נתחיל" onSkip={() => setStep(1)} />
      </Shell>
    );

  const finish = async () => {
    const t = nowIso();
    if (start.pushups != null && start.pushups >= 0) await db.tests.add({ id: newId(), ...stamp(), date: today, testId: 'pushups', value: Math.round(start.pushups), side: null, note: 'מהגדרת הפתיחה' });
    for (const lift of ['squat', 'deadlift', 'bench'] as const) {
      const kg = start[lift];
      if (kg != null && kg > 0) await db.strength.add({ id: newId(), ...stamp(), date: today, lift, kg });
    }
    await updateSettings({ onboardedAt: t });
  };

  return (
    <Shell title={['', 'קצת עליך', 'המשחק השבועי', 'נקודת פתיחה'][step]!} kicker={`הגדרה ראשונה · שלב ${step} מתוך 3`}>
      <div className="steps" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= step ? 'on' : ''} />
        ))}
      </div>
      {step === 1 && (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>
            לחישוב קלוריות, חלבון ויעדי כוח. אפשר לשנות אחר כך בהגדרות.
          </p>
          <div className="field">
            <label htmlFor="onb-name">שם</label>
            <input id="onb-name" className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
          </div>
          <div className="field">
            <div className="lbl">מין</div>
            <Seg value={p.sex} onChange={(v) => setP({ ...p, sex: v })} options={[{ v: 'male', label: 'גבר' }, { v: 'female', label: 'אישה' }]} />
          </div>
          <div className="row">
            <div className="field grow">
              <label>שנת לידה</label>
              <NumInput value={p.birthYear} onChange={(v) => setP({ ...p, birthYear: v == null ? null : Math.round(v) })} placeholder="1995" />
            </div>
            <div className="field grow">
              <label>גובה (ס"מ)</label>
              <NumInput value={p.heightCm} onChange={(v) => setP({ ...p, heightCm: v })} placeholder="178" />
            </div>
            <div className="field grow">
              <label>משקל (ק"ג)</label>
              <NumInput value={p.weightKg} onChange={(v) => setP({ ...p, weightKg: v })} step={0.1} placeholder="75" />
            </div>
          </div>
          <button
            type="button"
            className="btn block mt"
            disabled={!p.name.trim()}
            onClick={async () => {
              await updateSettings({ name: p.name.trim(), sex: p.sex, birthYear: p.birthYear, heightCm: p.heightCm, weightKg: p.weightKg });
              setStep(2);
            }}
          >
            הבא
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>
            המשחק מחליף את האימון של אותו יום, וכל התקופות מתיישרות אליו.
          </p>
          <div className="field">
            <div className="lbl">באיזה יום?</div>
            <div className="chips">
              {DAYS_HE.map((d, n) => (
                <button key={d} type="button" className={`chip ${game.day === n ? 'on' : ''}`} onClick={() => setGame({ ...game, day: n })}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="onb-time">באיזו שעה?</label>
            <input id="onb-time" className="input ltr" type="time" value={game.time} onChange={(e) => e.target.value && setGame({ ...game, time: e.target.value })} />
          </div>
          <div className="row mt">
            <button type="button" className="btn ghost" onClick={() => setStep(1)}>
              הקודם
            </button>
            <button
              type="button"
              className="btn grow"
              onClick={async () => {
                await changeGameDay(today, game.day, game.time);
                setStep(3);
              }}
            >
              הבא
            </button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>
            לא חובה. אם יודעים, האפליקציה מחשבת מהם את מינון השכיבות ואת המשקלים באימוני הכוח. אפשר גם לעשות בדיקות אחר כך.
          </p>
          <div className="field">
            <label>מקסימום שכיבות סמיכה ברצף</label>
            <NumInput value={start.pushups} onChange={(v) => setStart({ ...start, pushups: v })} min={0} placeholder="—" />
          </div>
          <div className="lbl small b">1RM: הכי כבד שאפשר להרים פעם אחת (ק"ג)</div>
          <div className="row">
            {(
              [
                ['squat', 'סקוואט'],
                ['deadlift', 'דדליפט'],
                ['bench', 'לחיצת חזה'],
              ] as const
            ).map(([k, he]) => (
              <div key={k} className="field grow">
                <label>{he}</label>
                <NumInput value={start[k]} onChange={(v) => setStart({ ...start, [k]: v })} min={0} step={2.5} placeholder="—" />
              </div>
            ))}
          </div>
          <div className="row mt">
            <button type="button" className="btn ghost" onClick={() => setStep(2)}>
              הקודם
            </button>
            <button type="button" className="btn grow" onClick={() => void finish()}>
              סיום: למסך היום
            </button>
          </div>
          <button type="button" className="linkbtn mt" onClick={() => void updateSettings({ onboardedAt: nowIso() })}>
            דלג, אמלא אחר כך
          </button>
        </>
      )}
    </Shell>
  );
}
