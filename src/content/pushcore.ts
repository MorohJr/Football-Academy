// "Push & Core" add-on (SPEC 10, proposal R-PC, pending Alex's approval).
// Not from Matchfit. Built from the Bible's principles:
// - Core: anti-extension, anti-rotation, flexion, extension. Start 1-2×10, progress to 3-4 sets, then add load
//   (KEY PRINCIPLES OF CORE STRENGTH TRAINING). Best at the end of pitch/gym sessions.
// - Bodyweight hypertrophy: compound, time under tension, progressive overload (more sets, harder variation, slower tempo).
// - Push-ups use the same standard as the Push Ups To Failure test (chest to a fist-size object, full lockout).
import type { ExerciseRx, Workout } from './types';

export interface PushLevel {
  level: 1 | 2 | 3 | 4 | 5;
  /** inclusive lower bound of max push-ups (test) */
  fromMax: number;
  exercise: string;
  he: string;
  cue: string;
}

export const PUSH_LEVELS: PushLevel[] = [
  { level: 1, fromMax: 0, exercise: 'Incline Press Up', he: 'שכיבות סמיכה בשיפוע (ידיים על ספסל)', cue: 'גוף ישר כמו קרש, החזה יורד עד הספסל.' },
  { level: 2, fromMax: 10, exercise: 'Press Up', he: 'שכיבות סמיכה רגילות', cue: 'ידיים מתחת לכתפיים, מרפקים 45°, חזה עד האגרוף.' },
  { level: 3, fromMax: 20, exercise: 'Tempo Press Up (3-1-1)', he: 'שכיבות סמיכה בקצב: 3 שניות ירידה, שנייה למטה, עלייה', cue: 'זמן תחת עומס: ירידה איטית בשליטה.' },
  { level: 4, fromMax: 35, exercise: 'Feet-Elevated / Archer Press Up', he: 'רגליים מוגבהות או "קשת" (משקל לצד אחד)', cue: 'וריאציה קשה יותר במקום עוד חזרות.' },
  { level: 5, fromMax: 50, exercise: 'Weighted / Clap Press Up', he: 'עם משקל על הגב או מחיאת כף (נפיץ)', cue: 'אותן תנועות שמופיעות בפרה-עונה ובעונה.' },
];

export const levelForMax = (max: number): PushLevel =>
  [...PUSH_LEVELS].reverse().find((l) => max >= l.fromMax) ?? PUSH_LEVELS[0]!;

/** Sets × % of max by add-on week (1-based). Weeks 9+ repeat 7-8 until the next test. */
export function pushDose(maxPushUps: number, addonWeek: number, maintenance = false): { sets: number; reps: number } {
  const lvl = levelForMax(maxPushUps);
  // Within a level, reps are scaled to the max of that level's variation. For harder variations reps naturally drop.
  const base = Math.max(3, maxPushUps);
  if (maintenance) return { sets: 2, reps: Math.max(3, Math.round(base * 0.5)) };
  const w = Math.min(Math.max(addonWeek, 1), 8);
  const [sets, pct] = w <= 2 ? [3, 0.5] : w <= 4 ? [4, 0.5] : w <= 6 ? [3, 0.6] : [4, 0.6];
  const harder = lvl.level >= 3 ? 0.8 : 1; // tempo / harder variants: fewer reps
  return { sets, reps: Math.max(3, Math.round(base * pct * harder)) };
}

/** Core sets by add-on week: 2 → 3 → 4, then 3 sets with load (Bible progression). */
export function coreDose(addonWeek: number): { sets: string; loaded: boolean } {
  if (addonWeek <= 2) return { sets: '2', loaded: false };
  if (addonWeek <= 4) return { sets: '3', loaded: false };
  if (addonWeek <= 6) return { sets: '4', loaded: false };
  return { sets: '3', loaded: true };
}

