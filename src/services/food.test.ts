import { describe, expect, it } from 'vitest';
import { Settings, type Game } from '../domain/schemas';
import { DEFAULT_CALENDAR } from '../domain/season';
import { dairyFrom, foodDay, kosherNow, type FoodContext } from './food';

const T = '2026-10-01T00:00:00.000Z';
const s = Settings.parse({ id: 'settings', createdAt: T, updatedAt: T, calendar: DEFAULT_CALENDAR, birthYear: 1995, heightCm: 178, weightKg: 80, goalMode: 'cut' });
const game = (date: string, defaultDate: string, time = '20:00'): Game => ({
  id: date, createdAt: T, updatedAt: T, date, defaultDate, time, pitchId: null, status: 'planned', minutes: null, rpe: null, goals: 0, assists: 0,
  rating: null, position: '', result: '', notes: '', weightBefore: null, weightAfter: null, checklist: {},
});
const ctx = (games: Game[]): FoodContext => ({ s, games, weighIns: [], bodyFat: null });

describe('nutrition day from the plan (R-NUT-2, R-GAM)', () => {
  it('in-season week with a Thursday game: Mon intense with deficit, Thu match without', () => {
    const c = ctx([game('2026-10-08', '2026-10-08')]);
    const mon = foodDay('2026-10-05', c);
    expect(mon.dayType).toBe('intense');
    expect(mon.targets!.deficit).toBe(400);
    const thu = foodDay('2026-10-08', c);
    expect(thu.dayType).toBe('match');
    expect(thu.targets!.deficit).toBe(0);
  });
  it('a game moved to a morning: the day before becomes the 24h loading day', () => {
    const c = ctx([game('2026-10-07', '2026-10-08', '11:00')]);
    expect(foodDay('2026-10-06', c).dayType).toBe('loading');
    expect(foodDay('2026-10-07', c).dayType).toBe('match');
  });
  it('missing profile → no targets, says what is missing', () => {
    const d = foodDay('2026-10-05', { ...ctx([]), s: { ...s, heightCm: null } });
    expect(d.targets).toBeNull();
    expect(d.missing).toEqual(['גובה']);
  });
});

describe('kosher wait across midnight (R-KSH, 15.9)', () => {
  it('meat at 23:00 → dairy from 01:00', () => {
    const logs = [{ time: '23:00', kosher: 'meat' as const }];
    expect(dairyFrom(logs, 120)).toEqual({ minute: 25 * 60, hm: '01:00' });
    expect(kosherNow(logs, 'dairy', '23:30', 120)).toEqual({ kind: 'wait', minutesLeft: 90 });
    expect(kosherNow([{ time: '12:00', kosher: 'dairy' }], 'meat', '12:10', 120)).toEqual({ kind: 'rinse' });
  });
});
