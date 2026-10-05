// Starting pantry and meals (SPEC 8.5, 15.11): the Bible's shopping list ("What to buy on a budget"), its "superfoods",
// the foods of MEAL_PLAN_TEMPLATE.xlsx and the pre-match / on-the-road ideas — kosher versions (R-KSH).
// Values are per 100 g/ml (or per unit). Where the meal-plan template gives values, they were used; the rest are
// general food-table values (approximate, editable). Not from Matchfit unless noted.
import type { Kosher } from '../domain/nutrition';

export type PantryCategory = 'protein' | 'carbs' | 'fats' | 'produce' | 'drinks';
export const CATEGORY_HE: Record<PantryCategory, string> = { protein: 'חלבון', carbs: 'פחמימות', fats: 'שומנים', produce: 'ירקות ופירות', drinks: 'משקאות ותוספים' };

export interface SeedItem {
  id: string;
  name: string;
  category: PantryCategory;
  kosher: Kosher;
  unit: 'g' | 'ml' | 'unit';
  /** kcal, protein, carbs, fat */
  per: [number, number, number, number];
  stock: number;
  lowAt: number;
  note?: string;
}

const I = (id: string, name: string, category: PantryCategory, kosher: Kosher, unit: SeedItem['unit'], per: SeedItem['per'], stock: number, lowAt: number, note?: string): SeedItem => ({ id, name, category, kosher, unit, per, stock, lowAt, note });

