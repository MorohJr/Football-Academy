import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { toISO } from '../domain/dates';
import { SETTINGS_ID, type Settings } from '../domain/schemas';

/** Live data from IndexedDB; re-renders when the tables change. */
export function useLive<T>(fn: () => Promise<T> | T, deps: unknown[] = []): T | undefined {
  return useLiveQuery(fn, deps);
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(() => db.settings.get(SETTINGS_ID), []);
}

export const nowHm = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
export const hmToMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

/** Today's date; updates at midnight / when the app wakes up. */
export function useToday(): string {
  const [today, setToday] = useState(() => toISO(new Date()));
  useEffect(() => {
    const tick = () => setToday(toISO(new Date()));
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return today;
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
