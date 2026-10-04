// INJURY_PREVENTION___REHAB.pdf + the shared routines (foam roller, activation, myofascial, band stretching).
import type { Workout, VideoLink } from './types';
import { TRX_YOGA_EXERCISES } from './preseason';

const V = (label: string, id: string): VideoLink => ({ label, url: `https://vimeo.com/${id}` });

export const FOAM_ROLLER_VIDEO = V('Foam Roller Routine', '227606241/39a0d4b410');
export const ACTIVATION_VIDEO = V('Muscle Activation', '228800251/288f4aee09');
export const MYOFASCIAL_VIDEO = V('Myofascial Release', '227606703/d323d73c7d');
export const BAND_STRETCH_VIDEO = V('Band Stretching', '227606185/ce8183488f');

export const FOAM_ROLLER_ORDER = [
  'Calfs', 'Single Leg Calf', 'Hamstrings', 'Single Leg Hamstring', 'Glutes (leg crossover)', 'Lower Back',
  'Lower Back (on the side)', 'Upper Back (arms overhead)', 'Upper Back (arms hugging)', 'Neck Roll (roll head side to side)',
  'IT Bands', 'Quads', 'Single Leg Quad', 'Adductors (inside leg)',
];

export const foamRoller: Workout = {
  id: 'foam-roller',
  title: 'Foam Roller Routine',
  subtitle: 'רולר: 20-30 שניות לכל אזור',
  category: 'recovery',
  location: 'any',
  durationMin: 10,
  videos: [FOAM_ROLLER_VIDEO],
  notes: ['מוצאים את האזורים התפוסים ומגלגלים בעדינות 20-30 שניות לפני שעוברים לאזור הבא.'],
  blocks: [{ kind: 'sequence', exercises: FOAM_ROLLER_ORDER.map((name) => ({ name, reps: '20-30s' })) }],
};

export const myofascial: Workout = {
  id: 'myofascial',
  title: 'Myofascial Release',
  subtitle: 'שחרור עם כדור טניס/עיסוי',
  category: 'recovery',
  location: 'any',
  durationMin: 5,
  videos: [MYOFASCIAL_VIDEO],
  blocks: [
    {
      kind: 'sequence',
      exercises: [
        { name: 'Foot Sole Roll', sets: '1', reps: '30s+', note: 'כף הרגל על הכדור, במיוחד האזור שלפני העקב.' },
        { name: 'Calf', sets: '1', reps: '30s+', note: 'אזורים תפוסים, גם צד חיצוני ופנימי של השוק.' },
        { name: 'Glute', sets: '1', reps: '30s+', note: 'הכדור בצד הישבן, לא על העצם.' },
        { name: 'Lower Back', sets: '1', reps: '30s+', note: 'באזור הרך משני צדי עמוד השדרה, מעל האגן.' },
        { name: 'Hamstring', sets: '1', reps: '30s+', note: 'יושבים על משטח מוגבה, הכדור מתחת לירך, נשענים קדימה.' },
      ],
    },
  ],
};

export const activation: Workout = {
  id: 'activation',
  title: 'Muscle Activation',
  subtitle: 'הפעלת שרירים לפני משחק/אימון',
  category: 'prematch',
  location: 'any',
  durationMin: 8,
  videos: [ACTIVATION_VIDEO],
  notes: ['ארבעה יתרונות: כוח רב יותר, תיאום סיבי שריר, גמישות, פחות פציעות שחיקה.'],
  blocks: [
    {
      kind: 'sequence',
      exercises: [
        { name: 'Outside Leg Push', sets: '1 לכל רגל', reps: '8-10s', note: 'רגל ישרה, דוחפים את צד הכף החיצוני לקופסה/משטח יציב.' },
        { name: 'Inside Leg Push', sets: '1 לכל רגל', reps: '8-10s', note: 'רגל ישרה, מחזיקים בקופסה ודוחפים את צד הכף הפנימי.' },
        { name: 'Front Leg Push', sets: '1 לכל רגל', reps: '8-10s', note: 'בצד הקופסה, דוחפים את גב כף הרגל קדימה, ברך כפופה.' },
        { name: 'Heel Pull', sets: '1 לכל רגל', reps: '8-10s', note: 'ברך כפופה, לוחצים עקב לרצפה ומושכים לכיוון הגוף.' },
        { name: 'Thigh Push', sets: '1 לכל רגל', reps: '8-10s', note: 'ידיים על הירך, לוחצים למטה והירך מתנגדת.' },
        { name: 'Standing Rear Leg Raise', sets: '1 לכל רגל', reps: '15-20s', note: 'מרימים רגל לאחור ככל האפשר ומכווצים ישבן.' },
        { name: 'Lying Hip Abductions', sets: '1 לכל רגל', reps: 'עד עייפות', note: 'רגל ישרה למעלה ומחזיקים; חוזרים עם הרגל לפני ומאחורי הגוף.' },
      ],
    },
  ],
};

