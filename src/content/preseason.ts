// PRE-SEASON.pdf: 70 days, 10 weeks (SPEC 5.1). Transcribed from the day tables.
import type { Block, DayPlan, ExerciseRx, Workout } from './types';

const V = (label: string, id: string) => ({ label, url: `https://vimeo.com/${id}` });

export const PRESEASON_NOTES = [
  'מתקדמים מיום 1 עד יום 70 לפי הסדר. ימי המנוחה חלק מהתוכנית: הכושר משתפר בזמן ההתאוששות.',
  'אימוני המגרש בנויים לביצוע לבד ועם ציוד מינימלי. אפשר לאלתר (למשל סוודר במקום משוכה).',
  'תרגיל חד-צדדי: החזרות הן לכל צד.',
  'טווח חזרות (12-15): בוחרים משקל שמעייף בתוך הטווח.',
  'בדיקות כושר בימים 1, 36 ו-70.',
];

export const PRESEASON_EQUIPMENT = {
  pitch: ['כדור', 'סולם', 'משוכות', 'מוטות', 'קונוסים', 'בובות', 'סטופר', 'מטר'],
  gym: ['ציוד חדר כושר בסיסי', 'קופסה', 'TRX', 'VIPR', 'BOSU', 'כדור שוויצרי', 'כדור כוח (מדיסין בול)', 'חבל קפיצה'],
};

// ---------- Strength endurance (SE) ----------
type Intensity = 'low' | 'medium' | 'high';
const SE_SETS: Record<Intensity, string> = { low: '2', medium: '3', high: '3' };

function se1(sets: string): ExerciseRx[] {
  return [
    { name: 'Med Ball Squat Press', sets, reps: '12-15', rest: '90s' },
    { name: 'Med Ball Press Up', sets, reps: '12-15', rest: '90s' },
    { name: 'Swiss Ball Hamstring Curl', sets, reps: '5-6', rest: '60s' },
    { name: 'Med Ball Walking Lunges', sets, reps: '10', rest: '90s' },
    { name: 'Swiss Ball Plank', sets, reps: '30s', rest: '60s' },
    { name: 'Step Up Knee Drive', sets, reps: '10', rest: '60s' },
    { name: 'Staggered Elastic Chest Press', sets, reps: '12-15', rest: '60s' },
    { name: 'Elastic Wood Chop', sets, reps: '12-15', rest: '60s' },
  ];
}
function se2(sets: string): ExerciseRx[] {
  return [
    { name: 'Reverse Lunge 1 Arm Press', sets, reps: '10', rest: '90s' },
    { name: 'Alternating Med Ball Press Up', sets, reps: '12-15', rest: '90s' },
    { name: 'Med Ball Lateral Lunge', sets, reps: '10', rest: '60s' },
    { name: 'Crossover Lateral Step Ups', sets, reps: '10', rest: '60s' },
    { name: 'Side Plank Row', sets, reps: '30s', rest: '60s' },
    { name: 'Med Ball Front Squat', sets, reps: '12-15', rest: '60s' },
    { name: 'Dumbbell Overhead Press', sets, reps: '12-15', rest: '90s' },
    { name: 'TRX Single Leg Squat', sets, reps: '5-6', rest: '60s' },
  ];
}
function se3(sets: string): ExerciseRx[] {
  return [
    { name: 'Med Ball Slams', sets, reps: '12-15', rest: '90s' },
    { name: 'Depth Press Ups', sets, reps: '12-15', rest: '90s' },
    { name: 'Leg Extension', sets, reps: '12-15', rest: '60s' },
    { name: 'Lateral Step Up Jumps', sets, reps: '8', rest: '90s' },
    { name: 'TRX Crunch', sets, reps: '12-15', rest: '90s' },
    { name: 'Box Clear', sets, reps: '12-15', rest: '60s' },
    { name: 'Dumbbell Lateral Raise', sets, reps: '12-15', rest: '90s' },
    { name: 'TRX In/Out', sets, reps: '12-15', rest: '90s' },
  ];
}

const INT_HE: Record<Intensity, string> = { low: 'עצימות נמוכה', medium: 'עצימות בינונית', high: 'עצימות גבוהה' };