export const SEED_ITEMS: SeedItem[] = [
  // ---- protein ----
  I('p-chicken', 'חזה עוף (נא)', 'protein', 'meat', 'g', [151, 27.3, 0, 3.3], 1500, 400, 'תבנית התפריט: 150 ג\' = 227 קק"ל'),
  I('p-thigh', 'פרגיות (נא)', 'protein', 'meat', 'g', [170, 18, 0, 10], 800, 300, 'Bible: הכי משתלם מהבשרים'),
  I('p-beef', 'בקר טחון רזה 5%', 'protein', 'meat', 'g', [137, 21, 0, 5], 500, 200, 'Bible: נתחים רזים עד 5% שומן'),
  I('p-steak', 'סטייק בקר רזה', 'protein', 'meat', 'g', [160, 22, 0, 7], 400, 150, 'בשר אדום לימים עצימים ולימי משחק'),
  I('p-slices', 'פרוסות חזה עוף/הודו', 'protein', 'meat', 'g', [105, 18, 2, 2], 200, 80, 'תבנית התפריט: 10 פרוסות = 110 קק"ל'),
  I('p-salmon', 'סלמון', 'protein', 'fish', 'g', [208, 20, 0, 13], 400, 150, 'Bible: "סופר-פוד", אומגה 3'),
  I('p-tuna', 'טונה במים (מסוננת)', 'protein', 'fish', 'g', [116, 26, 0, 1], 480, 160),
  I('p-whitefish', 'פילה דג לבן (מושט/בקלה)', 'protein', 'fish', 'g', [90, 20, 0, 1], 400, 125, 'תבנית התפריט: פילה 125 ג\' = 112 קק"ל'),
  I('p-eggs', 'ביצים', 'protein', 'parve', 'unit', [72, 6.5, 0.5, 5], 12, 4),
  I('p-greek', 'יוגורט יווני 2%', 'protein', 'dairy', 'g', [73, 10, 4, 2], 1000, 300, 'Bible: טוב לפני שינה, טוב למעי'),
  I('p-cottage', 'קוטג\' 5%', 'protein', 'dairy', 'g', [95, 11, 1.5, 5], 500, 250),
  I('p-milk', 'חלב 1%', 'protein', 'dairy', 'ml', [42, 3.4, 5, 1], 2000, 500, 'Bible: חלב דל שומן, עדיף אורגני'),
  I('p-whey', 'אבקת חלבון וויי', 'protein', 'dairy', 'g', [380, 78, 7, 5], 900, 200, 'Bible: הכי יעיל אחרי אימון'),
  I('p-soy', 'אבקת חלבון סויה', 'protein', 'parve', 'g', [340, 80, 3, 2], 900, 200, 'Bible: החלופה הכי טובה לוויי (פרווה)'),
  I('p-chickpeas', 'חומוס משומר (מסונן)', 'protein', 'parve', 'g', [73, 4, 10, 2], 800, 200, 'תבנית התפריט'),
  I('p-beans', 'שעועית לבנה משומרת', 'protein', 'parve', 'g', [90, 6, 16, 0.5], 800, 200),
  I('p-lentils', 'עדשים יבשות', 'protein', 'parve', 'g', [352, 25, 60, 1], 500, 150),
  I('p-tofu', 'טופו', 'protein', 'parve', 'g', [76, 8, 2, 4.8], 0, 0),
  // ---- carbs ----
  I('c-oats', 'שיבולת שועל', 'carbs', 'parve', 'g', [375, 13, 68, 8], 1000, 250, 'תבנית התפריט'),
  I('c-rice', 'אורז לבן (יבש)', 'carbs', 'parve', 'g', [346, 6, 80, 0.5], 2000, 400, 'תבנית התפריט'),
  I('c-pasta', 'פסטה (יבשה)', 'carbs', 'parve', 'g', [351, 12, 70, 1.6], 1000, 250, 'תבנית התפריט'),
  I('c-potato', 'תפוחי אדמה', 'carbs', 'parve', 'g', [82, 2, 17, 0.3], 2000, 500, 'תבנית התפריט'),
  I('c-sweetpotato', 'בטטה', 'carbs', 'parve', 'g', [86, 1.6, 20, 0.1], 1500, 400, 'Bible: 1-2 ביום'),
  I('c-bread', 'לחם מלא/נבוט (פרוסה)', 'carbs', 'parve', 'unit', [104, 4, 19, 1], 20, 6, 'Bible: בחיטוב לחם מלא משביע'),
  I('c-whitebread', 'לחם לבן (פרוסה)', 'carbs', 'parve', 'unit', [80, 2.5, 15, 1], 10, 4, 'Bible: לפני משחק, דל סיבים'),
  I('c-wrap', 'טורטייה גדולה', 'carbs', 'parve', 'unit', [180, 5, 32, 3], 8, 2, 'תבנית התפריט'),
  I('c-bagel', 'בייגל מלא', 'carbs', 'parve', 'unit', [225, 10, 39, 2], 4, 2, 'תבנית התפריט'),
  I('c-ricecake', 'פריכיות אורז', 'carbs', 'parve', 'unit', [35, 0.7, 7.3, 0.3], 20, 6),
  I('c-granola', 'גרנולה', 'carbs', 'parve', 'g', [430, 10, 63, 13], 500, 150, 'תבנית התפריט'),
  I('c-cereal', 'דגני בוקר (קורנפלקס)', 'carbs', 'parve', 'g', [378, 7, 84, 1], 500, 150, 'להעמסת פחמימות לפני משחק'),
  I('c-honey', 'דבש', 'carbs', 'parve', 'g', [304, 0.3, 82, 0], 350, 80),
  I('c-jam', 'ריבה', 'carbs', 'parve', 'g', [250, 0.4, 63, 0], 300, 80),
  I('c-raisins', 'צימוקים', 'carbs', 'parve', 'g', [299, 3, 79, 0.5], 250, 60, 'נשנוש לפני משחק ובמחצית'),
  I('c-figs', 'תאנים מיובשות', 'carbs', 'parve', 'g', [249, 3, 64, 1], 250, 60, 'במקום פיג רולס'),
  I('c-corn', 'תירס משומר', 'carbs', 'parve', 'g', [81, 2.4, 15, 1.2], 340, 0),
  I('c-sauce', 'רוטב עגבניות', 'carbs', 'parve', 'g', [56, 2, 8, 1.6], 700, 250, 'תבנית התפריט'),
  I('c-curry', 'רוטב קארי (פרווה)', 'carbs', 'parve', 'g', [72, 1.3, 5.8, 4.4], 450, 0, 'תבנית התפריט'),
  I('c-hoisin', 'רוטב הויסין', 'carbs', 'parve', 'g', [193, 0, 43, 0], 200, 0, 'תבנית התפריט'),
  // ---- produce ----
  I('v-banana', 'בננה', 'produce', 'parve', 'unit', [105, 1, 25, 0.3], 8, 3, 'Bible: פרוקטוז בארוחה 3 שעות לפני'),
  I('v-apple', 'תפוח', 'produce', 'parve', 'unit', [80, 0.3, 22, 0.2], 6, 2),
  I('v-strawberry', 'תותים', 'produce', 'parve', 'g', [30, 1, 6, 0.3], 250, 100),
  I('v-blueberry', 'אוכמניות', 'produce', 'parve', 'g', [57, 0.7, 14, 0.3], 250, 100, 'Bible: נוגדי חמצון'),
  I('v-pineapple', 'אננס', 'produce', 'parve', 'g', [50, 0.5, 13, 0.1], 500, 0),
  I('v-broccoli', 'ברוקולי', 'produce', 'parve', 'g', [35, 2.8, 7, 0.4], 500, 150, 'Bible: זול ורב-שימושי'),
  I('v-spinach', 'תרד', 'produce', 'parve', 'g', [23, 2.9, 3.6, 0.4], 300, 100, 'Bible: ניטרטים וברזל'),
  I('v-frozenveg', 'ירקות קפואים מעורבים', 'produce', 'parve', 'g', [65, 3, 12, 0.5], 1500, 400, 'Bible: זול ושלם תזונתית'),
  I('v-tomato', 'עגבנייה', 'produce', 'parve', 'unit', [22, 1, 5, 0.2], 8, 3),
  I('v-cucumber', 'מלפפון', 'produce', 'parve', 'unit', [20, 1, 4, 0.2], 8, 3),
  I('v-pepper', 'פלפל', 'produce', 'parve', 'unit', [36, 1, 8, 0.3], 4, 1),
  I('v-lettuce', 'חסה', 'produce', 'parve', 'g', [15, 1.4, 3, 0.2], 300, 100),
  I('v-onion', 'בצל', 'produce', 'parve', 'unit', [40, 1, 9, 0.1], 6, 2, 'Bible: זול ורב-שימושי'),
  I('v-avocado', 'אבוקדו', 'produce', 'parve', 'unit', [240, 3, 13, 22], 2, 1),
  // ---- fats ----
  I('f-walnuts', 'אגוזי מלך', 'fats', 'parve', 'g', [654, 15, 14, 65], 250, 80, 'Bible: היחס הכי טוב של אומגה 3'),
  I('f-macadamia', 'אגוזי מקדמיה', 'fats', 'parve', 'g', [718, 8, 14, 76], 0, 0, 'Bible: השני הכי טוב'),
  I('f-peanuts', 'בוטנים', 'fats', 'parve', 'g', [567, 26, 16, 49], 200, 0, 'Bible: האגוז הכי זול. חופן קטן'),
  I('f-pb', 'חמאת בוטנים', 'fats', 'parve', 'g', [588, 25, 20, 50], 350, 80),
  I('f-olive', 'שמן זית', 'fats', 'parve', 'g', [884, 0, 0, 100], 750, 150, 'Bible: עדיף על שמנים צמחיים'),
  I('f-flax', 'זרעי פשתן', 'fats', 'parve', 'g', [534, 18, 29, 42], 250, 60, 'Bible: אומגה 3 בזול'),
  I('f-tahini', 'טחינה גולמית', 'fats', 'parve', 'g', [600, 17, 21, 54], 500, 100),
  I('f-houmous', 'ממרח חומוס', 'fats', 'parve', 'g', [268, 7.5, 10, 22.5], 400, 100, 'תבנית התפריט'),
  // ---- drinks & supplements ----
  I('d-oj', 'מיץ תפוזים', 'drinks', 'parve', 'ml', [45, 0.7, 10, 0.2], 1000, 250, 'למשקאות הביתיים ולהעמסה'),
  I('d-isotonic', 'משקה איזוטוני', 'drinks', 'parve', 'ml', [24, 0, 6, 0], 1500, 500),
  I('d-gel', 'ג\'ל אנרגיה', 'drinks', 'parve', 'unit', [90, 0, 22, 0], 4, 1, 'עם 350 מ"ל מים'),
  I('d-bar', 'חטיף אנרגיה (שיבולת שועל)', 'drinks', 'parve', 'unit', [190, 3, 29, 7], 6, 2),
  I('d-beet', 'מיץ סלק', 'drinks', 'parve', 'ml', [44, 1, 9.6, 0], 0, 0, 'Bible: ניטרטים לסטמינה'),
  I('d-recovery', 'אבקת שייק התאוששות', 'drinks', 'dairy', 'g', [377, 34, 54, 3], 700, 140, 'תבנית התפריט: 70 ג\' אחרי אימון'),
];

