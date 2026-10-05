// Stored entities (Zod). Every row has id, createdAt, updatedAt. Dates YYYY-MM-DD, times HH:mm.
import { z } from 'zod';

const Base = { id: z.string(), createdAt: z.string(), updatedAt: z.string() };
const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Hm = z.string().regex(/^\d{2}:\d{2}$/);
export const KosherZ = z.enum(['meat', 'dairy', 'parve', 'fish']);
const MacrosZ = { kcal: z.number(), protein: z.number(), carbs: z.number(), fat: z.number() };

export const SETTINGS_ID = 'settings';

export const SeasonBlockZ = z.object({
  programme: z.enum(['stamina', 'speed', 'inseason', 'rest', 'preseason', 'bodyweight']),
  startMonth: z.int().min(1).max(12),
  startDay: z.int().min(1).max(31),
});

export const Settings = z.object({
  ...Base,
  name: z.string().default('אלכס'),
  sex: z.enum(['male', 'female']).default('male'),
  birthYear: z.int().nullable().default(null),
  heightCm: z.number().nullable().default(null),
  /** manual weight when there are no weigh-ins yet */
  weightKg: z.number().nullable().default(null),
  activity: z.number().default(1.6),
  goalMode: z.enum(['auto', 'cut', 'maintain']).default('auto'),
  deficit: z.int().default(400),
  kosherWaitMin: z.int().default(120),
  gameWeekday: z.int().min(0).max(6).default(4),
  gameTime: Hm.default('20:00'),
  defaultPitchId: z.string().nullable().default(null),
  calendar: z.array(SeasonBlockZ),
  pushCore: z.boolean().default(true),
  weakFoot: z.boolean().default(true),
  lastBackupAt: z.string().nullable().default(null),
  demo: z.boolean().default(false),
});
export type Settings = z.infer<typeof Settings>;

/** A finished workout, game or other activity. Feeds the tracking sheet (minutes, RPE). */
export const SessionLog = z.object({
  ...Base,
  date: Iso,
  kind: z.enum(['workout', 'game', 'other']),
  workoutId: z.string().nullable().default(null),
  /** push&core pair / weak foot etc. */
  addOn: z.string().nullable().default(null),
  title: z.string(),
  minutes: z.number().min(0),
  rpe: z.number().min(0).max(10).nullable(),
  /** set checkboxes from workout mode: "blockIdx.exIdx" → sets done */
  sets: z.record(z.string(), z.int()).default({}),
  gameId: z.string().nullable().default(null),
});
export type SessionLog = z.infer<typeof SessionLog>;

/** Morning check-in: POMS + sleep (R-TRK, R-SLP). id = date. */
export const Checkin = z.object({
  ...Base,
  date: Iso,
  sleep: z.int().min(1).max(5),
  lookingForward: z.int().min(1).max(5),
  vigorous: z.int().min(1).max(5),
  soreness: z.int().min(1).max(5),
  appetite: z.int().min(1).max(5),
  lightsOut: Hm.nullable().default(null),
  wake: Hm.nullable().default(null),
  napMin: z.int().min(0).default(0),
});
export type Checkin = z.infer<typeof Checkin>;

export const PantryItem = z.object({
  ...Base,
  name: z.string(),
  category: z.enum(['protein', 'carbs', 'fats', 'produce', 'drinks']),
  kosher: KosherZ,
  cert: z.string().default(''),
  unit: z.enum(['g', 'ml', 'unit']),
  /** per 100 g/ml, or per unit */
  per: z.object(MacrosZ),
  stock: z.number().min(0),
  lowAt: z.number().min(0),
  barcode: z.string().nullable().default(null),
  seed: z.boolean().default(false),
});
export type PantryItem = z.infer<typeof PantryItem>;

export const Meal = z.object({
  ...Base,
  name: z.string(),
  slot: z.enum(['breakfast', 'snack', 'lunch', 'dinner', 'pre', 'post', 'prebed', 'match']),
  style: z.enum(['around', 'protein']).default('protein'),
  ingredients: z.array(z.object({ itemId: z.string(), amount: z.number().positive() })),
  instructions: z.string().default(''),
  inMenu: z.boolean().default(false),
  seed: z.boolean().default(false),
});
export type Meal = z.infer<typeof Meal>;

