// Deload week (SPEC 14.12א, R-DLD): half the sets, same weight. Pure functions.
import type { Block, ExerciseRx, Workout } from '../content/types';
import { addDaysISO, diffDays, weekStart, type ISODate } from './dates';

export const isDeloadWeek = (date: ISODate, deloadWeeks: readonly ISODate[]) => deloadWeeks.includes(weekStart(date));

/** "3" → "2", "5" → "3", "1 לכל רגל" → "1 לכל רגל". Only a leading number is halved (rounded up, at least 1). */
export function halveCount(s: string | undefined): string | undefined {
  if (!s) return s;
  const m = /^(\d+)(.*)$/.exec(s.trim());
  if (!m) return s;
  return `${Math.max(1, Math.ceil(Number(m[1]) / 2))}${m[2]}`;
}

const halveEx = (e: ExerciseRx): ExerciseRx => ({ ...e, sets: halveCount(e.sets) });

/** The same workout with half the sets (and half the rounds of timed blocks). Weights are unchanged (R-PRG-7). */
export function deloadWorkout(w: Workout): Workout {
  const blocks: Block[] = w.blocks.map((b) => ({ ...b, rounds: b.kind === 'timed' ? halveCount(b.rounds) : b.rounds, exercises: b.kind === 'sequence' ? b.exercises : b.exercises.map(halveEx) }));
  return { ...w, blocks, notes: ['שבוע הורדת עומס: חצי מהסטים, אותו משקל (R-DLD).', ...(w.notes ?? [])] };
}

export function toggleDeload(deloadWeeks: readonly ISODate[], ws: ISODate): ISODate[] {
  return deloadWeeks.includes(ws) ? deloadWeeks.filter((d) => d !== ws) : [...deloadWeeks, ws].sort();
}

/** Whole weeks since the last deload week that started before `ws`, or null if there was none. */
export function weeksSinceDeload(deloadWeeks: readonly ISODate[], ws: ISODate): number | null {
  const prev = deloadWeeks.filter((d) => d < ws).sort().at(-1);
  return prev ? Math.floor(diffDays(ws, addDaysISO(prev, 7)) / 7) : null;
}
