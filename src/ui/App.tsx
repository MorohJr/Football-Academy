import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ensureSeed, getSettings } from '../services/entity';
import { ensureGames } from '../services/plan';
import { requestPersistentStorage } from '../services/platform';
import { ToastProvider } from './components/common';
import { Icon } from './components/Icon';
import { useToday } from './hooks';
import { go, useRoute } from './router';
import { BodyScreen } from './screens/BodyScreen';
import { FoodScreen, MealScreen, PantryItemScreen } from './screens/FoodScreens';
import { AnalysisScreen, GameModeScreen, GameScreen, GamesScreen, PitchesScreen } from './screens/GameScreens';
import { InjuryScreen } from './screens/InjuryScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { MindScreen, WorksheetScreen } from './screens/MindScreens';
import { BackupScreen, MoreScreen, ProgramsScreen, SettingsScreen } from './screens/MoreScreens';
import { ReviewScreen } from './screens/ReviewScreen';
import { DayScreen, SeasonScreen, WeekScreen } from './screens/WeekScreens';
import { TestsScreen, TestWizard } from './screens/TestScreens';
import { TodayScreen } from './screens/TodayScreen';
import { TrackScreen } from './screens/TrackScreen';
import { RunScreen, WorkoutScreen } from './screens/WorkoutScreens';

const TABS = [
  { id: '', label: 'היום', icon: 'ball' },
  { id: 'week', label: 'שבוע', icon: 'week' },
  { id: 'track', label: 'מעקב', icon: 'chart' },
  { id: 'food', label: 'תזונה', icon: 'food' },
  { id: 'more', label: 'עוד', icon: 'more' },
];
const MAIN = new Set(['', 'week', 'track', 'food', 'more', 'games', 'body', 'mind', 'injury', 'library', 'season', 'tests', 'programs']);
const OWNER: Record<string, string> = { games: 'more', body: 'more', mind: 'more', injury: 'more', library: 'more', season: 'week', tests: 'more', programs: 'more' };

function screenFor(r: string[]): ReactNode {
  const [a = '', b, c] = r;
  switch (a) {
    case '':
      return <TodayScreen />;
    case 'w':
      return <WorkoutScreen id={b!} />;
    case 'run':
      return <RunScreen id={b!} />;
    case 'day':
      return <DayScreen date={b!} />;
    case 'week':
      return <WeekScreen />;
    case 'season':
      return <SeasonScreen />;
    case 'track':
      return <TrackScreen tab={b} />;
    case 'tests':
      return b === 'new' ? <TestWizard /> : <TestsScreen />;
    case 'games':
      return <GamesScreen />;
    case 'game':
      return <GameScreen id={b!} />;
    case 'gamemode':
      return <GameModeScreen id={b!} />;
    case 'analysis':
      return <AnalysisScreen gameId={b!} />;
    case 'pitches':
      return <PitchesScreen />;
    case 'food':
      if (b === 'meal') return <MealScreen id={c!} />;
      if (b === 'item') return <PantryItemScreen id={c!} />;
      return <FoodScreen tab={b} />;
    case 'body':
      return <BodyScreen tab={b} />;
    case 'mind':
      return <MindScreen tab={b} />;
    case 'sheet':
      return <WorksheetScreen kind={b!} id={c} />;
    case 'injury':
      return <InjuryScreen tab={b} />;
    case 'library':
      return <LibraryScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'programs':
      return <ProgramsScreen prog={b} />;
    case 'more':
      return <MoreScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'backup':
      return <BackupScreen />;
    default:
      return <TodayScreen />;
  }
}

export function App() {
  const [ready, setReady] = useState(false);
  const route = useRoute();
  const today = useToday();
  const lastDay = useRef('');

  useEffect(() => {
    void (async () => {
      await ensureSeed();
      setReady(true);
      void requestPersistentStorage();
    })();
  }, []);

  // R-GAM-1: this week's and next week's game exist (again when the date changes).
  useEffect(() => {
    if (!ready || lastDay.current === today) return;
    lastDay.current = today;
    void getSettings().then((s) => ensureGames(today, s));
  }, [ready, today]);

  if (!ready) return null;
  const top = route[0] ?? '';
  const main = MAIN.has(top) && route.length <= 2;
  const active = OWNER[top] ?? top;
  return (
    <ToastProvider>
      <div className="app">
        <UpdateBanner />
        {screenFor(route)}
        {main && (
          <nav className="nav" aria-label="ניווט ראשי">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={`#/${t.id}`}
                className={active === t.id ? 'on' : ''}
                aria-current={active === t.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(`/${t.id}`);
                }}
              >
                <span className="dot">
                  <Icon name={t.icon} size="sm" />
                </span>
                {t.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </ToastProvider>
  );
}

/** Update only when the user taps, so a reload never interrupts a workout. */
function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="update" role="status">
      <span className="grow">
        <b>גרסה חדשה זמינה</b> · הנתונים שלך לא ייפגעו
      </span>
      <button type="button" className="btn sm" style={{ background: '#fff', color: 'var(--g2)' }} onClick={() => void updateServiceWorker(true)}>
        עדכן
      </button>
      <button type="button" aria-label="סגור" onClick={() => setNeedRefresh(false)} style={{ color: '#fff' }}>
        <Icon name="x" size="sm" />
      </button>
    </div>
  );
}
