import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION, TABLE_NAMES, db, type TableName } from '../db/db';
import * as S from '../domain/schemas';
import { SETTINGS_ID } from '../domain/schemas';

/** Full JSON backup (E2): every table + schema version. Restore replaces all data after validation and migration. */
export const BACKUP_FORMAT = 'football-academy-backup';

const ROW_SCHEMAS: Record<TableName, z.ZodType> = {
  settings: S.Settings,
  sessions: S.SessionLog,
  checkins: S.Checkin,
  pantry: S.PantryItem,
  meals: S.Meal,
  foodLogs: S.FoodLog,
  shopping: S.ShoppingItem,
  pitches: S.Pitch,
  games: S.Game,
  worksheets: S.Worksheet,
  tests: S.TestResult,
  strength: S.StrengthMax,
  body: S.BodyEntry,
  niggles: S.Niggle,
  reviews: S.WeekReview,
  lessons: S.LessonLog,
};

type BackupData = Partial<Record<string, unknown[]>>;

const BackupFile = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.int().positive(),
  exportedAt: z.string(),
  data: z.record(z.string(), z.array(z.unknown())),
});

export class BackupError extends Error {
  constructor(
    public readonly code: 'not_a_backup' | 'newer_version' | 'invalid_data',
    public readonly details?: string,
  ) {
    super(details ? `${code}: ${details}` : code);
    this.name = 'BackupError';
  }
}

export async function exportBackup(): Promise<string> {
  const data: BackupData = {};
  for (const name of TABLE_NAMES) data[name] = await db.table(name).toArray();
  return JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION, exportedAt: new Date().toISOString(), data });
}

export const backupFileName = (isoDate: string) => `football-academy-backup-${isoDate}.json`;

export async function markBackupDone(): Promise<void> {
  const t = new Date().toISOString();
  await db.settings.update(SETTINGS_ID, { lastBackupAt: t, updatedAt: t });
}

/** Migrations of backup data, keyed by the version they migrate FROM (n → n+1). Add a step for every Dexie version bump. */
export const MIGRATIONS: Record<number, (data: BackupData) => BackupData> = {};

function migrate(data: BackupData, fromVersion: number): BackupData {
  let cur = data;
  for (let v = fromVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new BackupError('invalid_data', `no migration from schema version ${v}`);
    cur = step(cur);
  }
  return cur;
}

export interface ParsedBackup {
  schemaVersion: number;
  exportedAt: string;
  tables: Record<TableName, unknown[]>;
  counts: Record<TableName, number>;
}

export async function parseBackup(text: string): Promise<ParsedBackup> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupError('not_a_backup');
  }
  const file = BackupFile.safeParse(json);
  if (!file.success) throw new BackupError('not_a_backup');
  if (file.data.schemaVersion > CURRENT_SCHEMA_VERSION) throw new BackupError('newer_version');
  const data = migrate(file.data.data as BackupData, file.data.schemaVersion);
  const tables = {} as Record<TableName, unknown[]>;
  const counts = {} as Record<TableName, number>;
  for (const name of TABLE_NAMES) {
    const rows = data[name] ?? [];
    tables[name] = rows.map((row, i) => {
      const r = ROW_SCHEMAS[name].safeParse(row);
      if (!r.success) throw new BackupError('invalid_data', `${name}[${i}]: ${r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`);
      return r.data;
    });
    counts[name] = rows.length;
  }
  if (tables.settings.length !== 1) throw new BackupError('invalid_data', 'settings row missing');
  return { schemaVersion: file.data.schemaVersion, exportedAt: file.data.exportedAt, tables, counts };
}

/** Replaces ALL data, atomically. The UI asks for a double confirmation first. */
export async function restoreBackup(backup: ParsedBackup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) {
      const table = db.table(name);
      await table.clear();
      await table.bulkAdd(backup.tables[name]);
    }
  });
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const name of TABLE_NAMES) await db.table(name).clear();
  });
}
