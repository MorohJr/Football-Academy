// SPEED.pdf, STAMINA.pdf, BODYWEIGHT__FAT_BURN___YOGA.pdf: the three 4-week booster programmes (SPEC 5.3-5.5).
import type { ExerciseRx, Workout, VideoLink } from './types';

const V = (label: string, id: string): VideoLink => ({ label, url: `https://vimeo.com/${id}` });
const W4 = [1, 2, 3, 4] as const;

export const DYNAMIC_WARMUP = V('Full Dynamic Warm-Up', '261816491');

// =================== SPEED ===================
export const SPEED_NOTES = [
  'בכדורגל חשובים האצה, בלימה ושינוי כיוון יותר ממהירות מרבית: צריך להגיע למהירות מרבית בפחות מ-30 מ\'.',
  'כל ספרינט ב-100%. איכות ולא כמות. התאוששות מלאה לפני כל חזרה וכל סט.',
  'לא בונים עייפות שרירית. מי שלא עשה פליומטריקה עלול להרגיש כאב שרירים יום-יומיים: מחכים שיעבור.',
  'אין אימוני כוח אחרים ב-4 השבועות האלה. מניעת פציעות מותר.',
  'עמוס או כואב? גם יום אחד או שניים בשבוע מקדמים. רעננות לאימון ולמשחק קודמת.',
  'משקל בחדר כושר: עד משקל גוף + 20-30% או 20-30% מ-1RM. Nordics לאט ובשליטה.',
  'שתייה: סיכה למפרקים, אספקת חומרים, מהירות העברת עצבים.',
];

/** W1 6×5, W2 5×6, W3 4×7, W4 3×8 (gym + plyometrics) */
const GYM_DOSE: Record<number, [string, string]> = { 1: ['5', '6'], 2: ['6', '5'], 3: ['7', '4'], 4: ['8', '3'] };
/** Sprints: 1 rep × W1 8, W2 6, W3 5, W4 3 sets */
const SPRINT_SETS: Record<number, string> = { 1: '8', 2: '6', 3: '5', 4: '3' };

const SPEED_GYM = [
  { n: 1, video: '275160165/031cb47861', ex: ['Bench Step Up Hops', 'TRX Lean Knee Drive', 'Arm Sprints (10s burst = 1 set)', 'Reverse Lunge High Step', 'Calf Raises', 'Box Squats'] },
  { n: 2, video: '275160296/f79294cd52', ex: ['Box Jumps', 'TRX Mountain Climbers (15s = 1 set)', 'Med Ball Vertical Jumps', 'Med Ball Diagonal Jumps', 'Split Squats', 'Deadlifts'] },
  { n: 3, video: '275160441/b2cc7e74d9', ex: ['Depth Jumps', 'Resistance Band Kick Back', 'Nordics', 'Forward Lunge', 'Barbell Glute Raise', 'Dead Treadmill (15s effort = 1 set)'] },
];

const SPEED_PITCH = [
  {
    n: 1,
    focus: 'מהירות קווית',
    plyo: ['Broad Jumps (1 jump = 1 rep)', 'Bounding', 'Running Style Jumps'],
    plyoVideo: '410229680/b7c1744b9a',
    sprintVideo: '410240797/5d63593355',
    kit: '5 סמנים, 2 משוכות קטנות, כדור',
    sprints: ['Sprint 1: מהמשוכות, 10 מ\'', 'Sprint 2: 15 מ\' ואז 5 מ\' בפנייה', 'Sprint 3: 10 מ\' ואז 15 מ\' (ריאקטיבי)', 'Sprint 4: 30 מ\' (ריאקטיבי)'],
    reactive: 'בספרינטים 3 ו-4: עוצמים עיניים, זורקים את הכדור ויוצאים ברגע ששומעים אותו נוחת.',
  },
  {
    n: 2,
    focus: 'מהירות רב-כיוונית',
    plyo: ['Single Leg Header Leaps', 'Knee Tuck Jumps', 'Counter Movement Jumps'],
    plyoVideo: '410233442/615dec1cb6',
    sprintVideo: '410247191/ff5797592b',
    kit: '9 סמנים, כדור',
    sprints: ['Sprint 1: שער 2 מ\' ו-20 מ\'', 'Sprint 2: 3 מ\' ו-25 מ\'', 'Sprint 3: סלאלום מוטות 1 מ\', 3 מ\', 10 מ\' (ריאקטיבי)', 'Sprint 4: מוטות 1 מ\', 10 מ\', 10 מ\''],
    reactive: 'בספרינט 3: עוצמים עיניים, זורקים את הכדור ויוצאים ברגע ששומעים אותו נוחת.',
  },
  {
    n: 3,
    focus: 'בלימה',
    plyo: ['Dorsi-Flexed Jumps', 'Knee Drives', 'Side To Side Hops'],
    plyoVideo: '410254526/0357177b09',
    sprintVideo: '410252013/0a0461160c',
    kit: '6 סמנים, 3 משוכות קטנות, כדור',
    sprints: ['Sprint 1: 3 מ\' ו-5 מ\' בין מוטות', 'Sprint 2: 25 מ\' לשער של 2 מ\' (ריאקטיבי)', 'Sprint 3: 3 מ\' ו-2 מ\'', 'Sprint 4: 5 מ\', 10 מ\', 5 מ\''],
    reactive: 'בספרינט 2: עוצמים עיניים, זורקים את הכדור ויוצאים ברגע ששומעים אותו נוחת.',
  },
];