/** Three rotating core pairs (Bible example programme), performed as supersets. */
export const CORE_PAIRS: { id: 'A' | 'B' | 'C'; focus: string; ex: [ExerciseRx, ExerciseRx] }[] = [
  {
    id: 'A', focus: 'אנטי-אקסטנציה + אקסטנציה',
    ex: [
      { name: 'Dead Bug', reps: '10', note: 'גב תחתון צמוד לרצפה. יד ורגל נגדיות יורדות לאט ונעצרות לפני הרצפה.' },
      { name: 'Back Extension', reps: '15-20', note: 'מחזק גב תחתון וישבן: כוח בהאצה ובספרינט.' },
    ],
  },
  {
    id: 'B', focus: 'אנטי-רוטציה + פלקסיה',
    ex: [
      { name: 'Bird Dog', reps: '10', note: 'יד ורגל נגדיות, החזקה 3-4 שניות, בלי שהגב ישקע.' },
      { name: 'Straight-Leg Sit Up', reps: '10', note: 'פלקסיה: כוח לזריקות חוץ ולבעיטה.' },
    ],
  },
  {
    id: 'C', focus: 'אנטי-רוטציה + אנטי-אקסטנציה',
    ex: [
      { name: 'Pallof Press', reps: '8-10 לכל צד', note: 'גומייה או כבל בגובה החזה. לוחצים קדימה ומתנגדים לסיבוב.' },
      { name: 'Leg Raises', reps: '10', note: 'רגליים ישרות, גב צמוד לרצפה בירידה.' },
    ],
  },
];

export function pushCoreWorkout(pair: 'A' | 'B' | 'C', maxPushUps: number, addonWeek: number, opts: { maintenance?: boolean; coreOnly?: boolean } = {}): Workout {
  const p = CORE_PAIRS.find((x) => x.id === pair)!;
  const lvl = levelForMax(maxPushUps);
  const pd = pushDose(maxPushUps, addonWeek, opts.maintenance);
  const cd = coreDose(addonWeek);
  const blocks: Workout['blocks'] = [];
  if (!opts.coreOnly) {
    blocks.push({
      title: 'שכיבות סמיכה',
      kind: 'straight',
      note: `רמה ${lvl.level}: ${lvl.he}. ${lvl.cue} חזרה נספרת רק עם טווח מלא.`,
      exercises: [{ name: lvl.exercise, sets: String(pd.sets), reps: String(pd.reps), rest: '60-90s' }],
    });
  }
  blocks.push({
    title: `ליבה ${p.id}: ${p.focus}`,
    kind: 'superset',
    note: cd.loaded ? 'מוסיפים עומס קל (צלחת, גומייה חזקה יותר או האטה).' : undefined,
    exercises: p.ex.map((e) => ({ ...e, sets: cd.sets })),
  });
  return {
    id: `pc-${pair}${opts.coreOnly ? '-core' : ''}${opts.maintenance ? '-m' : ''}`,
    title: opts.coreOnly ? `Core ${pair}` : `Push & Core ${pair}`,
    subtitle: opts.coreOnly ? 'ליבה · 8-10 דק\'' : 'שכיבות סמיכה וליבה · 10-12 דק\'',
    category: 'pushcore',
    location: 'any',
    durationMin: opts.coreOnly ? 8 : 12,
    blocks,
  };
}

/**
 * Where the add-on sits in each period, so it never doubles what the programme already trains (SPEC 10.3).
 * dayRefs use the programme's own day numbers (booster weeks 1-7, in-season offsets from game day).
 */
export const PUSHCORE_PLACEMENT = {
  inseason: { he: '2 פעמים בשבוע: אחרי אימון פלג גוף עליון, ועם אימון מניעת הפציעות. הליבה של העונה היא בעיקר כפיפות, אז כאן מוסיפים אנטי-רוטציה ואנטי-אקסטנציה.', offsets: [-4, -1], coreOnly: false, maintenance: false },
  preseason: { he: '2 פעמים בשבוע, בימי TRX Mobility או Gym Cardio (עומס נמוך על הרגליים). אימוני הסבולת כבר כוללים שכיבות ופלאנק.', coreOnly: false, maintenance: false },
  speed: { he: 'בסוף אימון החדר כושר בימים 1 ו-5. שכיבות בתחזוקה (2 סטים) וליבה יציבה, בלי להעמיס: התוכנית אוסרת אימוני כוח נוספים.', days: [1, 5], coreOnly: false, maintenance: true },
  stamina: { he: 'ליבה יציבה בלבד אחרי אימונים 2 ו-4, כמו "מניעת פציעות בעצימות נמוכה" שהתוכנית מתירה.', days: [2, 4], coreOnly: true, maintenance: false },
  bodyweight: { he: 'ליבה בלבד אחרי אימון 1 ואחרי אימון 3. אימוני משקל הגוף כבר כוללים 8 וריאציות של שכיבות סמיכה.', days: [1, 4], coreOnly: true, maintenance: false },
  rest: { he: 'שבועיים ראשונים: מנוחה מלאה. שבועיים אחרונים: פעמיים בשבוע בתחזוקה, כדי שהפרה-עונה לא תהיה קפיצת עומס.', coreOnly: false, maintenance: true },
} as const;
