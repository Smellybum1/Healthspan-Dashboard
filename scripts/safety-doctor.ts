import {
  closeDatabase,
  openDatabase,
  regulatorSignalRecords,
  adverseEventReportingSnapshots,
  safetyItems,
  interventionSafetyLinks,
} from '@healthspan/db';
import { assertM4CorporaMinima } from '@healthspan/interventions';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const signals = db.select().from(regulatorSignalRecords).all();
const patterns = db.select().from(adverseEventReportingSnapshots).all();
const items = db.select().from(safetyItems).all();
const links = db.select().from(interventionSafetyLinks).all();
const proven = signals.filter((s) => s.provenCausality);
const unsafeZero = patterns.filter((p) => p.zeroIsNotSafe === false);
const corpora = assertM4CorporaMinima();

const report = {
  suite: 'safety:doctor',
  signalCount: signals.length,
  reportingPatternCount: patterns.length,
  safetyItemCount: items.length,
  linkCount: links.length,
  provenCausalityCount: proven.length,
  zeroTreatedAsSafeCount: unsafeZero.length,
  corpora,
  ok: proven.length === 0 && unsafeZero.length === 0 && corpora.ok,
  notes: [
    'AEMS potential signals are never proven causality.',
    'Spontaneous-report counts are not incidence.',
    'Zero reports ≠ safe.',
    'Cross-intervention ranking is prohibited.',
  ],
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
