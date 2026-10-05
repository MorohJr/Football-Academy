import { db } from '../db/db';
import { SEED_ITEMS, SEED_MEALS } from '../content/pantry';
import type { FoodLog, Meal, PantryItem } from '../domain/schemas';
import { addMacros, deduct, mealKosher, roundMacros, valuesFor, ZERO, type Kosher, type Macros } from '../domain/nutrition';

const ts = () => new Date().toISOString();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export async function seedPantry(): Promise<void> {
  const t = ts();
  const items: PantryItem[] = SEED_ITEMS.map((s) => ({
    id: s.id, createdAt: t, updatedAt: t, name: s.name, category: s.category, kosher: s.kosher, cert: '', unit: s.unit,
    per: { kcal: s.per[0], protein: s.per[1], carbs: s.per[2], fat: s.per[3] }, stock: s.stock, lowAt: s.lowAt, barcode: null, seed: true,
  }));
  const meals: Meal[] = SEED_MEALS.map((m) => ({
    id: m.id, createdAt: t, updatedAt: t, name: m.name, slot: m.slot, style: m.style,
    ingredients: m.ingredients.map(([itemId, amount]) => ({ itemId, amount })),
    instructions: [m.instructions, m.source ? `מקור: ${m.source}` : ''].filter(Boolean).join('\n'), inMenu: false, seed: true,
  }));
  await db.transaction('rw', db.pantry, db.meals, async () => {
    await db.pantry.bulkPut(items);
    if ((await db.meals.count()) === 0) await db.meals.bulkPut(meals);
  });
}

export function mealValues(meal: Pick<Meal, 'ingredients'>, items: Map<string, PantryItem>): { macros: Macros; kosher: Kosher | 'mixed'; missing: string[] } {
  let m = ZERO;
  const kinds: Kosher[] = [];
  const missing: string[] = [];
  for (const ing of meal.ingredients) {
    const it = items.get(ing.itemId);
    if (!it) {
      missing.push(ing.itemId);
      continue;
    }
    m = addMacros(m, valuesFor({ per: it.per, unit: it.unit }, ing.amount));
    kinds.push(it.kosher);
  }
  return { macros: roundMacros(m), kosher: mealKosher(kinds), missing };
}

/** "Ate it": log the meal and take the amounts out of the pantry (R-PAN). */
export async function eatMeal(meal: Meal, date: string, time: string, factor = 1): Promise<void> {
  const items = new Map((await db.pantry.toArray()).map((i) => [i.id, i]));
  const scaled = { ingredients: meal.ingredients.map((i) => ({ ...i, amount: i.amount * factor })) };
  const v = mealValues(scaled, items);
  const t = ts();
  const log: FoodLog = { id: uid(), createdAt: t, updatedAt: t, date, time, name: meal.name, mealId: meal.id, itemId: null, amount: factor, kosher: v.kosher, ...v.macros };
  await db.transaction('rw', db.foodLogs, db.pantry, async () => {
    await db.foodLogs.add(log);
    for (const ing of scaled.ingredients) {
      const it = items.get(ing.itemId);
      if (it) await db.pantry.update(it.id, { stock: deduct(it.stock, ing.amount), updatedAt: t });
    }
  });
}

export async function eatItem(item: PantryItem, amount: number, date: string, time: string): Promise<void> {
  const v = roundMacros(valuesFor({ per: item.per, unit: item.unit }, amount));
  const t = ts();
  await db.transaction('rw', db.foodLogs, db.pantry, async () => {
    await db.foodLogs.add({ id: uid(), createdAt: t, updatedAt: t, date, time, name: item.name, mealId: null, itemId: item.id, amount, kosher: item.kosher, ...v });
    await db.pantry.update(item.id, { stock: deduct(item.stock, amount), updatedAt: t });
  });
}

/** Undo a log: delete it and put the amounts back. */
export async function undoFoodLog(log: FoodLog): Promise<void> {
  const t = ts();
  await db.transaction('rw', db.foodLogs, db.pantry, db.meals, async () => {
    await db.foodLogs.delete(log.id);
    if (log.itemId && log.amount) {
      const it = await db.pantry.get(log.itemId);
      if (it) await db.pantry.update(it.id, { stock: it.stock + log.amount, updatedAt: t });
    } else if (log.mealId) {
      const meal = await db.meals.get(log.mealId);
      const f = log.amount ?? 1;
      if (meal) for (const ing of meal.ingredients) {
        const it = await db.pantry.get(ing.itemId);
        if (it) await db.pantry.update(it.id, { stock: it.stock + ing.amount * f, updatedAt: t });
      }
    }
  });
}

export async function restock(itemId: string, amount: number): Promise<void> {
  const it = await db.pantry.get(itemId);
  if (it) await db.pantry.update(itemId, { stock: Math.round((it.stock + amount) * 100) / 100, updatedAt: ts() });
}
