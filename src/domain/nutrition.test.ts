import { describe, expect, it } from 'vitest';
import { autoGoal, dayTargets, dayTypeFor, kosherCheck, mealKosher, shoppingNeeds, stockLevel } from './nutrition';
import { navyBodyFatMale, strengthStatus, trendWeight } from './body';
import { SEED_ITEMS, SEED_MEALS } from '../content/pantry';

describe('targets (R-NUT)', () => {
  it('cut: deficit 400, protein 1.8 g/kg, carbs = rest; pre/post carbs on intense days', () => {
    const t = dayTargets({ weightKg: 72, maintenance: 2850, mode: 'cut', deficit: 400, dayType: 'intense' });
    expect(t.kcal).toBe(2450);
    expect(t.protein).toBe(130);
    expect(t.fat).toBe(60);
    expect(t.carbs).toBe(348);
    expect(t.preCarbs).toBe(144);
    expect(t.postCarbs).toEqual([72, 144]);
  });
  it('deficit is clamped to 250-500 (Bible)', () => {
    expect(dayTargets({ weightKg: 72, maintenance: 2850, mode: 'cut', deficit: 900, dayType: 'rest' }).deficit).toBe(500);
  });
  it('match / loading: no deficit, 8 g/kg carbs', () => {
    const t = dayTargets({ weightKg: 72, maintenance: 2850, mode: 'cut', deficit: 400, dayType: 'match' });
    expect(t.deficit).toBe(0);
    expect(t.carbs).toBe(576);
    expect(t.kcal).toBeGreaterThanOrEqual(2850);
    expect(t.postMatch).toEqual({ protein: [30, 40], carbs: 72 });
  });
  it('day types and goal', () => {
    expect(dayTypeFor(['strength', 'core'], { gameToday: false, gameTomorrowBefore15: false })).toBe('intense');
    expect(dayTypeFor(['injury'], { gameToday: false, gameTomorrowBefore15: false })).toBe('light');
    expect(dayTypeFor([], { gameToday: true, gameTomorrowBefore15: false })).toBe('match');
    expect(autoGoal(13.8)).toBe('cut');
    expect(autoGoal(11)).toBe('maintain');
  });
});

describe('kosher (R-KSH, 15.9)', () => {
  it('meat + dairy in one meal is not allowed', () => {
    expect(mealKosher(['meat', 'dairy'])).toBe('mixed');
    expect(mealKosher(['meat', 'parve'])).toBe('meat');
    expect(mealKosher(['fish', 'parve'])).toBe('fish');
  });
  it('2 hours after meat before dairy; after dairy rinse, then meat', () => {
    const lunch = [{ minute: 13 * 60 + 30, kosher: 'meat' as const }];
    expect(kosherCheck(lunch, 'dairy', 14 * 60 + 30)).toEqual({ kind: 'wait', minutesLeft: 60 });
    expect(kosherCheck(lunch, 'dairy', 15 * 60 + 30)).toEqual({ kind: 'ok' });
    expect(kosherCheck([{ minute: 8 * 60, kosher: 'dairy' }], 'meat', 9 * 60)).toEqual({ kind: 'rinse' });
    expect(kosherCheck([], 'mixed', 600)).toEqual({ kind: 'mixed' });
  });
  it('every seed meal is kosher and references existing items', () => {
    const items = new Map(SEED_ITEMS.map((i) => [i.id, i]));
    for (const m of SEED_MEALS) {
      for (const [id] of m.ingredients) expect(items.has(id), `${m.id} → ${id}`).toBe(true);
      expect(mealKosher(m.ingredients.map(([id]) => items.get(id)!.kosher)), m.name).not.toBe('mixed');
    }
  });
});

describe('pantry (R-PAN)', () => {
  it('levels and shopping list', () => {
    expect(stockLevel({ id: 'a', stock: 0, lowAt: 1 })).toBe('out');
    expect(stockLevel({ id: 'a', stock: 1, lowAt: 1 })).toBe('low');
    const needs = shoppingNeeds(
      [{ id: 'a', stock: 0, lowAt: 1 }, { id: 'b', stock: 100, lowAt: 10 }, { id: 'c', stock: 50, lowAt: 0 }],
      [{ name: 'X', ingredients: [{ itemId: 'c', amount: 30 }] }, { name: 'Y', ingredients: [{ itemId: 'c', amount: 30 }] }],
    );
    expect(needs.map((n) => [n.itemId, n.reason, n.mealNames])).toEqual([['a', 'out', []], ['c', 'menu', ['X', 'Y']]]);
  });
});

describe('body (R-BOD)', () => {
  it('navy body fat (male)', () => {
    expect(navyBodyFatMale(82, 37, 178)).toBe(14.9);
    expect(navyBodyFatMale(30, 37, 178)).toBeNull();
  });
  it('trend weight = 7-day mean with ≥3 weigh-ins', () => {
    const w = [{ date: '2026-10-01', weight: 73 }, { date: '2026-10-03', weight: 72 }, { date: '2026-10-05', weight: 71.5 }];
    expect(trendWeight(w, '2026-10-05')).toBe(72.2);
    expect(trendWeight(w.slice(0, 2), '2026-10-05')).toBe(72);
  });
  it('strength target', () => {
    expect(strengthStatus('deadlift', 100, 72)).toMatchObject({ ratio: 1.39, toLow: 8, enough: false });
  });
});
