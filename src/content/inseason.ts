// IN-SEASON.pdf: 10 weeks, strength blocks of 2 weeks, core/speed/stamina pairs of weeks (SPEC 5.2).
import type { ExerciseRx, Workout, VideoLink } from './types';

const V = (label: string, id: string): VideoLink => ({ label, url: `https://vimeo.com/${id}` });

export const INSEASON_GUIDELINES = [
  'עוקבים אחרי הלו"ז השבועי, אבל אפשר להתאים אותו לשבוע שלך.',
  'המטרה: לשמור על כל מרכיבי הכושר בעונה, בלי פציעות ובלי עייפות מיותרת, ולהשתפר איפה שאפשר.',
  'אם אי אפשר להוסיף משקל, מאטים את התנועה עם אותו משקל.',
  'אחוזי 1RM: מחשבון 1RM או בדיקת 1RM אמיתית. רושמים את התוצאות.',
  'תרגיל חד-צדדי: הסטים והחזרות לכל צד.',
  'עייף מדי? מורידים סטים/חזרות, נחים, או מחליפים באימון קל (מניעת פציעות או התאוששות פעילה).',
  '10 שבועות, יותר מ-130 תרגילים. בסוף אפשר לחזור מההתחלה.',
  'אחרי 4-6 שבועות אפשר שבוע הורדת עומס של 50% (חצי מהסטים או החזרות).',
  'פלג גוף תחתון: כמה שיותר רחוק מאימונים ומשחקים.',
];

export const FATIGUE_TYPES = [
  { name: 'מטבולית', text: 'עייפות בתא השריר, בדרך כלל מסבולת או כוח.' },
  { name: 'עצבית', text: 'מקהה את החושים ואת ההולכה לשרירים, פחות כוח. בדרך כלל מעצימות יתר.' },
  { name: 'הורמונלית', text: 'שינויים הורמונליים בגלל לחץ.' },
  { name: 'פסיכולוגית', text: 'לחץ, חרדה או ירידה בביטחון.' },
];

/** Timing hint for every in-season session type (schedule printout). */
export const INSEASON_TIMING = {
  upper: 'בוקר מוקדם, כמה שיותר רחוק מהאימון/משחק',
  lower: 'בוקר מוקדם, כמה שיותר רחוק מהאימון/משחק',
  core: 'מיד אחרי האימון',
  speed: 'מיד לפני האימון',
  stamina: 'מיד אחרי האימון',
  injury: 'בכל שעה',
  prematch: '1.5-3 שעות לפני שריקת הפתיחה',
  recovery: 'רצוי בבוקר',
} as const;

// ---------- Strength (2-week blocks) ----------
type StrengthBlock = 1 | 2 | 3 | 4 | 5; // weeks 1-2, 3-4, 5-6, 7-8, 9-10
const BLOCK_NAME: Record<StrengthBlock, string> = { 1: 'Explosiveness', 2: 'Speed', 3: 'Endurance', 4: 'Hypertrophy', 5: 'Max Strength' };
const BLOCK_HE: Record<StrengthBlock, string> = { 1: 'פיצוץ', 2: 'מהירות', 3: 'סבולת', 4: 'היפרטרופיה', 5: 'כוח מרבי' };

const all = (names: string[], sets: string, reps: string, rest: string): ExerciseRx[] => names.map((name) => ({ name, sets, reps, rest }));
const ladder = (name: string): ExerciseRx => ({ name, sets: '4', reps: '6 @70% · 5 @75% · 4 @80% · 3 @85%', rest: 'התאוששות מלאה' });

