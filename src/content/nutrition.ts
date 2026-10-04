// NUTRITION_GUIDE.pdf + MEAL_PLAN_TEMPLATE.xlsx (SPEC 8).
import type { VideoLink } from './types';

const V = (label: string, id: string): VideoLink => ({ label, url: `https://vimeo.com/${id}` });

/** Daily macro rules (g per kg bodyweight; fat as % of calories). */
export const MACRO_RULES = {
  proteinPerKg: 1.8,
  carbsPerKg: { rest: [5, 7] as const, training: [7, 10] as const },
  fatPctOfCalories: [20, 25] as const,
};

export const SEVEN_TIPS = [
  'לפני אימון ומשחק המטרה היא למלא את מאגרי הגליקוגן בשריר. הגוף אוגר מעט, אז ממלאים כל הזמן.',
  'יותר מסת שריר (אימוני כוח) = יותר מקום לאגור גליקוגן.',
  'ספורטאים מאומנים ממלאים גליקוגן מהר יותר. למתחיל זה לוקח יותר זמן.',
  'ארוחות קטנות ותכופות עדיפות על מעט ארוחות גדולות.',
  'אוכלים פחמימות לפני אימון. בצום יש פחות סבולת.',
  'אופים, מבשלים, מאדים או אוכלים טרי. לא מטגנים ולא על האש.',
  'כל אסטרטגיה חדשה בודקים קודם ביום אימון, לא ביום משחק.',
];

export const HYDRATION = [
  'לפחות 2 ליטר נוזלים ביום.',
  'בחום אפשר לאבד עד ליטר בשעה.',
  'כל קילו שירד במשקל אחרי משחק = ליטר נוזלים שאבד (שוקלים לפני ואחרי).',
  'אובדן של 2% בלבד פוגע בביצועים ומוריד את הכושר האירובי ב-10-20%.',
  'שתן בהיר וצהוב-חיוור לפני משחק = בטווח של 1% מהידרציה מיטבית.',
  'בהתייבשות מרגישים שעובדים קשה יותר (RPE עולה) ותגובות איטיות יותר.',
  'בקבוק בצד המגרש באימון ובמשחק, ולשתות בכל עצירה.',
];

export const DIY_DRINKS = [
  { name: 'היפוטוני (לפני משחק/אימון)', recipe: 'ליטר מים + 100 מ"ל מיץ פירות + קורט מלח', why: 'נספג מהר ממים, שומר נוזלים ומעורר צמא.' },
  { name: 'איזוטוני (במהלך)', recipe: 'ליטר מים + 200 מ"ל מיץ פירות + קורט מלח קצת יותר גדול', why: 'נספג מהר ומכיל יותר פחמימות ואלקטרוליטים.' },
  { name: 'היפרטוני (אחרי)', recipe: 'ליטר מים + 400 מ"ל מיץ פירות + קורט מלח', why: 'נספג לאט יותר אבל ממלא גליקוגן.' },
];
export const DRINKS_WARNINGS = ['שותים משקאות ספורט רק בזמן פעילות (שחיקת שיניים).', 'קר פחות שוחק משיניים.', 'הרבה סוכר: מחוץ לפעילות זה הופך לשומן.'];

export const MATCH_DAY_RULES = [
  'ערב לפני: יותר מים ופחמימות בעלות GI נמוך, פחות שומן.',
  'בלי אלכוהול, ויותר מינרלים כדי להימנע מהתכווצויות.',
  '1-2 ליטר נוזלים בין ארוחת הבוקר למשחק.',
  'לא יותר מ-3 שעות בין ארוחות.',
  'משקאות קרים, בטעם ועם נתרן (מים לבד לא מעודדים שתייה).',
  'ארוחה לפני משחק: מוצקה וקלה, עד 500 קלוריות, 2-4 שעות לפני, ואחריה נשנוש קטן.',
  'אפשר להוסיף קלוריות עם שייק בבוקר.',
  'להימנע מסיבים (מתעכלים לאט). חלבון לשיקום אחרי המשחק.',
  'ביום משחק סוכרים פשוטים בזמן הנכון הם לטובתך.',
];

