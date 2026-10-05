// Nutrition rules (SPEC 8): targets by day type for fat loss, kosher timeline, pantry and shopping list. Pure functions.
import type { ISODate } from './dates';

export type Kosher = 'meat' | 'dairy' | 'parve' | 'fish';
export const KOSHER_HE: Record<Kosher, string> = { meat: 'בשרי', dairy: 'חלבי', parve: 'פרווה', fish: 'דג' };

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
export const addMacros = (a: Macros, b: Macros): Macros => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat });
export const roundMacros = (m: Macros): Macros => ({ kcal: Math.round(m.kcal), protein: Math.round(m.protein), carbs: Math.round(m.carbs), fat: Math.round(m.fat) });

/** Mifflin-St Jeor (not from the material; same as the Fitness App, SPEC 8.2). */
export function bmr(sex: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

export const maintenanceKcal = (b: number, activity: number) => Math.round(b * activity);

/**
 * R-NUT-2 day types.
 * intense: strength, SAQ, speed, stamina, cardio, bodyweight; light: injury prevention, mobility, recovery, yoga, add-ons only;
 * rest: nothing planned; loading: the 24h before a morning/afternoon game; match: game day.
 */
export type DayType = 'intense' | 'light' | 'rest' | 'loading' | 'match';
export const DAY_TYPE_HE: Record<DayType, string> = {
  intense: 'יום אימון עצים',
  light: 'יום קל',
  rest: 'יום מנוחה',
  loading: '24 שעות לפני משחק',
  match: 'יום משחק',
};

const INTENSE = new Set(['strength', 'saq', 'speed', 'stamina', 'cardio', 'bodyweight', 'testing']);

export function dayTypeFor(categories: string[], opts: { gameToday: boolean; gameTomorrowBefore15: boolean }): DayType {
  if (opts.gameToday) return 'match';
  if (opts.gameTomorrowBefore15) return 'loading';
  if (categories.some((c) => INTENSE.has(c))) return 'intense';
  if (categories.length) return 'light';
  return 'rest';
}

export type GoalMode = 'cut' | 'maintain';

/** R-NUT-0: body fat above 12% → cut (Bible: 8-12% for male players). */
export function autoGoal(bodyFatPct: number | null): GoalMode {
  return bodyFatPct != null && bodyFatPct > 12 ? 'cut' : 'maintain';
}

export interface DayTargets extends Macros {
  dayType: DayType;
  deficit: number;
  fatRange: [number, number];
  /** carbs to place in the meal 3-4h before training / the game */
  preCarbs: number | null;
  /** carbs within 1-2h after training (range) */
  postCarbs: [number, number] | null;
  /** half-time carbs */
  halfTimeCarbs?: [number, number];
  /** post-match: protein + carbs within 1 hour */
  postMatch?: { protein: [number, number]; carbs: number };
  waterL: number;
  tips: string[];
}

/** R-NUT-1/2: daily targets. Protein 1.8 g/kg (nutrition guide), fat 20-25%, carbs = rest, timed around training (Bible p.165). */
export function dayTargets(input: { weightKg: number; maintenance: number; mode: GoalMode; deficit: number; dayType: DayType }): DayTargets {
  const { weightKg: w, maintenance, mode, dayType } = input;
  const protein = Math.round(w * 1.8);
  const fuel = dayType === 'loading' || dayType === 'match';
  const deficit = mode === 'cut' && !fuel ? Math.min(500, Math.max(250, input.deficit)) : 0;
  let kcal = maintenance - deficit;
  let carbs: number;
  let fat: number;
  if (fuel) {
    // Bible p.197: 8-10 g/kg in the 24h before a match; no deficit that day (p.165).
    carbs = Math.round(w * 8);
    const needed = (protein * 4 + carbs * 4) / 0.8;
    kcal = Math.round(Math.max(kcal, needed));
    fat = Math.round((kcal * 0.2) / 9);
  } else {
    fat = Math.round((kcal * 0.22) / 9);
    carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  }
  const fatRange: [number, number] = [Math.round((kcal * 0.2) / 9), Math.round((kcal * 0.25) / 9)];
  const tips: string[] = [];
  let preCarbs: number | null = null;
  let postCarbs: [number, number] | null = null;
  const out: DayTargets = { dayType, kcal, protein, carbs, fat, deficit, fatRange, preCarbs, postCarbs, waterL: dayType === 'rest' ? 2 : 2.5, tips };
  switch (dayType) {
    case 'intense':
      out.preCarbs = preCarbs = Math.round(w * 2);
      out.postCarbs = postCarbs = [Math.round(w * 1), Math.round(w * 2)];
      tips.push(`${preCarbs} ג' פחמימות בארוחה 3-4 שעות לפני האימון, ועוד ${postCarbs[0]}-${postCarbs[1]} ג' תוך שעתיים אחריו.`, 'שאר הארוחות: חלבון, ירקות ואגוזים (Bible).', 'בשר אדום מתאים לימים עצימים.');
      break;
    case 'light':
      tips.push('מעט פחמימות. הארוחה שלפני האימון הקל: חלבון, שומן וירקות (Bible, carb cycling).', 'בשר לבן בימים קלים.');
      break;
    case 'rest':
      tips.push('פחמימות מפוזרות לאורך היום, כמה שנוח. העיקר להישאר בגירעון.', 'בשר לבן בימי מנוחה.');
      break;
    case 'loading':
      tips.push(`24 שעות לפני המשחק: ${Math.round(w * 8)}-${Math.round(w * 10)} ג' פחמימות (8-10 ג'/ק"ג), בלי גירעון.`, 'פחמימות שקל לאכול הרבה מהן: פסטה, אורז, דגני בוקר, פריכיות, מיץ.');
      break;
    case 'match':
      out.preCarbs = Math.round(w * 2);
      out.halfTimeCarbs = [20, 40];
      out.postMatch = { protein: [30, 40], carbs: Math.round(w * 1) };
      tips.push(`ארוחה 3-4 שעות לפני: ${Math.round(w * 2)} ג' פחמימות, דלת סיבים ושומן, עד 500 קלוריות.`, '500 מ"ל עד ליטר מים עם הארוחה. שתן בהיר.', 'מחצית: 20-40 ג\' פחמימות + 500 מ"ל.', `תוך שעה אחרי: 30-40 ג' חלבון + ${Math.round(w)} ג' פחמימות. שוקלים לפני ואחרי, ושותים 1.5 ליטר לכל ק"ג שירד.`);
      break;
  }
  if (mode === 'cut' && !fuel) tips.push(`גירעון של ${deficit} קלוריות מהתחזוקה (Bible: 250-500).`);
  return out;
}

/** Per-100g (or per unit) values scaled to an amount. */
export interface FoodValues {
  /** per 100 g/ml, or per unit when unit === 'unit' */
  per: Macros;
  unit: 'g' | 'ml' | 'unit';
}
export function valuesFor(food: FoodValues, amount: number): Macros {
  const f = food.unit === 'unit' ? amount : amount / 100;
  return { kcal: food.per.kcal * f, protein: food.per.protein * f, carbs: food.per.carbs * f, fat: food.per.fat * f };
}

/** R-KSH: kosher class of a meal from its ingredients. Meat + dairy → 'mixed' (not allowed). */
export function mealKosher(kinds: Kosher[]): Kosher | 'mixed' {
  const s = new Set(kinds);
  if (s.has('meat') && s.has('dairy')) return 'mixed';
  if (s.has('meat')) return 'meat';
  if (s.has('dairy')) return 'dairy';
  if (s.has('fish')) return 'fish';
  return 'parve';
}
export const meatAndFish = (kinds: Kosher[]) => kinds.includes('meat') && kinds.includes('fish');

export interface EatenAt {
  /** minutes since midnight of the same date */
  minute: number;
  kosher: Kosher | 'mixed';
}

export type KosherStatus = { kind: 'ok' } | { kind: 'wait'; minutesLeft: number } | { kind: 'rinse' } | { kind: 'mixed' };

/**
 * R-KSH, Alex's custom (15.9): after meat wait `waitMin` (120) before dairy; after dairy rinse the mouth, then meat is fine.
 * Only the same day is checked (the wait is short).
 */
export function kosherCheck(eaten: EatenAt[], next: Kosher | 'mixed', atMinute: number, waitMin = 120): KosherStatus {
  if (next === 'mixed') return { kind: 'mixed' };
  if (next === 'dairy') {
    const lastMeat = Math.max(-Infinity, ...eaten.filter((e) => e.kosher === 'meat' && e.minute <= atMinute).map((e) => e.minute));
    if (lastMeat > -Infinity && atMinute - lastMeat < waitMin) return { kind: 'wait', minutesLeft: waitMin - (atMinute - lastMeat) };
  }
  if (next === 'meat') {
    const lastDairy = Math.max(-Infinity, ...eaten.filter((e) => e.kosher === 'dairy' && e.minute <= atMinute).map((e) => e.minute));
    const lastMeat = Math.max(-Infinity, ...eaten.filter((e) => e.kosher === 'meat' && e.minute <= atMinute).map((e) => e.minute));
    if (lastDairy > -Infinity && lastDairy > lastMeat) return { kind: 'rinse' };
  }
  return { kind: 'ok' };
}

// ---------- pantry & shopping (R-PAN) ----------
export interface StockItem {
  id: string;
  stock: number;
  lowAt: number;
}
export type StockLevel = 'ok' | 'low' | 'out';
export function stockLevel(i: StockItem): StockLevel {
  if (i.stock <= 0) return 'out';
  if (i.stock <= i.lowAt) return 'low';
  return 'ok';
}
export const deduct = (stock: number, amount: number) => Math.max(0, Math.round((stock - amount) * 100) / 100);

export interface ShoppingNeed {
  itemId: string;
  reason: 'out' | 'low' | 'menu';
  mealNames: string[];
}

/** Items at/below the threshold, and ingredients short for meals marked "this week's menu". */
export function shoppingNeeds(items: StockItem[], menuMeals: { name: string; ingredients: { itemId: string; amount: number }[] }[]): ShoppingNeed[] {
  const out = new Map<string, ShoppingNeed>();
  for (const i of items) {
    const lvl = stockLevel(i);
    if (lvl !== 'ok') out.set(i.id, { itemId: i.id, reason: lvl, mealNames: [] });
  }
  const need = new Map<string, number>();
  for (const m of menuMeals) for (const ing of m.ingredients) need.set(ing.itemId, (need.get(ing.itemId) ?? 0) + ing.amount);
  for (const m of menuMeals) {
    for (const ing of m.ingredients) {
      const item = items.find((i) => i.id === ing.itemId);
      if (!item) continue;
      if (item.stock < (need.get(ing.itemId) ?? 0)) {
        const cur = out.get(item.id) ?? { itemId: item.id, reason: 'menu' as const, mealNames: [] };
        if (!cur.mealNames.includes(m.name)) cur.mealNames.push(m.name);
        out.set(item.id, cur);
      }
    }
  }
  return [...out.values()];
}

/** Daily totals from logs. */
export function totalsByDate<T extends Macros & { date: ISODate }>(logs: T[]): Map<ISODate, Macros> {
  const m = new Map<ISODate, Macros>();
  for (const l of logs) m.set(l.date, addMacros(m.get(l.date) ?? ZERO, l));
  return m;
}
