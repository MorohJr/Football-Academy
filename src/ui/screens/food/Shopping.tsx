import { useState } from 'react';
import { db } from '../../../db/db';
import { CATEGORY_HE } from '../../../content/pantry';
import { shoppingNeeds } from '../../../domain/nutrition';
import type { PantryItem } from '../../../domain/schemas';
import { restock } from '../../../services/pantry';
import { Empty, HRow, Modal, NumInput, useToast } from '../../components/common';
import { useLive } from '../../hooks';
import { CATS, now, uid, UNIT_HE } from './shared';

export function Shopping() {
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