export const PRE_MATCH_MEALS = [
  { name: 'תפוח אדמה אפוי עם טונה ותירס', note: 'פחמימות קלאסיות, טונה לחלבון ותירס לעוד פחמימות וויטמינים.' },
  { name: 'דייסת שיבולת שועל עם בננה ודבש', note: 'מעולה למשחק מוקדם. אנרגיה ארוכה. אפשר זרעים ופירות יבשים.' },
  { name: 'פנקייק עם פירות יער', note: 'הרבה פחמימות. לא להגזים בממרחים ובסירופ. כף יוגורט.' },
  { name: 'בטטה עם שעועית', note: 'GI נמוך יותר, אנרגיה לאורך זמן.' },
  { name: 'פסטה עוף ברוטב', note: 'קלאסיקה של כדורגל. ירקות ועוף לחלבון.' },
  { name: 'כריך עם בננה', note: 'בדרכים. לחם לפחמימות, בשר רזה כמו הודו לחלבון.' },
  { name: 'סלמון, עוף או הודו עם אורז', note: 'אורז בסמטי. מנה בגודל כף יד. לא יותר מדי ירקות (סיבים).' },
  { name: 'ביצה עלומה ושעועית על טוסט', note: 'למשחק מוקדם. ביצה אחת ומעט שעועית על 2-3 פרוסות.' },
  { name: 'חמאת בוטנים ובננה על טוסט', note: 'שכבה דקה של חמאת בוטנים. אפשר קינמון.' },
  { name: 'שייק פירות', note: 'אננס, תפוז, תפוח ומיץ מדולל; אפשר תרד ויוגורט. עם עוד נשנוש כמו חטיף דגנים.' },
];

export const PRE_MATCH_SNACKS = ['אבטיח', 'אננס', 'צימוקים', 'בננה', 'מנגו', 'פריכיות שוקולד', 'חטיף דגנים', 'ג\'אפה קייקס', 'יוגורט דל שומן', 'פירות יבשים'];
export const HALF_TIME_SNACKS = ['פיג רולס (תאנים)', 'אננס', 'בננה', 'צימוקים', 'פירות יבשים', 'ג\'ל אנרגיה', 'חטיף אנרגיה', 'משקה איזוטוני', 'פריכיות אורז'];
export const POST_MATCH = [
  'השעתיים הראשונות הן החלון למילוי גליקוגן. אחריהן השרירים פחות יעילים בזה.',
  'מילוי מלא יכול לקחת עד יומיים, ועד 7 ימים אם יש נזק לשריר.',
  'תוך 15 דקות מהשריקה: סוכרים פשוטים (גם "חטיף לא בריא" בסדר כאן).',
  'ארוחה אחרי המשחק תוך 30 דקות, עם יותר חלבון.',
  'אפשר להביא שייק התאוששות משלך.',
];

export type KickoffSlot = 'morning' | 'afternoon' | 'evening';
export const EATING_SCHEDULES: Record<KickoffSlot, string[]> = {
  morning: ['ארוחת בוקר/ארוחה לפני משחק (3 שעות לפני)', 'נשנוש לפני משחק (1-1.5 שעות לפני)', 'נשנוש מחצית', 'נשנוש אחרי משחק (תוך 15 דק\')', 'צהריים/ארוחה אחרי משחק (30 דק\' אחרי)', 'נשנוש אחר הצהריים (16:00-17:00)', 'ערב (19:00-20:00)', 'נשנוש ערב (21:00)'],
  afternoon: ['09:00 ארוחת בוקר מזינה', 'ארוחה לפני משחק (3 שעות לפני)', 'נשנוש לפני משחק (1-1.5 שעות לפני)', 'נשנוש מחצית', 'נשנוש אחרי משחק (תוך 15 דק\')', 'צהריים/ארוחה אחרי משחק (30 דק\' אחרי)', 'נשנוש אחר הצהריים (16:00-17:00)', 'ערב (19:00-20:00)', 'נשנוש ערב (21:00)'],
  evening: ['09:00 ארוחת בוקר מזינה', '11:00 נשנוש', '13:00 צהריים מזינים', '15:00 נשנוש בריא', 'ארוחה לפני משחק (3 שעות לפני)', 'נשנוש לפני משחק (1-1.5 שעות לפני)', 'נשנוש מחצית', 'נשנוש אחרי משחק (תוך 15 דק\')', 'ארוחה אחרי משחק (30 דק\' אחרי)', 'נשנוש לפני השינה'],
};

