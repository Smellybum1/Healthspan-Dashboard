export type ThemeMode = 'dark' | 'light';

export type Preferences = {
  theme: ThemeMode;
  /** @deprecated prefer followedIdsByMode; retained for import compatibility */
  followedIds: string[];
  followedIdsByMode: {
    demo: string[];
    live: string[];
  };
  topics: string[];
  lastVisitAt: string | null;
  denserLayout: boolean;
};

const STORAGE_KEY = 'healthspan-dashboard.preferences.v1';

export const defaultPreferences = (): Preferences => ({
  theme: 'dark',
  followedIds: ['int-metformin', 'int-exercise', 'pep-bpc157', 'creator-hype-yt'],
  followedIdsByMode: {
    demo: ['int-metformin', 'int-exercise', 'pep-bpc157', 'creator-hype-yt'],
    live: [],
  },
  topics: ['mTOR', 'TGA', 'exercise'],
  lastVisitAt: null,
  denserLayout: true,
});

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences();
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    const base = { ...defaultPreferences(), ...parsed };
    if (!parsed.followedIdsByMode) {
      base.followedIdsByMode = {
        demo: parsed.followedIds ?? base.followedIds,
        live: [],
      };
    }
    return base;
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

export function toggleFollow(
  prefs: Preferences,
  id: string,
  mode: 'demo' | 'live' = 'demo',
): Preferences {
  const modeIds = prefs.followedIdsByMode?.[mode] ?? [];
  const exists = modeIds.includes(id) || prefs.followedIds.includes(id);
  const nextModeIds = exists ? modeIds.filter((x) => x !== id) : [...new Set([...modeIds, id])];
  const nextFollowed =
    mode === 'demo'
      ? exists
        ? prefs.followedIds.filter((x) => x !== id)
        : [...new Set([...prefs.followedIds, id])]
      : prefs.followedIds;
  return {
    ...prefs,
    followedIds: nextFollowed,
    followedIdsByMode: {
      demo: mode === 'demo' ? nextModeIds : (prefs.followedIdsByMode?.demo ?? prefs.followedIds),
      live: mode === 'live' ? nextModeIds : (prefs.followedIdsByMode?.live ?? []),
    },
  };
}
