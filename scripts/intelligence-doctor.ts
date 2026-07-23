import {
  closeDatabase,
  openDatabase,
  liveClaims,
  claimSourceSpans,
  contentIntelligenceState,
} from '@healthspan/db';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const claims = db.select().from(liveClaims).all();
const spans = db.select().from(claimSourceSpans).all();
const spanClaimIds = new Set(spans.filter((s) => s.primarySupport).map((s) => s.claimId));
const orphans = claims.filter((c) => !spanClaimIds.has(c.id)).map((c) => c.id);

const states = db.select().from(contentIntelligenceState).all();
const stalePointers = states.filter((s) => s.currentAnalysisId == null && !s.stale);

const report = {
  suite: 'intelligence:doctor',
  claimCount: claims.length,
  claimsMissingPrimarySpan: orphans.length,
  stalePointerAnomalies: stalePointers.length,
  ok: orphans.length === 0,
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
