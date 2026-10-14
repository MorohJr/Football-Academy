import { CATEGORY_HE, SLOT_HE, type MealSlot, type PantryCategory } from '../../../content/pantry';
import { type KosherStatus } from '../../../domain/nutrition';
import { nowHm } from '../../hooks';

export const UNIT_HE = { g: "ג'", ml: 'מ"ל', unit: "יח'" } as const;
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const now = () => new Date().toISOString();
export const SLOTS = Object.keys(SLOT_HE) as MealSlot[];
export const CATS = Object.keys(CATEGORY_HE) as PantryCategory[];

export function kosherText(k: KosherStatus): string | null {
  if (k.kind === 'wait') return `אחרי בשרי: חלבי בעוד ${k.minutesLeft} דק'`;
  if (k.kind === 'rinse') return 'אחרי חלבי: לשטוף את הפה לפני בשרי';
  if (k.kind === 'mixed') return 'בשר וחלב יחד: אסור';
  return null;
}

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>שעה</label>
      <input className="input ltr" type="time" value={value} onChange={(e) => onChange(e.target.value || nowHm())} />
    </div>
  );
}