export const bandStretching: Workout = {
  id: 'band-stretching',
  title: 'Band Stretching',
  subtitle: 'מתיחות סטטיות עם גומייה (התאוששות פעילה)',
  category: 'recovery',
  location: 'any',
  durationMin: 10,
  videos: [BAND_STRETCH_VIDEO],
  notes: ['להתחמם לפני מתיחות סטטיות.'],
  blocks: [],
};

export const activeRecovery: Workout = {
  id: 'active-recovery',
  title: 'Active Recovery',
  subtitle: 'התאוששות פעילה: תנועה קלה, רולר ומתיחות',
  category: 'recovery',
  location: 'any',
  durationMin: 30,
  videos: [FOAM_ROLLER_VIDEO, BAND_STRETCH_VIDEO],
  notes: [
    'רצוי בבוקר. עבודה קלה עם כדור או ריצה במים, רק להעלות דופק ולהזרים דם.',
    'אחר כך רולר ומתיחות. גם מנוחה מנטלית חשובה.',
  ],
  blocks: [{ kind: 'sequence', exercises: [{ name: 'Light ball work / water running', reps: '10-15m' }, { name: 'Foam Roller Routine' }, { name: 'Band Stretching' }] }],
};

/** In-season Friday injury prevention (supersets, W1-10) */
export const inseasonInjuryPrevention: Workout = {
  id: 'in-ip',
  title: 'Injury Prevention',
  subtitle: 'מניעת פציעות (סופרסטים) + רולר',
  category: 'injury',
  location: 'gym',
  durationMin: 30,
  videos: [V('Injury Prevention', 'showcase/5887418'), FOAM_ROLLER_VIDEO],
  notes: ['משלבים עם שגרת הרולר. מבצעים בזוגות (סופרסט).'],
  blocks: [
    { kind: 'superset', exercises: [{ name: 'Mini Band Side Steps', sets: '2', reps: '30s', rest: '0' }, { name: 'Ball Knee Squeeze', sets: '2', reps: '30s', rest: '0' }] },
    { kind: 'superset', exercises: [{ name: 'Swiss Ball Hamstring Press', sets: '2', reps: '30s', rest: '0' }, { name: 'Single Leg Stand Up', sets: '2', reps: '30s', rest: '0' }] },
    { kind: 'superset', exercises: [{ name: 'Stability Cushion', sets: '2', reps: '30s', rest: '0' }, { name: 'Mini Band Hip Openers', sets: '2', reps: '30s', rest: '0' }] },
    { kind: 'superset', exercises: [{ name: 'Dynamic Achilles Stretch', sets: '2', reps: '30s', rest: '0' }, { name: 'Single Leg Calf Raise', sets: '2', reps: '30s', rest: '0' }] },
    { kind: 'superset', exercises: [{ name: 'Nordics', sets: '2', reps: '30s', rest: '0' }, { name: 'Calf Drops', sets: '2', reps: '30s', rest: '0' }] },
    { kind: 'superset', exercises: [{ name: 'Trunk Rotations', sets: '2', reps: '30s', rest: '0' }, { name: 'Deep Sit', sets: '2', reps: '30s', rest: '0' }] },
  ],
};

export const preMatchRoutine: Workout = {
  id: 'pre-match',
  title: 'Pre-Match Routine',
  subtitle: '1.5-3 שעות לפני שריקת הפתיחה',
  category: 'prematch',
  location: 'any',
  durationMin: 30,
  videos: [FOAM_ROLLER_VIDEO, MYOFASCIAL_VIDEO, ACTIVATION_VIDEO, V('Mini-Band Exercises', 'showcase/5887436')],
  blocks: [
    { title: 'חלק 1: רולר', kind: 'sequence', exercises: FOAM_ROLLER_ORDER.map((name) => ({ name, reps: '20-30s' })) },
    { title: 'חלק 2: שחרור מיופסציאלי', kind: 'sequence', exercises: myofascial.blocks[0]!.exercises },
    { title: 'חלק 3: הפעלת שרירים', kind: 'sequence', exercises: activation.blocks[0]!.exercises },
    {
      title: 'חלק 4: מיני-בנד',
      kind: 'straight',
      exercises: [
        { name: 'Mini Band Side Steps', sets: '2', reps: '30s', rest: '0' },
        { name: 'Hip Adduction', sets: '2', reps: '30s', rest: '0' },
        { name: 'Hip Openers', sets: '2', reps: '30s', rest: '0' },
      ],
    },
  ],
};

