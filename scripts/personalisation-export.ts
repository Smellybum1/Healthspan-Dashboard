import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';
import {
  ensureLocalOwnerProfile,
  personalisationExport,
} from '../apps/api/src/personalization-service.js';

process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR ??= '1';
const { db, sqlite } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(db);
ensureLocalOwnerProfile(db);
const exported = personalisationExport(db);
console.log(
  JSON.stringify({ command: 'personalisation:export', ok: true, export: exported }, null, 2),
);
closeDatabase(sqlite);
