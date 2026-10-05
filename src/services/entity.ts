import { db } from '../db/db';
import { SETTINGS_ID, Settings } from '../domain/schemas';
import { DEFAULT_CALENDAR } from '../domain/season';
import { seedPantry } from './pantry';

export const nowIso = () => new Date().toISOString();
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const stamp = () => {
  const t = nowIso();
  return { createdAt: t, updatedAt: t };
};

/** Defaults on first start: settings, pantry and meals from the material (SPEC 8.5, 15.11). */
export async function ensureSeed(): Promise<void> {
  const s = await db.settings.get(SETTINGS_ID);
  if (!s) {
    await db.settings.put(Settings.parse({ id: SETTINGS_ID, ...stamp(), calendar: DEFAULT_CALENDAR }));
  }
  if ((await db.pantry.count()) === 0) await seedPantry();
}

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get(SETTINGS_ID);
  if (!s) throw new Error('settings missing');
  return s;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.settings.update(SETTINGS_ID, { ...patch, updatedAt: nowIso() });
}
