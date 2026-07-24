import { closeDatabase, openDatabase, seedOperationalSources } from '@healthspan/db';
import { ensureLocalOwnerProfile } from '../apps/api/src/personalization-service.js';

process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR ??= '1';
const { db, sqlite } = openDatabase({ allowRelativeOverride: true, migrateOnOpen: true });
seedOperationalSources(db);
const profile = ensureLocalOwnerProfile(db);
console.log(
  JSON.stringify(
    {
      command: 'personalisation:migrate',
      ok: profile.id === 'local-owner',
      profileId: profile.id,
      note: 'Ensures local-owner profile + default Following watchlist via schema migration path.',
    },
    null,
    2,
  ),
);
closeDatabase(sqlite);
process.exit(profile.id === 'local-owner' ? 0 : 1);
