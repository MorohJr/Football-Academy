import { useState, type ReactNode } from 'react';
import { INSEASON_GUIDELINES, INSEASON_WORKOUTS, FATIGUE_TYPES } from '../../content/inseason';
import { PRESEASON_DAYS, PRESEASON_EQUIPMENT, PRESEASON_NOTES } from '../../content/preseason';
import { BODYWEIGHT_AUDIO, BODYWEIGHT_BENEFITS, BODYWEIGHT_NOTES, BODYWEIGHT_WORKOUTS, DYNAMIC_WARMUP, SPEED_COACHING, SPEED_NOTES, SPEED_WORKOUTS, STAMINA_ADAPTATIONS, STAMINA_COACHING, STAMINA_NOTES, STAMINA_TYPES, STAMINA_WORKOUTS } from '../../content/boosters';
import { CORE_PAIRS, PUSH_LEVELS, PUSHCORE_PLACEMENT } from '../../content/pushcore';
import { weakFootWorkout } from '../../content/weakfoot';
import { getWorkout } from '../../content';
import type { Workout } from '../../content/types';
import { PROGRAMME_HE } from '../../domain/season';
import { fmtDateFull, HRow, Page, VideoLinks } from '../components/common';
import { Icon } from '../components/Icon';
import { useNow, useSettings } from '../hooks';
import { CATEGORY_HE } from '../labels';
import { go } from '../router';

// ---------------------------------------------------------------- more
function Link({ to, icon, title, sub }: { to: string; icon: string; title: string; sub: string }) {
  return (
    <div className="wrow tap" onClick={() => go(to)}>
      <span className="ico">
        <Icon name={icon} size="sm" />
      </span>
      <div className="grow">
        <div className="ttl">{title}</div>
        <div className="meta">{sub}</div>
      </div>
      <Icon name="chev" size="sm" />
    </div>
  );
}

export function MoreScreen() {
  const s = useSettings();
  const now = useNow(60_000);
  const backupDays = s?.lastBackupAt ? Math.floor((now - Date.parse(s.lastBackupAt)) / 86_400_000) : null;
  return (
    <Page title="עוד" kicker="Football Academy">
      {s && (backupDays == null || backupDays > 14) && (
        <div className="warnbox tap" onClick={() => go('/backup')}>
          {backupDays == null ? 'עוד לא עשית גיבוי.' : `הגיבוי האחרון לפני ${backupDays} ימים.`} הנתונים שמורים רק בטלפון. גיבוי ›
        </div>
      )}
      <HRow title="משחק וגוף" />
      <Link to="/games" icon="ball" title="המשחקים שלי" sub="סטטיסטיקה, ניתוחים וגרפים" />
      <Link to="/pitches" icon="location" title="מגרשים" sub="משטח ונעליים" />
      <Link to="/tests" icon="chart" title="בדיקות כושר ויעדי כוח" sub="10 בדיקות · 1RM" />
      <Link to="/body" icon="heart" title="גוף" sub="משקל, מדידות, אחוז שומן, עקיצות" />
      <HRow title="אימון וידע" />
      <Link to="/programs" icon="week" title="התוכניות" sub="פרה-עונה, עונה, מהירות, סטמינה, משקל גוף ותוספות" />
      <Link to="/injury" icon="shield" title="מניעת פציעות ושיקום" sub="4 אימונים, שגרות, 24 סרטוני שיקום" />
      <Link to="/mind" icon="brain" title="מיינדסט" sub="41 שיעורים, האזנה חוזרת, דפי עבודה" />
      <Link to="/library" icon="book" title="ספרייה" sub="95 מאמרי ה-Bible בתקציר" />
      <Link to="/review" icon="week" title="סיכום שבועי" sub="השבוע שעבר, השבוע הזה, 3 מטרות" />
      <HRow title="אפליקציה" />
      <Link to="/settings" icon="settings" title="הגדרות" sub="פרופיל, משחק שבועי, תזונה, מראה, תוספות" />
      <Link to="/intro" icon="book" title="איך משתמשים" sub="ההסבר של ההתחלה, שוב" />
      <Link to="/backup" icon="download" title="גיבוי ושחזור" sub={s?.lastBackupAt ? `אחרון: ${fmtDateFull(s.lastBackupAt.slice(0, 10))}` : 'עוד לא גובה'} />
    </Page>
  );
}

