import { describe, expect, it } from 'vitest';
import { acwr, dayLoad, macroTargets, monthlySummaries, pomsTotal, returnToPlayCap, weeklySummaries, type SessionLog } from './tracking';
import { periodFor, planFor } from './season';
import { addDaysISO, weekday } from './dates';
import { ALL_WORKOUTS, getWorkout } from '../content';
import { PRESEASON_DAYS } from '../content/preseason';
import { inseasonWeekTemplate } from '../content/inseason';
import { speedWeek, staminaWeek, bodyweightWeek } from '../content/boosters';
import { levelForMax, pushDose, coreDose } from '../content/pushcore';

// Golden example: the "EXAMPLE" columns of TRUE_TRACKING_SYSTEM (14th-20th, Mon-Sun).
const W = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'];
const EXAMPLE: SessionLog[] = [
  { date: W[0]!, minutes: 30, rpe: 5 }, { date: W[0]!, minutes: 60, rpe: 5 }, { date: W[0]!, minutes: 60, rpe: 8 },
  { date: W[1]!, minutes: 60, rpe: 4 }, { date: W[1]!, minutes: 60, rpe: 7 },
  { date: W[2]!, minutes: 15, rpe: 8 }, { date: W[2]!, minutes: 90, rpe: 6 },
  { date: W[3]!, minutes: 45, rpe: 2 }, { date: W[3]!, minutes: 45, rpe: 8 }, { date: W[3]!, minutes: 15, rpe: null },
  { date: W[4]!, minutes: 60, rpe: 3 },
  { date: W[5]!, minutes: 110, rpe: 10 },
  { date: W[6]!, minutes: 20, rpe: 3 },
];

describe('tracking (R-TRK)', () => {
  it('daily units = minutes × average RPE, as in the sheet example', () => {
    expect(W.map((d) => dayLoad(d, EXAMPLE).minutes)).toEqual([150, 120, 105, 105, 60, 110, 20]);
    expect(W.map((d) => dayLoad(d, EXAMPLE).rpeTotal)).toEqual([18, 11, 14, 10, 3, 10, 3]);
    expect(W.map((d) => dayLoad(d, EXAMPLE).rpeAvg)).toEqual([6, 5.5, 7, 5, 3, 10, 3]);
    expect(W.map((d) => dayLoad(d, EXAMPLE).units)).toEqual([900, 660, 735, 525, 180, 1100, 60]);
  });
  it('weekly total units 4160 and week average 5.64', () => {
    // Shift the example to a Sunday-start week so it lands in one week.
    const shifted = EXAMPLE.map((s) => ({ ...s, date: addDaysISO(s.date, -1) }));
    const [wk] = weeklySummaries(shifted, []);
    expect(wk!.units).toBe(4160);
    expect(wk!.minutes).toBe(670);
    expect(wk!.rpeAvg).toBe(5.64);
  });
  it('POMS example totals 142 for the week', () => {
    const scores = [[5, 5, 4, 3, 5], [4, 4, 4, 5, 4], [4, 4, 5, 3, 3], [3, 5, 3, 3, 4], [5, 5, 4, 5, 5], [5, 5, 5, 5, 4], [2, 5, 2, 1, 4]];
    const totals = scores.map((s) => pomsTotal({ date: '', scores: { sleep: s[0]!, lookingForward: s[1]!, vigorous: s[2]!, soreness: s[3]!, appetite: s[4]! } }));
    expect(totals).toEqual([22, 21, 19, 18, 24, 24, 14]);
    expect(totals.reduce((a, b) => a + b, 0)).toBe(142);
  });
  it('monthly workload sums units by calendar month', () => {
    const m = monthlySummaries([{ date: '2026-01-05', minutes: 100, rpe: 5 }, { date: '2026-01-20', minutes: 60, rpe: 10 }, { date: '2026-02-01', minutes: 10, rpe: 1 }], []);
    expect(m).toEqual([{ month: '2026-01', units: 1100, poms: null }, { month: '2026-02', units: 10, poms: null }]);
  });
  it('ACWR: Bible example 100,120,130,135 → chronic 121.25, 170 is above 1.4', () => {
    const weeks = [
      { weekStart: '2026-01-04', units: 100 }, { weekStart: '2026-01-11', units: 120 }, { weekStart: '2026-01-18', units: 130 },
      { weekStart: '2026-01-25', units: 135 }, { weekStart: '2026-02-01', units: 170 },
    ].map((w) => ({ ...w, minutes: 0, rpe: 0, rpeAvg: 0, poms: null }));
    const r = acwr(weeks, '2026-02-01');
    expect(r.chronic).toBe(121.25);
    expect(r.zone).toBe('high');
    expect(acwr(weeks.map((w) => (w.weekStart === '2026-02-01' ? { ...w, units: 169 } : w)), '2026-02-01').zone).toBe('ok');
    expect(acwr(weeks.slice(2), '2026-02-01').zone).toBe('unknown');
  });
  it('return to play cap 1.3× and macros', () => {
    expect(returnToPlayCap(1000)).toBe(1300);
    expect(macroTargets(70, true)).toEqual({ protein: 126, carbs: [490, 700], fatPct: [20, 25] });
    expect(macroTargets(70, false).carbs).toEqual([350, 490]);
  });
});

