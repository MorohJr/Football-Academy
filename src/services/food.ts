// Nutrition day context (R-NUT-1/2): day type from the plan + game, and the day's targets.
import { db } from '../db/db';
import { addDaysISO, type ISODate } from '../domain/dates';
import { trendWeight } from '../domain/body';
import { autoGoal, bmr, dayTargets, dayTypeFor, kosherCheck, maintenanceKcal, type DayTargets, type DayType, type EatenAt, type GoalMode, type Kosher, type KosherStatus } from '../domain/nutrition';
import type { FoodLog, Game, Settings } from '../domain/schemas';
import { bodySummary } from './queries';
import { planWith, resolveWorkout } from './plan';

export interface FoodContext {
  s: Settings;
  games: Game[];
  weighIns: { date: ISODate; weight: number }[];
  bodyFat: number | null;
}

export async function foodContext(s: Settings, today: ISODate): Promise<FoodContext> {
  const body = await bodySummary(today);
  const games = await db.games.toArray();
  return { s, games, weighIns: body.weighIns, bodyFat: body.bodyFat };
}

export interface FoodDay {
  dayType: DayType;
  mode: GoalMode;
  bodyFat: number | null;
  weight: number | null;
  maintenance: number | null;
  targets: DayTargets | null;
  /** what's missing in the profile to compute targets */
  missing: string[];
  game: Game | null;
}

export function foodDay(date: ISODate, ctx: FoodContext): FoodDay {
  const { s, games } = ctx;
  const plan = planWith(date, s, games);
  const cats = plan.items.filter((i) => i.kind !== 'game').map((i) => resolveWorkout(i)?.category).filter((c): c is NonNullable<typeof c> => !!c);
  const game = games.find((g) => g.date === date && g.status !== 'cancelled') ?? null;
  const gameToday = plan.items.some((i) => i.kind === 'game');
  const tomorrow = addDaysISO(date, 1);
  const tg = games.find((g) => g.date === tomorrow && g.status !== 'cancelled');
  const gameTomorrowBefore15 = planWith(tomorrow, s, games).items.some((i) => i.kind === 'game') && (tg?.time ?? s.gameTime) < '15:00';
  const dayType = dayTypeFor(cats, { gameToday, gameTomorrowBefore15 });
  const weight = trendWeight(ctx.weighIns, date) ?? s.weightKg;
  const age = s.birthYear ? Number(date.slice(0, 4)) - s.birthYear : null;
  const mode: GoalMode = s.goalMode === 'auto' ? autoGoal(ctx.bodyFat) : s.goalMode;
  const missing = [!weight && 'משקל', !s.heightCm && 'גובה', !age && 'שנת לידה'].filter((x): x is string => !!x);
  if (!weight || !s.heightCm || !age) return { dayType, mode, bodyFat: ctx.bodyFat, weight, maintenance: null, targets: null, missing, game };
  const maintenance = maintenanceKcal(bmr(s.sex, weight, s.heightCm, age), s.activity);
  return { dayType, mode, bodyFat: ctx.bodyFat, weight, maintenance, targets: dayTargets({ weightKg: weight, maintenance, mode, deficit: s.deficit, dayType }), missing, game };
}

const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

export const eatenAt = (logs: Pick<FoodLog, 'time' | 'kosher'>[]): EatenAt[] => logs.map((l) => ({ minute: toMin(l.time), kosher: l.kosher }));

/** R-KSH: status for the next food at `time`, from today's logs. */
export function kosherNow(logs: Pick<FoodLog, 'time' | 'kosher'>[], next: Kosher | 'mixed', time: string, waitMin: number): KosherStatus {
  return kosherCheck(eatenAt(logs), next, toMin(time), waitMin);
}

/** When dairy is allowed again after the last meat today: minute of day (may pass midnight) and HH:mm, or null. */
export function dairyFrom(logs: Pick<FoodLog, 'time' | 'kosher'>[], waitMin: number): { minute: number; hm: string } | null {
  const meat = logs.filter((l) => l.kosher === 'meat').map((l) => toMin(l.time));
  if (!meat.length) return null;
  const m = Math.max(...meat) + waitMin;
  const d = m % (24 * 60);
  return { minute: m, hm: `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}` };
}
