// Content model: everything extracted from INFORMATION/ (SPEC 3).
// Exercise names stay in English (as in the source), UI text is Hebrew.

/** A video is always a link that opens Vimeo in the browser. Never embedded (SPEC 1.1 E6). */
export interface VideoLink {
  label: string;
  url: string;
  /** true for the YouTube links we added where the source has none or a wrong one (SPEC 12). Shown as "לא מ-Matchfit". */
  external?: boolean;
}

/** One exercise line in a workout. Values are kept as written in the source ("12-15", "30 SECS"). */
export interface ExerciseRx {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
  note?: string;
  /** key of a pitch drawing in content/drills.ts */
  diagram?: string;
}

/**
 * How a block is performed:
 * straight = all sets of an exercise before the next one,
 * superset = pairs, all sets of the pair before the next pair, no rest,
 * circuit = one set of each in turn, repeat,
 * timed = work/rest intervals (time on / time off),
 * sequence = a fixed order with no sets (foam roller, mechanics),
 * runs = pitch drills (sprints, stamina runs).
 */
export type BlockKind = 'straight' | 'superset' | 'circuit' | 'timed' | 'sequence' | 'runs';

export interface Block {
  title?: string;
  kind: BlockKind;
  exercises: ExerciseRx[];
  /** For timed blocks */
  timeOn?: string;
  timeOff?: string;
  rounds?: string;
  note?: string;
  videos?: VideoLink[];
  /** key of a pitch drawing in content/drills.ts */
  diagram?: string;
}

export type WorkoutCategory =
  | 'testing'
  | 'strength'
  | 'saq'
  | 'cardio'
  | 'mobility'
  | 'speed'
  | 'stamina'
  | 'core'
  | 'injury'
  | 'prematch'
  | 'recovery'
  | 'bodyweight'
  | 'yoga'
  | 'pushcore'
  | 'rest';

export type Location = 'gym' | 'pitch' | 'home' | 'any';

export interface Workout {
  id: string;
  title: string;
  /** Short Hebrew subtitle for lists */
  subtitle?: string;
  category: WorkoutCategory;
  location: Location;
  durationMin?: number;
  equipment?: string[];
  videos?: VideoLink[];
  notes?: string[];
  blocks: Block[];
}

/** Programme ids. The order matches the default season calendar (SPEC 4). */
export type ProgrammeId = 'stamina' | 'speed' | 'inseason' | 'rest' | 'preseason' | 'bodyweight';

/** What the plan says for one day: zero or more workouts, with a Hebrew timing hint each. */
export interface PlannedSession {
  workoutId: string;
  /** e.g. "בוקר מוקדם, רחוק מהמשחק" */
  timing?: string;
}

export interface DayPlan {
  /** 1-based day of the programme */
  day: number;
  sessions: PlannedSession[];
  /** True when the source marks the day as complete rest */
  rest?: boolean;
}
