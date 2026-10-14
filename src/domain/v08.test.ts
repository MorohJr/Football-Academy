// SPEC 0.8 rules: R-PRG, R-NUT-1a, R-DLD, R-HEAT, R-UI-4/5.
import { describe, expect, it } from 'vitest';
import { bestE1rm, describeSets, e1rmSeries, epley, liftFor, oneRepMax, parseReps, roundKg, suggest } from './progression';
import { adaptiveMaintenance, adaptiveWorthShowing } from './nutrition';
import { deloadWorkout, halveCount, isDeloadWeek, toggleDeload, weeksSinceDeload } from './deload';
import { acclimatisation, heatToday, isHeatSeason } from './heat';
import { dayStripLabel, loadTileTone, orderByDone, seasonStats } from './today';
import { buildSteps, loadsByName } from './run';
import { addDaysISO } from './dates';
import { periodFor, planFor, preseasonDay1 } from './season';
import { getWorkout } from '../content';

describe('progressive overload (R-PRG)', () => {
  it('parses the prescriptions as written in the source', () => {
    expect(parseReps('6 @70% · 5 @75% · 4 @80% · 3 @85%', 4)).toEqual({ kind: 'pct', perSet: [{ reps: 6, pct: 70 }, { reps: 5, pct: 75 }, { reps: 4, pct: 80 }, { reps: 3, pct: 85 }] });
    expect(parseReps('7 @70%', 3)).toEqual({ kind: 'pct', perSet: [{ reps: 7, pct: 70 }, { reps: 7, pct: 70 }, { reps: 7, pct: 70 }] });
    expect(parseReps('12-15', 3)).toEqual({ kind: 'range', lo: 12, hi: 15 });
    expect(parseReps('10', 4)).toEqual({ kind: 'range', lo: 10, hi: 10 });
    expect(parseReps('7 (BW)', 3).kind).toBe('none');
    expect(parseReps('30s', 3).kind).toBe('none');
  });
  it('Epley 1RM, only up to 12 reps; rounding to 2.5 kg', () => {
    expect(epley(100, 1)).toBe(100);
    expect(epley(100, 6)).toBe(120);
    expect(epley(100, 15)).toBeNull();
    expect(epley(null, 5)).toBeNull();
    expect(bestE1rm([{ kg: 60, reps: 10 }, { kg: 70, reps: 6 }])).toBe(84);
    expect(roundKg(71.4)).toBe(72.5);
    expect(roundKg(70.9)).toBe(70);
  });
  it('1RM = max(manual, estimate of the last 90 days)', () => {
    const h = [{ date: '2026-09-01', sets: [{ kg: 100, reps: 6 }] }, { date: '2026-01-01', sets: [{ kg: 200, reps: 3 }] }];
    expect(oneRepMax(h, '2026-10-14', 110)).toBe(120);
    expect(oneRepMax(h, '2026-10-14', 130)).toBe(130);
    expect(oneRepMax([], '2026-10-14', null)).toBeNull();
  });
  it('% ladder → kg per set from the 1RM', () => {
    const s = suggest(parseReps('6 @70% · 5 @75% · 4 @80% · 3 @85%', 4), 4, [], '2026-10-14', 100);
    expect(s.sets.map((x) => x.kg)).toEqual([70, 75, 80, 85]);
    expect(s.sets.map((x) => x.reps)).toEqual([6, 5, 4, 3]);
    expect(suggest(parseReps('7 @70%', 3), 3, [], '2026-10-14', null).sets[0]!.kg).toBeNull();
  });
  it('double progression: all sets at the top of the range → +2.5 kg; otherwise same weight, one more rep', () => {
    const r = parseReps('12-15', 3);
    const top = [{ date: '2026-10-07', sets: [{ kg: 40, reps: 15 }, { kg: 40, reps: 15 }, { kg: 40, reps: 15 }] }];
    expect(suggest(r, 3, top, '2026-10-14', null).sets).toEqual([{ kg: 42.5, reps: 12 }, { kg: 42.5, reps: 12 }, { kg: 42.5, reps: 12 }]);
    const mid = [{ date: '2026-10-07', sets: [{ kg: 40, reps: 15 }, { kg: 40, reps: 13 }, { kg: 40, reps: 12 }] }];
    expect(suggest(r, 3, mid, '2026-10-14', null).sets).toEqual([{ kg: 40, reps: 15 }, { kg: 40, reps: 14 }, { kg: 40, reps: 13 }]);
    expect(suggest(r, 3, mid, '2026-10-14', null).last).toBe('15@40 · 13@40 · 12@40');
    expect(describeSets(top[0]!.sets)).toBe('3×15 @ 40 ק"ג');
    expect(suggest(r, 3, [], '2026-10-14', null).sets[0]).toEqual({ kg: null, reps: 15 });
  });
  it('today does not count as "last time", and the 1RM lifts map', () => {
    const r = parseReps('10', 2);
    const sameDay = [{ date: '2026-10-14', sets: [{ kg: 50, reps: 10 }, { kg: 50, reps: 10 }] }];
    expect(suggest(r, 2, sameDay, '2026-10-14', null).last).toBeNull();
    expect(liftFor('Bench Press')).toBe('bench');
    expect(liftFor('Box Squat')).toBe('squat');
    expect(liftFor('Lat Pulldown')).toBeNull();
  });
  it('chart 21 series: best e1RM per date', () => {
    expect(e1rmSeries([{ date: '2026-10-02', sets: [{ kg: 50, reps: 10 }] }, { date: '2026-10-01', sets: [{ kg: 60, reps: 1 }] }])).toEqual([
      { date: '2026-10-01', e1rm: 60 },
      { date: '2026-10-02', e1rm: 66.7 },
    ]);
  });
  it('workout steps: kg/reps only in strength blocks; loads stored by exercise name', () => {
    const w = getWorkout('in-upper-5')!;
    const steps = buildSteps(w);
    expect(steps.every((s) => s.loadable)).toBe(true);
    expect(steps[0]!.sets).toBe(4);
    expect(loadsByName(steps, { '0.1': [{ kg: 60, reps: 6 }] })).toEqual({ 'Bench Press': [{ kg: 60, reps: 6 }] });
    expect(buildSteps(getWorkout('trx-mobility')!).some((s) => s.loadable)).toBe(false);
  });
});

