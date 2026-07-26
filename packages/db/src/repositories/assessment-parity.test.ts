import fs from 'node:fs';
import { desc, eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { listAssessments } from '@healthspan/runtime';
import type { AssessmentListQuery } from '@healthspan/core';
import { contentItems } from '../schema.js';
import { contentIntelligenceState, intelligenceAnalyses } from '../intelligence-schema.js';
import type { HealthspanDb } from '../client.js';
import { seedAssessmentFixture } from '../testing/assessment-fixture.js';
import { createLocalClaimAssessmentRepository } from './assessment.js';

/**
 * Behaviour parity between the retired per-item implementation and the ported one.
 *
 * The port changed the *shape* of the query — a loop issuing one statement per
 * intelligence state plus one per content item became a single join — because the loop
 * could not run on D1 at acceptable cost. A change of shape is only safe if it is not
 * also a change of results, and nothing else in the suite could establish that: the
 * contract tests were written against the new implementation and would happily agree
 * with it about a wrong answer.
 *
 * So the retired algorithm is frozen below, verbatim apart from its imports, and both are
 * run over the same fixture for a matrix of queries. The fixture is built to hit every
 * branch the loop had — no current analysis, superseded analysis, missing content item,
 * retraction by status, retraction by signal, malformed JSON.
 *
 * Delete this file when the M7 completion report is accepted; until then it is the
 * evidence that the assessment port preserved behaviour.
 */

const dirs: string[] = [];
const handles: Array<{ close(): void }> = [];

afterAll(() => {
  // Windows holds the SQLite file open until the handle is closed, so closing must
  // precede removal or cleanup fails with EPERM.
  for (const h of handles) {
    try {
      h.close();
    } catch {
      /* already closed */
    }
  }
  for (const d of dirs) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      /* best-effort temp cleanup */
    }
  }
});