const UPPER: Record<StrengthBlock, { ex: ExerciseRx[]; video: string; note?: string }> = {
  1: {
    ex: all(['Barbell Push Press', 'Basic Hang Clean', 'Dumbbell Explosive Chest Press', 'Barbell Shrug', 'Explosive Pull Up', 'Barbell High Pull'], '3', '7', '90s'),
    video: 'showcase/5887189',
    note: 'משקל שמעייף עד החזרה האחרונה אבל עדיין מאפשר תנועה מהירה ונפיצה.',
  },
  2: {
    ex: all(['Clap Press Up', 'Band Elbow Drives', 'Med Ball Slams', 'Med Ball Vertical Throw', 'Woodchop Hold & Return', 'Rebound Press Up'], '5', '6', '60s'),
    video: 'showcase/5887204',
    note: 'Rebound Press Up: לא להוריד את החזה לרצפה, לחזור לכדור מהר.',
  },
  3: {
    ex: all(['Lat Pulldown', 'Dumbbell Shoulder Press', 'TRX Press Up', 'TRX Row', 'Band Straight Pull Down', 'Swiss Ball Back Extension'], '3', '12-15', '90s'),
    video: 'showcase/5887213',
    note: 'עייף מאוד בחזרה האחרונה. Back Extension אפשר במשקל גוף.',
  },
  4: {
    ex: all(['Underarm Pull Up', 'Front Raise', 'Swiss Ball Inverse Row', 'Lateral Raise', 'Cable Fly', 'Barbell Bent Over Row'], '4', '10', '90s'),
    video: 'showcase/5887223',
  },
  5: {
    ex: [ladder('Wide Grip Pull Up'), ladder('Bench Press'), ladder('Military Press'), ladder('Dumbbell Bench Row')],
    video: 'showcase/5887230',
    note: 'כל סט: חזרה אחת פחות ומשקל גבוה יותר. מנוחה עד התאוששות מלאה.',
  },
};

const LOWER: Record<StrengthBlock, { ex: ExerciseRx[]; video: string; note?: string }> = {
  1: {
    ex: all(['Box Squat', 'Calf Raise Jumps', 'Kettlebell Clean & Press', 'Squat Jumps', 'Kettlebell Swings', 'Dumbbell Step Up Jumps'], '3', '7', '90s'),
    video: 'showcase/5887255',
    note: 'Box Squat: לרדת לאט, לעלות מהר. Squat Jumps: למשוך את המוט לגוף. KB Swing: דחיפת אגן קדימה.',
  },
  2: {
    ex: [
      { name: "Knee's To Feet", sets: '5', reps: '3', rest: '60s' },
      ...all(['Box Jump', 'Depth Jump', 'Lateral Single Leg Box Jump', 'Lunge Jump', 'Knee Tuck Jump'], '5', '6', '60s'),
    ],
    video: 'showcase/5887265',
  },
  3: {
    // The PDF lists "Leg Abduction" twice; the second was replaced with Leg Adduction (SPEC 12.3).
    ex: all(['Resisted Forward Lunge', 'Lying Band Hamstring Curl', 'Band Front Pull', 'Leg Abduction', 'Leg Adduction', 'Calf Raise'], '3', '12-15', '90s'),
    video: 'showcase/5887287',
  },
  4: {
    ex: all(['Front Squat', 'Kettlebell Lateral Step Up', 'Leg Curl', 'Leg Extension', 'Bulgarian Split Squat', 'Barbell Bent Over Row'], '4', '10', '90s'),
    video: 'showcase/5887292',
  },
  5: {
    ex: [
      { name: 'TRX Single Leg Squat', sets: '4', reps: '6 · 5 · 4 · 3 (משקל גוף)', rest: 'התאוששות מלאה', note: 'שליטה, העקב נשאר על הקרקע.' },
      ladder('Barbell Step Up'),
      ladder('Deadlift'),
      ladder('Leg Press'),
    ],
    video: 'showcase/5887301',
  },
};

function strengthWorkout(kind: 'upper' | 'lower', b: StrengthBlock): Workout {
  const src = kind === 'upper' ? UPPER[b] : LOWER[b];
  const he = kind === 'upper' ? 'פלג גוף עליון' : 'פלג גוף תחתון';
  return {
    id: `in-${kind}-${b}`,
    title: `${kind === 'upper' ? 'Upper' : 'Lower'} Body · ${BLOCK_NAME[b]}`,
    subtitle: `${he} · ${BLOCK_HE[b]} (שבועות ${b * 2 - 1}-${b * 2})`,
    category: 'strength',
    location: 'gym',
    durationMin: 40,
    videos: [V(`${kind === 'upper' ? 'Upper' : 'Lower'} Body weeks ${b * 2 - 1}-${b * 2}`, src.video)],
    notes: src.note ? [src.note] : [],
    blocks: [{ kind: 'straight', exercises: src.ex }],
  };
}