export const SUPPLEMENTS = [
  { name: 'Beta-Alanine', text: 'מעלה סף לקטט, יותר נפח אימון ופחות עייפות. אבקה בשתייה (עקצוץ קל ולא מזיק בעור).' },
  { name: 'Caffeine', text: 'ערנות וריכוז, פחות תחושת עייפות, יותר שומן כדלק. שיפור ממוצע עד 12%, מנה פועלת עד 3 שעות. מעלה דופק, חרדה, בטן. לבדוק באימון.' },
  { name: 'Beetroot Juice', text: 'ניטרטים מרחיבים כלי דם: יותר חמצן לשרירים, סטמינה וסבולת. סלק שלם עובד כמו מיץ. בדרך כלל לפני משחקים.' },
  { name: 'CLA', text: 'חומצת שומן מחלב מלא. יכול להגדיל מסת שריר וכוח ולהוריד שומן.' },
  { name: 'Creatine', text: 'דלק למאמצים עצימים (הרמה, ספרינט), התאוששות מהירה בין ספרינטים, פחות פירוק חלבון. אבקה/טבליה לפני אימון.' },
  { name: 'Energy Gels', text: 'סוכרים פשוטים וקפאין. 350 מ"ל נוזל עם כל ג\'ל. לא מחליף שתייה. מעולה במחצית ולפני משחק.' },
  { name: 'Glutamine', text: 'מחזק חיסון בתקופות עומס, חוסך חלבון. אבקה בשתייה.' },
  { name: 'Magnesium', text: 'מונע התכווצויות. נמצא במשקה איזוטוני, ירוקים, אגוזים, זרעים, דגים, קטניות, אבוקדו, יוגורט, בננה, מלח ים. גם כספריי.' },
  { name: 'Glucosamine', text: 'פחות כאבי מפרקים, איכות סחוס. יעיל יותר עם כונדרויטין.' },
  { name: 'Cod Liver Oil', text: 'אומגה 3: פחות דלקת וכאבי שרירים, ריאות, לב, פירוק פחמימות יעיל, חיסון.' },
  { name: 'Protein Powder', text: 'וויי איזולט נספג הכי מהר (אחרי אימון). קזאין לאט (לאורך היום/לילה). למי שעושה אימוני כוח נוספים.' },
];
export const SUPPLEMENT_RULES = [
  'קודם תזונה נכונה, ורק אחר כך תוספים.',
  'ויטמינים לא משפרים ביצועים, אבל חוסר בהם פוגע. עם תזונה מגוונת לא צריך, חוץ מברזל (ספורטאים) וחומצה פולית (הריון).',
  'תוספים עלולים להיות מזוהמים או להכיל חומרים אסורים, גם כשבדוקים.',
];

export const NUTRITION_COACHING: VideoLink[] = [
  V('How To Create Your Own Nutrition Plan', '438250808/8128e9695e'),
  V('Should You Plan "Cheat" Days & Meals', '438253092/172f5ed290'),
  V('Increase Mass Or Reduce Body Fat?', '438252265/bbbfc44096'),
  V('Food Shopping List', '439206330/19517ce60f'),
  V('Nutrition To Combat Fatigue', '438252024/7a4e920715'),
];

