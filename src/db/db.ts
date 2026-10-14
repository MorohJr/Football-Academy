import Dexie, { type EntityTable } from 'dexie';
import type * as D from '../domain/schemas';

export const DB_NAME = 'football-academy';

/**
 * Table name → Dexie index spec. The first key is the primary key.
 * Every schema change MUST add a new `db.version(n)` and a step in MIGRATIONS (services/backup.ts). Never edit a published version.
 */
export const SCHEMA_V1 = {
  settings: 'id',
  sessions: 'id, date, kind, workoutId, gameId',
  checkins: 'id, &date',
  pantry: 'id, category, barcode',
  meals: 'id, slot',
  foodLogs: 'id, date',
  shopping: 'id',
  pitches: 'id',
  games: 'id, date, defaultDate',
  worksheets: 'id, date, kind, gameId',
  tests: 'id, date, testId',
  strength: 'id, date, lift',
  body: 'id, date',
  niggles: 'id, start, closed',
  reviews: 'id, &week',
  lessons: 'id, date, lessonId',
} as const;

/** v2 (SPEC 0.8): `runs` (workout in progress, R-WRK-2). New fields: sessions.loads, settings.onboardedAt/theme/deloadWeeks/maintenanceOverride. */
export const SCHEMA_V2 = { ...SCHEMA_V1, runs: 'id' } as const;

export type TableName = keyof typeof SCHEMA_V2;
export const TABLE_NAMES = Object.keys(SCHEMA_V2) as TableName[];
export const CURRENT_SCHEMA_VERSION = 2;

export class AcademyDB extends Dexie {
  settings!: EntityTable<D.Settings, 'id'>;
  sessions!: EntityTable<D.SessionLog, 'id'>;
  checkins!: EntityTable<D.Checkin, 'id'>;
  pantry!: EntityTable<D.PantryItem, 'id'>;
  meals!: EntityTable<D.Meal, 'id'>;
  foodLogs!: EntityTable<D.FoodLog, 'id'>;
  shopping!: EntityTable<D.ShoppingItem, 'id'>;
  pitches!: EntityTable<D.Pitch, 'id'>;
  games!: EntityTable<D.Game, 'id'>;
  worksheets!: EntityTable<D.Worksheet, 'id'>;
  tests!: EntityTable<D.TestResult, 'id'>;
  strength!: EntityTable<D.StrengthMax, 'id'>;
  body!: EntityTable<D.BodyEntry, 'id'>;
  niggles!: EntityTable<D.Niggle, 'id'>;
  reviews!: EntityTable<D.WeekReview, 'id'>;
  lessons!: EntityTable<D.LessonLog, 'id'>;
  runs!: EntityTable<D.ActiveRun, 'id'>;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores(SCHEMA_V1);
    // Existing users already use the app: no onboarding for them (R-ONB). New fields get their defaults.
    this.version(2)
      .stores(SCHEMA_V2)
      .upgrade(async (tx) => {
        const t = new Date().toISOString();
        await tx.table('settings').toCollection().modify((s: Record<string, unknown>) => {
          s.onboardedAt ??= t;
          s.theme ??= 'auto';
          s.deloadWeeks ??= [];
          s.maintenanceOverride ??= null;
        });
        await tx.table('sessions').toCollection().modify((s: Record<string, unknown>) => {
          s.loads ??= {};
        });
      });
  }
}

export const db = new AcademyDB();
