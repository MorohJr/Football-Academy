// TESTING_GUIDE.pdf + TRUE_TRACKING_SYSTEM (xlsx + instructions) (SPEC 6-7).
import type { VideoLink } from './types';

const V = (label: string, id: string): VideoLink => ({ label, url: `https://vimeo.com/${id}` });

/** RPE scale as in the tracking sheet (0-10). 10 is labelled "MATCH" in the sheet. */
export const RPE_SCALE: { score: number; label: string }[] = [
  { score: 0, label: 'מנוחה' },
  { score: 1, label: 'קל מאוד' },
  { score: 2, label: 'קל' },
  { score: 3, label: 'בינוני' },
  { score: 4, label: 'די קשה' },
  { score: 5, label: 'קשה' },
  { score: 6, label: '' },
  { score: 7, label: 'קשה מאוד' },
  { score: 8, label: '' },
  { score: 9, label: '' },
  { score: 10, label: 'מקסימלי (משחק)' },
];

export type PomsKey = 'sleep' | 'lookingForward' | 'vigorous' | 'soreness' | 'appetite';

/** POMS: answered every morning on waking, 1-5. Max 25 per day. Soreness 5 = no soreness. */
export const POMS_QUESTIONS: { key: PomsKey; he: string; en: string }[] = [
  { key: 'sleep', he: 'ישנתי טוב בלילה', en: 'I slept well last night' },
  { key: 'lookingForward', he: 'אני מחכה לאימון של היום', en: "I am looking forward to today's session" },
  { key: 'vigorous', he: 'אני מרגיש מלא מרץ ואנרגיה', en: 'I feel vigorous & energetic' },
  { key: 'soreness', he: 'כמעט אין לי כאבי שרירים', en: 'I have very little muscle soreness' },
  { key: 'appetite', he: 'התיאבון שלי מצוין', en: 'My appetite is great' },
];

export const POMS_SCALE = ['', 'ממש לא מסכים', 'לא מסכים', 'ניטרלי', 'מסכים', 'מסכים מאוד'];

/** The 17 graphs of the tracking workbook, reproduced in the app (SPEC 7.2). */
export const TRACKING_CHARTS: { id: string; title: string; type: 'bar' | 'line' | 'area' | 'combo'; period: 'daily' | 'weekly' | 'monthly' }[] = [
  { id: 'rpe-daily', title: 'RPE יומי (שנה מלאה)', type: 'bar', period: 'daily' },
  { id: 'poms-sleep', title: 'ישנתי טוב בלילה', type: 'line', period: 'daily' },
  { id: 'poms-looking-forward', title: 'מחכה לאימון של היום', type: 'area', period: 'daily' },
  { id: 'poms-vigorous', title: 'מלא מרץ ואנרגיה', type: 'line', period: 'daily' },
  { id: 'poms-soreness', title: 'כמעט אין כאבי שרירים', type: 'line', period: 'daily' },
  { id: 'poms-appetite', title: 'התיאבון מצוין', type: 'line', period: 'daily' },
  { id: 'minutes-daily', title: 'דקות אימון ביום (שנה מלאה)', type: 'bar', period: 'daily' },
  { id: 'units-daily', title: 'יחידות אימון ביום (שנה מלאה)', type: 'bar', period: 'daily' },
  { id: 'workload-monthly', title: 'עומס חודשי', type: 'bar', period: 'monthly' },
  { id: 'minutes-vs-rpe-weekly', title: 'דקות שבועיות מול RPE שבועי', type: 'combo', period: 'weekly' },
  { id: 'minutes-vs-poms-weekly', title: 'דקות שבועיות מול POMS שבועי', type: 'combo', period: 'weekly' },
  { id: 'units-vs-carbs', title: 'יחידות אימון מול פחמימות (יומי)', type: 'combo', period: 'daily' },
  { id: 'units-vs-fat', title: 'יחידות אימון מול שומן (יומי)', type: 'combo', period: 'daily' },
  { id: 'units-vs-calories', title: 'יחידות אימון מול קלוריות (יומי)', type: 'combo', period: 'daily' },
  { id: 'units-vs-protein', title: 'יחידות אימון מול חלבון (יומי)', type: 'combo', period: 'daily' },
  { id: 'units-weekly', title: 'יחידות אימון (שבועי)', type: 'bar', period: 'weekly' },
  { id: 'minutes-weekly', title: 'דקות אימון (שבועי)', type: 'bar', period: 'weekly' },
];

