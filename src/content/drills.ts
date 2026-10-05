// Pitch drawings for the run drills (R-HOW, SPEC 14.13). Approximate layouts from the PDF images and setup text.
// Meters; x to the right, y down. The exact movement pattern is in the video.

export type Mark = 'cone' | 'pole' | 'hurdle' | 'ball' | 'start' | 'mannequin';
export interface Diagram {
  items: { t: Mark; x: number; y: number }[];
  /** measurement lines with a label */
  dims: { x1: number; y1: number; x2: number; y2: number; label: string }[];
  /** the running path */
  path?: [number, number][];
  circle?: { cx: number; cy: number; r: number };
  caption?: string;
}

const D = (d: Diagram) => d;

/** A straight line of segments: markers at every boundary, a label on each segment. */
function line(segs: number[], opts: { start?: boolean; mark?: Mark; ball?: boolean; caption?: string } = {}): Diagram {
  const items: Diagram['items'] = [];
  const dims: Diagram['dims'] = [];
  let x = 0;
  items.push({ t: opts.start === false ? opts.mark ?? 'cone' : 'start', x: 0, y: 0 });
  for (const s of segs) {
    dims.push({ x1: x, y1: 3, x2: x + s, y2: 3, label: `${s} מ'` });
    x += s;
    items.push({ t: opts.mark ?? 'cone', x, y: 0 });
  }
  if (opts.ball) items.push({ t: 'ball', x: 0.8, y: -1.2 });
  return { items, dims, path: [[0, 0], [x, 0]], caption: opts.caption };
}

/** Markers at given distances along a 20 m lane. */
function lane(at: number[], len = 20, mark: Mark = 'cone', caption?: string): Diagram {
  const items: Diagram['items'] = [{ t: 'start', x: 0, y: 0 }, ...at.map((x) => ({ t: mark, x, y: 0 })), { t: 'cone', x: len, y: 0 }];
  return { items, dims: [{ x1: 0, y1: 3, x2: len, y2: 3, label: `${len} מ'` }], path: [[0, 0], [len, 0]], caption };
}