// ---------- Injury prevention programme (whole season, rotate 4) ----------
const ip = (n: number, video: string, pairs: [string, string, string, string, string, string][], note?: string): Workout => ({
  id: `ip${n}`,
  title: `Injury Prevention Workout ${n}`,
  subtitle: 'מניעת פציעות · סופרסטים, בלי מנוחה',
  category: 'injury',
  location: 'gym',
  durationMin: 30,
  videos: [V(`Injury Prevention ${n}`, video)],
  notes: ['כל הסטים של זוג לפני שעוברים לזוג הבא. אין מנוחה בין סטים או זוגות.', ...(note ? [note] : [])],
  blocks: pairs.map(([a, as, ar, b, bs, br]) => ({
    kind: 'superset' as const,
    exercises: [
      { name: a, sets: as, reps: ar },
      { name: b, sets: bs, reps: br },
    ],
  })),
});

export const IP_WORKOUTS: Workout[] = [
  ip(1, 'showcase/6045309', [
    ['Calf Raises', '3', '10', 'Single Leg Bridge', '3', '10 לכל רגל'],
    ['Calf Drops', '3', '10', 'Mini Band Side Steps', '3', '10 לכל כיוון'],
    ['Swiss Ball Hover', '3', '1 דק\'', 'Knee Squeezes', '3', '10'],
    ['Foot Up Plank', '3', '15s לכל רגל', 'T Plank', '3', '20s'],
  ]),
  ip(2, 'showcase/6045332', [
    ['Achilles Eccentrics', '3', '10', 'Mini Band Hip Activation', '3', '3 לכל רגל'],
    ['Single Leg Balance', '3', 'זמן מרבי', 'Hip Drops', '3', '10 לכל צד'],
    ['Trunk Rotations', '3', '10 לכל כיוון', '3 Point Lunge Pattern', '3', '3 לכל רגל'],
    ['Plank Arm Reach', '3', '15s לכל יד', 'Side Plank Arm Raised', '3', '20s לכל צד'],
  ], 'Single Leg Balance בעיניים עצומות.'),
  ip(3, 'showcase/6045384', [
    ['Ankle Jumps', '3', '5', 'Lying Hip Abductions', '3', '10'],
    ['Single Leg Cone Reach', '3', '3 סבבים לכל רגל', 'Single Leg Squat', '3', '5 לכל רגל'],
    ['Trunk Anti-Rotations', '3', '20s לכל צד', 'Nordics', '3', '5'],
    ['Rollouts', '3', '5', 'Hanging Knee Raises', '3', '5'],
  ]),
  ip(4, 'showcase/6045413', [
    ['Deep Sit', '3', '20s', "RDL's", '3', '5 לכל רגל'],
    ['Swiss Ball Hamstring Curl', '3', '10', 'Mini Band Step & Squat', '3', '5 לכל כיוון'],
    ['Diagonal Plank', '3', '20s לכל צד', 'Leg Adductions', '3', '10 לכל רגל'],
    ['Swiss Ball Plank', '3', '20s', 'Swiss Ball Knee Tucks', '3', '10'],
  ]),
];

export const trxYoga: Workout = {
  id: 'trx-yoga',
  title: 'TRX Yoga',
  subtitle: 'יוגה ב-TRX',
  category: 'mobility',
  location: 'gym',
  videos: [V('TRX Yoga', '217074472/9c3f0ad291')],
  blocks: [{ kind: 'straight', exercises: TRX_YOGA_EXERCISES.map(({ rest: _r, ...e }) => e) }],
};

/** When each routine fits (programme layout table, SPEC 5.6). */
export const IP_TIMING: { routine: string; when: string[] }[] = [
  { routine: 'אימון מניעת פציעות', when: ['בוקר לפני אימון'] },
  { routine: 'רולר', when: ['בוקר לפני אימון', 'ממש לפני אימון/משחק', 'יום אחרי משחק'] },
  { routine: 'שחרור מיופסציאלי', when: ['בוקר לפני אימון', 'ממש לפני אימון/משחק', 'יום אחרי משחק'] },
  { routine: 'TRX יוגה', when: ['בוקר לפני אימון', 'אחרי אימון', 'יום אחרי משחק'] },
  { routine: 'הפעלת שרירים', when: ['ממש לפני אימון/משחק'] },
  { routine: 'מתיחות עם גומייה', when: ['אחרי אימון', 'מיד אחרי משחק'] },
  { routine: 'התאוששות פעילה', when: ['אחרי אימון', 'מיד אחרי משחק'] },
];