/** How to read the graphs (TRUE_TRACKING_SYSTEM_INSTRUCTIONS.pdf). Shown under each graph. */
export const CHART_INSIGHTS: Record<string, string> = {
  'rpe-daily': 'קפיצה ב-RPE מעל הרגיל: אולי צריך יותר התאוששות. ירידה: אפשר להוסיף. לאורך זמן רוצים לראות RPE יורד או יציב כשהעומס עולה, כלומר הכושר השתפר.',
  'poms-sleep': 'כמה ימים או שבועות של שינה גרועה, יחד עם RPE, כאבי שרירים ויחידות גבוהים: השינה פוגעת בהתאוששות ועלולה להוביל לפציעת שחיקה. חפש דפוסים, למשל שינה גרועה אחרי משחק ערב או טלפון לפני השינה.',
  'minutes-vs-rpe-weekly': 'יחידות/דקות גבוהות ו-RPE יורד או יציב: הכושר משתפר. קפיצה ב-RPE כשהעומס דומה: הגוף בלחץ, שים לב להתאוששות ולתזונה.',
  'minutes-vs-poms-weekly': 'POMS גבוה = טוב. ירידה פתאומית או מגמת ירידה: לברר למה. הרבה דקות ומצב רוח נמוך: העומס עלה יותר מדי מהר, וסיכון גבוה יותר לפציעה.',
  'units-vs-carbs': 'יחידות האימון עלו? גם הפחמימות צריכות לעלות כדי להתאושש. יחידות ירדו כמה ימים והפחמימות לא? העודף עלול להפוך לשומן. מילוי גליקוגן אחרי משחק יכול לקחת עד 3 ימים.',
};

// ---------- Fitness tests ----------
export type TestId = 'trapbar' | 'legpress' | 'pushups' | 'plank' | 'broadjump' | 'sprint10' | 'flying30' | 'ttest' | 'test505' | 'yoyo';

export interface FitnessTest {
  id: TestId;
  name: string;
  he: string;
  assesses: string;
  unit: 'kg' | 'reps' | 'sec' | 'cm' | 'level';
  /** true when a lower number is better */
  lowerIsBetter: boolean;
  where: 'gym' | 'pitch';
  howTo: string[];
  videos: VideoLink[];
  /** Left/right variants (5-0-5 turn leg, single-leg broad jump) */
  sides?: boolean;
}

export const FITNESS_TESTS: FitnessTest[] = [
  {
    id: 'trapbar', name: '1RM Trap Bar Deadlift', he: 'מקסימום חזרה אחת בטראפ בר', assesses: 'כוח מרבי של פלג גוף תחתון', unit: 'kg', lowerIsBetter: false, where: 'gym',
    howTo: ['מגיעים למקסימום ב-3-5 ניסיונות. יותר ניסיונות = עייפות.', 'אם הצלחת יותר מחזרה אחת, המשקל קל מדי: מעלים בזהירות.', 'אם עושים גם לחיצת רגליים: הטראפ בר קודם, לחיצת רגליים אחרונה.'],
    videos: [V('איך לבדוק 1RM בבטחה (פודקאסט)', '328181450/b975d9d8a9'), V('1RM Trap Bar Deadlift', '296981655/fcb950b4c1')],
  },
  {
    id: 'legpress', name: '1RM Leg Press', he: 'מקסימום חזרה אחת בלחיצת רגליים', assesses: 'כוח מרבי של פלג גוף תחתון', unit: 'kg', lowerIsBetter: false, where: 'gym',
    howTo: ['3-5 ניסיונות.', 'יותר מחזרה אחת = קל מדי.'], videos: [V('1RM Leg Press', '228215473/536579eeaa')],
  },
  {
    id: 'pushups', name: 'Push Ups To Failure', he: 'שכיבות סמיכה עד כשל', assesses: 'סבולת שרירית של פלג גוף עליון', unit: 'reps', lowerIsBetter: false, where: 'gym',
    howTo: ['ידיים מתחת לכתפיים, מרפקים ב-45 מעלות.', 'חפץ רך בגודל אגרוף מתחת לעצם החזה.', 'חזרה נספרת רק אם החזה נוגע בחפץ והידיים מתיישרות עד הסוף.'],
    videos: [V('Push Ups To Failure', '296981576/e5c067a600')],
  },
  {
    id: 'plank', name: 'Max Plank Hold', he: 'פלאנק מרבי', assesses: 'יציבות וסבולת של הליבה', unit: 'sec', lowerIsBetter: false, where: 'gym',
    howTo: ['אמות ב-90 מעלות, מרפקים מתחת לכתפיים, כפות ידיים על הרצפה, גב ישר.', 'רגליים ברוחב כתפיים.', 'מחזיקים עד שלא מצליחים לשמור על המנח.'],
    videos: [V('Max Plank Hold', '296981549/5f6dbc5097')],
  },
  {
    id: 'broadjump', name: 'Broad Jump', he: 'ניתור לרוחק', assesses: 'כוח נפיץ אופקי של הרגליים', unit: 'cm', lowerIsBetter: false, where: 'pitch', sides: true,
    howTo: ['אצבעות על קו 0 של סרט המדידה, רגליים ברוחב כתפיים.', 'ירידה מהירה עם תנופת ידיים לאחור, ואז קפיצה קדימה כמה שיותר רחוק.', 'מודדים מהעקב. אם נופלים או צריכים צעד: חוזרים על הניסיון.', 'אפשר גם על רגל אחת (שמאל/ימין) כדי להשוות.'],
    videos: [V('Broad Jump', '228215493/3b214c5493')],
  },
  {
    id: 'sprint10', name: '10m Sprint', he: 'ספרינט 10 מ\'', assesses: 'האצה', unit: 'sec', lowerIsBetter: true, where: 'pitch',
    howTo: ['עמידת פתיחה מדורגת על קו 0, סטופר ביד.', 'רצים הכי מהר עד 10 מ\', עוצרים שעון כשעוברים את הסמן, ומאטים בהדרגה.', 'ידיים ורגליים חזק ומהר.'],
    videos: [V('10m Sprint', '228215550/e25c5d5c93')],
  },
  {
    id: 'flying30', name: 'Flying 30m Sprint', he: 'ספרינט 30 מ\' מעופף', assesses: 'מהירות מרבית', unit: 'sec', lowerIsBetter: true, where: 'pitch',
    howTo: ['סמנים ב-10 וב-40 מ\'.', 'השעון מתחיל רק במעבר ב-10 מ\' ונעצר ב-40 מ\'.', 'להיות בספרינט מלא כבר ב-10 מ\'.'],
    videos: [V('Flying 30m Sprint', '296867001/1e6b107fa8')],
  },
  {
    id: 'ttest', name: 'T-Test', he: 'מבחן T', assesses: 'זריזות', unit: 'sec', lowerIsBetter: true, where: 'pitch',
    howTo: ['ארבעה סמנים בצורת T.', 'מ-D ספרינט 10 מ\' ל-B, דשדוש צד 5 מ\' ל-A, דשדוש לאורך כל הדרך ל-C, חזרה ל-B, וריצה לאחור ל-D.'],
    videos: [V('T-Test', '274941191/8499cbf27c')],
  },
  {
    id: 'test505', name: '5-0-5 Agility Test', he: 'מבחן 5-0-5', assesses: 'זריזות ומהירות סיבוב', unit: 'sec', lowerIsBetter: true, where: 'pitch', sides: true,
    howTo: ['מ-A ספרינט 10 מ\' לקו B, שם מתחיל השעון.', 'ממשיכים לקו C (קו הסיבוב, 5 מ\'), מסתובבים, דוחפים וחוזרים ל-B. עוצרים שעון.', 'אחרי 2-3 דקות חוזרים, עם הרגל השנייה.', 'משווים שמאל וימין. הצד החלש: אימוני כוח ברגל אחת.'],
    videos: [V('5-0-5 Test', '296869736/c1acc3a8a3')],
  },
  {
    id: 'yoyo', name: 'Yo-Yo IR Level 2', he: 'יו-יו (התאוששות לסירוגין, רמה 2)', assesses: 'כושר אירובי ומהירות אירובית מרבית', unit: 'level', lowerIsBetter: false, where: 'pitch',
    howTo: ['20 מ\' הלוך וחזור לפי הקלטת שמע, ואזור התאוששות של 5 מ\'.', 'בצפצוף הראשון רצים, מסתובבים בשני, וחוצים את הקו עד השלישי.', '10 שניות הליכה איטית באזור ההתאוששות (5 מ\' הלוך וחזור) וחוזרים לקו.', 'ממשיכים עד שלא מגיעים בזמן. רושמים את הרמה האחרונה שהושלמה.', 'אפליקציה: Bleep Test Solo (iOS). מחליפים רגל סיבוב.'],
    // No video link for this test in the PDF.
    videos: [],
  },
];

