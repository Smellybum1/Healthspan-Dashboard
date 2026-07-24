import {
  closeDatabase,
  openDatabase,
  interventionEntities,
  interventionAliases,
  interventionIdentifiers,
  peptideProfiles,
} from '@healthspan/db';
import { assertM4CorporaMinima } from '@healthspan/interventions';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const entities = db.select().from(interventionEntities).all();
const aliases = db.select().from(interventionAliases).all();
const identifiers = db.select().from(interventionIdentifiers).all();
const peptides = db.select().from(peptideProfiles).all();
const corpora = assertM4CorporaMinima();

const report = {
  suite: 'interventions:doctor',
  entityCount: entities.length,
  aliasCount: aliases.length,
  identifierCount: identifiers.length,
  peptideProfileCount: peptides.length,
  corpora,
  ok: corpora.ok,
  notes: [
    'Exact-first identity preferred; collisions require review.',
    'Presence of identity sources must never imply approval.',
  ],
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
