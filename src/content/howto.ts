// R-HOW (SPEC 14.13): written explanation for every exercise, next to the video link.
import { CORE } from './howto/core';
import type { HowTo, Ref } from './howto/h';
import { MOBILITY } from './howto/mobility';
import { POWER } from './howto/power';
import { STRENGTH } from './howto/strength';

export type { HowTo } from './howto/h';

const ALL: Record<string, HowTo | Ref> = { ...MOBILITY, ...CORE, ...POWER, ...STRENGTH };

/** Lowercase, drop "(…)" notes, "x = 1 set" hints and plural/possessive endings. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*(\d|set|rep)[^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function find(key: string, depth = 0): HowTo | undefined {
  const e = ALL[key];
  if (!e || depth > 4) return undefined;
  if ('ref' in e) {
    const base = find(e.ref, depth + 1);
    if (!base) return undefined;
    return e.note ? { ...base, cues: [e.note, ...(base.cues ?? [])] } : base;
  }
  return e;
}

export function howTo(name: string): HowTo | undefined {
  const n = normalizeName(name);
  return find(n) ?? find(n.replace(/s$/, '')) ?? find(n.replace(/ \(.*\)$/, '')) ?? find(n.split(' (')[0]!.replace(/s$/, ''));
}

/** Hebrew-only rows (warm-up/cool-down lines) don't need an explanation. */
export const needsHowTo = (name: string) => /[a-z]/i.test(name);