export const SPEED_COACHING: VideoLink[] = [
  V('Ladder & Hurdle Mechanics', '386467874/6abec0a71d'),
  V('Perfect Sprinting Technique', '386465522/50e7f540a1'),
  V('Pro Sprinting Analysis', '386463984/87a3893563'),
  V('Fast Turning Technique', '265193577'),
  V('Fast Stopping Technique', '256096654'),
];

const speedGym = (n: number, week: number): Workout => {
  const g = SPEED_GYM.find((x) => x.n === n)!;
  const [sets, reps] = GYM_DOSE[week]!;
  return {
    id: `spd-gym${n}-w${week}`,
    title: `Speed Gym Workout ${n}`,
    subtitle: `כוח מהירות · שבוע ${week} · עד 40 דק'`,
    category: 'speed',
    location: 'gym',
    durationMin: 40,
    videos: [V(`Speed Gym ${n}`, g.video)],
    notes: ['כל חזרה נפיצה אבל בשליטה. Nordics לאט. לא עובדים עד עייפות.'],
    blocks: [{ kind: 'straight', exercises: g.ex.map((name): ExerciseRx => ({ name, sets, reps, rest: 'התאוששות מלאה' })) }],
  };
};

const speedPitch = (n: number, week: number): Workout => {
  const p = SPEED_PITCH.find((x) => x.n === n)!;
  const [sets, reps] = GYM_DOSE[week]!;
  return {
    id: `spd-pitch${n}-w${week}`,
    title: `Speed Pitch Session ${n}`,
    subtitle: `${p.focus} · שבוע ${week} · כשעה`,
    category: 'speed',
    location: 'pitch',
    durationMin: 60,
    equipment: [p.kit],
    videos: [DYNAMIC_WARMUP, V('Priming Exercises', '410132972/2774e2eb0d'), V('Plyometrics', p.plyoVideo), V('Sprints', p.sprintVideo), V('Band Stretching', '227606185')],
    blocks: [
      { title: 'Warm-Up', kind: 'sequence', exercises: [{ name: 'Full Dynamic Warm-Up' }, { name: 'Priming Exercises', sets: '1', reps: '5 חזרות/ריצות מכל אחד' }] },
      { title: 'Plyometrics', kind: 'straight', exercises: p.plyo.map((name) => ({ name, sets, reps, rest: 'התאוששות מלאה' })) },
      { title: 'Sprints', kind: 'runs', note: p.reactive, exercises: p.sprints.map((name) => ({ name, sets: SPRINT_SETS[week], reps: '1', rest: 'התאוששות מלאה' })) },
      { title: 'Cool Down', kind: 'sequence', exercises: [{ name: 'ג\'וג רב-כיווני קל', reps: '2-3 דק\'' }, { name: 'מתיחות סטטיות (או גומייה)' }] },
    ],
  };
};

export const SPEED_WORKOUTS: Workout[] = W4.flatMap((w) => [1, 2, 3].flatMap((n) => [speedGym(n, w), speedPitch(n, w)]));

