// Progressive overload (SPEC 14.5א, R-PRG): per-set kg/reps, 1RM, kg from %1RM, double progression. Pure functions.
import { addDaysISO, type ISODate } from './dates';

export interface SetLoad {
  /** null = bodyweight */
  kg: number | null;
  reps: number | null;
}

/** One logged occurrence of an exercise (from a finished session). */
export interface ExerciseHistory {
  date: ISODate;
  sets: SetLoad[];
}

/** What the prescription asks for, per set. */
export type RepTarget =
  | { kind: 'pct'; perSet: { reps: number; pct: number }[] }
  | { kind: 'range'; lo: number; hi: number }
  | { kind: 'none' };

/**
 * Parses the reps string as written in the source:
 * "6 @70% · 5 @75% · 4 @80% · 3 @85%" → % ladder; "7 @70%" → every set; "12-15" → range; "10" → fixed (range 10-10).
 * Bodyweight / timed / anything else → none.
 */
export function parseReps(reps: string | undefined, sets: number): RepTarget {
  const r = (reps ?? '').trim();
  if (!r) return { kind: 'none' };
  const pcts = [...r.matchAll(/(\d+)\s*@\s*(\d+(?:\.\d+)?)%/g)].map((m) => ({ reps: Number(m[1]), pct: Number(m[2]) }));
  if (pcts.length > 1) return { kind: 'pct', perSet: Array.from({ length: sets }, (_, i) => pcts[Math.min(i, pcts.length - 1)]!) };
  if (pcts.length === 1) return { kind: 'pct', perSet: Array.from({ length: sets }, () => pcts[0]!) };
  if (/BW|משקל גוף|s\b|sec|שנ|דק|m\b/i.test(r)) return { kind: 'none' };
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(r);
  if (range) return { kind: 'range', lo: Number(range[1]), hi: Number(range[2]) };
  const fixed = /^(\d+)$/.exec(r);
  if (fixed) return { kind: 'range', lo: Number(fixed[1]), hi: Number(fixed[1]) };
  return { kind: 'none' };
}

/** Rounded to the nearest 2.5 kg (the smallest plate pair). */
export const roundKg = (kg: number) => Math.round(kg / 2.5) * 2.5;

/** R-PRG-2: Epley estimate, only from sets of 1-12 reps with a weight. */
export function epley(kg: number | null, reps: number | null): number | null {
  if (kg == null || kg <= 0 || reps == null || reps < 1 || reps > 12) return null;
  return reps === 1 ? kg : Math.round(kg * (1 + reps / 30) * 10) / 10;
}

export function bestE1rm(sets: SetLoad[]): number | null {
  let best: number | null = null;
  for (const s of sets) {
    const e = epley(s.kg, s.reps);
    if (e != null && (best == null || e > best)) best = e;
  }
  return best;
}

/** Manual 1RM lift for an exercise name (14.11). */
export function liftFor(exercise: string): 'squat' | 'deadlift' | 'bench' | null {
  const n = exercise.toLowerCase();
  if (n === 'bench press') return 'bench';
  if (n === 'deadlift') return 'deadlift';
  if (n === 'box squat' || n === 'front squat' || n === 'back squat' || n === 'squat') return 'squat';
  return null;
}

/** R-PRG-2: the higher of the manual 1RM and the best Epley estimate of the last 90 days. */
export function oneRepMax(history: ExerciseHistory[], today: ISODate, manual: number | null): number | null {
  const from = addDaysISO(today, -90);
  let best = manual;
  for (const h of history) {
    if (h.date < from || h.date > today) continue;
    const e = bestE1rm(h.sets);
    if (e != null && (best == null || e > best)) best = e;
  }
  return best;
}

export interface SetSuggestion {
  kg: number | null;
  reps: number | null;
}

export interface Suggestion {
  /** one per set */
  sets: SetSuggestion[];
  /** short Hebrew explanation */
  text: string;
  /** last time, e.g. "3×12 @ 40 ק"ג" */
  last: string | null;
}

export function describeSets(sets: SetLoad[]): string {
  if (!sets.length) return '';
  const kgs = new Set(sets.map((s) => s.kg ?? 0));
  const reps = new Set(sets.map((s) => s.reps ?? 0));
  const kgText = (kg: number | null) => (kg ? `${kg} ק"ג` : 'משקל גוף');
  if (kgs.size === 1 && reps.size === 1) return `${sets.length}×${sets[0]!.reps ?? '?'} @ ${kgText(sets[0]!.kg)}`;
  return sets.map((s) => `${s.reps ?? '?'}@${s.kg ?? 'BW'}`).join(' · ');
}

