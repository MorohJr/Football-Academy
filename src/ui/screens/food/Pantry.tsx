import { useCallback, useState } from 'react';
import { db } from '../../../db/db';
import { CATEGORY_HE, type PantryCategory } from '../../../content/pantry';
import { KOSHER_HE, stockLevel, type Kosher } from '../../../domain/nutrition';
import type { PantryItem } from '../../../domain/schemas';
import { productByBarcode } from '../../../services/barcode';
import { restock } from '../../../services/pantry';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { ConfirmButton, Empty, HRow, KosherBadge, NumInput, Page, Seg, useToast } from '../../components/common';
import { go, replace } from '../../router';
import { useLive } from '../../hooks';
import { CATS, now, uid, UNIT_HE } from './shared';

const LEVEL_COLOR = { ok: 'var(--g1)', low: 'var(--warn)', out: 'var(--danger)' } as const;

export function Pantry() {
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
