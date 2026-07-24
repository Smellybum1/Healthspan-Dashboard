/**
 * One-shot X compliance reconciliation CLI (brief §24 `x:compliance`).
 */
import {
  closeDatabase,
  openDatabase,
} from '@healthspan/db';
import { runXComplianceReconciliation, getXComplianceStatus } from '../apps/api/src/x-sync-service.ts';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const result = runXComplianceReconciliation(db, { trigger: 'cli' });
const report = {
  suite: 'x:compliance',
  ...result,
  compliance: getXComplianceStatus(db),
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(result.ok ? 0 : 1);
