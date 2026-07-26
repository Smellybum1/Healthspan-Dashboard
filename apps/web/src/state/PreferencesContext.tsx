import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  exportPreferences,
  importPreferences,
  loadPreferences,
  savePreferences,
  toggleFollow,
  type Preferences,
  type ThemeMode,
} from '../lib/preferences';

type PreferencesContextValue = {
  prefs: Preferences;
  setTheme: (theme: ThemeMode) => void;
  toggleFollowId: (id: string) => void;
  isFollowed: (id: string) => boolean;
  updatePrefs: (patch: Partial<Preferences>) => void;
  exportJson: () => string;
  importJson: (json: string) => void;
  markVisit: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => loadPreferences());

  useEffect(() => {
    savePreferences(prefs);
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.density = prefs.denserLayout ? 'dense' : 'comfortable';
  }, [prefs]);

  const updatePrefs = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      setTheme: (theme) => updatePrefs({ theme }),
      toggleFollowId: (id) => setPrefs((prev) => toggleFollow(prev, id)),
      isFollowed: (id) => prefs.followedIds.includes(id),
      updatePrefs,
      exportJson: () => exportPreferences(prefs),
      importJson: (json) => setPrefs(importPreferences(json)),
      markVisit: () => updatePrefs({ lastVisitAt: new Date().toISOString() }),
    }),
    [prefs, updatePrefs],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
