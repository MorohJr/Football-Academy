import { useCallback, useMemo, useState } from 'react';
import { db } from '../../db/db';
import { CATEGORY_HE, SLOT_HE, type MealSlot, type PantryCategory } from '../../content/pantry';
import {
  DIY_DRINKS, DRINKS_WARNINGS, EATING_SCHEDULES, HALF_TIME_SNACKS, HYDRATION, MATCH_DAY_RULES, NUTRITION_COACHING, POST_MATCH, PRE_MATCH_MEALS,
  PRE_MATCH_SNACKS, SEVEN_TIPS, SUPPLEMENT_RULES, SUPPLEMENTS,
} from '../../content/nutrition';
import { addDaysISO } from '../../domain/dates';
import { trendWeight } from '../../domain/body';
import { DAY_TYPE_HE, KOSHER_HE, meatAndFish, shoppingNeeds, stockLevel, totalsByDate, type Kosher, type KosherStatus } from '../../domain/nutrition';
import type { FoodLog, Meal, PantryItem } from '../../domain/schemas';
import { productByBarcode } from '../../services/barcode';
import { dairyFrom, foodContext, foodDay, kosherNow } from '../../services/food';
import { eatItem, eatMeal, mealValues, restock, undoFoodLog } from '../../services/pantry';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { Chart, ChartBox } from '../components/charts';
import { ConfirmButton, Empty, fmtDate, HRow, KosherBadge, Meter, Modal, NumInput, Page, Seg, Tabs, useToast, VideoLinks } from '../components/common';
import { hmToMin, nowHm, useLive, useSettings, useToday } from '../hooks';
import { go, replace } from '../router';

type Tab = 'today' | 'pantry' | 'meals' | 'shop' | 'charts' | 'guide';
const TABS: { v: Tab; label: string }[] = [
  { v: 'today', label: 'היום' },
  { v: 'pantry', label: 'מזווה' },
  { v: 'meals', label: 'ארוחות' },
  { v: 'shop', label: 'קניות' },
  { v: 'charts', label: 'גרפים' },
  { v: 'guide', label: 'מדריך' },
];
const UNIT_HE = { g: "ג'", ml: 'מ"ל', unit: "יח'" } as const;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const now = () => new Date().toISOString();
const SLOTS = Object.keys(SLOT_HE) as MealSlot[];
const CATS = Object.keys(CATEGORY_HE) as PantryCategory[];

export function FoodScreen({ tab }: { tab?: string }) {
  const t = (TABS.some((x) => x.v === tab) ? tab : 'today') as Tab;
  return (
    <Page title="תזונה" kicker="R-NUT · לפי ה-Bible ומדריך התזונה · כשר">
      <Tabs value={t} tabs={TABS} onChange={(v) => replace(`/food/${v}`)} />
      {t === 'today' && <TodayFood />}
      {t === 'pantry' && <Pantry />}
      {t === 'meals' && <Meals />}
      {t === 'shop' && <Shopping />}
      {t === 'charts' && <FoodCharts />}
      {t === 'guide' && <Guide />}
    </Page>
  );
}

function kosherText(k: KosherStatus): string | null {
  if (k.kind === 'wait') return `אחרי בשרי: חלבי בעוד ${k.minutesLeft} דק'`;
  if (k.kind === 'rinse') return 'אחרי חלבי: לשטוף את הפה לפני בשרי';
  if (k.kind === 'mixed') return 'בשר וחלב יחד: אסור';
  return null;
}