function seWorkout(n: 1 | 2 | 3, i: Intensity): Workout {
  const sets = SE_SETS[i];
  const exercises = n === 1 ? se1(sets) : n === 2 ? se2(sets) : se3(sets);
  const video = { 1: V('Strength Endurance 1', '216564314/746cce270e'), 2: V('Strength Endurance 2', '216565036/5dde9e44fe'), 3: V('Strength Endurance 3', '216566199/bd72ab399d') }[n];
  return {
    id: `pre-se${n}-${i}`,
    title: `Strength Endurance ${n}`,
    subtitle: `סבולת כוח · ${INT_HE[i]}`,
    category: 'strength',
    location: 'gym',
    videos: [video],
    blocks: [{ kind: 'straight', exercises }],
  };
}

// ---------- Hypertrophy ----------
function hyp1(i: 'low' | 'medium'): Workout {
  const s = i === 'low' ? '3' : '4';
  return {
    id: `pre-hyp1-${i}`,
    title: 'Hypertrophy 1',
    subtitle: `היפרטרופיה · ${INT_HE[i]}`,
    category: 'strength',
    location: 'gym',
    videos: [V('Hypertrophy 1', '216567066/17e962105d')],
    notes: ['Straight Leg Deadlift: בפעם הראשונה לא להעמיס כבד.'],
    blocks: [
      {
        kind: 'straight',
        exercises: [
          { name: 'Weighted Press Up', sets: s, reps: '8-10', rest: '2m' },
          { name: 'Straight Leg Deadlift', sets: s, reps: '8-10', rest: '2m' },
          { name: 'Dumbbell Bent Over Row', sets: i === 'low' ? '3' : '3', reps: i === 'low' ? '8-10' : '6', rest: '2m' },
          { name: 'Back Squat', sets: s, reps: '8-10', rest: '2m' },
          { name: 'Forward Barbell Step Up Knee Drive', sets: s, reps: '6', rest: '2m' },
          { name: 'Tricep Dip Leg Raise', sets: s, reps: '8-10', rest: '2m' },
        ],
      },
    ],
  };
}
function hyp2(i: Intensity): Workout {
  const s = i === 'low' ? '3' : '4';
  const r = i === 'high' ? '8-10' : '10-12';
  return {
    id: `pre-hyp2-${i}`,
    title: 'Hypertrophy 2',
    subtitle: `היפרטרופיה · ${INT_HE[i]}`,
    category: 'strength',
    location: 'gym',
    videos: [V('Hypertrophy 2', '216567670/f33a01c5c9')],
    notes: ['Front Squat: כדאי לבקש ממאמן בחדר הכושר לבדוק טכניקה.'],
    blocks: [
      {
        kind: 'straight',
        exercises: [
          { name: 'Staggered Stance One Arm Row', sets: s, reps: r, rest: '2m' },
          { name: 'TRX Hamstring Curl To Hip Press', sets: s, reps: i === 'low' ? '6-8' : i === 'medium' ? '6' : '7', rest: '2m' },
          { name: i === 'high' ? 'Underarm Pull Up (no assistance)' : 'Underarm Pull Up With Assistance', sets: s, reps: r, rest: '2m' },
          { name: 'Front Squat', sets: s, reps: r, rest: '2m' },
          { name: 'Lateral Barbell Step Up', sets: s, reps: '6', rest: '2m' },
          { name: 'Hanging Knee Raise', sets: i === 'high' ? '5' : s, reps: '8-10', rest: '2m' },
        ],
      },
    ],
  };
}

// ---------- Max strength & strength-speed ----------
function maxStrength(i: 'low' | 'medium'): Workout {
  const p = i === 'low' ? ['65%', '70%', '75%', '80%'] : ['70%', '75%', '80%', '85%'];
  const ladder = (name: string): ExerciseRx => ({ name, sets: '4', reps: `6 @${p[0]} · 5 @${p[1]} · 4 @${p[2]} · 3 @${p[3]}`, rest: '2m' });
  return {
    id: `pre-max1-${i}`,
    title: 'Max Strength 1',
    subtitle: `כוח מרבי · ${INT_HE[i]}`,
    category: 'strength',
    location: 'gym',
    videos: [V('Max Strength 1', '216568383/2b5f59ff62')],
    notes: ['האחוזים הם מ-1RM. צריך שותף לביטחון (spotter).', 'כל סט: חזרה אחת פחות ומשקל גבוה יותר.'],
    blocks: [
      {
        kind: 'straight',
        exercises: [ladder('Leg Press'), ladder('Bench Press'), ladder('Deadlift'), ladder('Military Press'), { name: 'Nordic', sets: '3', reps: i === 'low' ? '4' : '5', rest: '2m' }],
      },
    ],
  };
}

