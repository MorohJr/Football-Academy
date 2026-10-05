import { useState } from 'react';
import { ARTICLES, LIB_CAT_HE, SLEEP_TIPS, type LibCat } from '../../content/library';
import { Empty, Page } from '../components/common';

/** Bible library (SPEC screen 13): titles + short Hebrew summaries. */
export function LibraryScreen() {
  const [cat, setCat] = useState<LibCat | 'all'>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const ql = q.trim().toLowerCase();
  const list = ARTICLES.filter((a) => (cat === 'all' || a.cat === cat) && (!ql || a.he.includes(q.trim()) || a.title.toLowerCase().includes(ql) || a.points.some((p) => p.includes(q.trim()))));
  return (
    <Page title="ספרייה" kicker="The Football Fitness Bible" sub={`${ARTICLES.length} מאמרים · תקציר בעברית`}>
      <input className="input" placeholder="חיפוש (למשל: שינה, ירך אחורית, קריאטין)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips mt">
        {(['all', ...Object.keys(LIB_CAT_HE)] as (LibCat | 'all')[]).map((c) => (
          <button key={c} type="button" className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
            {c === 'all' ? 'הכול' : LIB_CAT_HE[c]}
          </button>
        ))}
      </div>
      {(cat === 'all' || cat === 'recovery') && !ql && (
        <div className="card mt" style={{ borderInlineStart: '4px solid var(--g1)' }}>
          <div className="ch">
            המלצות שינה <span>Bible עמ' 140</span>
          </div>
          <ul className="clean small">
            {SLEEP_TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {list.map((a) => (
        <div key={a.n} className="card">
          <div className="tap" onClick={() => setOpen(open === a.n ? null : a.n)}>
            <div className="b small">{a.he}</div>
            <div className="xs muted ltr" style={{ textAlign: 'start' }}>
              {a.title} · p.{a.page}
            </div>
          </div>
          {open === a.n && (
            <ul className="clean small mt">
              {a.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {!list.length && <Empty>לא נמצא.</Empty>}
      <p className="xs muted">תקצירים במילים שלנו. הספר המלא נמצא אצלך בחבילת Matchfit.</p>
    </Page>
  );
}