export const TESTING_SAFETY = [
  'לא נבדקים כשפצועים או בלי אישור רפואי.',
  'כשנבדקים לבד, שמישהו יהיה בסביבה.',
  'חימום מלא לפני כל הבדיקות.',
  'מהבדיקות הקלות לקשות. עדיף לפצל ליום מגרש ויום חדר כושר.',
  'לבדיקת ניידות ויציבה: לבקש ממאמן לצלם ולנתח Overhead Squat.',
];

/** When to test (testing guide) + which tests per programme */
export const TESTING_WHEN = [
  'תחילת הפרה-עונה: נקודת פתיחה.',
  'ממש לפני תחילת העונה (כ-6 שבועות אחרי תחילת הפרה-עונה): האם התוכנית עובדת, על מה להתמקד, ונתונים לחזרה מפציעה.',
  'בפגרת אמצע העונה.',
  'סוף העונה: איפה אתה פיזית, ובניית תוכנית אוף-סיזן.',
];

export const TESTS_BY_PROGRAMME: Record<string, TestId[]> = {
  bodyweight: ['pushups', 'plank', 'broadjump'],
  stamina: ['yoyo'],
  speed: ['sprint10', 'flying30', 'ttest', 'test505'],
  injury: ['trapbar', 'legpress', 'plank'],
  preseason: ['trapbar', 'legpress', 'pushups', 'plank', 'broadjump', 'sprint10', 'flying30', 'ttest', 'test505', 'yoyo'],
  inseason: ['trapbar', 'legpress', 'pushups', 'plank', 'broadjump', 'sprint10', 'flying30', 'ttest', 'test505', 'yoyo'],
};

export const TRACKING_VIDEO = V('איך משתמשים במערכת המעקב', '359654940/183b578215');