describe('maintenance from real data (R-NUT-1a)', () => {
  const end = '2026-10-13';
  const days = Array.from({ length: 14 }, (_, i) => addDaysISO(end, -13 + i));
  it('intake − weight change × 7700, from the trend of the weigh-ins', () => {
    const intake = days.map((date) => ({ date, kcal: 2500 }));
    // losing 0.5 kg/week = 1/14 kg/day → 550 kcal/day deficit → maintenance 3050
    const weighIns = [0, 4, 9, 13].map((i) => ({ date: days[i]!, weight: 80 - (0.5 / 7) * i }));
    const r = adaptiveMaintenance({ intake, weighIns, end, formula: 2800 });
    expect(r.ok && r.kcal).toBe(3050);
    expect(r.ok && r.kgPerWeek).toBe(-0.5);
  });
  it('needs 10 logged days (≥1000 kcal) and 4 weigh-ins over ≥10 days', () => {
    const partial = days.map((date, i) => ({ date, kcal: i < 9 ? 2500 : 600 }));
    const w = [0, 4, 9, 13].map((i) => ({ date: days[i]!, weight: 80 }));
    expect(adaptiveMaintenance({ intake: partial, weighIns: w, end, formula: 2800 })).toMatchObject({ ok: false, reason: 'intake', loggedDays: 9 });
    const full = days.map((date) => ({ date, kcal: 2500 }));
    expect(adaptiveMaintenance({ intake: full, weighIns: w.slice(0, 3), end, formula: 2800 })).toMatchObject({ ok: false, reason: 'weight' });
    const close = [5, 6, 7, 8].map((i) => ({ date: days[i]!, weight: 80 }));
    expect(adaptiveMaintenance({ intake: full, weighIns: close, end, formula: 2800 })).toMatchObject({ ok: false, reason: 'weight' });
  });
  it('bounded to 75-125% of the formula; shown only when >100 kcal away', () => {
    const intake = days.map((date) => ({ date, kcal: 5000 }));
    const w = [0, 4, 9, 13].map((i) => ({ date: days[i]!, weight: 80 }));
    const r = adaptiveMaintenance({ intake, weighIns: w, end, formula: 2800 });
    expect(r.ok && r.kcal).toBe(3500);
    expect(adaptiveWorthShowing(2900, 2800)).toBe(false);
    expect(adaptiveWorthShowing(2950, 2800)).toBe(true);
  });
});

