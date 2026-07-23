import { closeDatabase, ingestionRuns, openDatabase } from '@healthspan/db';
import { desc } from 'drizzle-orm';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});
const runs = db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.startedAt)).limit(20).all();
console.log(JSON.stringify({ runs }, null, 2));
closeDatabase(sqlite);