const strengthSpeed: Workout = {
  id: 'pre-ss1',
  title: 'Strength-Speed 1',
  subtitle: 'כוח-מהירות',
  category: 'strength',
  location: 'gym',
  videos: [V('Strength-Speed 1', '217074409/ebd53f8af2')],
  notes: [
    'מפעילים את הכוח במהירות מרבית.',
    'Lateral Box Jump: לסירוגין בין הצדדים.',
    'Shrugs: ידיים ישרות, כתפיים לאחור, ולסיים בעלייה על הבהונות.',
    'TRX Row: לרדת לאט, למשוך מהר בלי רפיון ברצועות.',
  ],
  blocks: [
    {
      kind: 'straight',
      exercises: [
        { name: 'Box Squat', sets: '3', reps: '7 @70%', rest: '2m' },
        { name: 'Lateral Box Jump', sets: '3', reps: '7 (BW)', rest: '2m' },
        { name: 'Shrugs', sets: '3', reps: '7 @70%', rest: '2m' },
        { name: 'Clap Press Ups', sets: '3', reps: '7 (BW)', rest: '2m' },
        { name: 'TRX Single Arm Row', sets: '3', reps: '7 (BW)', rest: '2m' },
        { name: 'Barbell Hip Thrust', sets: '3', reps: '7 @70%', rest: '2m' },
      ],
    },
  ],
};

// ---------- Gym cardio & TRX mobility ----------
const gymCardio1: Workout = {
  id: 'pre-cardio1',
  title: 'Gym Cardio 1',
  subtitle: 'קרדיו בחדר כושר',
  category: 'cardio',
  location: 'gym',
  videos: [V('Gym Cardio 1', '216742292/c2083ca2db')],
  blocks: [
    {
      kind: 'straight',
      note: 'כל הסטים של תרגיל לפני שעוברים לבא.',
      exercises: [
        { name: 'Skipping', sets: '4', reps: '30s', rest: '45s' },
        { name: 'Bosu Steps', sets: '4', reps: '20s', rest: '45s' },
        { name: 'Med Ball Slams Cone Shuffle', sets: '4', reps: '30s', rest: '45s' },
        { name: 'Toe Taps Top', sets: '4', reps: '30s', rest: '45s' },
        { name: 'Figure 8 Dribble', sets: '4', reps: '20s', rest: '45s' },
      ],
    },
  ],
};
const gymCardio2: Workout = {
  id: 'pre-cardio2',
  title: 'Gym Cardio 2',
  subtitle: 'קרדיו בחדר כושר',
  category: 'cardio',
  location: 'gym',
  videos: [V('Gym Cardio 2', '217074366/e38b7ea2d9')],
  blocks: [
    {
      kind: 'straight',
      note: 'כל הסטים של תרגיל לפני שעוברים לבא.',
      exercises: [
        { name: 'VIPR Side Step', sets: '4', reps: '30s', rest: '45s' },
        { name: 'Battle Ropes', sets: '4', reps: '20s', rest: '45s' },
        { name: 'Step Ups', sets: '4', reps: '20s', rest: '45s' },
        { name: 'Lateral Crawl', sets: '4', reps: '20s', rest: '45s' },
        { name: 'Lateral Hops', sets: '4', reps: '30s', rest: '45s' },
      ],
    },
  ],
};

