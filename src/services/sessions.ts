import { db } from '../db/db';
import type { SessionLog } from '../domain/schemas';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export async function logSession(p: { date: string; workoutId: string | null; title: string; minutes: number; rpe: number | null; kind?: SessionLog['kind']; sets?: Record<string, number>; gameId?: string | null }): Promise<string> {
  const t = new Date().toISOString();
  const id = uid();
  await db.sessions.add({ id, createdAt: t, updatedAt: t, date: p.date, kind: p.kind ?? 'workout', workoutId: p.workoutId, addOn: null, title: p.title, minutes: p.minutes, rpe: p.rpe, sets: p.sets ?? {}, gameId: p.gameId ?? null });
  return id;
}

export async function deleteSession(id: string): Promise<SessionLog | undefined> {
  const s = await db.sessions.get(id);
  await db.sessions.delete(id);
  return s;
}
