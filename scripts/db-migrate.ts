import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';

const { db, sqlite, paths } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});
seedOperationalSources(db);
console.log(`Migrated database at ${paths.dbPath}`);
closeDatabase(sqlite);
