// The workout in progress (R-WRK-2): saved on every change, so iOS closing the app loses nothing.
import { db } from '../db/db';
import type { ISODate } from '../domain/dates';
import type { ActiveRun, SetLoad } from '../domain/schemas';
import type { Workout } from '../content/types';
import { historyOf } from '../domain/progression';
import type { ExerciseHistory } from '../domain/progression';

export const getActiveRun = () => db.runs.get('active');

/** Starts a run, or returns the one already open for this workout today. A run left from an earlier day is dropped. */
export async function openRun(workoutId: string, today: ISODate): Promise<ActiveRun> {
  const cur = await db.runs.get('active');
  if (cur && cur.workoutId === workoutId && cur.date === today) return cur;
  const run: ActiveRun = { id: 'active', workoutId, date: today, startedAt: Date.now(), updatedAt: new Date().toISOString(), sets: {}, loads: {}, rest: null };
  await db.runs.put(run);
  return run;
}

export async function saveRun(patch: Partial<Pick<ActiveRun, 'sets' | 'loads' | 'rest'>>): Promise<void> {
  await db.runs.update('active', { ...patch, updatedAt: new Date().toISOString() });
}

export const clearRun = () => db.runs.delete('active');

/** On start: a run from an earlier day is no longer resumable (R-WRK-2). */
export async function dropStaleRun(today: ISODate): Promise<void> {
  const cur = await db.runs.get('active');
  if (cur && cur.date < today) await db.runs.delete('active');
}

/** R-PRG: logged history of every exercise of a workout, plus the manual 1RMs (14.11). */
export async function loadHistory(w: Workout): Promise<{ history: Record<string, ExerciseHistory[]>; manual: Record<'squat' | 'deadlift' | 'bench', number | null> }> {
  const names = new Set(w.blocks.flatMap((b) => b.exercises.map((e) => e.name)));
  const sessions = await db.sessions.where('kind').equals('workout').toArray();
  const withLoads = sessions.filter((s) => Object.keys(s.loads ?? {}).some((n) => names.has(n))).map((s) => ({ date: s.date, loads: s.loads as Record<string, SetLoad[]> }));
  const history: Record<string, ExerciseHistory[]> = {};
  for (const n of names) history[n] = historyOf(n, withLoads);
  const strength = await db.strength.toArray();
  const latest = (lift: string) => strength.filter((x) => x.lift === lift).sort((a, b) => b.date.localeCompare(a.date))[0]?.kg ?? null;
  return { history, manual: { squat: latest('squat'), deadlift: latest('deadlift'), bench: latest('bench') } };
}
