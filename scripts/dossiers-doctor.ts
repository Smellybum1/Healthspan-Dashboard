import {
  closeDatabase,
  openDatabase,
  interventionEntities,
  peptideProfiles,
  regulatoryAssertions,
} from '@healthspan/db';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const entities = db.select().from(interventionEntities).all();
const peptides = db.select().from(peptideProfiles).all();
const assertions = db.select().from(regulatoryAssertions).all();

const bareApproved = assertions.filter((a) =>
  /^(approved|authorised|authorized)$/i.test(a.normalizedStanding),
);

const report = {
  suite: 'dossiers:doctor',
  entityCount: entities.length,
  peptideProfileCount: peptides.length,
  assertionCount: assertions.length,
  bareApprovedStandingCount: bareApproved.length,
  ok: bareApproved.length === 0,
  notes: [
    'Presence of identity sources must never imply approval.',
    'Spontaneous-report ranking across interventions is prohibited.',
    'TGA DAEN is not imported in M4.',
  ],
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