export const DRILLS: Record<string, Diagram> = {
  // ---------- pre-season SAQ ----------
  'saq-speed': D({
    items: [{ t: 'start', x: 0, y: 20 }, { t: 'pole', x: 0, y: 0 }, { t: 'pole', x: 15, y: 9 }, { t: 'pole', x: 30, y: 0 }, { t: 'cone', x: 30, y: 20 }],
    dims: [{ x1: -3, y1: 20, x2: -3, y2: 0, label: "20 מ'" }, { x1: 0, y1: 23, x2: 30, y2: 23, label: "30 מ' רוחב" }],
    path: [[0, 20], [0, 0], [15, 9], [30, 0], [30, 20]],
    caption: 'מסלול M: 20 מ\' עלייה, 15 מ\' אלכסון ירידה, 15 מ\' אלכסון עלייה, 20 מ\' ירידה',
  }),
  'saq-stamina-1': D({
    items: [0, 5, 10].map((x) => ({ t: 'cone' as Mark, x, y: 0 })).concat([0, 5, 10, 15, 20].map((x) => ({ t: 'cone' as Mark, x, y: 8 })), [{ t: 'ball', x: -1.5, y: 4 }]),
    dims: [{ x1: 0, y1: -3, x2: 10, y2: -3, label: "10 מ'" }, { x1: 0, y1: 11, x2: 20, y2: 11, label: "20 מ'" }],
    caption: 'קו של 10 מ\' וקו של 20 מ\', קונוס כל 5 מ\'. חזרה = הכדור חוזר למקום',
  }),
  'saq-stamina-2': D({
    items: [{ t: 'start', x: 0, y: 20 }, { t: 'cone', x: 30, y: 20 }, { t: 'cone', x: 30, y: 0 }, { t: 'cone', x: 15, y: 0 }, { t: 'cone', x: 15, y: 10 }, { t: 'mannequin', x: 20, y: 10 }],
    dims: [{ x1: 0, y1: 23, x2: 30, y2: 23, label: "30 מ'" }, { x1: 33, y1: 20, x2: 33, y2: 0, label: "20 מ'" }, { x1: 15, y1: -3, x2: 30, y2: -3, label: "15 מ'" }, { x1: 12, y1: 0, x2: 12, y2: 10, label: "10 מ'" }],
    path: [[0, 20], [30, 20], [30, 0], [15, 0], [15, 10]],
    caption: 'מקטעים של 30, 20, 15 ו-10 מ\' עם בובה',
  }),
  'saq-stamina-3': D({
    items: Array.from({ length: 8 }, (_, i) => ({ t: 'cone' as Mark, x: 15 + 15 * Math.cos((i * Math.PI) / 4), y: 15 + 15 * Math.sin((i * Math.PI) / 4) })),
    dims: [{ x1: 0, y1: 15, x2: 30, y2: 15, label: "קוטר 30 מ'" }],
    circle: { cx: 15, cy: 15, r: 15 },
    caption: 'עיגול בקוטר 30 מ\'. מתחילים ב-30% ומעלים בכל סמן עד 100%',
  }),
  'saq-stamina-4': D({
    items: [[0, 0], [40, 0], [40, 40], [0, 40]].map(([x, y]) => ({ t: 'cone' as Mark, x: x!, y: y! })),
    dims: [{ x1: 0, y1: 43, x2: 40, y2: 43, label: "40 מ'" }, { x1: 43, y1: 40, x2: 43, y2: 0, label: "40 מ'" }],
    path: [[0, 40], [40, 40]],
    caption: 'ריבוע 40×40 מ\'. הגעה לקצה השני = חזרה',
  }),

  // ---------- in-season speed ----------
  'in-sp-1-1': lane([10], 20, 'pole', 'מוט באמצע (10 מ\')'),
  'in-sp-1-2': lane([4, 8, 12, 16], 20, 'pole', '4 מוטות זריזות במרווחים שווים'),
  'in-sp-2-1': lane([4, 8, 12, 16], 20, 'pole', '4 מוטות זריזות במרווחים שווים'),
  'in-sp-2-2': D({ ...lane([], 20), items: [{ t: 'start', x: 0, y: 0 }, { t: 'cone', x: 3, y: -2.5 }, { t: 'cone', x: 3, y: 2.5 }, { t: 'cone', x: 20, y: 0 }], caption: 'שני קונוסים 3 מ\' מההתחלה, 5 מ\' זה מזה' }),
  'in-sp-3-1': D({ ...lane([], 20), items: [{ t: 'start', x: 0, y: 0 }, { t: 'cone', x: 3, y: -1.5 }, { t: 'cone', x: 6, y: -1.5 }, { t: 'cone', x: 3, y: 1.5 }, { t: 'cone', x: 6, y: 1.5 }, { t: 'cone', x: 20, y: 0 }], caption: 'ריבוע 3×3 מ\' במרחק 3 מ\' מההתחלה' }),
  'in-sp-3-2': D({ ...lane([], 20), items: [{ t: 'start', x: 0, y: 0 }, { t: 'ball', x: 0, y: 1.5 }, { t: 'ball', x: 5, y: 0 }, { t: 'cone', x: 20, y: 0 }], caption: 'כדור על קו ההתחלה וכדור 5 מ\' ממנו' }),
  'in-sp-4-1': D({ ...lane([7, 14], 20), items: [{ t: 'start', x: 0, y: 0 }, { t: 'cone', x: 7, y: 0 }, { t: 'pole', x: 8.5, y: -1.5 }, { t: 'cone', x: 14, y: 0 }, { t: 'pole', x: 15.5, y: 1.5 }, { t: 'cone', x: 20, y: 0 }], caption: 'קונוס ב-7 מ\' ומוט 2 מ\' באלכסון שמאלה; קונוס ב-14 מ\' ומוט 2 מ\' באלכסון ימינה' }),
  'in-sp-4-2': lane([7, 14], 20, 'cone', 'סמנים ב-7 וב-14 מ\': שם בולמים'),
  'in-sp-5-1': D({ ...lane([], 20), items: [{ t: 'start', x: 0, y: 0 }, { t: 'cone', x: 10, y: -2.5 }, { t: 'cone', x: 10, y: 2.5 }, { t: 'cone', x: 20, y: 0 }], caption: 'סמנים במרחק 5 מ\' זה מזה ב-10 מ\'' }),
  'in-sp-5-2': lane([3], 20, 'cone', 'סמן 3 מ\' מההתחלה: עד אליו בריצה לאחור'),
  'in-sp-5-3': lane([3, 10, 12.5, 15, 17.5], 20, 'cone', 'סמן ב-3 מ\' ו-4 סמנים במרווחים שווים מ-10 מ\''),

  // ---------- in-season stamina ----------
  'in-st-1-1': D({
    items: [[0, 0], [20, 0], [25, 20], [0, 20]].map(([x, y]) => ({ t: 'pole' as Mark, x: x!, y: y! })).concat([{ t: 'ball', x: 1.5, y: 1.5 }]),
    dims: [{ x1: 0, y1: -3, x2: 20, y2: -3, label: "20 מ'" }, { x1: 0, y1: 23, x2: 25, y2: 23, label: "25 מ'" }, { x1: -3, y1: 0, x2: -3, y2: 20, label: "20 מ'" }],
    path: [[0, 0], [20, 0], [25, 20], [0, 20], [0, 0]],
    caption: 'ריבוע "עקום" עם צלע של 25 מ\'. מכדררים לעמוד הבא ומשאירים את הכדור',
  }),
  'in-st-1-2': lane([5, 10, 15], 20, 'cone', 'סמנים ב-5, 10 ו-15 מ\'. 10 שניות בין חזרות'),
  'in-st-2-1': D({
    items: [{ t: 'pole', x: 0, y: 10 }, { t: 'pole', x: 40, y: 10 }, { t: 'pole', x: 20, y: 0 }, { t: 'pole', x: 20, y: 20 }, { t: 'ball', x: 2, y: 10 }],
    dims: [{ x1: 0, y1: 23, x2: 40, y2: 23, label: "40 מ'" }, { x1: 23, y1: 0, x2: 23, y2: 20, label: "20 מ'" }],
    path: [[0, 10], [20, 0], [40, 10], [20, 20], [0, 10]],
    caption: 'יהלום: עמודים 40 מ\' זה מזה, ובאמצע שניים 20 מ\' זה מזה',
  }),
  'in-st-2-2': D({ ...lane([3, 17], 20), items: [{ t: 'start', x: 0, y: 0 }, { t: 'cone', x: 3, y: -2 }, { t: 'cone', x: 3, y: 0 }, { t: 'cone', x: 3, y: 2 }, { t: 'cone', x: 10, y: -2 }, { t: 'cone', x: 12, y: 0 }, { t: 'cone', x: 10, y: 2 }, { t: 'cone', x: 17, y: -2 }, { t: 'cone', x: 17, y: 0 }, { t: 'cone', x: 17, y: 2 }, { t: 'cone', x: 20, y: 0 }], caption: 'שלושה סמנים 3 מ\' מכל קצה, ומשולש באמצע' }),
  'in-st-3-1': D({
    items: [[0, 0], [25, 0], [25, 20], [0, 20]].map(([x, y]) => ({ t: 'cone' as Mark, x: x!, y: y! })).concat([{ t: 'ball', x: 1.5, y: 21.5 }]),
    dims: [{ x1: 0, y1: -3, x2: 25, y2: -3, label: "25 מ'" }, { x1: 28, y1: 0, x2: 28, y2: 20, label: "20 מ'" }],
    path: [[0, 20], [25, 20], [0, 0], [25, 0], [0, 20]],
    caption: 'מלבן 25×20 מ\': לאורך 25 מ\' ואז באלכסון לפינה הנגדית',
  }),
  'in-st-3-2': lane([5, 8, 11, 15], 20, 'cone', 'סמנים 5 מ\' מכל קצה + סלאלום באמצע'),
  'in-st-4-1': D({
    items: [{ t: 'pole', x: 0, y: 0 }, { t: 'pole', x: 10, y: 0 }, { t: 'cone', x: 25, y: -2 }, { t: 'cone', x: 35, y: 2 }, { t: 'pole', x: 50, y: 0 }, { t: 'pole', x: 60, y: 0 }, { t: 'ball', x: 25, y: -4 }],
    dims: [{ x1: 0, y1: 4, x2: 60, y2: 4, label: "60 מ'" }, { x1: 0, y1: -4, x2: 10, y2: -4, label: "10 מ'" }],
    path: [[0, 0], [10, 0], [25, -2], [35, 2], [50, 0], [60, 0]],
    caption: 'עמודים 60 מ\' זה מזה ועמודים 10 מ\' פנימה. ג\'וג ב-10 מ\', ספרינט עם הכדור באמצע',
  }),
  'in-st-4-2': lane([7, 14], 20, 'cone', 'סמנים ב-7 וב-14 מ\''),
  'in-st-5-1': D({
    items: [0, 10, 20, 30, 40, 50].map((x, i) => ({ t: (i === 0 || i === 5 ? 'pole' : 'cone') as Mark, x, y: i % 2 ? -1.5 : 1.5 })).concat([{ t: 'ball', x: 1, y: -2 }]),
    dims: [{ x1: 0, y1: 4, x2: 50, y2: 4, label: "50 מ', 5 מקטעים" }],
    path: [[0, 0], [10, -1.5], [20, 1.5], [30, -1.5], [40, 1.5], [50, 0]],
    caption: 'עמודים 50 מ\' זה מזה, סמנים לסלאלום כל 10 מ\'',
  }),
  'in-st-5-2': D({ ...lane([7, 14], 20), items: [{ t: 'start', x: 0, y: 0 }, { t: 'cone', x: 7, y: -3 }, { t: 'cone', x: 7, y: -1 }, { t: 'cone', x: 14, y: 3 }, { t: 'cone', x: 14, y: 1 }, { t: 'cone', x: 20, y: 0 }], caption: 'סמנים ב-7 וב-14 מ\' בצדדים מנוגדים, וסמן 2 מ\' לפני כל אחד' }),

  // ---------- speed programme (pitch sessions) ----------
  'spd-1-1': D({ ...line([10]), items: [{ t: 'hurdle', x: -1.5, y: -0.8 }, { t: 'hurdle', x: -1.5, y: 0.8 }, { t: 'start', x: 0, y: 0 }, { t: 'pole', x: 10, y: -1 }, { t: 'pole', x: 10, y: 1 }], caption: 'מהמשוכות, 10 מ\'' }),
  'spd-1-2': D({ items: [{ t: 'start', x: 0, y: 0 }, { t: 'pole', x: 15, y: 0 }, { t: 'pole', x: 15, y: 5 }], dims: [{ x1: 0, y1: -3, x2: 15, y2: -3, label: "15 מ'" }, { x1: 18, y1: 0, x2: 18, y2: 5, label: "5 מ'" }], path: [[0, 0], [15, 0], [15, 5]], caption: '15 מ\' ואז 5 מ\' בפנייה' }),
  'spd-1-3': D({ items: [{ t: 'hurdle', x: -10, y: 0 }, { t: 'start', x: 0, y: 0 }, { t: 'ball', x: 1, y: -2 }, { t: 'pole', x: 15, y: 0 }], dims: [{ x1: -10, y1: 3, x2: 0, y2: 3, label: "10 מ'" }, { x1: 0, y1: 3, x2: 15, y2: 3, label: "15 מ'" }], path: [[0, 0], [15, 0]], caption: 'ריאקטיבי: עיניים עצומות, זורקים כדור, יוצאים כשהוא נוחת' }),
  'spd-1-4': D({ ...line([30], { caption: '30 מ\' (ריאקטיבי)' }), items: [{ t: 'start', x: 0, y: 0 }, { t: 'ball', x: 1, y: -2 }, { t: 'pole', x: 30, y: -1 }, { t: 'pole', x: 30, y: 1 }] }),
  'spd-2-1': D({ items: [{ t: 'pole', x: 0, y: -1 }, { t: 'pole', x: 0, y: 1 }, { t: 'pole', x: 20, y: -1 }, { t: 'pole', x: 20, y: 1 }, { t: 'start', x: -2, y: 0 }], dims: [{ x1: 2, y1: -1, x2: 2, y2: 1, label: "2 מ'" }, { x1: 0, y1: 3, x2: 20, y2: 3, label: "20 מ'" }], path: [[-2, 0], [20, 0]], caption: 'שער של 2 מ\' ואז 20 מ\'' }),
  'spd-2-2': D({ items: [{ t: 'pole', x: 0, y: -1.5 }, { t: 'pole', x: 0, y: 1.5 }, { t: 'pole', x: 22, y: 10 }, { t: 'pole', x: 23, y: 12 }, { t: 'start', x: -2, y: 0 }], dims: [{ x1: -4, y1: -1.5, x2: -4, y2: 1.5, label: "3 מ'" }, { x1: 0, y1: 0, x2: 22, y2: 11, label: "25 מ'" }], path: [[-2, 0], [22, 11]], caption: 'שער של 3 מ\' ואז 25 מ\' באלכסון' }),
  'spd-2-3': D({ items: [{ t: 'start', x: 0, y: 0 }, { t: 'pole', x: 3, y: 0 }, { t: 'pole', x: 4, y: 0 }, { t: 'pole', x: 5, y: 0 }, { t: 'pole', x: 6, y: 0 }, { t: 'cone', x: 6, y: 3 }, { t: 'cone', x: 16, y: 3 }, { t: 'ball', x: 0, y: -2 }], dims: [{ x1: 3, y1: -2, x2: 4, y2: -2, label: "1 מ'" }, { x1: 6, y1: 6, x2: 16, y2: 6, label: "10 מ'" }], path: [[0, 0], [6, 0], [6, 3], [16, 3]], caption: 'סלאלום מוטות 1 מ\', 3 מ\' הצידה, 10 מ\' (ריאקטיבי)' }),
  'spd-2-4': D({ items: [{ t: 'start', x: 0, y: 0 }, { t: 'pole', x: 2, y: 0 }, { t: 'pole', x: 3, y: 0 }, { t: 'pole', x: 4, y: 0 }, { t: 'cone', x: 14, y: 0 }, { t: 'cone', x: 14, y: 10 }], dims: [{ x1: 4, y1: -3, x2: 14, y2: -3, label: "10 מ'" }, { x1: 17, y1: 0, x2: 17, y2: 10, label: "10 מ'" }], path: [[0, 0], [14, 0], [14, 10]], caption: 'מוטות 1 מ\', 10 מ\' ואז 10 מ\' בפנייה' }),
  'spd-3-1': D({ items: [{ t: 'start', x: 0, y: 0 }, { t: 'pole', x: 3, y: -1 }, { t: 'pole', x: 3, y: 1 }, { t: 'pole', x: 8, y: -1 }, { t: 'pole', x: 8, y: 1 }], dims: [{ x1: 0, y1: 3, x2: 3, y2: 3, label: "3 מ'" }, { x1: 3, y1: 3, x2: 8, y2: 3, label: "5 מ'" }], path: [[0, 0], [8, 0]], caption: 'בלימה בין המוטות' }),
  'spd-3-2': D({ items: [{ t: 'start', x: 0, y: 0 }, { t: 'ball', x: 1, y: 2 }, { t: 'pole', x: 25, y: -1 }, { t: 'pole', x: 25, y: 1 }], dims: [{ x1: 0, y1: 4, x2: 25, y2: 4, label: "25 מ'" }, { x1: 27, y1: -1, x2: 27, y2: 1, label: "2 מ'" }], path: [[0, 0], [25, 0]], caption: '25 מ\' לשער של 2 מ\' ועצירה בתוכו (ריאקטיבי)' }),
  'spd-3-3': D({ items: [{ t: 'start', x: 0, y: 0 }, { t: 'pole', x: 3, y: -1 }, { t: 'pole', x: 3, y: 1 }, { t: 'pole', x: 5, y: -1 }, { t: 'pole', x: 5, y: 1 }], dims: [{ x1: 0, y1: 3, x2: 3, y2: 3, label: "3 מ'" }, { x1: 3, y1: 3, x2: 5, y2: 3, label: "2 מ'" }], path: [[0, 0], [5, 0]], caption: 'האצה 3 מ\' ובלימה תוך 2 מ\'' }),
  'spd-3-4': D({ items: [{ t: 'start', x: 0, y: 0 }, { t: 'pole', x: 5, y: 0 }, { t: 'pole', x: 15, y: 0 }, { t: 'pole', x: 15, y: 5 }], dims: [{ x1: 0, y1: -3, x2: 5, y2: -3, label: "5 מ'" }, { x1: 5, y1: -3, x2: 15, y2: -3, label: "10 מ'" }, { x1: 18, y1: 0, x2: 18, y2: 5, label: "5 מ'" }], path: [[0, 0], [15, 0], [15, 5]], caption: '5 מ\', 10 מ\', ואז 5 מ\' בפנייה' }),

  // ---------- stamina programme ----------
  'sta-mss-1': line([10, 30, 10], { ball: true, caption: 'הלוך וחזור = 2 חזרות. 80-95% מהמהירות המרבית' }),
  'sta-mss-2': line([10, 30, 10], { caption: 'הלוך וחזור = 2 חזרות' }),
  'sta-mss-3': line([10, 20, 5, 10], { caption: 'הלוך וחזור = 2 חזרות' }),
  'sta-mss-4': line([10, 30, 10], { ball: true, caption: 'שני כדורים. הלוך וחזור = 2 חזרות' }),
  'sta-sr-1': line([5, 15, 5], { ball: true, caption: '100%. חוזרים בהליכה בין חזרות' }),
  'sta-sr-2': line([5, 5, 15], { caption: '100%. חוזרים בהליכה בין חזרות' }),
  'sta-sr-3': line([5, 15, 5], { caption: '100%. חוזרים בהליכה בין חזרות' }),
  'sta-sr-4': line([5, 15], { caption: '100%. חוזרים בהליכה בין חזרות' }),
};

/** Diagram key from an exercise/block (content tags it via `diagram`). */
export function diagramFor(key: string | undefined): Diagram | undefined {
  return key ? DRILLS[key] : undefined;
}