/** Example week: D1 Gym1+Pitch1, D2 rest, D3 Gym2+Pitch2, D4 rest, D5 Gym3+Pitch3, D6-7 rest */
export function speedWeek(week: number) {
  return [
    { day: 1, sessions: [`spd-gym1-w${week}`, `spd-pitch1-w${week}`] },
    { day: 2, sessions: [] },
    { day: 3, sessions: [`spd-gym2-w${week}`, `spd-pitch2-w${week}`] },
    { day: 4, sessions: [] },
    { day: 5, sessions: [`spd-gym3-w${week}`, `spd-pitch3-w${week}`] },
    { day: 6, sessions: [] },
    { day: 7, sessions: [] },
  ];
}

// =================== STAMINA ===================
export const STAMINA_NOTES = [
  'סטמינה בכדורגל = לחזור שוב ושוב על מאמצים קצרים ומהירים עם התאוששות קצרה, 90+ דקות.',
  'אימון רציף ואחיד (כמו 5 ק"מ) לא מתאים לכדורגל. מתאמנים לקצב ולא למשך.',
  'ב-4 השבועות האלה: רק אימוני קבוצה ומשחקים, התוכנית הזו, ומניעת פציעות בעצימות נמוכה.',
  'הכי טוב: מיד אחרי אימון קבוצה (כבר חמים ועייפים). אחרת, כמה שיותר רחוק מהאימון, ולתדלק לפני.',
  'מעקב יומי, תזונה, שינה ועבודה על מיינדסט.',
  'אם הכושר בשיא: להתחיל מהשבוע מתקדם יותר, או כל חזרה ב-100%, או להוסיף בעיטה לשער בסוף התרגיל.',
  'Multi-Sprint: עד 72 ריצות בסטים של עד 6. Speed Repeatability: עד 20 ריצות; מקצרים מנוחה כדי להקשות.',
];

export const STAMINA_TYPES = [
  { name: 'Multi-Sprint Stamina', text: 'ריצת אינטרוולים רב-כיוונית, הרבה חזרות ומנוחה קצרה, 20-40 מ\' ב-80-95% ממהירות מרבית. 30-72 ריצות באימון.' },
  { name: 'Speed Repeatability', text: 'מעט סטים באיכות גבוהה, 10-20 מ\' רב-כיווני, מנוחה קצרה, 100%. הריצה האחרונה מהירה כמו הראשונה. 12-20 ריצות באימון.' },
];

export const STAMINA_ADAPTATIONS = [
  'VO2 max עד +20% (למי שלא מאומן)', 'סף לקטט גבוה יותר', 'יותר שומן כדלק, חיסכון בפחמימות', 'ייצור אנרגיה אירובי יעיל יותר',
  'ייצור ATP אירובי', 'חילוף חמצן טוב יותר בריאות', 'תפוקת לב גבוהה יותר', 'יותר כדוריות דם אדומות והמוגלובין', 'זרימת דם טובה יותר לשרירים',
];

const MSS_SETS: Record<number, string> = { 1: '5', 2: '6', 3: '7', 4: '8' };
const SR_SETS: Record<number, string> = { 1: '3', 2: '4', 3: '5', 4: '5' };
const STAMINA_SESSIONS = [
  { n: 1, mss: { layout: '10 מ\' · 30 מ\' · 10 מ\'', kit: '4-8 סמנים + כדור', video: '273727044/fd81979737' }, sr: { layout: '5 מ\' · 15 מ\' · 5 מ\'', kit: '4-8 סמנים + כדור', video: '273728285/0e69ca731c' } },
  { n: 2, mss: { layout: '10 מ\' · 30 מ\' · 10 מ\'', kit: '6-12 סמנים', video: '273727360/92647d1ab1' }, sr: { layout: '5 מ\' · 5 מ\' · 15 מ\'', kit: '6-12 סמנים', video: '273728468/ae98240677' } },
  { n: 3, mss: { layout: '10 מ\' · 20 מ\' · 5 מ\' · 10 מ\'', kit: '6-12 סמנים', video: '273727608/217d5df260' }, sr: { layout: '5 מ\' · 15 מ\' · 5 מ\'', kit: '8-16 סמנים', video: '273728707/c2a7f83e4e' } },
  { n: 4, mss: { layout: '10 מ\' · 30 מ\' · 10 מ\'', kit: '10-14 סמנים + 2 כדורים', video: '273727931/cd9f948250' }, sr: { layout: '5 מ\' · 15 מ\'', kit: 'סמנים', video: '273728935/a2b149bb51' } },
];

export const STAMINA_COACHING: VideoLink[] = [
  V('Last Resort Treadmill Stamina Programme', '438534476/dfa079c158'),
  V('The Biggest Stamina Training Mistake', '386445678/1e5839794f'),
  V('Plan "B" Pool Workout', '386444689/38f8563ba5'),
];

