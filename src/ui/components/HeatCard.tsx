// R-HEAT: heat-season card on the dashboard, with the hot-day guide.
import { useState } from 'react';
import { HEAT_GUIDE, HEAT_SOURCE, HEAT_TIPS } from '../../content/heat';
import { go } from '../router';
import { Modal } from './common';

export function HeatGuideList({ ids }: { ids?: string[] }) {
  return (
    <>
      {HEAT_GUIDE.filter((s) => !ids || ids.includes(s.id)).map((s) => (
        <div key={s.id} className={`card ${s.id === 'danger' ? 'danger' : ''}`}>
          <div className="ch">{s.title}</div>
          <ul className="clean">
            {s.items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      ))}
      <p className="xs muted">{HEAT_SOURCE}</p>
    </>
  );
}

export function HeatCard({ acclim }: { acclim: { day: number; pct: number } | null }) {
  const [hot, setHot] = useState(false);
  return (
    <div className="card warn">
      <div className="ch" style={{ color: 'var(--warn)' }}>
        ☀️ עונת החום
        {acclim && <span>הסתגלות לחום: יום {acclim.day} מתוך 14</span>}
      </div>
      {acclim && <div className="small b mb">היום כ-{acclim.pct}% מהנפח הרגיל באימוני המגרש (פחות סטים, מנוחות ארוכות יותר).</div>}
      <ul className="clean small">
        {HEAT_TIPS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="row mt">
        <button type="button" className="btn sm" onClick={() => setHot(true)}>
          היום שרבי
        </button>
        <button type="button" className="btn ghost sm" onClick={() => go('/injury/heat')}>
          המדריך המלא
        </button>
      </div>
      <Modal open={hot} onClose={() => setHot(false)} title="יום שרבי: מה עושים">
        <HeatGuideList ids={['hot', 'drink', 'danger']} />
      </Modal>
    </div>
  );
}
