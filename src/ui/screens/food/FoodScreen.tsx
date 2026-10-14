import { useState } from 'react';
import { db } from '../../../db/db';
import { SLOT_HE, type MealSlot } from '../../../content/pantry';
import { DAY_TYPE_HE, proteinPerKg } from '../../../domain/nutrition';
import type { FoodLog, Meal, PantryItem } from '../../../domain/schemas';
import { adaptiveEstimate, dairyFrom, foodContext, foodDay, kosherNow } from '../../../services/food';
import { updateSettings } from '../../../services/entity';
import { eatItem, eatMeal, mealValues, undoFoodLog } from '../../../services/pantry';
import { ConfirmButton, Empty, fmtDate, HRow, KosherBadge, Meter, Modal, NumInput, Page, Seg, Tabs, useToast } from '../../components/common';
import { go, replace } from '../../router';
import { hmToMin, nowHm, useLive, useSettings, useToday } from '../../hooks';
import { kosherText, SLOTS, TimeField, UNIT_HE } from './shared';
import { Pantry } from './Pantry';
import { Meals } from './Meals';
import { Shopping } from './Shopping';
import { FoodCharts } from './FoodCharts';
import { Guide } from './Guide';

type Tab = 'today' | 'pantry' | 'meals' | 'shop' | 'charts' | 'guide';
const TABS: { v: Tab; label: string }[] = [
  { v: 'today', label: 'היום' },
  { v: 'pantry', label: 'מזווה' },
  { v: 'meals', label: 'ארוחות' },
  { v: 'shop', label: 'קניות' },
  { v: 'charts', label: 'גרפים' },
  { v: 'guide', label: 'מדריך' },
];

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

/** R-NUT-1a: the 14-day estimate, offered as a suggestion. */
function AdaptiveNote({ adaptive, formula, today }: { adaptive: Awaited<ReturnType<typeof adaptiveEstimate>>; formula: number | null; today: string }) {
  const toast = useToast();
  if (!adaptive) return null;
  const r = adaptive.result;
  if (!r.ok)
    return (
      <div className="xs muted mt">
        התאמה לפי המציאות: צריך 14 יום עם רישום אוכל ({r.loggedDays}/10 ימים) ושקילות ({r.weighIns}/4, לאורך 10 ימים לפחות).
      </div>
    );
  if (!adaptive.offer) return null;
  return (
    <div className="okbox">
      לפי 14 הימים האחרונים התחזוקה שלך כ-<b>{r.kcal}</b> קק"ל (הנוסחה: {formula}). אכלת בממוצע {r.avgIntake}, והמשקל {r.kgPerWeek <= 0 ? 'ירד' : 'עלה'} {Math.abs(r.kgPerWeek)} ק"ג בשבוע.
      <div className="row mt">
        <button
          type="button"
          className="btn sm"
          onClick={async () => {
            await updateSettings({ maintenanceOverride: { kcal: r.kcal, date: today } });
            toast('היעדים חושבו מחדש');
          }}
        >
          השתמש בזה
        </button>
      </div>
    </div>
  );
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
    const day = foodDay(today, ctx);
    const adaptive = await adaptiveEstimate(day, ctx.weighIns, today);
    return { day, logs, adaptive };
  }, [s, today]);
  if (!s || !data) return null;
  const { day, logs, adaptive } = data;
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
              תחזוקה {day.maintenance} קק"ל{day.source === 'override' ? ` (לפי המציאות, ${fmtDate(s.maintenanceOverride!.date)})` : ' (נוסחה)'}
              {t.deficit ? ` · גירעון ${t.deficit}` : ' · בלי גירעון היום'} · חלבון {proteinPerKg(day.mode)} ג'/ק"ג · שתייה {t.waterL} ליטר לפחות
            </div>
            <AdaptiveNote adaptive={adaptive} formula={day.formula} today={today} />
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