// ---------------------------------------------------------------- programmes
const PROGS = [
  { id: 'preseason', he: PROGRAMME_HE.preseason, sub: '70 יום · 10 שבועות' },
  { id: 'inseason', he: PROGRAMME_HE.inseason, sub: '10 שבועות · משחק בשבוע' },
  { id: 'speed', he: PROGRAMME_HE.speed, sub: '4 שבועות · 3 ימים' },
  { id: 'stamina', he: PROGRAMME_HE.stamina, sub: '4 שבועות · 4 ימים' },
  { id: 'bodyweight', he: PROGRAMME_HE.bodyweight, sub: '4 שבועות · משקל גוף ויוגה' },
  { id: 'injury', he: 'מניעת פציעות ושיקום', sub: 'כל השנה' },
  { id: 'pushcore', he: 'שכיבות סמיכה וליבה', sub: 'תוספת (R-PC)' },
  { id: 'weakfoot', he: 'רגל חלשה ונגיעה ראשונה', sub: 'תוספת (R-WKF)' },
] as const;

function WList({ list }: { list: Workout[] }) {
  return (
    <>
      {list.map((w) => (
        <div key={w.id} className="wrow tap" onClick={() => go(`/w/${w.id}`)}>
          <div className="grow">
            <div className="ttl ltr" style={{ textAlign: 'start' }}>
              {w.title}
            </div>
            <div className="meta">
              {w.subtitle ?? CATEGORY_HE[w.category]}
              {w.durationMin ? ` · ${w.durationMin} דק'` : ''}
            </div>
          </div>
          <div className="when">›</div>
        </div>
      ))}
    </>
  );
}

const Notes = ({ items }: { items: readonly string[] }) => (
  <ul className="clean small">
    {items.map((x) => (
      <li key={x}>{x}</li>
    ))}
  </ul>
);

function Fold({ title, children, open: initial = false }: { title: string; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="card">
      <div className="ch tap" onClick={() => setOpen(!open)}>
        {title} <span>{open ? '−' : '+'}</span>
      </div>
      {open && children}
    </div>
  );
}

