// Rows for the tracking charts (SPEC 7.3, 16.3: the UI doesn't compute). Pure functions.
import { addDaysISO, monthKey, weekStart, type ISODate } from './dates';
import { acwr, dailyLoads, monthlySummaries, sleepHours, weeklySummaries, type PomsLog, type SessionLog } from './tracking';
import { totalsByDate, type Macros } from './nutrition';

export interface CheckinRow {
  date: ISODate;
  sleep: number;
  lookingForward: number;
  vigorous: number;
  soreness: number;
  appetite: number;
  lightsOut: string | null;
  wake: string | null;
  napMin: number;
}

const ddmm = (iso: ISODate) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Daily rows (charts 1-8, 12-15, 19). Days without data stay null, so they aren't drawn (R-CHT-1). */
export function dailyRows(from: ISODate, to: ISODate, sessions: SessionLog[], checkins: CheckinRow[], food: (Macros & { date: ISODate })[]) {
  const loads = dailyLoads(sessions);
  const checkByDate = new Map(checkins.map((c) => [c.date, c]));
  const foodByDate = totalsByDate(food);
  const rows = [];
  for (let d = from; d <= to; d = addDaysISO(d, 1)) {
    const l = loads.get(d);
    const c = checkByDate.get(d);
    const f = foodByDate.get(d);
    rows.push({
      d: ddmm(d),
      rpe: l && l.rpeTotal > 0 ? l.rpeTotal : null,
      minutes: l?.minutes || null,
      units: l?.units || null,
      sleep: c?.sleep ?? null,
      lookingForward: c?.lookingForward ?? null,
      vigorous: c?.vigorous ?? null,
      soreness: c?.soreness ?? null,
      appetite: c?.appetite ?? null,
      sleepH: c ? sleepHours(c) : null,
      rpeAvg: l?.rpeAvg ?? null,
      kcal: f ? Math.round(f.kcal) : null,
      protein: f ? Math.round(f.protein) : null,
      carbs: f ? Math.round(f.carbs) : null,
      fat: f ? Math.round(f.fat) : null,
    });
  }
  return rows;
}

/** Weekly rows (charts 10, 11, 16-18) from `from`'s week on. */
export function weeklyRows(from: ISODate, sessions: SessionLog[], poms: PomsLog[]) {
  const all = weeklySummaries(sessions, poms);
  return all
    .filter((w) => w.weekStart >= weekStart(from))
    .map((w) => ({ w: ddmm(w.weekStart), minutes: w.minutes || null, rpe: w.rpe || null, units: w.units || null, poms: w.poms, acwr: acwr(all, w.weekStart).ratio }));
}

/** Monthly rows (chart 9). */
export function monthlyRows(from: ISODate, sessions: SessionLog[], poms: PomsLog[]) {
  return monthlySummaries(sessions, poms)
    .filter((m) => m.month >= monthKey(from))
    .map((m) => ({ m: `${m.month.slice(5)}/${m.month.slice(2, 4)}`, units: m.units || null, poms: m.poms }));
}
