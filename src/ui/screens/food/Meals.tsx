import { useMemo, useState } from 'react';
import { db } from '../../../db/db';
import { SLOT_HE, type MealSlot } from '../../../content/pantry';
import { KOSHER_HE, meatAndFish, type Kosher } from '../../../domain/nutrition';
import type { Meal, PantryItem } from '../../../domain/schemas';
import { eatMeal, mealValues } from '../../../services/pantry';
import { ConfirmButton, Empty, HRow, KosherBadge, NumInput, Page, useToast } from '../../components/common';
import { go } from '../../router';
import { nowHm, useLive, useToday } from '../../hooks';
import { now, SLOTS, uid, UNIT_HE } from './shared';

export function Meals() {
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
