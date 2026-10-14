// Workout mode steps (R-WRK) and per-set loads (R-PRG-1). Pure functions.
import type { Block, ExerciseRx, Workout } from '../content/types';
import { parseSeconds, parseSets } from './rx';
import type { SetLoad } from './progression';

export interface Step {
  bi: number;
  ei: number;
  key: string;
  ex: ExerciseRx;
  block: Block;
  sets: number;
  /** R-PRG-1: kg/reps are logged for this exercise */
  loadable: boolean;
  /** for timed blocks: seconds on/off */
  on?: number;
  off?: number;
}

const LOADABLE_KINDS = new Set<Block['kind']>(['straight', 'superset', 'circuit']);

export function buildSteps(w: Workout): Step[] {
  const out: Step[] = [];
  w.blocks.forEach((b, bi) => {
    b.exercises.forEach((ex, ei) => {
      const base = { bi, ei, key: `${bi}.${ei}`, ex, block: b };
      if (b.kind === 'timed') out.push({ ...base, sets: Number.parseInt(b.rounds ?? '1', 10) || 1, loadable: false, on: parseSeconds(b.timeOn) ?? 30, off: parseSeconds(b.timeOff) ?? 0 });
      else out.push({ ...base, sets: b.kind === 'sequence' ? 1 : parseSets(ex.sets), loadable: w.category === 'strength' && LOADABLE_KINDS.has(b.kind) });
    });
  });
  return out;
}

/** Step-keyed loads ("0.1" → sets) to exercise-name-keyed loads for the session log (same name twice → merged). */
export function loadsByName(steps: Step[], loads: Record<string, SetLoad[]>): Record<string, SetLoad[]> {
  const out: Record<string, SetLoad[]> = {};
  for (const st of steps) {
    const l = loads[st.key];
    if (l?.length) out[st.ex.name] = [...(out[st.ex.name] ?? []), ...l];
  }
  return out;
}

/** Unticking set i (0-based) keeps sets before it. */
export const truncateLoads = (l: SetLoad[] | undefined, n: number): SetLoad[] => (l ?? []).slice(0, n);