// ---------- Meal plan template (xlsx) ----------
export type MealSlot = 'breakfast' | 'snack' | 'lunch' | 'shake' | 'dinner' | 'prebed';
export const MEAL_SLOTS: { slot: MealSlot; he: string }[] = [
  { slot: 'breakfast', he: 'ארוחת בוקר' },
  { slot: 'snack', he: 'נשנוש' },
  { slot: 'lunch', he: 'צהריים' },
  { slot: 'shake', he: 'שייק' },
  { slot: 'dinner', he: 'ערב' },
  { slot: 'prebed', he: 'לפני השינה' },
];

export interface FoodLine {
  food: string;
  qty: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  note?: string;
}
export interface MealOption {
  id: string;
  slot: MealSlot;
  name: string;
  items: FoodLine[];
  note?: string;
}

const f = (food: string, qty: string, kcal: number, carbs: number, protein: number, fat: number, note?: string): FoodLine => ({ food, qty, kcal, carbs, protein, fat, note });

export const MEAL_OPTIONS: MealOption[] = [
  {
    id: 'b-granola', slot: 'breakfast', name: 'Granola, bread and fruit', note: 'אפשר להחליף גרנולה בשיבולת שועל, ולהוסיף תותים/אוכמניות וחופן אגוזים.',
    items: [f('Fruit and nut granola', '100g', 430, 63, 10, 13), f('Whole milk', '200ml', 130, 9, 7, 7), f('Apple', '1 large', 80, 22, 0, 0), f('Wholewheat bread', '1 slice', 104, 19, 4, 1), f('Nutella', '15g', 82, 9, 1, 5)],
  },
  {
    id: 'b-pancakes', slot: 'breakfast', name: 'Oat pancakes', note: 'מערבבים שיבולת שועל ואבקת אפייה; בננה מעוכה, ביצים וחלב; ומחברים. תותים וסירופ אחרי הבישול.',
    items: [f('Rolled oats', '100g', 375, 68, 13, 8), f('Whole milk', '150ml', 98, 7, 5, 5), f('Baking powder', '1 tbsp', 0, 0, 0, 0), f('Banana', '1 large', 105, 25, 1, 0), f('Eggs', '2', 143, 1, 13, 10), f('Strawberries', '100g', 30, 6, 1, 0), f('Maple syrup', 'drizzle', 40, 10, 0, 0), f('Oil/butter', 'very light', 45, 0, 0, 5)],
  },
  { id: 's-graze', slot: 'snack', name: 'Protein flapjack and banana', items: [f('Cocoa+vanilla protein flapjack', '1 pack', 248, 25, 9, 13), f('Banana', '2 large', 210, 50, 3, 0)] },
  { id: 's-ricecakes', slot: 'snack', name: 'Rice cakes and apple', items: [f('Chocolate rice cakes', '5 cakes', 420, 57, 6, 19), f('Apple', '1 large', 80, 22, 0, 0)] },
  { id: 's-peanuts', slot: 'snack', name: 'Honey peanuts and grapes', note: 'עדיפות לאפשרויות אחרות: יותר מדי שומן.', items: [f('Honey roasted peanuts', '50g', 294, 10, 13, 22), f('Grapes', '250g', 166, 40, 1, 0)] },
  { id: 's-milkshake', slot: 'snack', name: 'Milkshake and banana', items: [f('Milkshake', '1 bottle', 295, 42, 12, 7), f('Banana', '1 large', 105, 25, 1, 0)] },
  { id: 's-yoghurt', slot: 'snack', name: 'Yoghurt and strawberries', items: [f('0% fat yoghurt', '450g (1 tub)', 336, 57, 20, 1), f('Strawberries', '100g', 30, 6, 1, 0)] },
  { id: 's-proteinbar', slot: 'snack', name: 'Protein bar and banana', items: [f('Protein bar', '1 bar', 219, 20, 20, 7), f('Banana', '2 large', 210, 50, 3, 0)] },
  { id: 'l-bagel', slot: 'lunch', name: 'Chicken bagel and banana', note: 'מכינים יחד עם ארוחת הבוקר ועוטפים בנייר כסף.', items: [f('Wholemeal bagel', '2 bagels', 450, 78, 20, 4), f('Wafer thin chicken slices', '10 slices', 110, 0, 24, 4), f('Lettuce', '-', 0, 0, 0, 0), f('Sauce (BBQ/tomato)', '-', 24, 6, 0, 0), f('Banana', '1 large', 105, 25, 0, 0)] },
  { id: 'l-sandwich', slot: 'lunch', name: 'Chicken and cheese sandwich and apple', note: 'מכינים יחד עם ארוחת הבוקר ועוטפים בנייר כסף.', items: [f('Wholemeal bread', '4 slices', 320, 54, 12, 4), f('Wafer thin chicken slices', '10 slices', 110, 0, 24, 4), f('Grated cheddar', '30g', 120, 0, 7, 10), f('Tomato', '2 slices', 0, 0, 0, 0), f('Lettuce', '-', 0, 0, 0, 0), f('Sauce (BBQ/tomato)', '-', 24, 6, 0, 0), f('Apple', '1 large', 80, 22, 0, 0)] },
  { id: 'sh-recovery', slot: 'shake', name: 'Recovery shake', items: [f('Recovery shake (carb + protein)', '70g (3 scoops)', 264, 38, 24, 2)] },
  { id: 'd-pasta', slot: 'dinner', name: 'Chicken and tomato pasta', items: [f('Fresh chicken breast', '150g raw', 227, 0, 41, 5), f('Pasta', '125g raw', 439, 88, 15, 2), f('Tomato and herb sauce', '250g', 140, 20, 5, 4, 'בערך חצי צנצנת. אפשר רסק.'), f('Pepper', '0.5', 18, 4, 1, 0), f('Broccoli', '75g', 26, 5, 2, 0)] },
  { id: 'd-curry', slot: 'dinner', name: 'Chicken and chickpea curry', note: 'עוף במחבת בלי שמן בזמן שהאורז מתבשל, ואז הכול יחד 5 דקות על אש בינונית.', items: [f('Fresh chicken breast', '150g raw', 227, 0, 41, 5), f('White rice', '100g raw', 346, 80, 6, 0), f('Canned chickpeas', '100g', 73, 10, 4, 2), f('Curry sauce', '225g', 162, 13, 3, 10), f('Spinach', '-', 29, 2, 3, 1)] },
  { id: 'd-cod', slot: 'dinner', name: 'Hoisin cod and roast potatoes', note: 'תפוחי אדמה ראשונים: 5 דק\' רתיחה ואז 30 דק\' בתנור.', items: [f('Cod fillet', '~125g', 112, 0, 25, 1), f('White potatoes', '400g raw', 328, 69, 8, 1), f('Hoisin sauce', '30g', 58, 13, 0, 0), f('Green beans', '100g', 29, 3, 2, 1), f('Olive oil', '30g', 270, 0, 0, 30)] },
  { id: 'd-wrap', slot: 'dinner', name: 'Chicken wrap', items: [f('Fresh chicken breast', '150g raw', 227, 0, 41, 5), f('Large tortilla wrap', '2 wraps', 360, 64, 10, 6), f('Houmous', '40g', 107, 4, 3, 9), f('Olive oil', '15g', 135, 0, 0, 15), f('Pepper', '0.5', 18, 4, 1, 0), f('Lettuce', '-', 0, 0, 0, 0)] },
  { id: 'pb-milk', slot: 'prebed', name: 'Milk', items: [f('Whole milk', '500ml', 325, 24, 17, 18)] },
];

export const TEMPLATE_SUPPLEMENTS = [
  { name: 'Vitamin D3', qty: '4000IU', time: 'בכל שעה', note: 'D3 ולא D2.' },
  { name: 'Omega-3 Fish Oil', qty: '3000mg', time: 'ערב', note: 'בדרך כלל 3 כמוסות של 1000mg.' },
  { name: 'Recovery shake', qty: '70g', time: 'בזמן ה"שייק"', note: '' },
  { name: 'Protein bar', qty: '1', time: 'בזמן ה"נשנוש"', note: '' },
];