describe('deload week (R-DLD)', () => {
  it('half the sets, rounded up, at least 1; weights unchanged', () => {
    expect(halveCount('3')).toBe('2');
    expect(halveCount('4')).toBe('2');
    expect(halveCount('1 לכל רגל')).toBe('1 לכל רגל');
    expect(halveCount('לפי הסרטון')).toBe('לפי הסרטון');
    const w = deloadWorkout(getWorkout('in-upper-5')!);
    expect(w.blocks[0]!.exercises[0]!.sets).toBe('2');
    expect(w.blocks[0]!.exercises[0]!.reps).toBe('6 @70% · 5 @75% · 4 @80% · 3 @85%');
  });
  it('the week is marked in the plan by its Sunday', () => {
    expect(isDeloadWeek('2026-10-14', ['2026-10-11'])).toBe(true);
    expect(isDeloadWeek('2026-10-18', ['2026-10-11'])).toBe(false);
    expect(planFor('2026-10-13', undefined, { deloadWeeks: ['2026-10-11'] }).deload).toBe(true);
    expect(toggleDeload(['2026-10-11'], '2026-10-11')).toEqual([]);
    expect(toggleDeload([], '2026-10-11')).toEqual(['2026-10-11']);
    expect(weeksSinceDeload(['2026-09-06'], '2026-10-11')).toBe(4);
  });
});

describe('heat (R-HEAT)', () => {
  it('season June-September, acclimatisation 60/75/90% over 14 days', () => {
    expect(isHeatSeason('2026-06-01')).toBe(true);
    expect(isHeatSeason('2026-10-01')).toBe(false);
    expect(acclimatisation(1)).toEqual({ day: 1, pct: 60 });
    expect(acclimatisation(5)).toEqual({ day: 5, pct: 75 });
    expect(acclimatisation(14)).toEqual({ day: 14, pct: 90 });
    expect(acclimatisation(15)).toBeNull();
  });
  it('counts from pre-season day 1, only on outdoor days', () => {
    const p = periodFor('2026-06-10');
    const d1 = preseasonDay1(p.start, 4);
    expect(heatToday(d1, periodFor(d1), 4, true)).toEqual({ acclim: { day: 1, pct: 60 } });
    expect(heatToday(d1, periodFor(d1), 4, false)).toBeNull();
    expect(heatToday('2026-09-10', periodFor('2026-09-10'), 4, true)).toEqual({ acclim: null });
  });
});

describe('dashboard (R-UI-4/5)', () => {
  const cat = (id: string) => getWorkout(id)?.category;
  it('week strip uses Hebrew words, not English abbreviations', () => {
    const labels = Array.from({ length: 7 }, (_, i) => dayStripLabel(planFor(addDaysISO('2026-10-11', i)), cat));
    expect(labels).toContain('⚽');
    expect(labels.some((l) => l === 'עליון' || l === 'תחתון')).toBe(true);
    expect(labels.every((l) => !/^[A-Z]{2}$/.test(l))).toBe(true);
  });
  it('load tile: red high, green in range, neutral without ACWR', () => {
    expect(loadTileTone({ acute: 0, chronic: 0, ratio: null, zone: 'unknown' })).toBe('neutral');
    expect(loadTileTone({ acute: 1500, chronic: 1000, ratio: 1.5, zone: 'high' })).toBe('high');
    expect(loadTileTone({ acute: 1000, chronic: 1000, ratio: 1, zone: 'ok' })).toBe('ok');
  });
  it('todo before done; season stats', () => {
    expect(orderByDone([1, 2, 3], (n) => n === 1).ordered).toEqual([2, 3, 1]);
    expect(seasonStats([{ goals: 1, assists: 0, rating: 7 }, { goals: 2, assists: 1, rating: null }])).toEqual({ games: 2, goals: 3, assists: 1, rating: 7 });
  });
});
