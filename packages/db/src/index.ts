/**
 * Milestone 1 persistence boundary.
 * SQLite/Drizzle arrives in Milestone 2. For now repositories read seeded demo data.
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
    getSeedBundle,
    getDashboardPayload,
    listAllItems,
    getItemById,
    searchItems,
    filterItems,
  };
}

export type SeedRepository = ReturnType<typeof createSeedRepository>;
