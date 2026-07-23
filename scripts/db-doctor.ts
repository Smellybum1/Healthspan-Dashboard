import { closeDatabase, databaseDoctor, openDatabase } from '@healthspan/db';

const { sqlite, paths } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});
const doctor = databaseDoctor(sqlite);
console.log(JSON.stringify({ paths, doctor }, null, 2));
closeDatabase(sqlite);
process.exit(doctor.ok ? 0 : 1);
