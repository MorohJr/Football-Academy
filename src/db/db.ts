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

export type TableName = keyof typeof SCHEMA_V1;
export const TABLE_NAMES = Object.keys(SCHEMA_V1) as TableName[];
export const CURRENT_SCHEMA_VERSION = 1;

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

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores(SCHEMA_V1);
  }
}

export const db = new AcademyDB();
