export type ThemeMode = 'dark' | 'light';

export type Preferences = {
  theme: ThemeMode;
  followedIds: string[];
  topics: string[];
  lastVisitAt: string | null;
  denserLayout: boolean;
};

const STORAGE_KEY = 'healthspan-dashboard.preferences.v1';

export const defaultPreferences = (): Preferences => ({
  theme: 'dark',
  followedIds: ['int-metformin', 'int-exercise', 'pep-bpc157', 'creator-hype-yt'],
  topics: ['mTOR', 'TGA', 'exercise'],
  lastVisitAt: null,
  denserLayout: true,
});

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences();
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...defaultPreferences(), ...parsed };
  } catch {
    return defaultPreferences();
  }
}

export function savePreferences(prefs: Preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function exportPreferences(prefs: Preferences): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      product: 'Healthspan Dashboard',
      warning: 'Prototype preferences only. Do not store medical records here.',
      preferences: prefs,
    },
    null,
    2,
  );
}

export function importPreferences(json: string): Preferences {
  const parsed = JSON.parse(json) as { preferences?: Preferences } & Partial<Preferences>;
  const prefs = parsed.preferences ?? parsed;
  return { ...defaultPreferences(), ...prefs };
}

export function toggleFollow(prefs: Preferences, id: string): Preferences {
  const exists = prefs.followedIds.includes(id);
  return {
    ...prefs,
    followedIds: exists
      ? prefs.followedIds.filter((x) => x !== id)
      : [...prefs.followedIds, id],
  };
}