export const TRX_YOGA_EXERCISES: ExerciseRx[] = [
  { name: 'Deep Sit', sets: '2', reps: '30s', rest: '15s' },
  { name: 'Wheel', sets: '2', reps: '15s', rest: '15s' },
  { name: 'Pyramid', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Warrior 2', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Low Lunge', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Triangle', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Half Pigeon', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Crescent Lunge', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Warrior 3', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Tree', sets: '1', reps: '30s', rest: '15s' },
  { name: 'Elbow To Knee', sets: '2', reps: '10', rest: '30s' },
  { name: 'Boat Scissors', sets: '2', reps: '10', rest: '30s' },
  { name: 'Side Plank', sets: '2', reps: '30s', rest: '30s' },
  { name: 'Crow', sets: '2', reps: '15s', rest: '30s' },
];

export const trxMobility: Workout = {
  id: 'trx-mobility',
  title: 'TRX Mobility (TRX Yoga)',
  subtitle: 'מוביליטי ב-TRX',
  category: 'mobility',
  location: 'gym',
  videos: [V('TRX Mobility', '217074472/9c3f0ad291')],
  notes: ['לכל צד. כל הסטים של תרגיל לפני הבא.'],
  blocks: [{ kind: 'straight', exercises: TRX_YOGA_EXERCISES }],
};

// ---------- SAQ (pitch) ----------
const SAQ_WARMUP = V('SAQ Warm-Up (כל המפגשים)', '216569611/db63d0ec54');
const SAQ_VIDEOS: Record<number, { mech: string; speed: string; stamina: string; kit: string }> = {
  1: { mech: '216571246/d95cf5b99c', speed: '216572350/66f2f75641', stamina: '216572681/7cde4e21d9', kit: '8 מוטות, 10 סמנים, כדור, 6 משוכות, סולם' },
  2: { mech: '216571904/81c58e828f', speed: '216742490/415df26541', stamina: '216742638/f6372f6115', kit: '8 מוטות, 15 סמנים, כדור, 6 משוכות, סולם' },
  3: { mech: '216742350/9b05d30c5c', speed: '216742535/6972a62077', stamina: '216742687/65bce651c5', kit: '10 מוטות, 12 סמנים, כדור, 6 משוכות, סולם' },
  4: { mech: '216742440/cb51eafa0f', speed: '216742598/5101aa3d1d', stamina: '216742729/4cb2f742ea', kit: '10 מוטות, 12 סמנים, כדור, 6 משוכות, סולם' },
};
const SAQ_STAMINA_RULE: Record<number, string> = {
  1: 'חזרה = הכדור חוזר למקומו המקורי. עצימות 70-80%.',
  2: 'ההליכה חזרה להתחלה היא חלק מהחזרה. עצימות 70-80%.',
  3: 'בונים עד ספרינט 100% בסמן האחרון: מתחילים בכ-30% ומעלים בכל סמן. סיבוב אחד = חזרה.',
  4: 'הגעה לקצה השני של השטח = חזרה. עצימות 70-80%.',
};
const SAQ_LAYOUT: Record<number, string> = {
  1: 'סטמינה 1: קו של 10 מ\' וקו של 20 מ\', קונוס כל 5 מ\'.',
  2: 'סטמינה 2: מקטעים של 30, 20, 15 ו-10 מ\' עם בובה.',
  3: 'סטמינה 3: עיגול בקוטר 30 מ\' (רדיוס 15 מ\').',
  4: 'סטמינה 4: ריבוע 40×40 מ\'.',
};

/** Stamina part of an SAQ day: reps × sets, rest between reps / between sets */
interface SaqDose {
  speedSets: number;
  reps: number;
  sets: number;
  restReps: string;
  restSets: string;
}

function saq(n: 1 | 2 | 3 | 4, d: SaqDose): Workout {
  const v = SAQ_VIDEOS[n]!;
  const blocks: Block[] = [
    { title: 'Warm-Up', kind: 'sequence', exercises: [{ name: 'SAQ Warm-Up', note: 'קווים של 10 מ\' ו-20 מ\'' }], videos: [SAQ_WARMUP] },
    {
      title: 'Movement Mechanics',
      kind: 'sequence',
      exercises: [{ name: `Movement Mechanics ${n}`, sets: '1', reps: '4 לכל תרגיל', note: 'חוזרים להתחלה בהליכה. תרגיל חד-צדדי: לכל צד.' }],
      videos: [V(`SAQ ${n} Mechanics`, v.mech)],
    },
    {
      title: 'Speed Circuit',
      kind: 'runs',
      exercises: [{ name: `Speed Circuit ${n}`, sets: String(d.speedSets), reps: '1', rest: 'התאוששות מלאה' }],
      note: 'מסלול בצורת M: 20 מ\' עלייה, 15 מ\' אלכסון ירידה, 15 מ\' אלכסון עלייה, 20 מ\' ירידה. רוחב 30 מ\'.',
      videos: [V(`SAQ ${n} Speed Circuit`, v.speed)],
    },
    {
      title: `Stamina Workout ${n}`,
      kind: 'runs',
      exercises: [{ name: `Stamina Workout ${n}`, sets: String(d.sets), reps: String(d.reps), rest: `${d.restReps} בין חזרות · ${d.restSets} בין סטים` }],
      note: `${SAQ_STAMINA_RULE[n]} ${SAQ_LAYOUT[n]}`,
      videos: [V(`SAQ ${n} Stamina`, v.stamina)],
    },
    { title: 'Cool Down', kind: 'sequence', exercises: [{ name: 'תנועה קלה 2 דקות' }, { name: 'מתיחות סטטיות', reps: '20-30s לכל מתיחה' }] },
  ];
  return {
    id: `pre-saq${n}-s${d.speedSets}-${d.reps}x${d.sets}-${d.restReps}-${d.restSets}`.replace(/\s/g, ''),
    title: `SAQ Session ${n}`,
    subtitle: 'מהירות, זריזות וקצב (מגרש) · 60-90 דק\'',
    category: 'saq',
    location: 'pitch',
    durationMin: 75,
    equipment: [v.kit],
    blocks,
  };
}

const testingDay: Workout = {
  id: 'testing',
  title: 'Testing Day',
  subtitle: 'יום בדיקות כושר (10 בדיקות)',
  category: 'testing',
  location: 'any',
  notes: ['לפי מדריך הבדיקות: מהקלות לקשות, ועדיף לפצל ליום מגרש ויום חדר כושר.'],
  blocks: [],
};

export const restDay: Workout = {
  id: 'rest',
  title: 'Complete Rest',
  subtitle: 'מנוחה מלאה',
  category: 'rest',
  location: 'any',
  blocks: [],
};

// ---------- The 70 days ----------
const S = (n: 1 | 2 | 3 | 4, speedSets: number, reps: number, sets: number, restReps: string, restSets: string) =>
  saq(n, { speedSets, reps, sets, restReps, restSets });

const W = {
  test: testingDay,
  rest: restDay,
  trx: trxMobility,
  c1: gymCardio1,
  c2: gymCardio2,
  ss: strengthSpeed,
};

/** Day 1..70 in order. Index 0 = day 1. */
const DAYS: Workout[] = [
  // Week 1
  W.test, seWorkout(1, 'low'), S(1, 8, 4, 2, '0', '45s'), hyp1('low'), W.rest, seWorkout(2, 'low'), S(2, 8, 4, 2, '0', '2m'),
  // Week 2
  W.trx, seWorkout(3, 'medium'), W.c1, hyp1('medium'), W.rest, seWorkout(1, 'medium'), S(3, 8, 2, 2, '10s', '2m'),
  // Week 3
  W.c2, seWorkout(2, 'medium'), W.trx, hyp2('low'), S(4, 8, 2, 3, '0', '1m'), seWorkout(3, 'medium'), W.trx,
  // Week 4
  S(1, 7, 5, 2, '0', '45s'), hyp2('medium'), W.trx, seWorkout(1, 'medium'), W.c1, hyp1('medium'), W.trx,
  // Week 5
  S(2, 6, 4, 3, '0', '2m'), seWorkout(2, 'medium'), W.c2, hyp1('low'), S(3, 6, 3, 2, '10s', '2m'), hyp2('medium'), W.rest,
  // Week 6
  W.test, maxStrength('low'), W.trx, hyp2('high'), S(4, 6, 2, 4, '0', '1m'), seWorkout(3, 'medium'), W.c1,
  // Week 7
  W.rest, W.trx, S(1, 5, 4, 2, '0', '45s'), maxStrength('medium'), W.c2, S(2, 5, 2, 4, '0', '2m'), W.rest,
  // Week 8
  W.rest, W.trx, maxStrength('medium'), W.c1, S(3, 5, 2, 3, '10s', '2m'), W.trx, maxStrength('medium'),
  // Week 9
  W.trx, seWorkout(1, 'low'), W.c2, S(4, 4, 3, 4, '0', '1m'), W.ss, W.rest, S(1, 4, 4, 4, '0', '45s'),
  // Week 10
  W.trx, W.c1, seWorkout(2, 'medium'), S(2, 4, 4, 4, '0', '2m'), W.ss, W.rest, W.test,
];

export const PRESEASON_WORKOUTS: Workout[] = (() => {
  const seen = new Map<string, Workout>();
  for (const w of DAYS) if (!seen.has(w.id)) seen.set(w.id, w);
  return [...seen.values()];
})();

export const PRESEASON_DAYS: DayPlan[] = DAYS.map((w, i) => ({
  day: i + 1,
  rest: w.id === 'rest',
  sessions: w.id === 'rest' ? [] : [{ workoutId: w.id }],
}));

export const PRESEASON_LENGTH = DAYS.length;
