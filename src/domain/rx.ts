// Parse the prescription strings kept as in the source ("90s", "2m", "1-2 דק'", "30s לכל צד") (R-WRK).

/** Seconds from a rest/time string, or null when it isn't a time ("התאוששות מלאה", "8-10"). Ranges take the first number. */
export function parseSeconds(s: string | undefined): number | null {
  if (!s) return null;
  const t = s.trim();
  if (/^0$/.test(t)) return 0;
  const m = /(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?\s*(secs|sec|s|שנ'|שניות|min|m|דק'|דקות|דק)/i.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2]!.toLowerCase();
  return unit.startsWith('s') || unit.startsWith('שנ') ? n : n * 60;
}

/** Number of sets ("3" → 3, "1 לכל רגל" → 1, "4" → 4). Default 1. */
export function parseSets(s: string | undefined): number {
  const m = /\d+/.exec(s ?? '');
  return m ? Math.max(1, Math.min(20, Number(m[0]))) : 1;
}

export const fullRecovery = (s: string | undefined) => !!s && /התאוששות מלאה|fully/i.test(s);

export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
