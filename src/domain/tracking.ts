// The True Tracking System formulas (xlsx), as pure functions (SPEC 7).
import { monthKey, weekStart, type ISODate } from './dates';
import type { PomsKey } from '../content/tracking';

export interface SessionLog {
  date: ISODate;
  minutes: number;
  /** 0-10. null when only minutes were logged (the sheet tracks minutes and RPE separately). */
  rpe: number | null;
}

export interface PomsLog {
  date: ISODate;
  scores: Record<PomsKey, number>; // 1-5 each
}

export interface NutritionLog {
  date: ISODate;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface DayLoad {
  date: ISODate;
  /** Σ minutes of the day's sessions (TRAINING MINUTES daily total) */
  minutes: number;
  /** Σ RPE of the day's sessions (RPE "daily total", chart 1) */
  rpeTotal: number;
  /** average RPE of the day's sessions, 2 decimals (RPE "daily average") */
  rpeAvg: number | null;
  /** minutes × average RPE (TRAINING UNITS) */
  units: number;
  sessions: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** R-TRK-1: daily load exactly as the sheet: units = daily minutes × ROUND(AVERAGE(session RPEs), 2). */
export function dayLoad(date: ISODate, sessions: SessionLog[]): DayLoad {
  const s = sessions.filter((x) => x.date === date);
  const minutes = s.reduce((a, x) => a + x.minutes, 0);
  const rated = s.filter((x) => x.rpe != null).map((x) => x.rpe as number);
  const rpeTotal = rated.reduce((a, x) => a + x, 0);
  const rpeAvg = rated.length && rpeTotal > 0 ? round2(rpeTotal / rated.length) : null;
  return { date, minutes, rpeTotal, rpeAvg, units: rpeAvg == null ? 0 : Math.round(minutes * rpeAvg * 100) / 100, sessions: s.length };
}

export function dailyLoads(sessions: SessionLog[]): Map<ISODate, DayLoad> {
  const dates = [...new Set(sessions.map((s) => s.date))].sort();
  return new Map(dates.map((d) => [d, dayLoad(d, sessions)]));
}

/** POMS daily total (max 25). Missing day → null. */
export const pomsTotal = (p: PomsLog): number => Object.values(p.scores).reduce((a, b) => a + b, 0);

export interface WeekSummary {
  weekStart: ISODate;
  minutes: number;
  /** Σ daily RPE totals (chart 10 "Weekly RPE") */
  rpe: number;
  /** average of daily averages (sheet "WEEK AVERAGE") */
  rpeAvg: number;
  units: number;
  poms: number | null;
}

/** R-TRK-2: weekly totals. Weeks start on Sunday (SPEC 1.2; the sheet uses Monday). */
export function weeklySummaries(sessions: SessionLog[], poms: PomsLog[]): WeekSummary[] {
  const map = new Map<ISODate, { minutes: number; rpe: number; avgs: number[]; units: number; poms: number | null }>();
  const get = (w: ISODate) => {
    let v = map.get(w);
    if (!v) map.set(w, (v = { minutes: 0, rpe: 0, avgs: [], units: 0, poms: null }));
    return v;
  };
  for (const dl of dailyLoads(sessions).values()) {
    const v = get(weekStart(dl.date));
    v.minutes += dl.minutes;
    v.rpe += dl.rpeTotal;
    v.units += dl.units;
    if (dl.rpeAvg != null) v.avgs.push(dl.rpeAvg);
  }
  for (const p of poms) {
    const v = get(weekStart(p.date));
    v.poms = (v.poms ?? 0) + pomsTotal(p);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([w, v]) => ({ weekStart: w, minutes: v.minutes, rpe: v.rpe, rpeAvg: v.avgs.length ? round2(v.avgs.reduce((a, b) => a + b, 0) / v.avgs.length) : 0, units: Math.round(v.units), poms: v.poms }));
}

export interface MonthSummary {
  month: string; // YYYY-MM
  units: number;
  poms: number | null;
}

/** R-TRK-3: monthly workload & POMS by calendar month (the sheet uses 4-week blocks; see SPEC 12). */
export function monthlySummaries(sessions: SessionLog[], poms: PomsLog[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();
  const get = (m: string) => {
    let v = map.get(m);
    if (!v) map.set(m, (v = { month: m, units: 0, poms: null }));
    return v;
  };
  for (const dl of dailyLoads(sessions).values()) get(monthKey(dl.date)).units += dl.units;
  for (const p of poms) {
    const v = get(monthKey(p.date));
    v.poms = (v.poms ?? 0) + pomsTotal(p);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({ ...m, units: Math.round(m.units) }));
}

export interface Acwr {
  acute: number;
  chronic: number;
  ratio: number | null;
  zone: 'low' | 'ok' | 'high' | 'unknown';
}

/**
 * R-TRK-4: acute:chronic workload (Bible, "Key principles of pre-season training", Gabbett).
 * acute = this week's units, chronic = average of the previous 4 weeks. ratio ≥ 1.4 → injury risk rises sharply.
 * Needs 4 previous weeks with any data; otherwise unknown.
 */
export function acwr(weeks: WeekSummary[], currentWeekStart: ISODate): Acwr {
  const byStart = new Map(weeks.map((w) => [w.weekStart, w.units]));
  const prev: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date(`${currentWeekStart}T00:00:00`);
    d.setDate(d.getDate() - 7 * i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    prev.push(byStart.get(key) ?? 0);
  }
  const acute = byStart.get(currentWeekStart) ?? 0;
  const chronic = prev.reduce((a, b) => a + b, 0) / 4;
  const hasHistory = prev.filter((x) => x > 0).length >= 4;
  if (!hasHistory || chronic === 0) return { acute, chronic, ratio: null, zone: 'unknown' };
  const ratio = round2(acute / chronic);
  return { acute, chronic: round2(chronic), ratio, zone: ratio >= 1.4 ? 'high' : ratio < 0.8 ? 'low' : 'ok' };
}

/** R-TRK-5: returning from injury, don't exceed 1.3× last week's load (Bible). */
export const returnToPlayCap = (lastWeekUnits: number): number => Math.round(lastWeekUnits * 1.3);

/** R-NUT-1: daily macro targets from bodyweight (nutrition guide). */
export function macroTargets(weightKg: number, trainingDay: boolean) {
  const protein = Math.round(weightKg * 1.8);
  const [cLo, cHi] = trainingDay ? [7, 10] : [5, 7];
  return { protein, carbs: [Math.round(weightKg * cLo), Math.round(weightKg * cHi)] as const, fatPct: [20, 25] as const };
}
