import { closeDatabase, openDatabase, liveClaims, claimSourceSpans, contentIntelligenceState } from '@healthspan/db';
import { eq } from 'drizzle-orm';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const claims = db.select().from(liveClaims).all();
const orphans: string[] = [];
for (const claim of claims) {
  const spans = db.select().from(claimSourceSpans).where(eq(claimSourceSpans.claimId, claim.id)).all();
  if (!spans.some((s) => s.primarySupport)) {
    orphans.push(claim.id);
  }
}

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
