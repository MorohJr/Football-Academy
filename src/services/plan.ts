// Assembles the day: programme plan + games + add-ons, resolved to workouts (SPEC 4, R-GAM, R-PC, R-WKF).
import { db } from '../db/db';
import { getWorkout } from '../content';
import { pushCoreWorkout } from '../content/pushcore';
import { weakFootWorkout } from '../content/weakfoot';
import type { Workout } from '../content/types';
import { addDaysISO, diffDays, type ISODate } from '../domain/dates';
import type { Game, Settings } from '../domain/schemas';
import { fixedGameDateFor, planFor, type DayPlanResult, type PlanItem } from '../domain/season';
import { getSettings, updateSettings } from './entity';

export interface PushCoreContext {
  max: number;
  addonWeek: number;
  tested: boolean;
  testDate: ISODate | null;
}

/** R-PC-1/2: level from the latest push-up test; add-on week = weeks since that test. */
export async function pushCoreContext(date: ISODate): Promise<PushCoreContext> {
  const tests = await db.tests.where('testId').equals('pushups').toArray();
  const last = tests.filter((t) => t.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return { max: 10, addonWeek: 1, tested: false, testDate: null };
  return { max: last.value, addonWeek: Math.floor(diffDays(date, last.date) / 7) + 1, tested: true, testDate: last.date };
}

export function resolveWorkout(item: PlanItem | { workoutId: string }, pc?: PushCoreContext): Workout | undefined {
  if ('kind' in item && item.kind === 'pushcore') {
    return pushCoreWorkout(item.pair ?? 'A', pc?.max ?? 10, pc?.addonWeek ?? 1, { maintenance: item.maintenance, coreOnly: item.coreOnly });
  }
  if ('kind' in item && item.kind === 'weakfoot') return weakFootWorkout;
  const id = item.workoutId;
  if (!id) return undefined;
  if (id === 'weak-foot') return weakFootWorkout;
  const m = /^pc-([ABC])(-core)?(-m)?$/.exec(id);
  if (m) return pushCoreWorkout(m[1] as 'A' | 'B' | 'C', pc?.max ?? 10, pc?.addonWeek ?? 1, { coreOnly: !!m[2], maintenance: !!m[3] });
  return getWorkout(id);
}

export function gameRefs(games: Game[]) {
  return games.map((g) => ({ date: g.date, cancelled: g.status === 'cancelled', defaultDate: g.defaultDate }));
}

export function planWith(date: ISODate, settings: Settings, games: Game[]): DayPlanResult {
  return planFor(date, settings.calendar, { gameDay: settings.gameWeekday, games: gameRefs(games), pushCore: settings.pushCore, weakFoot: settings.weakFoot });
}

export interface ResolvedItem {
  item: PlanItem;
  workout?: Workout;
  /** stable key to match a logged session */
  key: string;
}

export function resolveItems(plan: DayPlanResult, pc: PushCoreContext): ResolvedItem[] {
  return plan.items.map((item, i) => {
    const workout = item.kind === 'game' ? undefined : resolveWorkout(item, pc);
    return { item, workout, key: workout?.id ?? `${item.kind}-${i}` };
  });
}

/** R-GAM-1: make sure this week's and next week's game exist (fixed day, time and pitch from settings). */
export async function ensureGames(today: ISODate, s: Settings): Promise<void> {
  const first = fixedGameDateFor(today, s.gameWeekday);
  for (const d of [first, addDaysISO(first, 7)]) {
    const exists = await db.games.where('defaultDate').equals(d).count();
    if (!exists) {
      const t = new Date().toISOString();
      await db.games.add({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        createdAt: t, updatedAt: t, date: d, defaultDate: d, time: s.gameTime, pitchId: s.defaultPitchId, status: 'planned',
        minutes: null, rpe: null, goals: 0, assists: 0, rating: null, position: '', result: '', notes: '', weightBefore: null, weightAfter: null, checklist: {},
      });
    }
  }
}

export async function gamesAround(date: ISODate): Promise<Game[]> {
  return db.games.where('date').between(addDaysISO(date, -21), addDaysISO(date, 21), true, true).toArray();
}

/** The next game on or after `date` that isn't cancelled. */
export async function nextGame(date: ISODate): Promise<Game | undefined> {
  const list = await db.games.where('date').aboveOrEqual(date).toArray();
  return list.filter((g) => g.status !== 'cancelled' && !(g.status === 'played' && g.date < date)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
}

export async function lastPlayedGame(date: ISODate): Promise<Game | undefined> {
  const list = await db.games.where('date').belowOrEqual(date).toArray();
  return list.filter((g) => g.status === 'played').sort((a, b) => b.date.localeCompare(a.date))[0];
}

/** Settings change of the fixed game day: future planned games are rebuilt on the new day. */
export async function changeGameDay(today: ISODate, weekdayNum: number, time?: string): Promise<void> {
  await updateSettings(time ? { gameWeekday: weekdayNum, gameTime: time } : { gameWeekday: weekdayNum });
  const future = await db.games.where('date').aboveOrEqual(today).toArray();
  await db.games.bulkDelete(future.filter((g) => g.status === 'planned' && g.minutes == null).map((g) => g.id));
  await ensureGames(today, await getSettings());
}