function safeJsonArray(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** The pre-port `listAssessments` from `apps/api/src/assessment-service.ts`, frozen. */
function retiredListAssessments(db: HealthspanDb, query: AssessmentListQuery) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const states = db.select().from(contentIntelligenceState).all();
  const rows = [];
  for (const state of states) {
    if (!state.currentAnalysisId) continue;
    const analysis = db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.id, state.currentAnalysisId))
      .all()[0];
    if (!analysis || analysis.supersededAt) continue;
    const item = db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, state.contentItemId))
      .all()[0];
    if (!item) continue;

    const hallmarks = safeJsonArray(analysis.hallmarksJson);
    const gaps = safeJsonArray(analysis.translationGapsJson);
    const signals = safeJsonArray(analysis.methodologicalSignalsJson);
    const whatWouldChange = safeJsonArray(analysis.whatWouldChangeJson);
    const retraction =
      signals.some(
        (s) =>
          typeof s === 'object' &&
          s !== null &&
          'code' in s &&
          String((s as { code?: string }).code) === 'retraction_or_correction',
      ) || Boolean(analysis.status === 'retracted');

    if (query.evidenceMaturity && analysis.evidenceMaturity !== query.evidenceMaturity) continue;
    if (
      query.evidenceAvailability &&
      analysis.evidenceAvailability !== query.evidenceAvailability
    ) {
      continue;
    }
    if (query.studyDesign && analysis.studyDesign !== query.studyDesign) continue;
    if (query.organism && analysis.organismLevel !== query.organism) continue;
    if (query.retractionOrCorrection === 'true' && !retraction) continue;
    if (query.retractionOrCorrection === 'false' && retraction) continue;
    if (query.q) {
      const q = query.q.toLowerCase();
      if (
        !item.title.toLowerCase().includes(q) &&
        !(item.summary ?? '').toLowerCase().includes(q)
      ) {
        continue;
      }
    }

    rows.push({
      analysisId: analysis.id,
      contentItemId: item.id,
      title: item.title,
      contentType: item.type,
      evidenceMaturity: analysis.evidenceMaturity,
      evidenceAvailability: analysis.evidenceAvailability,
      studyDesign: analysis.studyDesign,
      organismLevel: analysis.organismLevel,
      classificationConfidence: analysis.classificationConfidence,
      assessmentCompleteness: analysis.assessmentCompleteness,
      resultsPresent: analysis.resultsPresent,
      stale: Boolean(state.stale),
      retractionOrCorrection: retraction,
      translationGaps: gaps,
      methodologicalSignals: signals,
      whatWouldChange,
      potentialHallmarks: hallmarks,
      rulesetVersion: analysis.rulesetVersion,
      createdAt: new Date(analysis.createdAt).toISOString(),
    });
  }

  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = rows.length;
  return {
    items: rows.slice(offset, offset + pageSize),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const QUERIES: Array<[string, AssessmentListQuery]> = [
  ['no filters', {}],
  ['maturity clinical', { evidenceMaturity: 'clinical' }],
  ['maturity preclinical', { evidenceMaturity: 'preclinical' }],
  ['maturity with no matches', { evidenceMaturity: 'nonexistent' }],
  ['availability full_text', { evidenceAvailability: 'full_text' }],
  ['study design rct', { studyDesign: 'rct' }],
  ['organism mouse', { organism: 'mouse' }],
  ['organism human', { organism: 'human' }],
  ['retracted only', { retractionOrCorrection: 'true' }],
  ['non-retracted only', { retractionOrCorrection: 'false' }],
  ['retraction flag ignored when not true/false', { retractionOrCorrection: 'maybe' }],
  ['search matches a title', { q: 'metformin' }],
  ['search is case-insensitive', { q: 'METFORMIN' }],
  ['search matches a summary', { q: 'correction notice' }],
  ['search matches nothing', { q: 'zzzz' }],
  ['search skips a null summary without throwing', { q: 'rapamycin' }],
  ['combined filters', { evidenceMaturity: 'clinical', organism: 'human', studyDesign: 'rct' }],
  ['combined with retraction', { evidenceMaturity: 'clinical', retractionOrCorrection: 'true' }],
  ['page 1 of 2', { pageSize: 2, page: 1 }],
  ['page 2 of 2', { pageSize: 2, page: 2 }],
  ['page past the end', { page: 99 }],
  ['page size clamped high', { pageSize: 1_000 }],
  ['page size clamped low', { pageSize: 0 }],
  ['negative page clamped', { page: -3 }],
];

describe('assessment port — parity with the retired implementation', () => {
  const seeded = seedAssessmentFixture();
  dirs.push(seeded.dir);
  handles.push(seeded.sqlite);
  const repo = createLocalClaimAssessmentRepository(seeded.db);

  it.each(QUERIES)('produces identical output: %s', async (_name, query) => {
    const retired = retiredListAssessments(seeded.db, query);
    const ported = await listAssessments(repo, query);
    expect(ported).toEqual(retired);
  });

  it('excludes the rows the retired loop skipped, for the same reasons', async () => {
    const { items } = await listAssessments(repo, {});
    const ids = items.map((i) => i.contentItemId);
    expect(ids).not.toContain('item-unanalysed'); // no current analysis
    expect(ids).not.toContain('item-superseded'); // current analysis superseded
    expect(ids).not.toContain('item-missing'); // content item does not exist
    expect(ids).toHaveLength(4);
  });

  it('degrades a malformed JSON column to an empty list rather than throwing', async () => {
    const { items } = await listAssessments(repo, { organism: 'mouse' });
    expect(items[0]?.potentialHallmarks).toEqual([]);
  });

  it('issues one statement for the list instead of one per item', async () => {
    // The reason the shape changed at all. On D1 each statement is a network round
    // trip, so this is the difference between 1 and 1 + 2N of them.
    let statements = 0;
    const counting = new Proxy(seeded.db, {
      get(target, prop, receiver) {
        if (prop === 'select') statements += 1;
        return Reflect.get(target, prop, receiver) as unknown;
      },
    }) as HealthspanDb;

    await listAssessments(createLocalClaimAssessmentRepository(counting), {});
    expect(statements).toBe(1);

    statements = 0;
    retiredListAssessments(counting, {});
    // Seven states, each costing an analysis lookup, plus the content-item lookups.
    expect(statements).toBeGreaterThan(10);
  });

  it('orders history newest first, matching the retired detail query', async () => {
    const history = await seeded.db
      .select()
      .from(intelligenceAnalyses)
      .where(eq(intelligenceAnalyses.contentItemId, 'item-rct'))
      .orderBy(desc(intelligenceAnalyses.createdAt))
      .all();
    expect(history.map((h) => h.id)).toEqual(['analysis-rct', 'analysis-rct-old']);
  });
});