// ---------- Core (5 circuits, each used in 2 weeks with different timing) ----------
const CORE: { ex: string[]; video: string; weeks: [number, string, string][] }[] = [
  { ex: ['Crunch', 'Sky Kicks', 'Russian Twist', 'Diagonal Plank', 'Butterfly Sit Up'], video: 'showcase/5887310', weeks: [[1, '30s', '20s'], [6, '35s', '10s']] },
  { ex: ["Knee's Up Crunch", 'Lying Criss Cross', 'V Sit', 'Knee To Elbow', 'Knee Pendulum'], video: 'showcase/5887317', weeks: [[2, '35s', '20s'], [7, '40s', '10s']] },
  { ex: ['Legs Up/Down', 'Lying Flutter Kicks', 'Seated Criss Cross', 'Knee Touches', 'V Hold'], video: 'showcase/5887326', weeks: [[3, '40s', '20s'], [8, '45s', '10s']] },
  { ex: ['Toe Reach', 'Knee To Chest', 'Seated Flutter Kicks', 'Reverse Plank', 'Lying Cycle'], video: 'showcase/5887336', weeks: [[4, '45s', '20s'], [9, '30s', '0']] },
  { ex: ['Sit Up', 'Reverse Crunch', 'Seated Cycle', 'Swimmer', 'Boat Sit'], video: 'showcase/5887340', weeks: [[5, '30s', '10s'], [10, '35s', '0']] },
];

function coreWorkout(week: number): Workout {
  const c = CORE.find((x) => x.weeks.some(([w]) => w === week))!;
  const [, on, off] = c.weeks.find(([w]) => w === week)!;
  return {
    id: `in-core-w${week}`,
    title: `Core · Week ${week}`,
    subtitle: `בטן/ליבה · ${on} עבודה / ${off === '0' ? 'בלי מנוחה' : `${off} מנוחה`} · סבב אחד`,
    category: 'core',
    location: 'any',
    durationMin: 5,
    videos: [V(`Core weeks ${c.weeks.map((w) => w[0]).join(' & ')}`, c.video)],
    blocks: [{ kind: 'timed', timeOn: on, timeOff: off, rounds: '1', exercises: c.ex.map((name) => ({ name })) }],
  };
}

// ---------- Speed (sprints, 1 set, 1-2 min rest) ----------
interface Drill {
  name: string;
  reps: [number, number]; // [first week, second week]; 0 = N/A
  setup: string;
  video: string;
}
const SPEED: { weeks: [number, number]; drills: Drill[] }[] = [
  {
    weeks: [1, 6],
    drills: [
      { name: 'Sprint 1', reps: [8, 6], setup: '20 מ\' עם מוט באמצע (10 מ\').', video: '227609121/99c3cd93a7' },
      { name: 'Sprint 2', reps: [8, 6], setup: '20 מ\' עם 4 מוטות זריזות במרווחים שווים.', video: '227609156/84e441dee4' },
    ],
  },
  {
    weeks: [2, 7],
    drills: [
      { name: 'Sprint 1', reps: [8, 5], setup: '20 מ\' עם 4 מוטות זריזות במרווחים שווים.', video: '227615549/ff0d72b9ee' },
      { name: 'Sprint 2', reps: [8, 5], setup: '20 מ\', שני קונוסים 3 מ\' מההתחלה, 5 מ\' זה מזה.', video: '227609173/5dacc099e0' },
    ],
  },
  {
    weeks: [3, 8],
    drills: [
      { name: 'Sprint 1', reps: [7, 4], setup: '20 מ\' עם ריבוע 3×3 מ\' במרחק 3 מ\' מההתחלה.', video: '227609204/053fb2cf31' },
      { name: 'Sprint 2', reps: [7, 4], setup: '20 מ\', כדור אחד על קו ההתחלה וכדור שני 5 מ\' ממנו.', video: '227609247/87bbeffbd8' },
    ],
  },
  {
    weeks: [4, 9],
    drills: [
      { name: 'Sprint 1', reps: [7, 3], setup: '20 מ\'. קונוס 7 מ\' מההתחלה ומוט 2 מ\' באלכסון שמאלה; קונוס נוסף 7 מ\' אחריו ומוט 2 מ\' באלכסון ימינה.', video: '227609266/af5f4159ae' },
      { name: 'Sprint 2', reps: [7, 3], setup: '20 מ\' עם סמנים ב-7 וב-14 מ\' שמסמנים איפה לבלום.', video: '227609288/231fec06c1' },
    ],
  },
  {
    weeks: [5, 10],
    drills: [
      { name: 'Sprint 1', reps: [6, 3], setup: '20 מ\' עם סמנים במרחק 5 מ\' זה מזה ב-10 מ\'.', video: '227609309/f46dd6e322' },
      { name: 'Sprint 2', reps: [6, 3], setup: '20 מ\' עם סמן 3 מ\' מההתחלה: עד אליו בריצה לאחור.', video: '227609332/fbe1a74a0d' },
      { name: 'Sprint 3', reps: [0, 3], setup: '20 מ\', סמן 3 מ\' מההתחלה ו-4 סמנים במרווחים שווים החל מ-10 מ\'.', video: '227609091/4fee2f23aa' },
    ],
  },
];

