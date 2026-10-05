import type { Location, WorkoutCategory } from '../content/types';

export const CATEGORY_HE: Record<WorkoutCategory, string> = {
  testing: 'בדיקות כושר',
  strength: 'כוח',
  saq: 'מהירות, זריזות וקצב',
  cardio: 'קרדיו',
  mobility: 'מוביליטי',
  speed: 'מהירות',
  stamina: 'סטמינה',
  core: 'ליבה',
  injury: 'מניעת פציעות',
  prematch: 'לפני משחק',
  recovery: 'התאוששות',
  bodyweight: 'משקל גוף',
  yoga: 'יוגה',
  pushcore: 'שכיבות סמיכה וליבה',
  rest: 'מנוחה',
};

/** R-UI-1 colors: speed & strength in the button green (no orange), core blue, push&core purple, light work teal. */
export function categoryColor(c: WorkoutCategory): string {
  switch (c) {
    case 'core':
      return 'var(--core)';
    case 'pushcore':
      return 'var(--pc)';
    case 'injury':
    case 'mobility':
    case 'recovery':
    case 'yoga':
    case 'prematch':
      return 'var(--fish)';
    default:
      return 'var(--g1)';
  }
}

export const LOCATION_HE: Record<Location, string> = { gym: 'בית', pitch: 'מגרש', home: 'בית', any: 'בכל מקום' };

export const SURFACE_HE = { synthetic: 'סינטטי', grass: 'דשא טבעי', hard: 'אספלט/בטון', indoor: 'אולם', sand: 'חול' } as const;
/** R-PIT (general advice, not from Matchfit). */
export const SURFACE_SHOES = { synthetic: 'AG או TF', grass: 'FG (SG כשרטוב)', hard: 'נעלי טורף/ריצה עם ריפוד', indoor: 'IC (נעלי אולם)', sand: 'יחפים או גרביים' } as const;
export const HARD_SURFACES = new Set(['hard']);
