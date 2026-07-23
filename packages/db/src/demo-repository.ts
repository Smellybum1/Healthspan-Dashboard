/**
 * Demo-mode repository facade (in-memory seeded data).
 * Live mode uses SQLite repositories from openDatabase().
 */
import {
  filterItems,
  getDashboardPayload,
  getItemById,
  getSeedBundle,
  listAllItems,
  searchItems,
} from '@healthspan/core';

export const persistenceMode = 'seeded-memory' as const;

export function createSeedRepository() {
  return {
    mode: persistenceMode,
    dataOrigin: 'demo' as const,
    getSeedBundle,
    getDashboardPayload,
    listAllItems,
    getItemById,
    searchItems,
    filterItems,
  };
}

export type SeedRepository = ReturnType<typeof createSeedRepository>;
