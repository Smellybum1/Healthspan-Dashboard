import { closeDatabase, databaseDoctor, openDatabase, sources } from '@healthspan/db';

const { db, sqlite, paths } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});
const doctor = databaseDoctor(sqlite);
const sourceRows = db.select().from(sources).all();
console.log(JSON.stringify({ paths, doctor, sources: sourceRows }, null, 2));
closeDatabase(sqlite);
