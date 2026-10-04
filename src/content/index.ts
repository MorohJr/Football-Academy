import type { Workout } from './types';
import { PRESEASON_WORKOUTS, restDay, trxMobility } from './preseason';
import { INSEASON_WORKOUTS } from './inseason';
import { INJURY_WORKOUTS } from './injury';
import { SPEED_WORKOUTS, STAMINA_WORKOUTS, BODYWEIGHT_WORKOUTS } from './boosters';

export const ALL_WORKOUTS: Workout[] = (() => {
  const map = new Map<string, Workout>();
  for (const w of [restDay, trxMobility, ...PRESEASON_WORKOUTS, ...INSEASON_WORKOUTS, ...INJURY_WORKOUTS, ...SPEED_WORKOUTS, ...STAMINA_WORKOUTS, ...BODYWEIGHT_WORKOUTS]) {
    if (!map.has(w.id)) map.set(w.id, w);
  }
  return [...map.values()];
})();

const BY_ID = new Map(ALL_WORKOUTS.map((w) => [w.id, w]));

export function getWorkout(id: string): Workout | undefined {
  return BY_ID.get(id);
}
