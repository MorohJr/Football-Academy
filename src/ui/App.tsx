import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ensureSeed, getSettings } from '../services/entity';
import { ensureGames } from '../services/plan';
import { dropStaleRun } from '../services/runs';
import { installAudioUnlock, requestPersistentStorage } from '../services/platform';
import { ToastProvider } from './components/common';
import { Icon } from './components/Icon';
import { useSettings, useToday } from './hooks';
import { back, go, useRoute } from './router';
import { IntroScreen, Onboarding } from './screens/Onboarding';
import { DayScreen, SeasonScreen, WeekScreen } from './screens/WeekScreens';
import { TodayScreen } from './screens/TodayScreen';
import { RunScreen } from './screens/RunScreen';
import { WorkoutScreen } from './screens/WorkoutScreens';

// SPEC 16.3: heavy screens (and the charts they use) load on demand. Today and workout mode stay in the main bundle.
const TrackScreen = lazy(() => import('./screens/TrackScreen').then((m) => ({ default: m.TrackScreen })));
const FoodScreen = lazy(() => import('./screens/food/FoodScreen').then((m) => ({ default: m.FoodScreen })));
const MealScreen = lazy(() => import('./screens/food/Meals').then((m) => ({ default: m.MealScreen })));
const PantryItemScreen = lazy(() => import('./screens/food/Pantry').then((m) => ({ default: m.PantryItemScreen })));
const BodyScreen = lazy(() => import('./screens/BodyScreen').then((m) => ({ default: m.BodyScreen })));
const GamesScreen = lazy(() => import('./screens/GameScreens').then((m) => ({ default: m.GamesScreen })));
const GameScreen = lazy(() => import('./screens/GameScreens').then((m) => ({ default: m.GameScreen })));
const GameModeScreen = lazy(() => import('./screens/GameScreens').then((m) => ({ default: m.GameModeScreen })));
const AnalysisScreen = lazy(() => import('./screens/GameScreens').then((m) => ({ default: m.AnalysisScreen })));
const PitchesScreen = lazy(() => import('./screens/GameScreens').then((m) => ({ default: m.PitchesScreen })));
const InjuryScreen = lazy(() => import('./screens/InjuryScreen').then((m) => ({ default: m.InjuryScreen })));
const LibraryScreen = lazy(() => import('./screens/LibraryScreen').then((m) => ({ default: m.LibraryScreen })));
const MindScreen = lazy(() => import('./screens/MindScreens').then((m) => ({ default: m.MindScreen })));
const WorksheetScreen = lazy(() => import('./screens/MindScreens').then((m) => ({ default: m.WorksheetScreen })));
const MoreScreen = lazy(() => import('./screens/MoreScreens').then((m) => ({ default: m.MoreScreen })));
const ProgramsScreen = lazy(() => import('./screens/MoreScreens').then((m) => ({ default: m.ProgramsScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreens').then((m) => ({ default: m.SettingsScreen })));
const BackupScreen = lazy(() => import('./screens/SettingsScreens').then((m) => ({ default: m.BackupScreen })));
const ReviewScreen = lazy(() => import('./screens/ReviewScreen').then((m) => ({ default: m.ReviewScreen })));
const TestsScreen = lazy(() => import('./screens/TestScreens').then((m) => ({ default: m.TestsScreen })));
const TestWizard = lazy(() => import('./screens/TestScreens').then((m) => ({ default: m.TestWizard })));

/** R-UI-3: theme on <html>, plus the status-bar colour. */
function useTheme(theme: 'auto' | 'light' | 'dark' | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    if (!theme || theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme;
    const dark = theme === 'dark' || (theme !== 'light' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17602d' : '#1f7a3a');
  }, [theme]);
}

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
    case 'intro':
      return <IntroScreen onClose={() => back('/more')} />;
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
  const settings = useSettings();
  const lastDay = useRef('');
  useTheme(settings?.theme);

  useEffect(() => {
    void (async () => {
      await ensureSeed();
      setReady(true);
      void requestPersistentStorage();
    })();
    return installAudioUnlock();
  }, []);

  // R-GAM-1: this week's and next week's game exist (again when the date changes).
  useEffect(() => {
    if (!ready || lastDay.current === today) return;
    lastDay.current = today;
    void getSettings().then((s) => ensureGames(today, s));
    void dropStaleRun(today);
  }, [ready, today]);

  if (!ready || !settings) return null;
  // R-ONB: a new user (or after "delete everything") sees the intro and setup first.
  if (!settings.onboardedAt) return <ToastProvider><Onboarding s={settings} /></ToastProvider>;
  const top = route[0] ?? '';
  const main = MAIN.has(top) && route.length <= 2;
  const active = OWNER[top] ?? top;
  return (
    <ToastProvider>
      <div className="app">
        <UpdateBanner />
        <Suspense fallback={<div className="screen" />}>{screenFor(route)}</Suspense>
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
      <button type="button" className="btn sm" style={{ background: 'var(--surface)', color: 'var(--g2)' }} onClick={() => void updateServiceWorker(true)}>
        עדכן
      </button>
      <button type="button" aria-label="סגור" onClick={() => setNeedRefresh(false)} style={{ color: 'var(--on-accent)' }}>
        <Icon name="x" size="sm" />
      </button>
    </div>
  );
}