function speedWorkout(week: number): Workout {
  const g = SPEED.find((x) => x.weeks.includes(week))!;
  const idx = g.weeks[0] === week ? 0 : 1;
  const drills = g.drills.filter((d) => d.reps[idx]! > 0);
  return {
    id: `in-speed-w${week}`,
    title: `Speed · Week ${week}`,
    subtitle: 'ספרינטים · סט אחד, 1-2 דק\' מנוחה',
    category: 'speed',
    location: 'pitch',
    durationMin: 20,
    videos: drills.map((d) => V(d.name, d.video)),
    notes: ['100% בכל ספרינט.'],
    blocks: drills.map((d) => ({ kind: 'runs' as const, title: d.name, note: d.setup, exercises: [{ name: d.name, sets: '1', reps: String(d.reps[idx]), rest: '1-2 דק\'' }], videos: [V(d.name, d.video)] })),
  };
}

// ---------- Stamina (2 runs; run 1 rest 2-3 min, run 2 rest 1-2 min) ----------
interface Run {
  reps: [number, number];
  sets: [number, number];
  setup: string;
  video: string;
}
const PYRAMID5 = 'חזרה = ג\'וג 1 | ספרינט 1, ג\'וג 1 | ספרינט 2, ג\'וג 1 | ספרינט 3, ג\'וג 1 | ספרינט 2, ג\'וג 1 | ספרינט 1.';
const STAMINA: { weeks: [number, number]; run1: Run; run2: Run }[] = [
  {
    weeks: [1, 6],
    run1: { reps: [1, 1], sets: [5, 7], setup: `ריבוע 20×20 מ' "עקום" שצלע אחת שלו 25 מ'. כדור אחד: כשפוגשים אותו מכדררים לעמוד הבא במהירות הנדרשת ומשאירים אותו. ${PYRAMID5}`, video: '227609864/8d0ccd6ce7' },
    run2: { reps: [4, 4], sets: [2, 4], setup: '20 מ\' עם סמנים ב-5, 10 ו-15 מ\'. צד לצד = חזרה. 10 שניות המתנה וחזרה לכיוון השני. 100%.', video: '227610750/3f44b77f64' },
  },
  {
    weeks: [2, 7],
    run1: { reps: [6, 10], sets: [5, 3], setup: 'שני עמודים 40 מ\' זה מזה, ובאמצע שני עמודים 20 מ\' זה מזה (יהלום). מוסרים לעצמך כדור לעומק, רצים סביב עמוד האמצע לפגוש אותו, מכדררים סביב עמוד הקצה וחוזר חלילה. קצה לקצה = חזרה.', video: '227609455/9a635bf3d8' },
    run2: { reps: [4, 6], sets: [2, 3], setup: '20 מ\' עם שלושה סמנים 3 מ\' מההתחלה ומהסוף, ומשולש באמצע. קצה לקצה = חזרה, 10 שניות בין חזרות לכיוון השני.', video: '227610159/3164cde729' },
  },
  {
    weeks: [3, 8],
    run1: { reps: [1, 2], sets: [6, 3], setup: 'מלבן 25×20 מ\'. רצים תמיד לאורך צלעות 25 מ\' ואז באלכסון לפינה הנגדית. כדור אחד שמכדררים לסמן הבא במהירות הנדרשת. חזרה = ג\'וג 1 | ספרינט 1, ג\'וג 1 | ספרינט 2, ג\'וג 1 | ספרינט 3.', video: '227609546/3380044cfd' },
    run2: { reps: [4, 6], sets: [3, 3], setup: '20 מ\' עם סמנים 5 מ\' מכל קצה (כמו בסרטון). עם כדור: ארבעה סיבובים ואז כדרור סביב ארבעת הסמנים הבאים ב-100%. צד לצד = חזרה, 10 שניות וחזרה לכיוון השני.', video: '227610277/b8678f6ccf' },
  },
  {
    weeks: [4, 9],
    run1: { reps: [6, 10], sets: [6, 4], setup: 'שני עמודים 60 מ\' זה מזה, ועמודים 10 מ\' פנימה מכל אחד. שני סמנים באמצע לסלאלום עם כדור (שמונח בסמן הראשון). תמיד ג\'וג ב-10 מ\' וספרינט במקטע הארוך עם הכדור. קצה לקצה = חזרה.', video: '227609649/2c3c082ca3' },
    run2: { reps: [4, 6], sets: [2, 3], setup: '20 מ\' עם סמנים ב-7 וב-14 מ\'. מעתיקים את התרגיל מהסרטון ב-100%. צד לצד = חזרה, 10 שניות וחזרה לכיוון השני.', video: '227610646/ddda350650' },
  },
  {
    weeks: [5, 10],
    run1: { reps: [6, 4], sets: [6, 4], setup: `שני עמודים 50 מ' זה מזה, מחולקים לחמישה מקטעים שווים עם סמנים לסלאלום. כדור אחד שמכדררים לסמן הבא במהירות הנדרשת. "2 ספרינטים" = שני סלאלומים. ${PYRAMID5}`, video: '227609771/2c52d0e87c' },
    run2: { reps: [4, 5], sets: [2, 4], setup: '20 מ\' עם סמנים בשוליים ב-7 וב-14 מ\' (בצדדים מנוגדים) וסמן נוסף 2 מ\' לפני כל אחד. צד לצד = חזרה. 100%. 10 שניות וחזרה לכיוון השני.', video: '227610700/17d6d9751c' },
  },
];

