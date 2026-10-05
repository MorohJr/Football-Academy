// R-NIG (SPEC 14.6): body areas for the niggle log, linked to the rehab videos and a prevention workout.
import { REHAB_VIDEOS } from '../../content/injury';
import type { VideoLink } from '../../content/types';

export const AREAS = [
  { key: 'foot', he: 'כף רגל / עקב', rehab: ['Plantar Fasciitis', 'Severs Disease', 'Stress Fractures'], ip: 'ip2' },
  { key: 'ankle', he: 'קרסול', rehab: ['Ankle Ligaments'], ip: 'ip3' },
  { key: 'achilles', he: 'גיד אכילס', rehab: ['Achilles Tendinopathy', 'Achilles Tendon Rupture'], ip: 'ip2' },
  { key: 'calf', he: 'שוק (תאומים)', rehab: ['Calf Strain'], ip: 'ip1' },
  { key: 'shin', he: 'שין (עצם השוק)', rehab: ['Shin Splints', 'Stress Fractures'], ip: 'ip1' },
  { key: 'knee-front', he: 'ברך קדמית', rehab: ['Patellar Tendinopathy', 'Osgood Schlatters', 'Sinding Larsen', 'Plica Syndrome'], ip: 'ip3' },
  { key: 'knee-in', he: 'ברך פנימית', rehab: ['Medial & Lateral', 'Meniscus Tear', 'ACL'], ip: 'ip3' },
  { key: 'knee-out', he: 'ברך חיצונית', rehab: ['IT Band Syndrome', 'Medial & Lateral', 'Posterior Cruciate'], ip: 'ip4' },
  { key: 'hamstring', he: 'ירך אחורית', rehab: ['Hamstring Strain'], ip: 'ip4' },
  { key: 'quad', he: 'ארבע-ראשי', rehab: ['Quad Strain', 'Dead Leg'], ip: 'ip4' },
  { key: 'groin', he: 'מפשעה / מקרבים', rehab: ['Groin Strain', 'Adductor Tendinopathy'], ip: 'ip4' },
  { key: 'hip', he: 'ירך / אגן', rehab: ['Labral Tear', 'Trochanteric Bursitis'], ip: 'ip2' },
  { key: 'glute', he: 'ישבן', rehab: ['Trochanteric Bursitis'], ip: 'ip1' },
  { key: 'lowback', he: 'גב תחתון', rehab: [], ip: 'ip2' },
  { key: 'shoulder', he: 'כתף', rehab: [], ip: 'ip2' },
] as const;

export const AREA_HE: Record<string, string> = Object.fromEntries(AREAS.map((a) => [a.key, a.he]));

export function rehabFor(area: string): VideoLink[] {
  const a = AREAS.find((x) => x.key === area);
  if (!a) return [];
  return REHAB_VIDEOS.filter((v) => a.rehab.some((r) => v.label.startsWith(r)));
}

/** Front/back map dots (viewBox 0 0 100 232). */
export const MAP_POINTS: Record<string, { front?: [number, number]; back?: [number, number] }> = {
  foot: { front: [40, 212], back: [40, 212] },
  ankle: { front: [40, 200] },
  achilles: { back: [40, 196] },
  calf: { back: [40, 170] },
  shin: { front: [40, 170] },
  'knee-front': { front: [40, 133] },
  'knee-in': { front: [45, 147] },
  'knee-out': { front: [35, 147] },
  hamstring: { back: [40, 115] },
  quad: { front: [40, 112] },
  groin: { front: [47, 92] },
  hip: { front: [32, 86] },
  glute: { back: [40, 88] },
  lowback: { back: [50, 72] },
  shoulder: { front: [30, 34], back: [30, 34] },
};
