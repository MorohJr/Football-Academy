// Season calendar and "what's planned today" (SPEC 4).
import type { PlannedSession, ProgrammeId } from '../content/types';
import { PRESEASON_DAYS, PRESEASON_LENGTH } from '../content/preseason';
import { inseasonWeekTemplate } from '../content/inseason';
import { speedWeek, staminaWeek, bodyweightWeek } from '../content/boosters';
import { addDaysISO, diffDays, weekday, type ISODate } from './dates';

export interface SeasonBlock {
  programme: ProgrammeId;
  /** month 1-12, day 1-31: the block starts every year on this date */
  startMonth: number;
  startDay: number;
}

/** R-SEA-1: default calendar = the Matchfit example (WELCOME.pdf). Editable in settings. */
export const DEFAULT_CALENDAR: SeasonBlock[] = [
  { programme: 'stamina', startMonth: 1, startDay: 1 },
  { programme: 'speed', startMonth: 2, startDay: 1 },
  { programme: 'inseason', startMonth: 3, startDay: 1 },
  { programme: 'rest', startMonth: 5, startDay: 1 },
  { programme: 'preseason', startMonth: 6, startDay: 1 },
  { programme: 'bodyweight', startMonth: 9, startDay: 1 },
  { programme: 'inseason', startMonth: 10, startDay: 1 },
];

export const PROGRAMME_HE: Record<ProgrammeId, string> = {
  stamina: 'סטמינה',
  speed: 'מהירות',
  inseason: 'עונה',
  rest: 'פגרה',
  preseason: 'פרה-עונה',
  bodyweight: 'משקל גוף ושריפת שומן',
};

export const PROGRAMME_WEEKS: Record<ProgrammeId, number | null> = {
  stamina: 4,
  speed: 4,
  inseason: 10,
  rest: null,
  preseason: 10,
  bodyweight: 4,
};

const pad = (n: number) => String(n).padStart(2, '0');
const blockDate = (year: number, b: SeasonBlock): ISODate => `${year}-${pad(b.startMonth)}-${pad(b.startDay)}`;

export interface Period {
  programme: ProgrammeId;
  start: ISODate;
  /** inclusive */
  end: ISODate;
  /** 1-based day inside the block */
  dayOfBlock: number;
  lengthDays: number;
}

/** R-SEA-2: the block that contains `date`. Blocks run until the next block starts (wrapping over the year). */
export function periodFor(date: ISODate, calendar: SeasonBlock[] = DEFAULT_CALENDAR): Period {
  const year = Number(date.slice(0, 4));
  const starts = [year - 1, year, year + 1]
    .flatMap((y) => calendar.map((b) => ({ b, start: blockDate(y, b) })))
    .sort((a, b) => a.start.localeCompare(b.start));
  let idx = -1;
  for (let i = 0; i < starts.length; i++) if (starts[i]!.start <= date) idx = i;
  const cur = starts[idx]!;
  const next = starts[idx + 1]!;
  const end = addDaysISO(next.start, -1);
  return { programme: cur.b.programme, start: cur.start, end, dayOfBlock: diffDays(date, cur.start) + 1, lengthDays: diffDays(end, cur.start) + 1 };
}

export interface DayPlanResult {
  period: Period;
  /** programme week (1-based) or null for rest */
  week: number | null;
  sessions: PlannedSession[];
  rest: boolean;
  /** Hebrew label: "שבוע 3 · יום 2" / "פרה-עונה · יום 36 מתוך 70" */
  label: string;
  /** e.g. extra days after a 4-week booster (R-SEA-3) */
  transition?: boolean;
  /** pre-season testing day */
  testing?: boolean;
}

export interface PlanOptions {
  /** 0=Sun … 6=Sat. The main game of the week (in-season template anchor). Default Saturday. */
  gameDay?: number;
}

/**
 * R-SEA-3: Programme day inside a block.
 * - preseason: days 1-70 from block start; after day 70 the season starts → in-season weeks from week 1.
 * - inseason: weeks loop 1-10 from block start. Template anchored to the main game day.
 * - boosters (4 weeks): day 1-28; extra days to the next block are transition (rest) days.
 * - rest: rest.
 */
export function planFor(date: ISODate, calendar: SeasonBlock[] = DEFAULT_CALENDAR, opts: PlanOptions = {}): DayPlanResult {
  const period = periodFor(date, calendar);
  const d = period.dayOfBlock;
  const gameDay = opts.gameDay ?? 6;

  const inseasonDay = (dayFromStart: number): DayPlanResult => {
    const week = (Math.floor((dayFromStart - 1) / 7) % 10) + 1;
    let offset = weekday(date) - gameDay; // -6..6
    if (offset > 1) offset -= 7; // map to -5..+1
    if (offset < -5) offset += 7;
    const row = inseasonWeekTemplate(week).find((r) => r.offset === offset);
    return {
      period,
      week,
      sessions: row?.sessions ?? [],
      rest: !!row?.rest || !row || row.sessions.length === 0,
      label: `שבוע ${week} מתוך 10`,
    };
  };

  switch (period.programme) {
    case 'preseason': {
      if (d <= PRESEASON_LENGTH) {
        const p = PRESEASON_DAYS[d - 1]!;
        return {
          period,
          week: Math.ceil(d / 7),
          sessions: p.sessions,
          rest: !!p.rest,
          label: `יום ${d} מתוך ${PRESEASON_LENGTH}`,
          testing: p.sessions.some((s) => s.workoutId === 'testing'),
        };
      }
      return { ...inseasonDay(d - PRESEASON_LENGTH), label: `${inseasonDay(d - PRESEASON_LENGTH).label} · תחילת העונה` };
    }
    case 'inseason':
      return inseasonDay(d);
    case 'speed':
    case 'stamina':
    case 'bodyweight': {
      if (d > 28) return { period, week: null, sessions: [], rest: true, transition: true, label: 'ימי מעבר לתקופה הבאה' };
      const week = Math.ceil(d / 7);
      const dow = ((d - 1) % 7) + 1;
      const tmpl = period.programme === 'speed' ? speedWeek(week) : period.programme === 'stamina' ? staminaWeek(week) : bodyweightWeek(week);
      const row = tmpl.find((r) => r.day === dow)!;
      return { period, week, sessions: row.sessions.map((workoutId) => ({ workoutId })), rest: row.sessions.length === 0, label: `שבוע ${week} מתוך 4 · יום ${dow}` };
    }
    case 'rest':
    default:
      return { period, week: null, sessions: [], rest: true, label: `פגרה · יום ${d} מתוך ${period.lengthDays}` };
  }
}