export type MealSlot = 'breakfast' | 'snack' | 'lunch' | 'dinner' | 'pre' | 'post' | 'prebed' | 'match';
export const SLOT_HE: Record<MealSlot, string> = {
  breakfast: 'בוקר',
  snack: 'נשנוש',
  lunch: 'צהריים',
  dinner: 'ערב',
  pre: 'לפני אימון',
  post: 'אחרי אימון',
  prebed: 'לפני השינה',
  match: 'לפני משחק',
};

export interface SeedMeal {
  id: string;
  name: string;
  slot: MealSlot;
  /** around = carb-rich, for around training / loading; protein = protein & veg (fat-loss meals) */
  style: 'around' | 'protein';
  ingredients: [string, number][];
  instructions?: string;
  source?: string;
}

const M = (id: string, name: string, slot: MealSlot, style: SeedMeal['style'], ingredients: [string, number][], instructions?: string, source?: string): SeedMeal => ({ id, name, slot, style, ingredients, instructions, source });

export const SEED_MEALS: SeedMeal[] = [
  // breakfast
  M('m-yog-walnut', 'יוגורט יווני, אגוזי מלך ואוכמניות', 'breakfast', 'protein', [['p-greek', 300], ['f-walnuts', 20], ['v-blueberry', 100]], '', 'Bible: "סופר-פודס"'),
  M('m-omelette', 'חביתה 3 ביצים וסלט ירקות', 'breakfast', 'protein', [['p-eggs', 3], ['v-tomato', 1], ['v-cucumber', 1], ['v-spinach', 50], ['f-olive', 5]]),
  M('m-porridge', 'דייסת שיבולת שועל, בננה ודבש', 'breakfast', 'around', [['c-oats', 80], ['p-milk', 250], ['v-banana', 1], ['c-honey', 15]], 'אפשר להוסיף זרעים ופירות יבשים.', 'מדריך התזונה: ארוחה לפני משחק'),
  M('m-pancakes', 'פנקייק שיבולת שועל ותותים', 'breakfast', 'around', [['c-oats', 100], ['p-milk', 150], ['v-banana', 1], ['p-eggs', 2], ['v-strawberry', 100], ['c-honey', 15], ['f-olive', 5]], 'מערבבים שיבולת שועל ואבקת אפייה; בננה מעוכה, ביצים וחלב; ומחברים. תותים ודבש אחרי הבישול.', 'תבנית התפריט'),
  M('m-granola', 'גרנולה, חלב ותפוח', 'breakfast', 'around', [['c-granola', 100], ['p-milk', 200], ['v-apple', 1]], 'אפשר להחליף גרנולה בשיבולת שועל עם תותים ואגוזים.', 'תבנית התפריט'),
  // snacks
  M('m-ricecake-apple', 'פריכיות אורז ותפוח', 'snack', 'around', [['c-ricecake', 5], ['v-apple', 1]], '', 'תבנית התפריט'),
  M('m-yog-straw', 'יוגורט יווני ותותים', 'snack', 'protein', [['p-greek', 200], ['v-strawberry', 100]], '', 'תבנית התפריט'),
  M('m-bar-banana', 'חטיף אנרגיה ובננה', 'snack', 'around', [['d-bar', 1], ['v-banana', 1]], '', 'תבנית התפריט'),
  M('m-cottage', 'קוטג\' ומלפפון', 'snack', 'protein', [['p-cottage', 250], ['v-cucumber', 1]]),
  M('m-walnut-apple', 'חופן אגוזי מלך ותפוח', 'snack', 'protein', [['f-walnuts', 30], ['v-apple', 1]]),
  // lunch
  M('m-chicken-sandwich', 'כריך עוף, חומוס וירקות, ותפוח', 'lunch', 'around', [['c-bread', 4], ['p-slices', 100], ['f-houmous', 40], ['v-tomato', 1], ['v-lettuce', 30], ['v-apple', 1]], 'בגרסה הכשרה: חומוס במקום גבינה.', 'תבנית התפריט (כשר)'),
  M('m-bagel', 'בייגל עוף ובננה', 'lunch', 'around', [['c-bagel', 2], ['p-slices', 100], ['v-lettuce', 30], ['v-banana', 1]], 'מכינים עם ארוחת הבוקר ועוטפים בנייר כסף.', 'תבנית התפריט'),
  M('m-tuna-salad', 'סלט טונה וביצים', 'lunch', 'protein', [['p-tuna', 120], ['p-eggs', 2], ['v-tomato', 1], ['v-cucumber', 1], ['f-olive', 10]]),
  M('m-chicken-rice', 'חזה עוף, אורז וירקות', 'pre', 'around', [['p-chicken', 150], ['c-rice', 100], ['v-frozenveg', 150]], 'ארוחה 3-4 שעות לפני אימון.'),
  M('m-lentil', 'סלט עדשים וטחינה', 'lunch', 'around', [['p-lentils', 80], ['v-tomato', 1], ['v-cucumber', 1], ['f-tahini', 20], ['v-onion', 0.5]]),
  // dinner
  M('m-chicken-pasta', 'פסטה עוף ברוטב עגבניות', 'dinner', 'around', [['p-chicken', 150], ['c-pasta', 125], ['c-sauce', 250], ['v-pepper', 0.5], ['v-broccoli', 75]], '', 'תבנית התפריט'),
  M('m-curry', 'קארי עוף וחומוס', 'dinner', 'around', [['p-chicken', 150], ['c-rice', 100], ['p-chickpeas', 100], ['c-curry', 225], ['v-spinach', 50]], 'עוף במחבת בלי שמן בזמן שהאורז מתבשל, ואז הכול יחד 5 דקות על אש בינונית.', 'תבנית התפריט'),
  M('m-fish-potato', 'דג לבן בהויסין ותפוחי אדמה', 'dinner', 'around', [['p-whitefish', 125], ['c-potato', 400], ['c-hoisin', 30], ['v-frozenveg', 100], ['f-olive', 15]], 'תפוחי אדמה: 5 דקות רתיחה ואז 30 דקות בתנור.', 'תבנית התפריט'),
  M('m-wrap', 'טורטיית עוף וחומוס', 'dinner', 'around', [['p-chicken', 150], ['c-wrap', 2], ['f-houmous', 40], ['f-olive', 10], ['v-pepper', 0.5], ['v-lettuce', 30]], '', 'תבנית התפריט'),
  M('m-salmon', 'סלמון, בטטה וברוקולי', 'dinner', 'around', [['p-salmon', 150], ['c-sweetpotato', 300], ['v-broccoli', 150]], '', 'Bible: "סופר-פודס"'),
  M('m-steak', 'סטייק רזה, תפוחי אדמה וסלט', 'dinner', 'around', [['p-steak', 180], ['c-potato', 300], ['v-tomato', 1], ['v-cucumber', 1], ['f-olive', 5]], 'בשר אדום לימים עצימים.', 'Bible: בשר אדום בימים עצימים'),
  M('m-chicken-salad', 'חזה עוף וסלט ירקות גדול', 'dinner', 'protein', [['p-chicken', 180], ['v-tomato', 2], ['v-cucumber', 2], ['v-lettuce', 60], ['f-olive', 10]], 'ארוחת חלבון וירקות לימי גירעון.', 'Bible: חלבון, ירקות ואגוזים'),
  M('m-green-omelette', 'חביתה ירוקה וקוטג\'', 'dinner', 'protein', [['p-eggs', 3], ['v-spinach', 60], ['p-cottage', 150], ['v-tomato', 1]]),
  // pre-match ideas (nutrition guide, kosher)
  M('m-match-potato', 'תפוח אדמה אפוי, טונה ותירס', 'match', 'around', [['c-potato', 350], ['p-tuna', 80], ['c-corn', 60]], '', 'מדריך התזונה'),
  M('m-match-porridge', 'דייסה, בננה ודבש', 'match', 'around', [['c-oats', 80], ['p-milk', 250], ['v-banana', 1], ['c-honey', 20]], 'מעולה למשחק מוקדם.', 'מדריך התזונה'),
  M('m-match-pancakes', 'פנקייק עם פירות יער', 'match', 'around', [['c-oats', 80], ['p-milk', 120], ['p-eggs', 1], ['v-blueberry', 100], ['c-honey', 15]], 'לא להגזים בתוספות.', 'מדריך התזונה'),
  M('m-match-sweetpotato', 'בטטה עם שעועית', 'match', 'around', [['c-sweetpotato', 350], ['p-beans', 150]], '', 'מדריך התזונה'),
  M('m-match-pasta', 'פסטה עוף ברוטב', 'match', 'around', [['c-pasta', 125], ['p-chicken', 120], ['c-sauce', 200]], 'לא יותר מדי ירקות (סיבים).', 'מדריך התזונה'),
  M('m-match-sandwich', 'כריך הודו ובננה', 'match', 'around', [['c-whitebread', 4], ['p-slices', 80], ['v-lettuce', 20], ['v-banana', 1]], 'טוב בדרכים.', 'מדריך התזונה'),
  M('m-match-rice', 'עוף או סלמון עם אורז', 'match', 'around', [['p-chicken', 120], ['c-rice', 120]], 'מנה בגודל כף יד.', 'מדריך התזונה'),
  M('m-match-eggtoast', 'ביצה ושעועית על טוסט', 'match', 'around', [['p-eggs', 1], ['p-beans', 100], ['c-whitebread', 3]], 'הדגש על הפחמימות.', 'מדריך התזונה'),
  M('m-match-pbtoast', 'חמאת בוטנים ובננה על טוסט', 'match', 'around', [['c-whitebread', 2], ['f-pb', 15], ['v-banana', 1]], 'שכבה דקה של חמאת בוטנים.', 'מדריך התזונה'),
  M('m-match-smoothie', 'שייק פירות וחטיף', 'match', 'around', [['v-pineapple', 100], ['d-oj', 200], ['v-banana', 1], ['p-greek', 100], ['d-bar', 1]], '', 'מדריך התזונה'),
  M('m-road-pasta', 'קופסת פסטה, עוף ותרד לדרך', 'match', 'around', [['c-pasta', 125], ['p-chicken', 120], ['v-spinach', 40], ['c-sauce', 150]], 'נאכל גם קר.', 'Bible: אוכל לדרך'),
  // post
  M('m-recovery', 'שייק התאוששות', 'post', 'around', [['d-recovery', 70]], 'מיד אחרי האימון/המשחק.', 'תבנית התפריט'),
  M('m-soy-shake', 'שייק סויה, בננה ופריכיות', 'post', 'around', [['p-soy', 35], ['v-banana', 1], ['c-ricecake', 3]], 'פרווה: מתאים גם אחרי ארוחה בשרית.', 'Bible: סויה כחלופה לוויי'),
  M('m-whey-shake', 'שייק וויי ובננה', 'post', 'around', [['p-whey', 35], ['v-banana', 1]], '', 'Bible: וויי אחרי אימון'),
  // pre-bed
  M('m-bed-yog', 'יוגורט יווני לפני השינה', 'prebed', 'protein', [['p-greek', 200]], '', 'Bible'),
  M('m-bed-milk', 'כוס חלב', 'prebed', 'protein', [['p-milk', 400]], '', 'תבנית התפריט (דל שומן לפי ה-Bible)'),
  M('m-bed-soy', 'שייק סויה לפני השינה', 'prebed', 'protein', [['p-soy', 30]], 'פרווה, אם עדיין לא עברו שעתיים מבשר.', 'Bible'),
];

export const TEMPLATE_SCHEDULE_NOTE = 'בכל יום: בוקר, נשנוש, צהריים, שייק, ערב ולפני השינה (תבנית התפריט).';
