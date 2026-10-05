// Body: weight trend, body fat from tape (SPEC 14.9). Pure functions.
import { addDaysISO, type ISODate } from './dates';

/** US Navy method, male, cm (as the Fitness App R-BODY-1). Not from the Matchfit material. */
export function navyBodyFatMale(waistCm: number, neckCm: number, heightCm: number): number | null {
  if (!(waistCm > neckCm) || !(heightCm > 0)) return null;
  const v = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  return Math.round(v * 10) / 10;
}

export function navyBodyFatFemale(waistCm: number, hipCm: number, neckCm: number, heightCm: number): number | null {
  if (!(waistCm + hipCm > neckCm) || !(heightCm > 0)) return null;
  const v = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
  return Math.round(v * 10) / 10;
}

export function leanMass(weightKg: number, bodyFatPct: number) {
  const lean = Math.round(weightKg * (1 - bodyFatPct / 100) * 10) / 10;
  return { lean, fat: Math.round((weightKg - lean) * 10) / 10 };
}

/** Trend weight = mean of the morning weigh-ins of the last 7 days (≥3), else the latest weigh-in up to that day. */
export function trendWeight(weighIns: { date: ISODate; weight: number }[], date: ISODate): number | null {
  const from = addDaysISO(date, -6);
  const w = weighIns.filter((x) => x.date >= from && x.date <= date);
  if (w.length >= 3) return Math.round((w.reduce((a, b) => a + b.weight, 0) / w.length) * 10) / 10;
  const last = weighIns.filter((x) => x.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
  return last ? last.weight : null;
}

export const BODY_FAT_TARGET: [number, number] = [8, 12];

export const MEASURE_SITES = [
  { key: 'neck', he: 'צוואר', how: 'מתחת לגרוגרת, הסרט מוטה מעט למטה בחזית.' },
  { key: 'chest', he: 'חזה', how: 'בגובה הפטמות, בסוף נשיפה.' },
  { key: 'waist', he: 'מותניים', how: 'בגובה הטבור, בסוף נשיפה רגילה, בלי לכווץ בטן.' },
  { key: 'hips', he: 'אגן', how: 'בנקודה הרחבה ביותר של הישבן.' },
  { key: 'armR', he: 'זרוע ימין', how: 'באמצע הזרוע, שריר רפוי.' },
  { key: 'armL', he: 'זרוע שמאל', how: 'באמצע הזרוע, שריר רפוי.' },
  { key: 'forearmR', he: 'אמה ימין', how: 'בנקודה הרחבה ביותר.' },
  { key: 'forearmL', he: 'אמה שמאל', how: 'בנקודה הרחבה ביותר.' },
  { key: 'thighR', he: 'ירך ימין', how: 'בנקודה הרחבה ביותר.' },
  { key: 'thighL', he: 'ירך שמאל', how: 'בנקודה הרחבה ביותר.' },
  { key: 'calfR', he: 'שוק ימין', how: 'בנקודה הרחבה ביותר.' },
  { key: 'calfL', he: 'שוק שמאל', how: 'בנקודה הרחבה ביותר.' },
] as const;
export type MeasureKey = (typeof MEASURE_SITES)[number]['key'];

export const MEASURE_RULES = [
  'באותה שעה: בבוקר, אחרי שירותים, לפני אוכל ושתייה.',
  'אותו סרט מדידה, צמוד לעור בלי ללחוץ, מקביל לרצפה.',
  'כל 2-4 שבועות. משקל פעם בשבוע (או כל בוקר, למגמה).',
];

/** R-STR (Bible): 1RM targets as multiples of bodyweight. */
export const STRENGTH_TARGETS = {
  squat: { he: 'סקוואט', range: [1.5, 2] as [number, number] },
  deadlift: { he: 'דדליפט', range: [1.5, 2] as [number, number] },
  trapbar: { he: 'דדליפט טראפ בר (לפי ה-Bible אפשר קצת יותר)', range: [1.5, 2] as [number, number] },
  bench: { he: 'לחיצת חזה', range: [1, 1.5] as [number, number] },
} as const;
export type Lift = keyof typeof STRENGTH_TARGETS;

export function strengthStatus(lift: Lift, oneRm: number, bodyweight: number) {
  const ratio = Math.round((oneRm / bodyweight) * 100) / 100;
  const [lo, hi] = STRENGTH_TARGETS[lift].range;
  const toLow = Math.max(0, Math.round(lo * bodyweight - oneRm));
  return { ratio, lo, hi, toLow, enough: ratio >= hi };
}