// ---------------------------------------------------------------- today
function TodayFood() {
  const today = useToday();
  const s = useSettings();
  const toast = useToast();
  const [pick, setPick] = useState<'meal' | 'item' | null>(null);
  const data = useLive(async () => {
    if (!s) return null;
    const ctx = await foodContext(s, today);
    const logs = (await db.foodLogs.where('date').equals(today).toArray()).sort((a, b) => a.time.localeCompare(b.time));
    return { day: foodDay(today, ctx), logs };
  }, [s, today]);
  if (!s || !data) return null;
  const { day, logs } = data;
  const eaten = logs.reduce((a, l) => ({ kcal: a.kcal + l.kcal, protein: a.protein + l.protein, carbs: a.carbs + l.carbs, fat: a.fat + l.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const t = day.targets;
  const dairy = dairyFrom(logs, s.kosherWaitMin);
  const dairyWait = !!dairy && dairy.minute > hmToMin(nowHm());
  const lastDairyAfterMeat = kosherNow(logs, 'meat', nowHm(), s.kosherWaitMin).kind === 'rinse';
  return (
    <>
      <div className="card" style={{ borderInlineStart: '4px solid var(--g1)' }}>
        <div className="ch">
          {DAY_TYPE_HE[day.dayType]} <span>{day.mode === 'cut' ? 'מצב חיטוב' : 'מצב תחזוקה'}{s.goalMode === 'auto' ? (day.bodyFat != null ? ` (אוטומטי · שומן ${day.bodyFat}%)` : ' (אוטומטי)') : ''}</span>
        </div>
        {s.goalMode === 'auto' && day.bodyFat == null && (
          <div className="xs muted" style={{ marginBottom: 6 }}>
            אין עדיין אחוז שומן, אז המצב הוא תחזוקה. מדידת צוואר ומותניים במסך הגוף, או לבחור "חיטוב" בהגדרות.{' '}
            <button type="button" className="linkbtn" onClick={() => go('/body/measure')}>
              למדידה ›
            </button>
          </div>
        )}
        {!t ? (
          <div className="warnbox">
            חסר {day.missing.join(', ')} כדי לחשב יעדים.{' '}
            <button type="button" className="linkbtn" onClick={() => go('/settings')}>
              להגדרות ›
            </button>
          </div>
        ) : (
          <>
            {(
              [
                ['קלוריות', eaten.kcal, t.kcal, ''],
                ['חלבון', eaten.protein, t.protein, "ג'"],
                ['פחמימות', eaten.carbs, t.carbs, "ג'"],
                ['שומן', eaten.fat, t.fat, "ג'"],
              ] as const
            ).map(([label, v, max, u]) => (
              <div key={label} style={{ marginBottom: 6 }}>
                <div className="row between small">
                  <span>{label}</span>
                  <span className="num">
                    {Math.round(v)} / {max} {u}
                  </span>
                </div>
                <Meter value={v} max={max} over={label === 'קלוריות' || label === 'שומן'} />
              </div>
            ))}
            <div className="xs muted">
              תחזוקה {day.maintenance} קק"ל{t.deficit ? ` · גירעון ${t.deficit}` : ' · בלי גירעון היום'} · שתייה {t.waterL} ליטר לפחות
            </div>
            <ul className="clean small mt">
              {t.tips.map((x) => (
                <li key={x}>{x}</li>
              ))}
              {day.dayType === 'match' && <li>ארוחת ההתאוששות אחרי המשחק נשארת מלאה גם בחיטוב (החלטה 15.8).</li>}
            </ul>
            {day.game && (
              <button type="button" className="btn sec sm" onClick={() => go(`/gamemode/${day.game!.id}`)}>
                לו"ז אכילה של יום המשחק ›
              </button>
            )}
          </>
        )}
      </div>
      {(dairyWait || lastDairyAfterMeat) && (
        <div className="card" style={{ background: 'var(--surface2)' }}>
          {dairyWait && (
            <div className="small">
              <KosherBadge k="meat" /> אכלת בשרי. חלבי מ-<b className="ltr">{dairy?.hm}</b>
            </div>
          )}
          {lastDairyAfterMeat && (
            <div className="small">
              <KosherBadge k="dairy" /> אחרי חלבי: לשטוף את הפה ואז בשרי
            </div>
          )}
        </div>
      )}
      <div className="row">
        <button type="button" className="btn grow" onClick={() => setPick('meal')}>
          + אכלתי ארוחה
        </button>
        <button type="button" className="btn sec grow" onClick={() => setPick('item')}>
          + פריט בודד
        </button>
      </div>
      <HRow title="אכלתי היום" meta={`${logs.length} רישומים`} />
      {logs.map((l) => (
        <div key={l.id} className="wrow">
          <div className="when ltr">{l.time}</div>
          <div className="grow">
            <div className="ttl">
              <KosherBadge k={l.kosher} /> {l.name}
              {l.mealId && l.amount && l.amount !== 1 ? ` ×${l.amount}` : ''}
              {l.itemId && l.amount ? ` · ${l.amount}` : ''}
            </div>
            <div className="meta">
              {l.kcal} קק"ל · ח {l.protein} · פ {l.carbs} · ש {l.fat}
            </div>
          </div>
          <ConfirmButton
            label="בטל"
            confirm="לבטל?"
            onConfirm={() =>
              void undoFoodLog(l).then(() => {
                toast('בוטל והוחזר למזווה');
              })
            }
          />
        </div>
      ))}
      {!logs.length && <Empty>עוד לא נרשם אוכל היום.</Empty>}
      {pick === 'meal' && <MealPicker logs={logs} waitMin={s.kosherWaitMin} dayType={day.dayType} onClose={() => setPick(null)} />}
      {pick === 'item' && <ItemPicker logs={logs} waitMin={s.kosherWaitMin} onClose={() => setPick(null)} />}
    </>
  );
}

function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>שעה</label>
      <input className="input ltr" type="time" value={value} onChange={(e) => onChange(e.target.value || nowHm())} />
    </div>
  );
}

function MealPicker({ logs, waitMin, dayType, onClose }: { logs: FoodLog[]; waitMin: number; dayType: string; onClose: () => void }) {
  const today = useToday();
  const toast = useToast();
  const [time, setTime] = useState(nowHm());
  const [slot, setSlot] = useState<MealSlot | 'all'>('all');
  const [chosen, setChosen] = useState<Meal | null>(null);
  const [factor, setFactor] = useState(1);
  const data = useLive(async () => ({ meals: await db.meals.toArray(), items: new Map((await db.pantry.toArray()).map((i) => [i.id, i])) }), []);
  if (!data) return null;
  const fuel = dayType === 'intense' || dayType === 'loading' || dayType === 'match';
  const list = data.meals.filter((m) => slot === 'all' || m.slot === slot).sort((a, b) => Number(b.style === (fuel ? 'around' : 'protein')) - Number(a.style === (fuel ? 'around' : 'protein')) || a.name.localeCompare(b.name, 'he'));
  return (
    <Modal open onClose={onClose} title={chosen ? chosen.name : 'אכלתי ארוחה'}>
      {!chosen ? (
        <>
          <div className="chips">
            {(['all', ...SLOTS] as const).map((x) => (
              <button key={x} type="button" className={`chip ${slot === x ? 'on' : ''}`} onClick={() => setSlot(x)}>
                {x === 'all' ? 'הכול' : SLOT_HE[x]}
              </button>
            ))}
          </div>
          <div className="stack mt" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {list.map((m) => {
              const v = mealValues(m, data.items);
              const k = kosherNow(logs, v.kosher, time, waitMin);
              const warn = kosherText(k);
              return (
                <button key={m.id} type="button" className="wrow tap" style={{ textAlign: 'start', width: '100%' }} onClick={() => setChosen(m)}>
                  <div className="grow">
                    <div className="ttl">
                      <KosherBadge k={v.kosher} /> {m.name}
                    </div>
                    <div className="meta">
                      {SLOT_HE[m.slot]} · {m.style === 'around' ? 'סביב אימון' : 'חלבון וירקות'} · {v.macros.kcal} קק"ל · ח {v.macros.protein}
                    </div>
                    {warn && <div className="xs" style={{ color: 'var(--danger)' }}>{warn}</div>}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="xs muted">{fuel ? 'היום עצים/לפני משחק: ארוחות "סביב אימון" למעלה.' : 'היום קל/מנוחה: ארוחות "חלבון וירקות" למעלה.'}</p>
        </>
      ) : (
        (() => {
          const v = mealValues({ ingredients: chosen.ingredients.map((i) => ({ ...i, amount: i.amount * factor })) }, data.items);
          const k = kosherNow(logs, v.kosher, time, waitMin);
          const warn = kosherText(k);
          return (
            <>
              <div className="small">
                {v.macros.kcal} קק"ל · חלבון {v.macros.protein} · פחמימות {v.macros.carbs} · שומן {v.macros.fat}
              </div>
              {warn && <div className="warnbox">{warn}</div>}
              <TimeField value={time} onChange={setTime} />
              <div className="field">
                <div className="lbl">מנה</div>
                <Seg value={String(factor)} onChange={(x) => setFactor(Number(x))} options={[{ v: '0.5', label: '½' }, { v: '0.75', label: '¾' }, { v: '1', label: 'מלאה' }, { v: '1.5', label: '1½' }, { v: '2', label: '×2' }]} />
              </div>
              <div className="row">
                <button
                  type="button"
                  className="btn grow"
                  disabled={k.kind === 'mixed'}
                  onClick={async () => {
                    await eatMeal(chosen, today, time, factor);
                    toast('נרשם וירד מהמזווה');
                    onClose();
                  }}
                >
                  אכלתי
                </button>
                <button type="button" className="btn ghost" onClick={() => setChosen(null)}>
                  חזרה
                </button>
              </div>
            </>
          );
        })()
      )}
    </Modal>
  );
}

function ItemPicker({ logs, waitMin, onClose }: { logs: FoodLog[]; waitMin: number; onClose: () => void }) {
  const today = useToday();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [time, setTime] = useState(nowHm());
  const [chosen, setChosen] = useState<PantryItem | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const items = useLive(() => db.pantry.toArray(), []);
  if (!items) return null;
  const list = items.filter((i) => !q || i.name.includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  return (
    <Modal open onClose={onClose} title={chosen ? chosen.name : 'פריט בודד'}>
      {!chosen ? (
        <>
          <input className="input" placeholder="חיפוש" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="stack mt" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {list.map((i) => (
              <button
                key={i.id}
                type="button"
                className="list-row tap"
                style={{ width: '100%', textAlign: 'start' }}
                onClick={() => {
                  setChosen(i);
                  setAmount(i.unit === 'unit' ? 1 : 100);
                }}
              >
                <KosherBadge k={i.kosher} /> <span className="grow small">{i.name}</span>
                <span className="xs muted">
                  {i.per.kcal} קק"ל / {i.unit === 'unit' ? "יח'" : '100'}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        (() => {
          const f = chosen.unit === 'unit' ? amount ?? 0 : (amount ?? 0) / 100;
          const k = kosherNow(logs, chosen.kosher, time, waitMin);
          const warn = kosherText(k);
          return (
            <>
              <div className="field">
                <label>כמות ({UNIT_HE[chosen.unit]}) · במלאי {chosen.stock}</label>
                <NumInput value={amount} onChange={setAmount} />
              </div>
              <div className="small">
                {Math.round(chosen.per.kcal * f)} קק"ל · ח {Math.round(chosen.per.protein * f)} · פ {Math.round(chosen.per.carbs * f)} · ש {Math.round(chosen.per.fat * f)}
              </div>
              {warn && <div className="warnbox">{warn}</div>}
              <TimeField value={time} onChange={setTime} />
              <div className="row">
                <button
                  type="button"
                  className="btn grow"
                  disabled={!amount}
                  onClick={async () => {
                    await eatItem(chosen, amount!, today, time);
                    toast('נרשם וירד מהמזווה');
                    onClose();
                  }}
                >
                  אכלתי
                </button>
                <button type="button" className="btn ghost" onClick={() => setChosen(null)}>
                  חזרה
                </button>
              </div>
            </>
          );
        })()
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------- pantry
const LEVEL_COLOR = { ok: 'var(--g1)', low: 'var(--warn)', out: 'var(--danger)' } as const;

function Pantry() {
  const items = useLive(() => db.pantry.toArray(), []);
  const [q, setQ] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  if (!items) return null;
  const list = items.filter((i) => (!q || i.name.includes(q)) && (!onlyLow || stockLevel(i) !== 'ok'));
  return (
    <>
      <div className="row">
        <input className="input grow" placeholder="חיפוש במזווה" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className={`btn sm ${onlyLow ? '' : 'sec'}`} onClick={() => setOnlyLow(!onlyLow)}>
          חסר
        </button>
      </div>
      <div className="row mt">
        <button type="button" className="btn grow" onClick={() => go('/food/item/new')}>
          + פריט
        </button>
        <button type="button" className="btn sec grow" onClick={() => go('/food/item/scan')}>
          סריקת ברקוד
        </button>
      </div>
      {CATS.map((c) => {
        const rows = list.filter((i) => i.category === c).sort((a, b) => a.name.localeCompare(b.name, 'he'));
        if (!rows.length) return null;
        return (
          <div key={c}>
            <HRow title={CATEGORY_HE[c]} meta={`${rows.length}`} />
            {rows.map((i) => {
              const lvl = stockLevel(i);
              return (
                <div key={i.id} className="list-row tap" onClick={() => go(`/food/item/${i.id}`)}>
                  <KosherBadge k={i.kosher} />
                  <span className="grow small">{i.name}</span>
                  <span className="xs num" style={{ color: LEVEL_COLOR[lvl] }}>
                    {lvl === 'out' ? 'אזל' : `${i.stock} ${UNIT_HE[i.unit]}`}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
      {!list.length && <Empty>לא נמצא.</Empty>}
      <p className="xs muted">ערכים תזונתיים מטבלאות כלליות (לא מ-Matchfit). אפשר לערוך.</p>
    </>
  );
}

export function PantryItemScreen({ id }: { id: string }) {
  const isNew = id === 'new' || id === 'scan';
  const existing = useLive(async () => (isNew ? null : ((await db.pantry.get(id)) ?? null)), [id]);
  if (existing === undefined) return null;
  return <PantryItemForm key={id} initial={existing} scan={id === 'scan'} />;
}

function blankItem(): PantryItem {
  const t = now();
  return { id: uid(), createdAt: t, updatedAt: t, name: '', category: 'protein', kosher: 'parve', cert: '', unit: 'g', per: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, stock: 0, lowAt: 0, barcode: null, seed: false };
}

function PantryItemForm({ initial, scan }: { initial: PantryItem | null; scan: boolean }) {
  const toast = useToast();
  const [v, setV] = useState<PantryItem>(initial ?? blankItem());
  const [scanning, setScanning] = useState(scan);
  const [busy, setBusy] = useState(false);
  const [add, setAdd] = useState<number | null>(null);
  const set = (p: Partial<PantryItem>) => setV({ ...v, ...p });
  const setPer = (k: keyof PantryItem['per'], n: number | null) => setV({ ...v, per: { ...v.per, [k]: n ?? 0 } });
  const onCode = useCallback(
    async (code: string) => {
      setScanning(false);
      const dup = await db.pantry.where('barcode').equals(code).first();
      if (dup) {
        toast('המוצר כבר במזווה');
        replace(`/food/item/${dup.id}`);
        return;
      }
      setBusy(true);
      try {
        const p = await productByBarcode(code);
        if (!p) {
          toast('לא נמצא במאגר. אפשר להזין ידנית');
          setV((x) => ({ ...x, barcode: code }));
        } else {
          setV((x) => ({ ...x, barcode: code, name: [p.name, p.brand].filter(Boolean).join(' · '), unit: 'g', per: p.per100 }));
          toast('נמצא. לבחור סוג כשרות וכמות');
        }
      } catch (e) {
        toast((e as Error).message);
        setV((x) => ({ ...x, barcode: code }));
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  const perLabel = v.unit === 'unit' ? "ליחידה" : `ל-100 ${UNIT_HE[v.unit]}`;
  return (
    <Page title={initial ? initial.name : 'פריט חדש'} kicker="מזווה" backTo="/food/pantry" sub2>
      {busy && <div className="okbox">מחפש במאגר…</div>}
      {!initial && (
        <button type="button" className="btn sec block" onClick={() => setScanning(true)}>
          סריקת ברקוד
        </button>
      )}
      {v.barcode && <div className="xs muted ltr">barcode {v.barcode}</div>}
      <div className="field">
        <label>שם</label>
        <input className="input" value={v.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="row">
        <div className="field grow">
          <label>קטגוריה</label>
          <select className="input" value={v.category} onChange={(e) => set({ category: e.target.value as PantryCategory })}>
            {CATS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_HE[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="field grow">
          <label>יחידה</label>
          <select className="input" value={v.unit} onChange={(e) => set({ unit: e.target.value as PantryItem['unit'] })}>
            <option value="g">גרם</option>
            <option value="ml">מ"ל</option>
            <option value="unit">יחידות</option>
          </select>
        </div>
      </div>
      <div className="field">
        <div className="lbl">כשרות</div>
        <Seg value={v.kosher} onChange={(k) => set({ kosher: k })} options={(['meat', 'dairy', 'parve', 'fish'] as Kosher[]).map((k) => ({ v: k, label: KOSHER_HE[k] }))} />
      </div>
      <div className="field">
        <label>הכשר (לא חובה)</label>
        <input className="input" value={v.cert} onChange={(e) => set({ cert: e.target.value })} />
      </div>
      <HRow title={`ערכים ${perLabel}`} />
      <div className="row">
        {(
          [
            ['kcal', 'קק"ל'],
            ['protein', 'חלבון'],
            ['carbs', 'פחמימות'],
            ['fat', 'שומן'],
          ] as const
        ).map(([k, l]) => (
          <div key={k} className="field grow">
            <label>{l}</label>
            <NumInput value={v.per[k]} onChange={(n) => setPer(k, n)} step={0.1} />
          </div>
        ))}
      </div>
      <HRow title="מלאי" />
      <div className="row">
        <div className="field grow">
          <label>במלאי ({UNIT_HE[v.unit]})</label>
          <NumInput value={v.stock} onChange={(n) => set({ stock: n ?? 0 })} />
        </div>
        <div className="field grow">
          <label>"נמוך" מתחת ל-</label>
          <NumInput value={v.lowAt} onChange={(n) => set({ lowAt: n ?? 0 })} />
        </div>
      </div>
      {initial && (
        <div className="row">
          <div className="grow">
            <NumInput value={add} onChange={setAdd} placeholder={`קניתי (${UNIT_HE[v.unit]})`} />
          </div>
          <button
            type="button"
            className="btn sec"
            disabled={!add}
            onClick={async () => {
              await restock(v.id, add!);
              setV({ ...v, stock: Math.round((v.stock + add!) * 100) / 100 });
              setAdd(null);
              toast('נוסף למלאי');
            }}
          >
            הוסף
          </button>
        </div>
      )}
      <button
        type="button"
        className="btn block mt"
        disabled={!v.name}
        onClick={async () => {
          await db.pantry.put({ ...v, updatedAt: now() });
          toast('נשמר');
          go('/food/pantry');
        }}
      >
        שמור
      </button>
      {initial && (
        <div className="row mt">
          <ConfirmButton
            label="מחק פריט"
            confirm="למחוק?"
            onConfirm={async () => {
              const used = (await db.meals.toArray()).filter((m) => m.ingredients.some((i) => i.itemId === v.id));
              if (used.length) {
                toast(`בשימוש ב-${used.length} ארוחות: ${used.map((m) => m.name).slice(0, 2).join(', ')}`);
                return;
              }
              await db.pantry.delete(v.id);
              go('/food/pantry');
            }}
          />
        </div>
      )}
      {scanning && <BarcodeScanner onCode={(c) => void onCode(c)} onClose={() => setScanning(false)} />}
    </Page>
  );
}

// ---------------------------------------------------------------- meals
function Meals() {
  const data = useLive(async () => ({ meals: await db.meals.toArray(), items: new Map((await db.pantry.toArray()).map((i) => [i.id, i])) }), []);
  const [slot, setSlot] = useState<MealSlot | 'menu' | 'all'>('all');
  if (!data) return null;
  const list = data.meals.filter((m) => slot === 'all' || (slot === 'menu' ? m.inMenu : m.slot === slot)).sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) || a.name.localeCompare(b.name, 'he'));
  return (
    <>
      <div className="chips">
        {(['all', 'menu', ...SLOTS] as const).map((x) => (
          <button key={x} type="button" className={`chip ${slot === x ? 'on' : ''}`} onClick={() => setSlot(x)}>
            {x === 'all' ? 'הכול' : x === 'menu' ? 'בתפריט השבוע' : SLOT_HE[x]}
          </button>
        ))}
      </div>
      <button type="button" className="btn block mt" onClick={() => go('/food/meal/new')}>
        + ארוחה חדשה
      </button>
      {list.map((m) => {
        const v = mealValues(m, data.items);
        return (
          <div key={m.id} className="wrow tap" onClick={() => go(`/food/meal/${m.id}`)}>
            <div className="grow">
              <div className="ttl">
                <KosherBadge k={v.kosher} /> {m.name}
                {m.inMenu ? ' ★' : ''}
              </div>
              <div className="meta">
                {SLOT_HE[m.slot]} · {m.style === 'around' ? 'סביב אימון' : 'חלבון וירקות'} · {v.macros.kcal} קק"ל · ח {v.macros.protein} · פ {v.macros.carbs} · ש {v.macros.fat}
              </div>
            </div>
          </div>
        );
      })}
      {!list.length && <Empty>אין ארוחות כאן.</Empty>}
      <p className="xs muted">★ = בתפריט השבוע. מה שחסר להן נכנס לרשימת הקניות.</p>
    </>
  );
}

export function MealScreen({ id }: { id: string }) {
  const data = useLive(async () => ({ meal: id === 'new' ? null : ((await db.meals.get(id)) ?? null), items: await db.pantry.toArray() }), [id]);
  if (!data) return null;
  return <MealForm key={id} initial={data.meal} items={data.items} />;
}

function MealForm({ initial, items }: { initial: Meal | null; items: PantryItem[] }) {
  const toast = useToast();
  const today = useToday();
  const t = now();
  const [v, setV] = useState<Meal>(initial ?? { id: uid(), createdAt: t, updatedAt: t, name: '', slot: 'lunch', style: 'protein', ingredients: [], instructions: '', inMenu: false, seed: false });
  const [addId, setAddId] = useState('');
  const [addAmt, setAddAmt] = useState<number | null>(null);
  const map = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const vals = mealValues(v, map);
  const kinds = v.ingredients.map((i) => map.get(i.itemId)?.kosher).filter((k): k is Kosher => !!k);
  const set = (p: Partial<Meal>) => setV({ ...v, ...p });
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  return (
    <Page title={initial ? initial.name : 'ארוחה חדשה'} kicker={`${vals.macros.kcal} קק"ל · ח ${vals.macros.protein} · פ ${vals.macros.carbs} · ש ${vals.macros.fat}`} backTo="/food/meals" sub2>
      {vals.kosher === 'mixed' && <div className="warnbox">בשר וחלב באותה ארוחה: אי אפשר לשמור (R-KSH).</div>}
      {meatAndFish(kinds) && <div className="warnbox">בשר ודג באותה ארוחה: נהוג לא לאכול יחד.</div>}
      <div className="field">
        <label>שם</label>
        <input className="input" value={v.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="row">
        <div className="field grow">
          <label>סוג</label>
          <select className="input" value={v.slot} onChange={(e) => set({ slot: e.target.value as MealSlot })}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {SLOT_HE[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field grow">
          <label>סגנון (8.3)</label>
          <select className="input" value={v.style} onChange={(e) => set({ style: e.target.value as Meal['style'] })}>
            <option value="around">סביב אימון (פחמימות)</option>
            <option value="protein">חלבון וירקות</option>
          </select>
        </div>
      </div>
      <label className="row small">
        <input type="checkbox" checked={v.inMenu} onChange={(e) => set({ inMenu: e.target.checked })} /> בתפריט השבוע (לרשימת הקניות)
      </label>
      <HRow title="מרכיבים" meta={<KosherBadge k={vals.kosher} />} />
      {v.ingredients.map((ing, idx) => {
        const it = map.get(ing.itemId);
        return (
          <div key={idx} className="list-row">
            {it && <KosherBadge k={it.kosher} />}
            <span className="grow small">{it?.name ?? 'פריט שנמחק'}</span>
            <div style={{ width: 80 }}>
              <NumInput value={ing.amount} onChange={(n) => set({ ingredients: v.ingredients.map((x, j) => (j === idx ? { ...x, amount: n ?? 0 } : x)) })} />
            </div>
            <span className="xs">{it ? UNIT_HE[it.unit] : ''}</span>
            <button type="button" className="btn ghost sm" aria-label="הסר" onClick={() => set({ ingredients: v.ingredients.filter((_, j) => j !== idx) })}>
              ✕
            </button>
          </div>
        );
      })}
      <div className="row mt">
        <select className="input grow" value={addId} onChange={(e) => setAddId(e.target.value)}>
          <option value="">+ מרכיב מהמזווה</option>
          {sorted.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({KOSHER_HE[i.kosher]})
            </option>
          ))}
        </select>
        <div style={{ width: 80 }}>
          <NumInput value={addAmt} onChange={setAddAmt} placeholder="כמות" />
        </div>
        <button
          type="button"
          className="btn sm"
          disabled={!addId || !addAmt}
          onClick={() => {
            set({ ingredients: [...v.ingredients, { itemId: addId, amount: addAmt! }] });
            setAddId('');
            setAddAmt(null);
          }}
        >
          הוסף
        </button>
      </div>
      <div className="field mt">
        <label>הוראות הכנה</label>
        <textarea className="input" rows={4} value={v.instructions} onChange={(e) => set({ instructions: e.target.value })} />
      </div>
      <div className="row">
        <button
          type="button"
          className="btn grow"
          disabled={!v.name || !v.ingredients.length || vals.kosher === 'mixed' || v.ingredients.some((i) => i.amount <= 0)}
          onClick={async () => {
            await db.meals.put({ ...v, updatedAt: now() });
            toast('נשמר');
            go('/food/meals');
          }}
        >
          שמור
        </button>
        {initial && (
          <button
            type="button"
            className="btn sec grow"
            disabled={vals.kosher === 'mixed'}
            onClick={async () => {
              await eatMeal(initial, today, nowHm());
              toast('נרשם וירד מהמזווה');
            }}
          >
            אכלתי עכשיו
          </button>
        )}
      </div>
      {initial && (
        <div className="row mt">
          <ConfirmButton label="מחק ארוחה" confirm="למחוק?" onConfirm={() => void db.meals.delete(initial.id).then(() => go('/food/meals'))} />
        </div>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------- shopping
function Shopping() {
  const toast = useToast();
  const data = useLive(async () => ({ items: await db.pantry.toArray(), meals: await db.meals.filter((m) => m.inMenu).toArray(), manual: await db.shopping.toArray() }), []);
  const [text, setText] = useState('');
  const [buy, setBuy] = useState<{ item: PantryItem; amount: number | null } | null>(null);
  if (!data) return null;
  const needs = shoppingNeeds(data.items, data.meals);
  const byId = new Map(data.items.map((i) => [i.id, i]));
  return (
    <>
      <HRow title="חסר במזווה" meta={`${needs.length} פריטים`} />
      {CATS.map((c) => {
        const rows = needs.filter((n) => byId.get(n.itemId)?.category === c);
        if (!rows.length) return null;
        return (
          <div key={c} className="card">
            <div className="ch">{CATEGORY_HE[c]}</div>
            {rows.map((n) => {
              const it = byId.get(n.itemId)!;
              return (
                <div key={n.itemId} className="list-row">
                  <span className="grow small">
                    {it.name}
                    <div className="xs muted">
                      {n.reason === 'out' ? 'אזל' : n.reason === 'low' ? `נשאר ${it.stock} ${UNIT_HE[it.unit]}` : `לתפריט: ${n.mealNames.join(', ')}`}
                    </div>
                  </span>
                  <button type="button" className="btn sm" onClick={() => setBuy({ item: it, amount: Math.max(it.lowAt * 2 - it.stock, it.lowAt, it.unit === 'unit' ? 1 : 100) })}>
                    קניתי
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
      {!needs.length && <Empty>המזווה מלא. אין מה לקנות.</Empty>}
      <HRow title="עוד דברים לקנות" />
      {data.manual.map((m) => (
        <div key={m.id} className="list-row">
          <input type="checkbox" checked={m.done} onChange={() => void db.shopping.update(m.id, { done: !m.done, updatedAt: now() })} />
          <span className="grow small" style={{ textDecoration: m.done ? 'line-through' : 'none' }}>
            {m.name}
          </span>
          <button type="button" className="btn ghost sm" aria-label="מחק" onClick={() => void db.shopping.delete(m.id)}>
            ✕
          </button>
        </div>
      ))}
      <div className="row mt">
        <input className="input grow" placeholder="להוסיף לרשימה" value={text} onChange={(e) => setText(e.target.value)} />
        <button
          type="button"
          className="btn"
          disabled={!text.trim()}
          onClick={async () => {
            const t = now();
            await db.shopping.add({ id: uid(), createdAt: t, updatedAt: t, name: text.trim(), itemId: null, done: false });
            setText('');
          }}
        >
          הוסף
        </button>
      </div>
      {data.manual.some((m) => m.done) && (
        <button type="button" className="btn ghost sm mt" onClick={() => void db.shopping.bulkDelete(data.manual.filter((m) => m.done).map((m) => m.id))}>
          נקה מסומנים
        </button>
      )}
      {buy && (
        <Modal open onClose={() => setBuy(null)} title={`קניתי: ${buy.item.name}`}>
          <div className="field">
            <label>כמה ({UNIT_HE[buy.item.unit]})</label>
            <NumInput value={buy.amount} onChange={(n) => setBuy({ ...buy, amount: n })} />
          </div>
          <button
            type="button"
            className="btn block"
            disabled={!buy.amount}
            onClick={async () => {
              await restock(buy.item.id, buy.amount!);
              toast('נוסף למלאי');
              setBuy(null);
            }}
          >
            הוסף למלאי
          </button>
        </Modal>
      )}
    </>
  );
}

// ---------------------------------------------------------------- charts (in the nutrition screen, not the dashboard)
function FoodCharts() {
  const today = useToday();
  const s = useSettings();
  const [days, setDays] = useState<'14' | '28' | '56'>('28');
  const data = useLive(async () => {
    if (!s) return null;
    const n = Number(days);
    const from = addDaysISO(today, -(n - 1));
    const ctx = await foodContext(s, today);
    const logs = await db.foodLogs.where('date').between(from, today, true, true).toArray();
    const totals = totalsByDate(logs);
    const rows = Array.from({ length: n }, (_, i) => {
      const d = addDaysISO(from, i);
      const fd = foodDay(d, ctx);
      const tot = totals.get(d);
      return {
        d: fmtDate(d),
        kcal: tot ? Math.round(tot.kcal) : null,
        kcalT: fd.targets?.kcal ?? null,
        protein: tot ? Math.round(tot.protein) : null,
        proteinT: fd.targets?.protein ?? null,
        carbs: tot ? Math.round(tot.carbs) : null,
        carbsT: fd.targets?.carbs ?? null,
        maint: fd.maintenance,
        weight: trendWeight(ctx.weighIns, d),
        deficit: tot && fd.maintenance ? tot.kcal < fd.maintenance : null,
      };
    });
    return rows;
  }, [s, today, days]);
  if (!data) return null;
  const logged = data.filter((r) => r.kcal != null);
  const inDeficit = logged.filter((r) => r.deficit).length;
  const avg = (k: 'kcal' | 'protein' | 'carbs') => (logged.length ? Math.round(logged.reduce((a, r) => a + (r[k] ?? 0), 0) / logged.length) : null);
  return (
    <>
      <Seg value={days} onChange={setDays} options={[{ v: '14', label: '14 יום' }, { v: '28', label: '28 יום' }, { v: '56', label: '8 שבועות' }]} />
      <div className="tiles mt">
        <div className="tile">
          <b>{avg('kcal') ?? '—'}</b>
          <span>קק"ל ממוצע</span>
        </div>
        <div className="tile l">
          <b>{avg('protein') ?? '—'}</b>
          <span>חלבון ממוצע</span>
        </div>
        <div className="tile l">
          <b>
            {inDeficit}/{logged.length}
          </b>
          <span>ימים בגירעון</span>
        </div>
      </div>
      <ChartBox title="קלוריות מול יעד" legend={[{ label: 'אכלתי', color: '#1f7a3a' }, { label: 'יעד', color: '#c0392b' }, { label: 'תחזוקה', color: '#9aa59d' }]}>
        <Chart data={data} x="d" series={[{ key: 'kcal', label: 'אכלתי', type: 'bar' }, { key: 'kcalT', label: 'יעד', type: 'line', color: '#c0392b' }, { key: 'maint', label: 'תחזוקה', type: 'line', color: '#9aa59d' }]} />
      </ChartBox>
      <ChartBox title="חלבון מול יעד (1.8 ג'/ק&quot;ג)" legend={[{ label: 'אכלתי', color: '#2a6fb5' }, { label: 'יעד', color: '#c0392b' }]}>
        <Chart data={data} x="d" series={[{ key: 'protein', label: 'חלבון', type: 'bar', color: '#2a6fb5' }, { key: 'proteinT', label: 'יעד', type: 'line', color: '#c0392b' }]} />
      </ChartBox>
      <ChartBox title="פחמימות מול יעד לפי סוג היום" insight="היעד עולה בימים עצימים, ב-24 שעות לפני משחק וביום המשחק (R-NUT-2).">
        <Chart data={data} x="d" series={[{ key: 'carbs', label: 'פחמימות', type: 'bar', color: '#8a5a00' }, { key: 'carbsT', label: 'יעד', type: 'line', color: '#c0392b' }]} />
      </ChartBox>
      <ChartBox title="משקל מגמה מול קלוריות" legend={[{ label: 'משקל מגמה', color: '#7a4bb3' }, { label: 'קלוריות', color: '#1f7a3a' }]}>
        <Chart data={data} x="d" series={[{ key: 'kcal', label: 'קלוריות', type: 'bar' }, { key: 'weight', label: 'משקל', type: 'line', color: '#7a4bb3', right: true }]} />
      </ChartBox>
    </>
  );
}

// ---------------------------------------------------------------- guide
function Guide() {
  const [open, setOpen] = useState<string | null>('bible');
  const sec = (key: string, title: string, body: React.ReactNode) => (
    <div className="card">
      <div className="ch tap" onClick={() => setOpen(open === key ? null : key)}>
        {title} <span>{open === key ? '−' : '+'}</span>
      </div>
      {open === key && body}
    </div>
  );
  const ul = (xs: readonly string[]) => (
    <ul className="clean small">
      {xs.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
  return (
    <>
      {sec(
        'bible',
        'עקרונות החיטוב (Bible)',
        ul([
          'גירעון של 250-500 קלוריות מהתחזוקה. לא מורידים פחמימות לפני אימון: מרכזים אותן סביב האימון, ובשאר הארוחות חלבון, ירקות ואגוזים.',
          '30-40 ג\' חלבון בכל ארוחה, כל 3-4 שעות, וגם לפני השינה.',
          'בשר טרי פעם ביום: לבן בימי מנוחה וקלים, אדום בימים עצימים ובימי משחק. נתחים רזים (עד 5% שומן), בלי מעובד.',
          'לחם: בחיטוב מלא/נבוט. לפני משחק לבן.',
          'סוכר רק בזמן מאמץ. פרוקטוז (בננה) בארוחה 3 שעות לפני.',
          'אגוזים: עדיפות למלך ולמקדמיה, משאר הסוגים חופן קטן.',
          'בריאות המעי: אוכל טבעי. להימנע ממשקאות ממותקים, ממתקים ושמנים צמחיים עשירים באומגה 6. שמן זית עדיף.',
          '"סופר-פודס": בטטה (1-2 ביום), סלמון, יוגורט יווני לפני שינה, שיבולת שועל, אגוזים, אוכמניות.',
          'אסור בעונה: צום לסירוגין, ודיאטה דלת פחמימות לפני משחק.',
          'אלכוהול: עד 0.5 ג\' לק"ג כדי לא לפגוע בהתאוששות.',
          'יעד אחוז שומן: 8-12%.',
        ]),
      )}
      {sec(
        'kosher',
        'כשרות (R-KSH)',
        ul(['ארוחה לא מערבבת בשר וחלב. אי אפשר לשמור ארוחה כזו.', 'בשר ודג באותה ארוחה: אזהרה.', 'אחרי בשרי מחכים שעתיים לפני חלבי (ניתן לשינוי בהגדרות). אחרי חלבי שוטפים את הפה ואפשר בשרי.', 'שייק אחרי אימון כשאכלת בשר לפני פחות משעתיים: חלבון סויה (פרווה), "האפשרות הבאה הכי טובה" לפי ה-Bible.', 'תוספים: לבדוק הכשר (אומגה 3 וג\'לטין בכמוסות).']),
      )}
      {sec('tips', '7 הטיפים', ul(SEVEN_TIPS))}
      {sec(
        'water',
        'שתייה ומשקאות ביתיים',
        <>
          {ul(HYDRATION)}
          {DIY_DRINKS.map((d) => (
            <div key={d.name} className="small mt">
              <b>{d.name}:</b> {d.recipe}. <span className="muted">{d.why}</span>
            </div>
          ))}
          {ul(DRINKS_WARNINGS)}
        </>,
      )}
      {sec('match', 'יום משחק', ul(MATCH_DAY_RULES))}
      {sec(
        'prematch',
        '10 ארוחות לפני משחק',
        <>
          {PRE_MATCH_MEALS.map((m) => (
            <div key={m.name} className="small" style={{ marginBottom: 6 }}>
              <b>{m.name}</b>
              <div className="xs muted">{m.note}</div>
            </div>
          ))}
          <div className="small mt">
            <b>נשנוש לפני:</b> {PRE_MATCH_SNACKS.join(', ')}
          </div>
          <div className="small">
            <b>במחצית:</b> {HALF_TIME_SNACKS.join(', ')}
          </div>
        </>,
      )}
      {sec('post', 'אחרי משחק', ul(POST_MATCH))}
      {sec(
        'sched',
        'לו"ז אכילה לפי שעת המשחק',
        <>
          {(
            [
              ['morning', 'משחק בבוקר'],
              ['afternoon', 'משחק אחר הצהריים'],
              ['evening', 'משחק בערב'],
            ] as const
          ).map(([k, l]) => (
            <div key={k} className="mt">
              <b className="small">{l}</b>
              {ul(EATING_SCHEDULES[k])}
            </div>
          ))}
        </>,
      )}
      {sec(
        'supp',
        'תוספים',
        <>
          {ul(SUPPLEMENT_RULES)}
          {SUPPLEMENTS.map((x) => (
            <div key={x.name} className="small mt">
              <b className="ltr">{x.name}</b>: {x.text}
            </div>
          ))}
        </>,
      )}
      {sec('videos', 'סרטוני תזונה', <VideoLinks videos={NUTRITION_COACHING} />)}
    </>
  );
}
