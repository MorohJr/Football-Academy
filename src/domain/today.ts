// Dashboard calculations (SPEC 15.5 R-UI-2/4/5, 16.3: the UI doesn't compute). Pure functions.
import type { WorkoutCategory } from '../content/types';
import type { Acwr } from './tracking';
import type { DayPlanResult } from './season';

/** R-UI-4: a short Hebrew word for the day in the week strip, from the first workout of the day. */
export function dayStripLabel(plan: DayPlanResult, categoryOf: (workoutId: string) => WorkoutCategory | undefined): string {
  if (plan.items.some((i) => i.kind === 'game')) return '⚽';
  const first = plan.items.find((i) => i.kind === 'session');
  if (!first?.workoutId) return plan.items.length ? 'תוספת' : '–';
  const id = first.workoutId;
  if (id.startsWith('in-upper')) return 'עליון';
  if (id.startsWith('in-lower')) return 'תחתון';
  if (id === 'trx-mobility') return 'גמישות';
  const byCat: Partial<Record<WorkoutCategory, string>> = {
    strength: 'כוח',
    speed: 'מהירות',
    stamina: 'סטמינה',
    saq: 'זריזות',
    cardio: 'קרדיו',
    mobility: 'גמישות',
    injury: 'מניעה',
    recovery: 'קל',
    core: 'ליבה',
    testing: 'בדיקות',
    yoga: 'יוגה',
    bodyweight: 'גוף',
    prematch: 'לפני משחק',
    pushcore: 'תוספת',
    rest: '–',
  };
  return byCat[categoryOf(id) ?? 'rest'] ?? '•';
}

/** R-UI-5: the load tile is coloured by state only. */
export function loadTileTone(a: Acwr): 'high' | 'ok' | 'neutral' {
  if (a.ratio == null) return 'neutral';
  return a.zone === 'high' ? 'high' : 'ok';
}

/** R-UI-1: what's still to do first, then what's done. */
export function orderByDone<T>(items: T[], isDone: (t: T) => boolean): { ordered: T[]; done: T[]; todo: T[] } {
  const todo = items.filter((i) => !isDone(i));
  const done = items.filter(isDone);
  return { ordered: [...todo, ...done], done, todo };
}

/** R-GAM-5: heavy legs the day before a game. */
export const HEAVY_LEGS = /in-lower|pre-max|pre-se|pre-ss/;
export const heavyLegs = (plan: DayPlanResult) => plan.items.some((i) => HEAVY_LEGS.test(i.workoutId ?? ''));

/** R-STA: season totals of played games. */
export function seasonStats(games: { goals: number; assists: number; rating: number | null }[]) {
  const rated = games.filter((g) => g.rating != null);
  return {
    games: games.length,
    goals: games.reduce((a, g) => a + g.goals, 0),
    assists: games.reduce((a, g) => a + g.assists, 0),
    rating: rated.length ? Math.round((rated.reduce((a, g) => a + g.rating!, 0) / rated.length) * 10) / 10 : null,
  };
}

/** Position of "you are here" on the year bar, in % (kept inside the bar). */
export function yearBarPosition(daysFromStart: number, yearDays: number): number {
  return Math.max(0, Math.min(92, (daysFromStart / yearDays) * 100));
}

export function greeting(hour: number): string {
  return hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : hour < 21 ? 'ערב טוב' : 'לילה טוב';
}