function staminaWorkout(week: number): Workout {
  const g = STAMINA.find((x) => x.weeks.includes(week))!;
  const i = g.weeks[0] === week ? 0 : 1;
  return {
    id: `in-stamina-w${week}`,
    title: `Stamina · Week ${week}`,
    subtitle: 'סטמינה · שתי ריצות',
    category: 'stamina',
    location: 'pitch',
    durationMin: 30,
    videos: [V('Run 1', g.run1.video), V('Run 2', g.run2.video)],
    blocks: [
      { kind: 'runs', title: 'Run 1', note: g.run1.setup, exercises: [{ name: 'Run 1', sets: String(g.run1.sets[i]), reps: String(g.run1.reps[i]), rest: '2-3 דק\' בין סטים' }], videos: [V('Run 1', g.run1.video)] },
      { kind: 'runs', title: 'Run 2', note: g.run2.setup, exercises: [{ name: 'Run 2', sets: String(g.run2.sets[i]), reps: String(g.run2.reps[i]), rest: '1-2 דק\' בין סטים' }], videos: [V('Run 2', g.run2.video)] },
    ],
  };
}

export const blockOfWeek = (week: number): StrengthBlock => Math.ceil(week / 2) as StrengthBlock;

export const INSEASON_WORKOUTS: Workout[] = [
  ...([1, 2, 3, 4, 5] as StrengthBlock[]).flatMap((b) => [strengthWorkout('upper', b), strengthWorkout('lower', b)]),
  ...Array.from({ length: 10 }, (_, i) => [coreWorkout(i + 1), speedWorkout(i + 1), staminaWorkout(i + 1)]).flat(),
];

/**
 * The example week (match on Saturday). Keys are offsets from match day:
 * -5 Mon rest, -4 Tue upper+core+speed, -3 Wed lower+core+stamina, -2 Thu rest, -1 Fri injury prevention,
 * 0 Sat pre-match routine + match, +1 Sun active recovery.
 */
export function inseasonWeekTemplate(week: number): { offset: number; sessions: { workoutId: string; timing: string }[]; rest?: boolean }[] {
  const b = blockOfWeek(week);
  return [
    { offset: -5, sessions: [], rest: true },
    {
      offset: -4,
      sessions: [
        { workoutId: `in-upper-${b}`, timing: INSEASON_TIMING.upper },
        { workoutId: `in-speed-w${week}`, timing: INSEASON_TIMING.speed },
        { workoutId: `in-core-w${week}`, timing: INSEASON_TIMING.core },
      ],
    },
    {
      offset: -3,
      sessions: [
        { workoutId: `in-lower-${b}`, timing: INSEASON_TIMING.lower },
        { workoutId: `in-core-w${week}`, timing: INSEASON_TIMING.core },
        { workoutId: `in-stamina-w${week}`, timing: INSEASON_TIMING.stamina },
      ],
    },
    { offset: -2, sessions: [], rest: true },
    { offset: -1, sessions: [{ workoutId: 'in-ip', timing: INSEASON_TIMING.injury }] },
    { offset: 0, sessions: [{ workoutId: 'pre-match', timing: INSEASON_TIMING.prematch }] },
    { offset: 1, sessions: [{ workoutId: 'active-recovery', timing: INSEASON_TIMING.recovery }] },
  ];
}
