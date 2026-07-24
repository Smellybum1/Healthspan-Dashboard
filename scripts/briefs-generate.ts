import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';
import { ensureLocalOwnerProfile, generateBrief } from '../apps/api/src/personalization-service.js';

process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR ??= '1';
const kind = process.argv.includes('--weekly') ? 'weekly' : 'daily';
const { db, sqlite } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(db);
ensureLocalOwnerProfile(db);
const brief = generateBrief(db, kind);
console.log(JSON.stringify({ command: 'briefs:generate', ok: true, kind, brief }, null, 2));
closeDatabase(sqlite);
