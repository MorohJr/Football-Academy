// Heat (SPEC 14.14, R-HEAT). Not from Matchfit: Racinais et al. 2015 consensus, ACSM. Pure functions.
import { diffDays, type ISODate } from './dates';
import { preseasonDay1, type Period } from './season';

/** R-HEAT-1: 1 June – 30 September. */
export const isHeatSeason = (date: ISODate) => {
  const m = Number(date.slice(5, 7));
  return m >= 6 && m <= 9;
};

/** R-HEAT-3: acclimatisation day 1-14 → share of the usual pitch volume. Day 15+ → full. */
export function acclimatisation(day: number): { day: number; pct: number } | null {
  if (day < 1 || day > 14) return null;
  return { day, pct: day <= 4 ? 60 : day <= 9 ? 75 : 90 };
}

/** Acclimatisation day inside the heat season, counted from the pre-season day 1 (null outside the first 14 days). */
export function acclimatisationFor(date: ISODate, preseasonDay1: ISODate | null): { day: number; pct: number } | null {
  if (!preseasonDay1 || !isHeatSeason(date)) return null;
  return acclimatisation(diffDays(date, preseasonDay1) + 1);
}

/** R-HEAT-1/3: what the dashboard shows today. Null when there is nothing to show. */
export function heatToday(date: ISODate, period: Period, gameDay: number, outdoorToday: boolean): { acclim: { day: number; pct: number } | null } | null {
  if (!isHeatSeason(date) || !outdoorToday) return null;
  const d1 = period.programme === 'preseason' ? preseasonDay1(period.start, gameDay) : null;
  return { acclim: acclimatisationFor(date, d1) };
}
