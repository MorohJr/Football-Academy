// Schema v2 (SPEC 0.8): v1 backups restore without onboarding; the workout in progress survives (R-WRK-2).
import { describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { AcademyDB, db, SCHEMA_V1 } from '../db/db';
import { exportBackup, parseBackup, restoreBackup } from './backup';
import { ensureSeed, getSettings } from './entity';
import { clearRun, getActiveRun, openRun, saveRun } from './runs';

describe('schema v2', () => {
  it('a v1 backup is migrated: onboarded, new defaults, empty runs', async () => {
    const t = '2026-10-01T10:00:00.000Z';
    const v1 = {
      format: 'football-academy-backup',
      schemaVersion: 1,
      exportedAt: t,
      data: { settings: [{ id: 'settings', createdAt: t, updatedAt: t, calendar: [{ programme: 'inseason', startMonth: 1, startDay: 1 }] }], sessions: [{ id: 'a', createdAt: t, updatedAt: t, date: '2026-10-01', kind: 'workout', title: 'x', minutes: 30, rpe: 5 }] },
    };
    const parsed = await parseBackup(JSON.stringify(v1));
    expect(parsed.tables.settings[0]).toMatchObject({ onboardedAt: t, theme: 'auto', deloadWeeks: [], maintenanceOverride: null });
    expect(parsed.tables.sessions[0]).toMatchObject({ loads: {} });
    expect(parsed.tables.runs).toEqual([]);
    await restoreBackup(parsed);
    expect((await getSettings()).onboardedAt).toBe(t);
  });
  it('a fresh start needs onboarding (also after "delete everything")', async () => {
    await db.settings.clear();
    await ensureSeed();
    expect((await getSettings()).onboardedAt).toBeNull();
  });
  it('the run is saved and resumed; a new backup round-trips', async () => {
    const r = await openRun('in-upper-1', '2026-10-14');
    await saveRun({ sets: { '0.0': 2 }, loads: { '0.0': [{ kg: 40, reps: 7 }, { kg: 40, reps: 7 }] } });
    const again = await openRun('in-upper-1', '2026-10-14');
    expect(again.startedAt).toBe(r.startedAt);
    expect(again.sets).toEqual({ '0.0': 2 });
    const back = await parseBackup(await exportBackup());
    expect(back.schemaVersion).toBe(2);
    expect(back.counts.runs).toBe(1);
    await clearRun();
    expect(await getActiveRun()).toBeUndefined();
  });
  it('an existing v1 database on the phone upgrades in place: no onboarding, loads added', async () => {
    const name = 'upgrade-test';
    const old = new Dexie(name);
    old.version(1).stores(SCHEMA_V1);
    const t = '2026-10-01T10:00:00.000Z';
    await old.table('settings').put({ id: 'settings', createdAt: t, updatedAt: t, name: 'אלכס', calendar: [] });
    await old.table('sessions').put({ id: 'a', createdAt: t, updatedAt: t, date: '2026-10-01', kind: 'workout', title: 'x', minutes: 30, rpe: 5, sets: {} });
    old.close();
    const upgraded = new AcademyDB(name);
    const s = await upgraded.settings.get('settings');
    expect(s?.onboardedAt).toBeTruthy();
    expect(s?.deloadWeeks).toEqual([]);
    expect((await upgraded.sessions.get('a'))?.loads).toEqual({});
    expect(await upgraded.runs.count()).toBe(0);
    upgraded.close();
  });
});
