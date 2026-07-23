import { describe, expect, it, beforeEach } from 'vitest';
import {
  defaultPreferences,
  exportPreferences,
  importPreferences,
  loadPreferences,
  savePreferences,
  toggleFollow,
} from './preferences';

describe('watchlist persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips preferences through localStorage', () => {
    const prefs = defaultPreferences();
    prefs.followedIds = ['int-metformin'];
    savePreferences(prefs);
    expect(loadPreferences().followedIds).toContain('int-metformin');
  });

  it('toggles follow state', () => {
    const prefs = defaultPreferences();
    const next = toggleFollow(prefs, 'int-rapamycin');
    expect(next.followedIds.includes('int-rapamycin')).toBe(true);
    const back = toggleFollow(next, 'int-rapamycin');
    expect(back.followedIds.includes('int-rapamycin')).toBe(false);
  });

  it('exports and imports JSON', () => {
    const prefs = defaultPreferences();
    prefs.topics = ['TGA'];
    const json = exportPreferences(prefs);
    const imported = importPreferences(json);
    expect(imported.topics).toEqual(['TGA']);
  });
});