/**
 * R-PRG-3/4: the weights for today.
 * % ladder → % × 1RM (rounded to 2.5). Range/fixed → double progression from the last time.
 */
export function suggest(target: RepTarget, setsCount: number, history: ExerciseHistory[], today: ISODate, manual1rm: number | null): Suggestion {
  const past = history.filter((h) => h.date < today && h.sets.length).sort((a, b) => b.date.localeCompare(a.date));
  const lastH = past[0];
  const last = lastH ? describeSets(lastH.sets) : null;
  if (target.kind === 'pct') {
    const orm = oneRepMax(history, today, manual1rm);
    if (orm == null) return { sets: target.perSet.map((p) => ({ kg: null, reps: p.reps })), text: 'אין עדיין 1RM: הזן ביעדי כוח, או רשום סט והאפליקציה תעריך.', last };
    return { sets: target.perSet.map((p) => ({ kg: roundKg((orm * p.pct) / 100), reps: p.reps })), text: `לפי 1RM של כ-${Math.round(orm)} ק"ג.`, last };
  }
  if (target.kind === 'range') {
    const blank = Array.from({ length: setsCount }, () => ({ kg: null, reps: target.hi }));
    if (!lastH) return { sets: blank, text: 'בחר משקל שמעייף בחזרה האחרונה.', last };
    const lastKg = Math.max(...lastH.sets.map((s) => s.kg ?? 0));
    const top = lastH.sets.filter((s) => (s.kg ?? 0) === lastKg);
    const allTop = top.length >= Math.min(setsCount, lastH.sets.length) && top.every((s) => (s.reps ?? 0) >= target.hi);
    if (!lastKg) {
      const reps = allTop ? target.hi : Math.min(target.hi, Math.max(...lastH.sets.map((s) => s.reps ?? 0)) + 1);
      return { sets: Array.from({ length: setsCount }, () => ({ kg: null, reps })), text: allTop ? 'הגעת לקצה הטווח: אפשר להוסיף משקל.' : 'נסה חזרה אחת יותר בכל סט.', last };
    }
    if (allTop) return { sets: Array.from({ length: setsCount }, () => ({ kg: lastKg + 2.5, reps: target.lo })), text: `כל הסטים הגיעו ל-${target.hi}: מוסיפים 2.5 ק"ג.`, last };
    return {
      sets: Array.from({ length: setsCount }, (_, i) => ({ kg: lastKg, reps: Math.min(target.hi, (lastH.sets[i]?.reps ?? target.lo) + 1) })),
      text: `אותו משקל, ולנסות להוסיף חזרה עד ${target.hi}.`,
      last,
    };
  }
  return { sets: Array.from({ length: setsCount }, () => ({ kg: lastH ? (lastH.sets[0]?.kg ?? null) : null, reps: null })), text: '', last };
}

/** History of one exercise from finished sessions' `loads`. */
export function historyOf(exercise: string, sessions: { date: ISODate; loads?: Record<string, SetLoad[]> }[]): ExerciseHistory[] {
  return sessions.filter((s) => s.loads?.[exercise]?.length).map((s) => ({ date: s.date, sets: s.loads![exercise]! }));
}

/** R-PRG-6 (chart 21): best estimated 1RM per session date for one exercise. */
export function e1rmSeries(history: ExerciseHistory[]): { date: ISODate; e1rm: number }[] {
  const byDate = new Map<ISODate, number>();
  for (const h of history) {
    const e = bestE1rm(h.sets);
    if (e != null) byDate.set(h.date, Math.max(byDate.get(h.date) ?? 0, e));
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, e1rm]) => ({ date, e1rm }));
}

/** Exercise names that have any logged weight, for the chart picker. */
export function loggedExercises(sessions: { loads?: Record<string, SetLoad[]> }[]): string[] {
  const names = new Set<string>();
  for (const s of sessions) for (const [n, sets] of Object.entries(s.loads ?? {})) if (sets.some((x) => (x.kg ?? 0) > 0)) names.add(n);
  return [...names].sort();
}