export function ProgramsScreen({ prog }: { prog?: string }) {
  const p = PROGS.find((x) => x.id === prog);
  if (prog === 'injury') {
    go('/injury');
    return null;
  }
  if (!p) {
    return (
      <Page title="התוכניות" kicker="Matchfit MESSI-N" sub="כל האימונים, לעיון">
        {PROGS.map((x) => (
          <div key={x.id} className="wrow tap" onClick={() => go(x.id === 'injury' ? '/injury' : `/programs/${x.id}`)}>
            <div className="grow">
              <div className="ttl">{x.he}</div>
              <div className="meta">{x.sub}</div>
            </div>
            <div className="when">›</div>
          </div>
        ))}
      </Page>
    );
  }
  return (
    <Page title={p.he} kicker="תוכנית" sub={p.sub} backTo="/programs" sub2>
      {p.id === 'preseason' && <Preseason />}
      {p.id === 'inseason' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={INSEASON_GUIDELINES} />
          </Fold>
          <Fold title="4 סוגי עייפות">
            {FATIGUE_TYPES.map((f) => (
              <div key={f.name} className="small">
                <b>{f.name}:</b> {f.text}
              </div>
            ))}
          </Fold>
          <HRow title="אימונים" meta={`${INSEASON_WORKOUTS.length}`} />
          <WList list={INSEASON_WORKOUTS} />
        </>
      )}
      {p.id === 'speed' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={SPEED_NOTES} />
            <VideoLinks videos={[DYNAMIC_WARMUP, ...SPEED_COACHING]} />
          </Fold>
          <WList list={SPEED_WORKOUTS} />
        </>
      )}
      {p.id === 'stamina' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={STAMINA_NOTES} />
            {STAMINA_TYPES.map((t) => (
              <div key={t.name} className="small mt">
                <b className="ltr">{t.name}:</b> {t.text}
              </div>
            ))}
            <VideoLinks videos={STAMINA_COACHING} />
          </Fold>
          <Fold title="מה משתפר">
            <Notes items={STAMINA_ADAPTATIONS} />
          </Fold>
          <WList list={STAMINA_WORKOUTS} />
        </>
      )}
      {p.id === 'bodyweight' && (
        <>
          <Fold title="הנחיות" open>
            <Notes items={BODYWEIGHT_NOTES} />
            <VideoLinks videos={BODYWEIGHT_AUDIO} />
          </Fold>
          <Fold title="יתרונות">
            <Notes items={BODYWEIGHT_BENEFITS} />
          </Fold>
          <WList list={BODYWEIGHT_WORKOUTS} />
        </>
      )}
      {p.id === 'pushcore' && (
        <>
          <Fold title="5 רמות שכיבות (לפי בדיקת השכיבות)" open>
            {PUSH_LEVELS.map((l) => (
              <div key={l.level} className="small" style={{ marginBottom: 4 }}>
                <b>
                  {l.level}. {l.he}
                </b>{' '}
                <span className="xs muted">(מ-{l.fromMax} שכיבות)</span>
                <div className="xs muted">{l.cue}</div>
              </div>
            ))}
          </Fold>
          <Fold title="איפה זה בכל תקופה">
            {Object.entries(PUSHCORE_PLACEMENT).map(([k, v]) => (
              <div key={k} className="small" style={{ marginBottom: 4 }}>
                <b>{PROGRAMME_HE[k as keyof typeof PROGRAMME_HE]}:</b> {v.he}
              </div>
            ))}
          </Fold>
          <HRow title="3 זוגות ליבה" meta="מתחלפים" />
          {CORE_PAIRS.map((c) => (
            <div key={c.id} className="wrow tap" onClick={() => go(`/w/pc-${c.id}`)}>
              <div className="grow">
                <div className="ttl">זוג {c.id}</div>
                <div className="meta">
                  {c.focus} · <span className="ltr">{c.ex.map((e) => e.name).join(' + ')}</span>
                </div>
              </div>
              <div className="when">›</div>
            </div>
          ))}
        </>
      )}
      {p.id === 'weakfoot' && <WList list={[weakFootWorkout]} />}
    </Page>
  );
}

function Preseason() {
  return (
    <>
      <Fold title="הנחיות" open>
        <Notes items={PRESEASON_NOTES} />
      </Fold>
      <Fold title="ציוד">
        <div className="small">
          <b>מגרש:</b> {PRESEASON_EQUIPMENT.pitch.join(', ')}
        </div>
        <div className="small">
          <b>חדר כושר / בית:</b> {PRESEASON_EQUIPMENT.gym.join(', ')}
        </div>
      </Fold>
      {Array.from({ length: 10 }, (_, wk) => (
        <div key={wk}>
          <HRow title={`שבוע ${wk + 1}`} />
          {PRESEASON_DAYS.slice(wk * 7, wk * 7 + 7).map((d) => {
            const w = d.sessions[0] ? getWorkout(d.sessions[0].workoutId) : undefined;
            return (
              <div key={d.day} className={`wrow ${w ? 'tap' : ''}`} onClick={() => w && go(`/w/${w.id}`)}>
                <div className="when">יום {d.day}</div>
                <div className="grow">
                  <div className="ttl ltr" style={{ textAlign: 'start' }}>
                    {w ? w.title : 'מנוחה'}
                  </div>
                  {w?.subtitle && <div className="meta">{w.subtitle}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- settings