const staminaSession = (n: number, week: number): Workout => {
  const s = STAMINA_SESSIONS.find((x) => x.n === n)!;
  return {
    id: `sta-s${n}-w${week}`,
    title: `Stamina Session ${n}`,
    subtitle: `סטמינה · שבוע ${week}`,
    category: 'stamina',
    location: 'pitch',
    durationMin: 45,
    equipment: [s.mss.kit, s.sr.kit],
    videos: [DYNAMIC_WARMUP, V('Multi-Sprint Stamina', s.mss.video), V('Speed Repeatability', s.sr.video)],
    blocks: [
      { title: 'Warm-Up', kind: 'sequence', exercises: [{ name: 'Full Dynamic Warm-Up', note: 'חובה לפני כל אימון.' }] },
      { title: 'Multi-Sprint Stamina', kind: 'runs', note: `מבנה: ${s.mss.layout}. הלוך וחזור = 2 חזרות.`, exercises: [{ name: 'Multi-Sprint Stamina', sets: MSS_SETS[week], reps: '6', rest: '60s בין סטים' }], videos: [V('Multi-Sprint Stamina', s.mss.video)] },
      { title: 'Speed Repeatability', kind: 'runs', note: `מבנה: ${s.sr.layout}. חוזרים בהליכה בין חזרות.`, exercises: [{ name: 'Speed Repeatability', sets: SR_SETS[week], reps: '4', rest: '90s בין סטים' }], videos: [V('Speed Repeatability', s.sr.video)] },
      { title: 'Cool Down', kind: 'sequence', exercises: [{ name: 'ג\'וג קל', reps: '3 דק\'' }, { name: 'מתיחות סטטיות', reps: '20-30s לכל מתיחה' }] },
    ],
  };
};

export const STAMINA_WORKOUTS: Workout[] = W4.flatMap((w) => [1, 2, 3, 4].map((n) => staminaSession(n, w)));

/** D1 S1, D2 S2, D3 rest, D4 S3, D5 S4, D6-7 rest */
export function staminaWeek(week: number) {
  return [
    { day: 1, sessions: [`sta-s1-w${week}`] },
    { day: 2, sessions: [`sta-s2-w${week}`] },
    { day: 3, sessions: [] },
    { day: 4, sessions: [`sta-s3-w${week}`] },
    { day: 5, sessions: [`sta-s4-w${week}`] },
    { day: 6, sessions: [] },
    { day: 7, sessions: [] },
  ];
}

// =================== BODYWEIGHT & FAT BURN + YOGA ===================
export const BODYWEIGHT_NOTES = [
  '4 אימוני משקל גוף בשבוע (עד 30 דק\' כל אחד) + 4 אימוני יוגה בעצימות נמוכה, במשך 4 שבועות.',
  'אימוני משקל הגוף הם כל אימוני הכוח של השבוע. לא מוסיפים אימוני כוח אחרים.',
  'מתי: בוקר מוקדם, רחוק מאימון הקבוצה, או מיד אחרי אימון הקבוצה.',
  'יום מנוחה מלא ביום שלפני משחק.',
  'מרגיש עומס יתר? 3 אימונים בשבוע או פחות סטים.',
  'מבצעים כמעגל: סט אחד מכל תרגיל, ואז עוד סבב. תרגיל ברגל אחת: 2 סטים לכל רגל.',
  'מי שלא מתאמן עם קבוצה: יוגה לפני אימון משקל הגוף.',
];

export const BODYWEIGHT_BENEFITS = [
  'מהירות ספרינט (קפיצות אנכיות)', 'גמישות וניידות (טווח תנועה מלא)', 'יציבות מפרקים ופחות פציעות', 'רגישות לאינסולין ושליטה בסוכר',
  'כושר אירובי ואנאירובי, יותר שריפת שומן', 'יעיל בזמן', 'בלי ציוד', 'מתאים לכל רמה', 'שלושת מישורי התנועה',
];

