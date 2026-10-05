// Season calendar and "what's planned today" (SPEC 4, R-GAM-4, R-PC-4, R-WKF).
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

export const PROGRAMME_SHORT: Record<ProgrammeId, string> = {
  stamina: "סטמ'",
  speed: "מהיר'",
  inseason: 'עונה',
  rest: 'פגרה',
  preseason: 'פרה-עונה',
  bodyweight: 'גוף',
};

export const PROGRAMME_WEEKS: Record<ProgrammeId, number | null> = { stamina: 4, speed: 4, inseason: 10, rest: null, preseason: 10, bodyweight: 4 };

const pad = (n: number) => String(n).padStart(2, '0');
const blockDate = (year: number, b: SeasonBlock): ISODate => `${year}-${pad(b.startMonth)}-${pad(b.startDay)}`;

export interface Period {
  programme: ProgrammeId;
  start: ISODate;
  /** inclusive */
  end: ISODate;
  /** 1-based day inside the block (calendar, not aligned) */
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

/** All blocks of the 12 months starting at `from` (for the season bar). */
export function yearBlocks(from: ISODate, calendar: SeasonBlock[] = DEFAULT_CALENDAR): Period[] {
  const out: Period[] = [];
  let d = periodFor(from, calendar).start;
  const stop = addDaysISO(from, 365);
  while (d < stop) {
    const p = periodFor(d, calendar);
    out.push(p);
    d = addDaysISO(p.end, 1);
  }
  return out;
}

/** First date on or after `from` whose weekday is `wd`. */
export function firstWeekdayOnOrAfter(from: ISODate, wd: number): ISODate {
  const delta = (wd - weekday(from) + 7) % 7;
  return addDaysISO(from, delta);
}

export type SlotKind = 'session' | 'prematch' | 'game' | 'pushcore' | 'weakfoot';

export interface PlanItem {
  kind: SlotKind;
  workoutId?: string;
  timing?: string;
  /** push&core: which pair and dose flags */
  pair?: 'A' | 'B' | 'C';
  coreOnly?: boolean;
  maintenance?: boolean;
}

export interface DayPlanResult {
  period: Period;
  /** programme week (1-based) or null */
  week: number | null;
  /** programme day (1-based) where it applies */
  programmeDay: number | null;
  items: PlanItem[];
  rest: boolean;
  label: string;
  transition?: boolean;
  testing?: boolean;
  /** sessions the game replaced (R-GAM-2) */
  replaced?: PlannedSession[];
  /** offset from the weekly game day (in-season), -5..+1 */
  offset?: number;
}

export interface GameRef {
  date: ISODate;
  cancelled?: boolean;
  /** the default (fixed) date this game belongs to, when moved */
  defaultDate?: ISODate;
}

export interface PlanOptions {
  /** 0=Sun … 6=Sat. Default Thursday (R-GAM-1, 15.2). */
  gameDay?: number;
  /** actual games (moved / cancelled). If absent for a week, the fixed day is assumed. */
  games?: GameRef[];
  pushCore?: boolean;
  weakFoot?: boolean;
}

const DEFAULT_GAME_DAY = 4;

function toItems(sessions: PlannedSession[]): PlanItem[] {
  return sessions.map((s) => ({ kind: 'session' as const, workoutId: s.workoutId, timing: s.timing }));
}

/** Week start for 7-day programmes = day after the game (R-GAM-4). */
function alignedStart(blockStart: ISODate, gameDay: number): ISODate {
  return firstWeekdayOnOrAfter(blockStart, (gameDay + 1) % 7);
}

/** Pre-season day 1 so that the game falls on day 3 of every week (R-GAM-4, 15.6). */
export function preseasonDay1(blockStart: ISODate, gameDay = DEFAULT_GAME_DAY): ISODate {
  return firstWeekdayOnOrAfter(blockStart, (gameDay - 2 + 7) % 7);
}

/** Programme plan for a date, before games and add-ons are applied. */
function basePlan(date: ISODate, calendar: SeasonBlock[], gameDay: number): DayPlanResult {
  const period = periodFor(date, calendar);

  const inseasonFrom = (anchor: ISODate, labelSuffix = ''): DayPlanResult => {
    const start = alignedStart(anchor, gameDay);
    const week = date < start ? 1 : (Math.floor(diffDays(date, start) / 7) % 10) + 1;
    let offset = weekday(date) - gameDay;
    if (offset > 1) offset -= 7;
    if (offset < -5) offset += 7;
    const row = inseasonWeekTemplate(week).find((r) => r.offset === offset);
    // R-GAM-2: the pre-match routine belongs to the game, not to the weekday.
    const sessions = (row?.sessions ?? []).filter((s) => s.workoutId !== 'pre-match');
    return { period, week, programmeDay: null, items: toItems(sessions), rest: sessions.length === 0, label: `שבוע ${week} מתוך 10${labelSuffix}`, offset };
  };

  switch (period.programme) {
    case 'preseason': {
      const d1 = preseasonDay1(period.start, gameDay);
      if (date < d1) return { period, week: null, programmeDay: null, items: [], rest: true, transition: true, label: 'מתחילים בעוד ' + diffDays(d1, date) + ' ימים' };
      const d = diffDays(date, d1) + 1;
      if (d <= PRESEASON_LENGTH) {
        const p = PRESEASON_DAYS[d - 1]!;
        return {
          period,
          week: Math.ceil(d / 7),
          programmeDay: d,
          items: toItems(p.sessions),
          rest: !!p.rest,
          label: `יום ${d} מתוך ${PRESEASON_LENGTH}`,
          testing: p.sessions.some((s) => s.workoutId === 'testing'),
        };
      }
      return inseasonFrom(addDaysISO(d1, PRESEASON_LENGTH), ' · העונה התחילה');
    }
    case 'inseason':
      return inseasonFrom(period.start);
    case 'speed':
    case 'stamina':
    case 'bodyweight': {
      const start = alignedStart(period.start, gameDay);
      if (date < start) return { period, week: null, programmeDay: null, items: [], rest: true, transition: true, label: 'ימי מעבר לפני התוכנית' };
      const d = diffDays(date, start) + 1;
      if (d > 28) return { period, week: null, programmeDay: null, items: [], rest: true, transition: true, label: 'ימי מעבר לתקופה הבאה' };
      const week = Math.ceil(d / 7);
      const dow = ((d - 1) % 7) + 1;
      const tmpl = period.programme === 'speed' ? speedWeek(week) : period.programme === 'stamina' ? staminaWeek(week) : bodyweightWeek(week);
      const row = tmpl.find((r) => r.day === dow)!;
      return { period, week, programmeDay: d, items: row.sessions.map((workoutId) => ({ kind: 'session' as const, workoutId })), rest: row.sessions.length === 0, label: `שבוע ${week} מתוך 4 · יום ${dow}` };
    }
    case 'rest':
    default:
      return { period, week: null, programmeDay: null, items: [], rest: true, label: `פגרה · יום ${period.dayOfBlock} מתוך ${period.lengthDays}` };
  }
}

/** Light days where the weak-foot practice fits (R-WKF). Returns day-in-week numbers (1-7) or offsets. */
function addOns(base: DayPlanResult, date: ISODate, gameDay: number, opts: PlanOptions): PlanItem[] {
  const out: PlanItem[] = [];
  const prog = base.period.programme;
  const dow = base.programmeDay ? ((base.programmeDay - 1) % 7) + 1 : null;
  // Rotate push&core pairs by the number of days since an epoch, so it changes each time.
  const pairOf = (n: number): 'A' | 'B' | 'C' => (['A', 'B', 'C'] as const)[((n % 3) + 3) % 3]!;
  const weekIdx = Math.floor(diffDays(date, '2026-01-02') / 7);
  const pc = (slot: number, extra: Partial<PlanItem> = {}): PlanItem => ({ kind: 'pushcore', pair: pairOf(weekIdx * 2 + slot), ...extra });
  const wf: PlanItem = { kind: 'weakfoot' };

  if (prog === 'inseason' || (prog === 'preseason' && base.offset != null)) {
    if (base.offset === -4 && opts.pushCore !== false) out.push(pc(0, { timing: 'בסוף, אחרי הליבה' }));
    if (base.offset === -1) {
      if (opts.pushCore !== false) out.push(pc(1, { timing: 'אחרי מניעת הפציעות' }));
      if (opts.weakFoot !== false) out.push(wf);
    }
    if (base.offset === 1 && opts.weakFoot !== false) out.push(wf);
    return out;
  }
  if (prog === 'preseason' && dow) {
    // Twice a week on the first two TRX / Gym Cardio days of the programme week.
    const light = ['trx-mobility', 'pre-cardio1', 'pre-cardio2'];
    const weekStartDay = base.programmeDay! - dow + 1;
    const lightDays: number[] = [];
    for (let i = 0; i < 7; i++) {
      const p = PRESEASON_DAYS[weekStartDay - 1 + i];
      if (p && p.sessions.some((s) => light.includes(s.workoutId))) lightDays.push(i + 1);
    }
    const idx = lightDays.slice(0, 2).indexOf(dow);
    if (idx >= 0) {
      if (opts.pushCore !== false) out.push(pc(idx));
      if (opts.weakFoot !== false) out.push(wf);
    }
    return out;
  }
  if (prog === 'speed' && dow) {
    if ((dow === 1 || dow === 5) && opts.pushCore !== false) out.push(pc(dow === 1 ? 0 : 1, { maintenance: true, timing: 'בסוף אימון חדר הכושר' }));
    if ((dow === 1 || dow === 3) && opts.weakFoot !== false) out.push(wf);
    return out;
  }
  if (prog === 'stamina' && dow) {
    if ((dow === 2 || dow === 4) && opts.pushCore !== false) out.push(pc(dow === 2 ? 0 : 1, { coreOnly: true, timing: 'אחרי האימון' }));
    if ((dow === 2 || dow === 4) && opts.weakFoot !== false) out.push(wf);
    return out;
  }
  if (prog === 'bodyweight' && dow) {
    if ((dow === 1 || dow === 4) && opts.pushCore !== false) out.push(pc(dow === 1 ? 0 : 1, { coreOnly: true, timing: 'אחרי אימון משקל הגוף' }));
    if ((dow === 2 || dow === 5) && opts.weakFoot !== false) out.push(wf);
    return out;
  }
  if (prog === 'rest') {
    // Last two weeks of the break: twice a week maintenance so pre-season isn't a spike (R-PC-4).
    const left = diffDays(base.period.end, date);
    const wd = weekday(date);
    const days = [(gameDay + 3) % 7, (gameDay + 5) % 7];
    if (left < 14 && days.includes(wd) && opts.pushCore !== false) out.push(pc(days.indexOf(wd), { maintenance: true }));
    return out;
  }
  return out;
}

/** The fixed game date of the programme week that contains `date` (week = day after game … game day). */
export function fixedGameDateFor(date: ISODate, gameDay = DEFAULT_GAME_DAY): ISODate {
  return firstWeekdayOnOrAfter(date, gameDay);
}

/**
 * The full plan of a date (R-SEA-3, R-GAM-2, R-PC-4, R-WKF):
 * 1. programme plan; 2. add-ons; 3. a game on this date replaces the day's training (pre-match routine + game).
 */
export function planFor(date: ISODate, calendar: SeasonBlock[] = DEFAULT_CALENDAR, opts: PlanOptions = {}): DayPlanResult {
  const gameDay = opts.gameDay ?? DEFAULT_GAME_DAY;
  const base = basePlan(date, calendar, gameDay);
  const extras = addOns(base, date, gameDay, opts);
  const plan: DayPlanResult = { ...base, items: [...base.items, ...extras], rest: base.rest && extras.length === 0 };

  const games = opts.games;
  let hasGame: boolean;
  if (games) {
    hasGame = games.some((g) => g.date === date && !g.cancelled);
    // A fixed day with no stored game record counts as a game day, unless that week's game was moved or cancelled.
    if (!hasGame && weekday(date) === gameDay) {
      const handled = games.some((g) => g.defaultDate === date || (g.date === date && g.cancelled));
      hasGame = !handled;
    }
  } else {
    hasGame = weekday(date) === gameDay;
  }
  if (hasGame) {
    const replaced = plan.items.filter((i) => i.kind === 'session').map((i) => ({ workoutId: i.workoutId! }));
    return { ...plan, items: [{ kind: 'prematch', workoutId: 'pre-match', timing: '1.5-3 שעות לפני שריקת הפתיחה' }, { kind: 'game' }], rest: false, replaced, testing: false };
  }
  return plan;
}

/** Number of planned training items that count as "a workout to do" (excludes the game itself). */
export const plannedCount = (p: DayPlanResult) => p.items.filter((i) => i.kind !== 'game').length;
