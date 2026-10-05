import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { VideoLink } from '../../content/types';
import { KOSHER_HE, type Kosher } from '../../domain/nutrition';
import { openLink } from '../../services/platform';
import { back } from '../router';
import { Icon } from './Icon';

export const CHALK = (
  <svg className="chalk" viewBox="0 0 320 120" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
    <rect x="2" y="2" width="316" height="116" />
    <line x1="160" y1="2" x2="160" y2="118" />
    <circle cx="160" cy="60" r="26" />
    <rect x="2" y="32" width="36" height="56" />
    <rect x="282" y="32" width="36" height="56" />
  </svg>
);

/** Grass header + white sheet (SPEC 15.5 "classic"). */
export function Page({ title, kicker, sub, backTo, actions, children, sub2 = false }: { title: ReactNode; kicker?: ReactNode; sub?: ReactNode; backTo?: string | true; actions?: ReactNode; children: ReactNode; sub2?: boolean }) {
  return (
    <div className={`screen ${sub2 ? 'sub' : ''}`}>
      <header className="grass ghead">
        {CHALK}
        {backTo && (
          <button type="button" className="back" onClick={() => back(typeof backTo === 'string' ? backTo : '/')}>
            <Icon name="chevR" size="sm" /> חזרה
          </button>
        )}
        {kicker && <div className="k">{kicker}</div>}
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
        {actions && <div className="acts">{actions}</div>}
      </header>
      <main className="sheet">{children}</main>
    </div>
  );
}

export function HRow({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <div className="hrow">
      <span className="h">{title}</span>
      {meta && <span className="hm">{meta}</span>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="backdrop" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: 10 }}>
          {title ? <h3 style={{ margin: 0 }}>{title}</h3> : <span />}
          <button type="button" aria-label="סגור" onClick={onClose} style={{ padding: 6 }}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- toast ----------
interface ToastMsg {
  text: string;
  undo?: () => void;
}
const ToastCtx = createContext<(m: ToastMsg | string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: ToastMsg | string) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(typeof m === 'string' ? { text: m } : m);
    timer.current = setTimeout(() => setMsg(null), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status">
          <span>{msg.text}</span>
          {msg.undo && (
            <button
              type="button"
              onClick={() => {
                msg.undo!();
                setMsg(null);
              }}
            >
              בטל
            </button>
          )}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

// ---------- inputs ----------
export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Scale({ value, from = 1, to = 5, onChange }: { value: number | null; from?: number; to?: number; onChange: (v: number) => void }) {
  const items = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <div className="scale">
      {items.map((n) => (
        <button key={n} type="button" className={value === n ? 'on' : ''} onClick={() => onChange(n)} aria-label={String(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ value, tabs, onChange }: { value: T; tabs: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.v} type="button" role="tab" aria-selected={value === t.v} className={value === t.v ? 'on' : ''} onClick={() => onChange(t.v)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function NumInput({ value, onChange, step = 1, placeholder, min }: { value: number | null; onChange: (v: number | null) => void; step?: number; placeholder?: string; min?: number }) {
  return (
    <input
      className="input ltr"
      inputMode="decimal"
      type="number"
      step={step}
      min={min}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Number(v));
      }}
    />
  );
}

export function Meter({ value, max, over = false }: { value: number; max: number; over?: boolean }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`meter ${over && value > max ? 'over' : ''}`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

const KB: Record<Kosher | 'mixed', string> = { meat: 'ב', dairy: 'ח', parve: 'פ', fish: 'ד', mixed: '!' };
export function KosherBadge({ k }: { k: Kosher | 'mixed' }) {
  return (
    <span className={`badge b-${k}`} title={k === 'mixed' ? 'בשר וחלב' : KOSHER_HE[k]}>
      {KB[k]}
    </span>
  );
}

/** Videos are links only (E6). External = YouTube added where Matchfit has none/wrong (SPEC 12). */
export function VideoLinks({ videos, compact = false }: { videos?: VideoLink[]; compact?: boolean }) {
  if (!videos?.length) return null;
  return (
    <div className="chips" style={{ marginTop: compact ? 0 : 6 }}>
      {videos.map((v, i) => (
        <button key={i} type="button" className={`chip ${v.external ? 'ext' : ''}`} onClick={() => openLink(v.url)} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <Icon name="play" size="xs" /> {v.label}
          {v.external && <span className="xs">(יוטיוב · לא מ-Matchfit)</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

/** A button that asks once more before doing something destructive. */
export function ConfirmButton({ label, confirm, onConfirm, className = 'btn ghost sm' }: { label: string; confirm: string; onConfirm: () => void; className?: string }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <span className="row">
      <button type="button" className="btn danger sm" onClick={onConfirm}>
        {confirm}
      </button>
      <button type="button" className="btn ghost sm" onClick={() => setAsk(false)}>
        ביטול
      </button>
    </span>
  ) : (
    <button type="button" className={className} onClick={() => setAsk(true)}>
      {label}
    </button>
  );
}

export const fmtDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const fmtDateFull = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
export const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const DAYS_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