const BW_TIMING: Record<number, [string, string]> = { 1: ['30s', '20s'], 2: ['30s', '10s'], 3: ['35s', '15s'], 4: ['35s', '10s'] };
const BW = [
  { n: 1, video: 'showcase/7954025', ex: ['Press Up Walks', 'Open Close Jumps', 'Lateral Rock', 'Oblique Mountain Climber', 'Star Jumps', "RDL's", 'Elbow To Knee Skip'] },
  { n: 2, video: 'showcase/7954033', ex: ['Press Up Extension', 'Forward Backwards Jumps', 'Pulsing Wide Squat', 'Inverted Press Up', 'Skater Hops', 'Split Squat', 'Squat Thrusts'] },
  { n: 3, video: 'showcase/7954038', ex: ['Spiderman Crawl', 'High Knee Jog', 'Glute Raises', 'Tricep Extension', 'Running Straddle', 'Diagonal Lunges', 'Rebound Knee-Tuck Jumps'] },
  { n: 4, video: 'showcase/7954046', ex: ['Scorpion Twists', 'Knee Drives', 'Squat Kicks', 'Explosive Press Ups', 'Reverse Lunge Squat Jumps', 'Split-Legged Climbers', 'Squat Sprint'] },
];

const bwWorkout = (n: number, week: number): Workout => {
  const b = BW.find((x) => x.n === n)!;
  const [on, off] = BW_TIMING[week]!;
  return {
    id: `bw${n}-w${week}`,
    title: `Bodyweight & Fat Burn ${n}`,
    subtitle: `משקל גוף ושריפת שומן · שבוע ${week} · ${on}/${off} × 4`,
    category: 'bodyweight',
    location: 'home',
    durationMin: 30,
    videos: [V(`Bodyweight & Fat Burn ${n}`, b.video)],
    notes: ['עבודה בזמן "on", מנוחה בזמן "off" ומיד לתרגיל הבא. אין מנוחה נוספת בין סבבים.'],
    blocks: [{ kind: 'timed', timeOn: on, timeOff: off, rounds: '4', exercises: b.ex.map((name) => ({ name })) }],
  };
};

export const YOGA: Workout[] = [
  { id: 'yoga-pre-training', title: 'Pre-Training Yoga', subtitle: 'יוגה לפני אימון · 20 דק\'', category: 'yoga', location: 'home', durationMin: 20, videos: [V('Pre-Training Yoga', '317229095/a09069fc0d')], blocks: [] },
  { id: 'yoga-pre-match', title: 'Pre-Match Yoga', subtitle: 'יוגה לפני משחק · 5 דק\'', category: 'yoga', location: 'any', durationMin: 5, videos: [V('Pre-Match Yoga', '317228128/9b68fd4e2e')], blocks: [] },
  { id: 'yoga-post', title: 'Post-Match & Training Yoga', subtitle: 'יוגה אחרי משחק/אימון · 10 דק\'', category: 'yoga', location: 'any', durationMin: 10, videos: [V('Post-Match & Training Yoga', '317226201/eef641bd88')], blocks: [] },
  { id: 'yoga-recovery', title: 'Recovery Day Yoga', subtitle: 'יוגה ליום התאוששות · 50 דק\'', category: 'yoga', location: 'home', durationMin: 50, videos: [V('Recovery Day Yoga', '317217913/6e21421b99')], blocks: [] },
];

export const BODYWEIGHT_AUDIO: VideoLink[] = [
  V("What's the ideal body fat % for a footballer?", '385960098/4ddaa33756'),
  V('How to lose fat during the season', '385962533/f93ca11104'),
  V('Should footballers do intermittent fasting?', '385962245/02b8650241'),
  // The PDF links "barefoot" to the same video as intermittent fasting (SPEC 12).
  V('The benefits of training barefoot', '385962245/02b8650241'),
];

export const BODYWEIGHT_WORKOUTS: Workout[] = [...W4.flatMap((w) => [1, 2, 3, 4].map((n) => bwWorkout(n, w))), ...YOGA];

/** D1 yoga+BW1, D2 yoga+BW2, D3 rest, D4 yoga+BW3, D5 yoga+BW4, D6-7 rest. Yoga picks by context; default pre-training. */
export function bodyweightWeek(week: number) {
  return [
    { day: 1, sessions: ['yoga-pre-training', `bw1-w${week}`] },
    { day: 2, sessions: ['yoga-pre-training', `bw2-w${week}`] },
    { day: 3, sessions: [] },
    { day: 4, sessions: ['yoga-pre-training', `bw3-w${week}`] },
    { day: 5, sessions: ['yoga-pre-training', `bw4-w${week}`] },
    { day: 6, sessions: [] },
    { day: 7, sessions: [] },
  ];
}
