import { db } from '../db/db';
import { addDaysISO, weekStart, type ISODate } from '../domain/dates';
import { acwr, weeklySummaries, type PomsLog, type SessionLog as TSession } from '../domain/tracking';
import type { Checkin, SessionLog } from '../domain/schemas';
import { navyBodyFatMale, navyBodyFatFemale, trendWeight } from '../domain/body';
import { getSettings } from './entity';

export const toTrackSessions = (s: SessionLog[]): TSession[] => s.map((x) => ({ date: x.date, minutes: x.minutes, rpe: x.rpe }));
export const toPoms = (c: Checkin[]): PomsLog[] =>
  c.map((x) => ({ date: x.date, scores: { sleep: x.sleep, lookingForward: x.lookingForward, vigorous: x.vigorous, soreness: x.soreness, appetite: x.appetite } }));

export const pomsOf = (c: Checkin) => c.sleep + c.lookingForward + c.vigorous + c.soreness + c.appetite;

/** Sleep hours from lights-out and wake (crossing midnight), + nap. */
export function sleepHours(c: Pick<Checkin, 'lightsOut' | 'wake' | 'napMin'>): number | null {
  if (!c.lightsOut || !c.wake) return null;
  const a = Number(c.lightsOut.slice(0, 2)) * 60 + Number(c.lightsOut.slice(3));
  const b = Number(c.wake.slice(0, 2)) * 60 + Number(c.wake.slice(3));
  const mins = (b - a + 24 * 60) % (24 * 60);
  return Math.round(((mins + (c.napMin ?? 0)) / 60) * 10) / 10;
}

export async function loadStatus(today: ISODate) {
  const from = addDaysISO(weekStart(today), -35);
  const sessions = await db.sessions.where('date').between(from, today, true, true).toArray();
  const checkins = await db.checkins.where('date').between(from, today, true, true).toArray();
  const weeks = weeklySummaries(toTrackSessions(sessions), toPoms(checkins));
  const ws = weekStart(today);
  const cur = weeks.find((w) => w.weekStart === ws);
  const a = acwr(weeks, ws);
  // R-TRK-6: high load + low POMS in the same week.
  const prevWeeks = weeks.filter((w) => w.weekStart < ws).slice(-4);
  const avgPoms = prevWeeks.filter((w) => w.poms != null).map((w) => w.poms!);
  const curPomsDays = checkins.filter((c) => c.date >= ws);
  const curPomsAvg = curPomsDays.length ? curPomsDays.reduce((s, c) => s + pomsOf(c), 0) / curPomsDays.length : null;
  const prevDaily = avgPoms.length ? avgPoms.reduce((x, y) => x + y, 0) / avgPoms.length / 7 : null;
  const pomsDrop = curPomsAvg != null && prevDaily != null && curPomsAvg < prevDaily * 0.85;
  return { acwr: a, weekUnits: cur?.units ?? 0, weekMinutes: cur?.minutes ?? 0, prevWeekUnits: weeks.find((w) => w.weekStart === addDaysISO(ws, -7))?.units ?? 0, pomsDrop: pomsDrop && a.zone === 'high' };
}

/** Body summary: trend weight, latest measurement and body fat (R-BOD). */
export async function bodySummary(today: ISODate) {
  const s = await getSettings();
  const entries = (await db.body.toArray()).sort((a, b) => a.date.localeCompare(b.date));
  const weighIns = entries.filter((e) => e.weight != null).map((e) => ({ date: e.date, weight: e.weight! }));
  const trend = trendWeight(weighIns, today);
  const lastMeasure = [...entries].reverse().find((e) => Object.keys(e.sites).length > 0) ?? null;
  const weight = trend ?? s.weightKg;
  let bodyFat: number | null = null;
  if (lastMeasure && s.heightCm) {
    const w = lastMeasure.sites.waist;
    const n = lastMeasure.sites.neck;
    const h = lastMeasure.sites.hips;
    if (w && n) bodyFat = s.sex === 'male' ? navyBodyFatMale(w, n, s.heightCm) : h ? navyBodyFatFemale(w, h, n, s.heightCm) : null;
  }
  const monthAgo = trendWeight(weighIns, addDaysISO(today, -30));
  return { weight, trend, weighIns, lastMeasure, bodyFat, monthDelta: trend != null && monthAgo != null && monthAgo !== trend ? Math.round((trend - monthAgo) * 10) / 10 : null, lastWeighIn: weighIns[weighIns.length - 1] ?? null, entries };
}
