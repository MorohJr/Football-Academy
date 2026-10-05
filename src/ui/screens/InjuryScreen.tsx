import { useState } from 'react';
import { db } from '../../db/db';
import { INJURY_CAUSES, INJURY_FACTS, INJURY_WORKOUTS, IP_EQUIPMENT, IP_TIMING, REHAB_VIDEOS } from '../../content/injury';
import { YOGA } from '../../content/boosters';
import type { Workout } from '../../content/types';
import { Empty, HRow, Page, Tabs, VideoLinks } from '../components/common';
import { useLive } from '../hooks';
import { go, replace } from '../router';
import { AREA_HE } from './body-areas';

type Tab = 'workouts' | 'timing' | 'rehab' | 'about';

/** Injury prevention & rehab (SPEC 5.6). */
export function InjuryScreen({ tab }: { tab?: string }) {
  const t = (['workouts', 'timing', 'rehab', 'about'].includes(tab ?? '') ? tab : 'workouts') as Tab;
  return (
    <Page title="מניעת פציעות ושיקום" kicker="Injury Prevention & Rehab" sub="כל השנה, בכל תקופה">
      <Tabs value={t} tabs={[{ v: 'workouts', label: 'אימונים' }, { v: 'timing', label: 'מתי' }, { v: 'rehab', label: 'שיקום' }, { v: 'about', label: 'למה' }]} onChange={(v) => replace(`/injury/${v}`)} />
      {t === 'workouts' && <Workouts />}
      {t === 'timing' && <Timing />}
      {t === 'rehab' && <Rehab />}
      {t === 'about' && <About />}
    </Page>
  );
}

function WRow({ w }: { w: Workout }) {
  return (
    <div className="wrow tap" onClick={() => go(`/w/${w.id}`)}>
      <div className="grow">
        <div className="ttl ltr" style={{ textAlign: 'start' }}>
          {w.title}
        </div>
        <div className="meta">
          {w.subtitle}
          {w.durationMin ? ` · ${w.durationMin} דק'` : ''}
        </div>
      </div>
      <div className="when">›</div>
    </div>
  );
}

function Workouts() {
  const ip = INJURY_WORKOUTS.filter((w) => /^ip\d$/.test(w.id));
  const routines = INJURY_WORKOUTS.filter((w) => !/^ip\d$/.test(w.id));
  return (
    <>
      <HRow title="4 אימוני מניעה" meta="סופרסטים, בלי מנוחה · מסתובבים כל העונה" />
      {ip.map((w) => (
        <WRow key={w.id} w={w} />
      ))}
      <HRow title="שגרות" />
      {routines.map((w) => (
        <WRow key={w.id} w={w} />
      ))}
      <HRow title="יוגה" />
      {YOGA.map((w) => (
        <WRow key={w.id} w={w} />
      ))}
    </>
  );
}

function Timing() {
  const slots = [...new Set(IP_TIMING.flatMap((r) => r.when))];
  return (
    <>
      <p className="small muted" style={{ marginTop: 0 }}>
        מתי כל שגרה מתאימה (טבלת התזמון של התוכנית).
      </p>
      {slots.map((s) => (
        <div key={s} className="card">
          <div className="ch">{s}</div>
          <div className="chips">
            {IP_TIMING.filter((r) => r.when.includes(s)).map((r) => (
              <span key={r.routine} className="chip">
                {r.routine}
              </span>
            ))}
          </div>
        </div>
      ))}
      <p className="xs muted">היום והשבוע כבר משבצים את השגרות לפי התוכנית והמשחק.</p>
    </>
  );
}

function Rehab() {
  const [q, setQ] = useState('');
  const open = useLive(() => db.niggles.filter((n) => !n.closed).toArray(), []);
  const list = REHAB_VIDEOS.filter((v) => !q || v.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="warnbox" style={{ marginTop: 0 }}>
        לא מחליף פיזיותרפיסט. כאב חד, נפיחות, קליק עם כאב או עקיצה שלא עוברת: לפנות לבדיקה.
      </div>
      {open && open.length > 0 && (
        <div className="card">
          <div className="ch">
            עקיצות פעילות <span>{open.length}</span>
          </div>
          {open.map((n) => (
            <div key={n.id} className="small">
              {AREA_HE[n.area]} · עוצמה {n.intensity}
            </div>
          ))}
          <button type="button" className="linkbtn" onClick={() => go('/body/niggles')}>
            ליומן העקיצות ›
          </button>
        </div>
      )}
      <input className="input mt" placeholder="חיפוש פציעה" value={q} onChange={(e) => setQ(e.target.value)} />
      <HRow title={`${REHAB_VIDEOS.length} פציעות נפוצות`} />
      <VideoLinks videos={list} />
      {!list.length && <Empty>לא נמצא.</Empty>}
    </>
  );
}

function About() {
  return (
    <>
      <HRow title="9 גורמי פציעה" />
      <ul className="clean small">
        {INJURY_CAUSES.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <HRow title="עובדות" />
      <ul className="clean small">
        {INJURY_FACTS.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <HRow title="ציוד" meta="יש לך הכול בבית" />
      <div className="chips">
        {IP_EQUIPMENT.map((x) => (
          <span key={x} className="chip">
            {x}
          </span>
        ))}
      </div>
    </>
  );
}
