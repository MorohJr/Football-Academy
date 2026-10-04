import { addDays, differenceInCalendarDays, format, getDay, parseISO, startOfWeek } from 'date-fns';

/** Storage format is always YYYY-MM-DD (local date). Never slice an ISO timestamp. */
export type ISODate = string;

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const fromISO = (s: ISODate): Date => parseISO(s);
export const addDaysISO = (s: ISODate, n: number): ISODate => toISO(addDays(fromISO(s), n));
export const diffDays = (a: ISODate, b: ISODate): number => differenceInCalendarDays(fromISO(a), fromISO(b));
/** 0 = Sunday … 6 = Saturday */
export const weekday = (s: ISODate): number => getDay(fromISO(s));
/** Week starts on Sunday (SPEC 1.2) */
export const weekStart = (s: ISODate): ISODate => toISO(startOfWeek(fromISO(s), { weekStartsOn: 0 }));
export const monthKey = (s: ISODate): string => s.slice(0, 7);