export const INJURY_CAUSES = [
  'מתעלמים מ"עקיצות" קטנות עד שהן הופכות לפציעה.',
  'עומס יתר בלי התאוששות ותזונה מספיקות.',
  'מכניקת תנועה לקויה שחוזרת שוב ושוב.',
  'מתאמנים "מסביב" לפציעה במשך שנים, וזה יוצר פציעות שחיקה כרוניות.',
  'חוסר יציבות, ניידות וכוח בקרסול, ברך, ירך וליבה (בנחיתה, סיבוב, שינוי כיוון ובלימה).',
  'פציעה קודמת מעלה מאוד את הסיכון לפציעה חוזרת.',
  'ירכיים, שוקיים, ירך אחורית ו-IT band תפוסים בגלל הזנחת גמישות.',
  'חוסר איזון בכוח, בעיקר בין הארבע-ראשי לירך האחורית.',
  'אימון ממושך על משטח קשה או לא יציב בנעליים לא מתאימות.',
];

export const INJURY_FACTS = [
  'שחקן חווה בממוצע פציעה אחת בשנה שמגבילה ביצועים.',
  'במשחק הסיכון לפציעה גבוה פי 4-6 מאשר באימון.',
  'רוב הפציעות בפלג הגוף התחתון: קרסול, ברך, שוק וירך אחורית.',
  'תרגילי כוח הורידו פציעות חדות ביותר מ-60% ופציעות חוזרות ב-50%.',
  'זה לא תחליף לפיזיותרפיסט כשנפצעים.',
];

export const IP_EQUIPMENT = [
  'מיני-בנד', 'כדור שוויצרי', 'כדור פילאטיס רך', 'מדרגה או משטח מוגבה', '3 סמנים', 'מכונת כבלים', 'גלגל בטן',
  'מתח', 'כדור טניס/עיסוי', 'קופסת פליאומטריקה', 'מכונת לחיצת רגליים', 'רולר', 'גומייה סגורה', 'TRX',
];

export const REHAB_VIDEOS: VideoLink[] = [
  V('Achilles Tendinopathy · דלקת גיד אכילס', '385952962/3e8914b482'),
  V('Achilles Tendon Rupture & Tendonitis · קרע/דלקת בגיד אכילס', '385953055/39fd3e9d23'),
  V('ACL · הרצועה הצולבת הקדמית', '385953167/c06761cb57'),
  V('Adductor Tendinopathy · מקרבים (גיד)', '385953343/a1bd49998a'),
  V('Ankle Ligaments · רצועות הקרסול', '385953461/b3152d9f9c'),
  V('Calf Strain · מתיחה בשוק', '385953822/c3cc509fbb'),
  V('Dead Leg / Muscle Contusion · "רגל מתה" / חבלה בשריר', '385953954/55e415e2d0'),
  V('Groin Strain · מתיחה במפשעה', '385954040/a190739f1c'),
  V('Hamstring Strain · מתיחה בירך האחורית', '385954351/5cf8d883e3'),
  V('IT Band Syndrome · תסמונת IT band', '385954427/3707bad76f'),
  V('Labral Tear · קרע בלברום', '385954509/dd2ef2d2ab'),
  V('Medial & Lateral Collateral Ligaments · רצועות צד בברך', '385954600/25ed2c1a7e'),
  V('Meniscus Tear · קרע במניסקוס', '385954694/5a2736fea5'),
  V('Osgood Schlatters Disease · אוסגוד שלאטר', '385954832/64a98c0f39'),
  V('Patellar Tendinopathy · דלקת בגיד הפיקה', '385954917/9b8e6715fc'),
  // The PDF links PCL to the same video as patellar tendinopathy (source error, SPEC 12).
  V('Posterior Cruciate Ligament · הרצועה הצולבת האחורית', '385954917/9b8e6715fc'),
  V('Plantar Fasciitis · דלקת בכף הרגל', '385955139/50ccce87c1'),
  V('Plica Syndrome · תסמונת פליקה', '385955206/cef495ecb9'),
  V('Quad Strain · מתיחה בארבע-ראשי', '385955268/a7aed38425'),
  V('Severs Disease · סבר (עקב)', '385955383/1548f50e8e'),
  V('Shin Splints · שין ספלינטס', '385955454/acec8db4b8'),
  V('Sinding Larsen Johansson · סינדינג לארסן', '385955970/af2a985889'),
  V('Stress Fractures · שברי מאמץ', '385957701/30dffae8e7'),
  V('Trochanteric Bursitis · דלקת בבורסה בירך', '385953750/5ffedbca5e'),
];

export const INJURY_WORKOUTS: Workout[] = [
  foamRoller, myofascial, activation, bandStretching, activeRecovery, inseasonInjuryPrevention, preMatchRoutine, trxYoga, ...IP_WORKOUTS,
];