describe('season calendar (R-SEA)', () => {
  it('default blocks by date', () => {
    expect(periodFor('2026-01-15').programme).toBe('stamina');
    expect(periodFor('2026-02-10').programme).toBe('speed');
    expect(periodFor('2026-04-30').programme).toBe('inseason');
    expect(periodFor('2026-05-10').programme).toBe('rest');
    expect(periodFor('2026-07-01').programme).toBe('preseason');
    expect(periodFor('2026-09-01').programme).toBe('bodyweight');
    expect(periodFor('2026-12-31').programme).toBe('inseason');
    expect(periodFor('2026-10-04')).toMatchObject({ start: '2026-10-01', end: '2026-12-31', dayOfBlock: 4 });
  });
  it('pre-season: testing on days 1, 36, 70; then the season starts', () => {
    expect(planFor('2026-06-01').testing).toBe(true);
    expect(planFor(addDaysISO('2026-06-01', 35)).testing).toBe(true);
    expect(planFor(addDaysISO('2026-06-01', 69)).testing).toBe(true);
    expect(planFor(addDaysISO('2026-06-01', 4)).rest).toBe(true); // day 5
    expect(planFor(addDaysISO('2026-06-01', 70)).week).toBe(1); // day 71 → in-season week 1
  });
  it('in-season: Saturday game → Tue upper+speed+core, Fri injury prevention, Sat pre-match, Sun recovery', () => {
    // 2026-10-03 is a Saturday
    expect(weekday('2026-10-03')).toBe(6);
    expect(planFor('2026-10-06').sessions.map((s) => s.workoutId)).toEqual(['in-upper-1', 'in-speed-w1', 'in-core-w1']);
    expect(planFor('2026-10-09').sessions.map((s) => s.workoutId)).toEqual(['in-ip']);
    expect(planFor('2026-10-10').sessions.map((s) => s.workoutId)).toEqual(['pre-match']);
    expect(planFor('2026-10-11').sessions.map((s) => s.workoutId)).toEqual(['active-recovery']);
    expect(planFor('2026-10-05').rest).toBe(true);
  });
  it('in-season game day is a setting', () => {
    // game on Thursday (4): Sunday becomes upper day (offset -4)
    expect(planFor('2026-10-04', undefined, { gameDay: 4 }).sessions[0]!.workoutId).toBe('in-upper-1');
  });
  it('boosters: 28 days then transition days', () => {
    expect(planFor('2026-01-01').sessions.map((s) => s.workoutId)).toEqual(['sta-s1-w1']);
    expect(planFor('2026-01-29').transition).toBe(true);
    expect(planFor('2026-02-01').sessions.map((s) => s.workoutId)).toEqual(['spd-gym1-w1', 'spd-pitch1-w1']);
  });
});

describe('content integrity', () => {
  it('pre-season has 70 days and 8 complete rest days (days 5, 12, 35, 43, 49, 50, 62, 69)', () => {
    expect(PRESEASON_DAYS).toHaveLength(70);
    expect(PRESEASON_DAYS.filter((d) => d.rest).map((d) => d.day)).toEqual([5, 12, 35, 43, 49, 50, 62, 69]);
  });
  it('every planned workout id exists', () => {
    const ids = new Set<string>();
    PRESEASON_DAYS.forEach((d) => d.sessions.forEach((s) => ids.add(s.workoutId)));
    for (let w = 1; w <= 10; w++) inseasonWeekTemplate(w).forEach((r) => r.sessions.forEach((s) => ids.add(s.workoutId)));
    for (let w = 1; w <= 4; w++) [...speedWeek(w), ...staminaWeek(w), ...bodyweightWeek(w)].forEach((r) => r.sessions.forEach((s) => ids.add(s)));
    const missing = [...ids].filter((id) => !getWorkout(id));
    expect(missing).toEqual([]);
  });
  it('all video links are Vimeo https links', () => {
    for (const w of ALL_WORKOUTS) for (const v of [...(w.videos ?? []), ...w.blocks.flatMap((b) => b.videos ?? [])]) expect(v.url).toMatch(/^https:\/\/vimeo\.com\//);
  });
});

describe('push & core add-on (R-PC, proposal)', () => {
  it('level from max push-ups', () => {
    expect(levelForMax(5).level).toBe(1);
    expect(levelForMax(10).level).toBe(2);
    expect(levelForMax(34).level).toBe(3);
    expect(levelForMax(60).level).toBe(5);
  });
  it('dose progresses 3×50% → 4×50% → 3×60% → 4×60%', () => {
    expect(pushDose(16, 1)).toEqual({ sets: 3, reps: 8 });
    expect(pushDose(16, 3)).toEqual({ sets: 4, reps: 8 });
    expect(pushDose(16, 5)).toEqual({ sets: 3, reps: 10 });
    expect(pushDose(16, 8, true)).toEqual({ sets: 2, reps: 8 });
    expect(coreDose(1).sets).toBe('2');
    expect(coreDose(7).loaded).toBe(true);
  });
});