export const FoodLog = z.object({
  ...Base,
  date: Iso,
  time: Hm,
  name: z.string(),
  mealId: z.string().nullable().default(null),
  itemId: z.string().nullable().default(null),
  amount: z.number().nullable().default(null),
  kosher: z.enum(['meat', 'dairy', 'parve', 'fish', 'mixed']),
  ...MacrosZ,
});
export type FoodLog = z.infer<typeof FoodLog>;

export const ShoppingItem = z.object({ ...Base, name: z.string(), itemId: z.string().nullable().default(null), done: z.boolean().default(false) });
export type ShoppingItem = z.infer<typeof ShoppingItem>;

export const Pitch = z.object({
  ...Base,
  name: z.string(),
  note: z.string().default(''),
  surface: z.enum(['synthetic', 'grass', 'hard', 'indoor', 'sand']),
});
export type Pitch = z.infer<typeof Pitch>;

export const Game = z.object({
  ...Base,
  date: Iso,
  time: Hm,
  /** the fixed weekly date this game belongs to (R-GAM-2) */
  defaultDate: Iso,
  pitchId: z.string().nullable().default(null),
  status: z.enum(['planned', 'played', 'cancelled']).default('planned'),
  minutes: z.number().nullable().default(null),
  rpe: z.number().min(0).max(10).nullable().default(null),
  goals: z.int().min(0).default(0),
  assists: z.int().min(0).default(0),
  rating: z.number().min(1).max(10).nullable().default(null),
  position: z.string().default(''),
  result: z.string().default(''),
  notes: z.string().default(''),
  weightBefore: z.number().nullable().default(null),
  weightAfter: z.number().nullable().default(null),
  /** game-mode checklist: item id → done */
  checklist: z.record(z.string(), z.boolean()).default({}),
});
export type Game = z.infer<typeof Game>;

export const Worksheet = z.object({
  ...Base,
  date: Iso,
  kind: z.enum(['postMatch', 'trainingScript', 'matchScript', 'selfTalk']),
  gameId: z.string().nullable().default(null),
  data: z.record(z.string(), z.array(z.string())),
});
export type Worksheet = z.infer<typeof Worksheet>;

export const TestResult = z.object({
  ...Base,
  date: Iso,
  testId: z.string(),
  value: z.number(),
  side: z.enum(['L', 'R']).nullable().default(null),
  note: z.string().default(''),
});
export type TestResult = z.infer<typeof TestResult>;

export const StrengthMax = z.object({ ...Base, date: Iso, lift: z.enum(['squat', 'deadlift', 'bench']), kg: z.number().positive() });
export type StrengthMax = z.infer<typeof StrengthMax>;

export const BodyEntry = z.object({
  ...Base,
  date: Iso,
  weight: z.number().nullable().default(null),
  sites: z.record(z.string(), z.number()).default({}),
});
export type BodyEntry = z.infer<typeof BodyEntry>;

export const Niggle = z.object({
  ...Base,
  start: Iso,
  area: z.string(),
  side: z.enum(['L', 'R', 'C']),
  intensity: z.int().min(1).max(10),
  type: z.enum(['tight', 'sharp', 'dull']),
  when: z.enum(['game', 'training', 'after', 'other']),
  note: z.string().default(''),
  closed: Iso.nullable().default(null),
});
export type Niggle = z.infer<typeof Niggle>;

export const WeekReview = z.object({
  ...Base,
  /** Sunday of the week */
  week: Iso,
  goals: z.array(z.object({ text: z.string(), done: z.boolean() })).max(3),
  doneAt: z.string().nullable().default(null),
});
export type WeekReview = z.infer<typeof WeekReview>;

export const LessonLog = z.object({ ...Base, date: Iso, lessonId: z.string() });
export type LessonLog = z.infer<typeof LessonLog>;
