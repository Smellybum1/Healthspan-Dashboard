import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../client.js';
import { contentItems } from '../schema.js';
import { contentIntelligenceState, intelligenceAnalyses } from '../intelligence-schema.js';

/**
 * Seeds a migrated database with assessment fixtures. **Test support only.**
 *
 * Shared by the local contract binding, the D1 contract binding, and the parity test
 * against the retired implementation, so all three measure the same starting state.
 *
 * The fixture is built to exercise every branch the retired per-item loop had: a state
 * with no current analysis, a superseded analysis, a state whose content item is missing,
 * a retracted analysis, a retraction signalled through `methodological_signals_json`, and
 * a malformed JSON column.
 */
export type AssessmentFixtureItem = {
  contentItemId: string;
  title: string;
  summary: string | null;
  type: string;
  /** Omit to seed an intelligence state whose content item does not exist. */
  createItem?: boolean;
  currentAnalysisId: string | null;
  stale: boolean;
  analyses: Array<{
    id: string;
    status?: string;
    evidenceMaturity: string;
    evidenceAvailability: string;
    studyDesign: string | null;
    organismLevel: string | null;
    methodologicalSignalsJson?: string;
    hallmarksJson?: string;
    createdAt: number;
    supersededAt: number | null;
  }>;
};

const BASE = Date.UTC(2026, 0, 1);

export function assessmentFixture(): AssessmentFixtureItem[] {
  return [
    {
      contentItemId: 'item-rct',
      title: 'Metformin randomised trial',
      summary: 'A human RCT.',
      type: 'paper',
      currentAnalysisId: 'analysis-rct',
      stale: false,
      analyses: [
        {
          id: 'analysis-rct',
          evidenceMaturity: 'clinical',
          evidenceAvailability: 'full_text',
          studyDesign: 'rct',
          organismLevel: 'human',
          createdAt: BASE + 5_000,
          supersededAt: null,
        },
        {
          id: 'analysis-rct-old',
          evidenceMaturity: 'preclinical',
          evidenceAvailability: 'abstract_only',
          studyDesign: 'observational',
          organismLevel: 'human',
          createdAt: BASE + 1_000,
          supersededAt: BASE + 5_000,
        },
      ],
    },
    {
      contentItemId: 'item-mouse',
      title: 'Rapamycin lifespan in mice',
      summary: null,
      type: 'paper',
      currentAnalysisId: 'analysis-mouse',
      stale: true,
      analyses: [
        {
          id: 'analysis-mouse',
          evidenceMaturity: 'preclinical',
          evidenceAvailability: 'abstract_only',
          studyDesign: 'observational',
          organismLevel: 'mouse',
          // Malformed JSON: must degrade to an empty list, never throw.
          hallmarksJson: '{not json',
          createdAt: BASE + 4_000,
          supersededAt: null,
        },
      ],
    },
    {
      contentItemId: 'item-retracted-signal',
      title: 'Senolytic cohort with correction',
      summary: 'Carries a correction notice.',
      type: 'paper',
      currentAnalysisId: 'analysis-signal',
      stale: false,
      analyses: [
        {
          id: 'analysis-signal',
          evidenceMaturity: 'clinical',
          evidenceAvailability: 'full_text',
          studyDesign: 'observational',
          organismLevel: 'human',
          methodologicalSignalsJson: JSON.stringify([
            { code: 'small_sample' },
            { code: 'retraction_or_correction' },
          ]),
          createdAt: BASE + 3_000,
          supersededAt: null,
        },
      ],
    },
    {
      contentItemId: 'item-retracted-status',
      title: 'Withdrawn peptide study',
      summary: null,
      type: 'paper',
      currentAnalysisId: 'analysis-status',
      stale: false,
      analyses: [
        {
          id: 'analysis-status',
          status: 'retracted',
          evidenceMaturity: 'clinical',
          evidenceAvailability: 'full_text',
          studyDesign: 'rct',
          organismLevel: 'human',
          createdAt: BASE + 2_000,
          supersededAt: null,
        },
      ],
    },
    {
      // A state with no current analysis: the loop skipped it, the join excludes it.
      contentItemId: 'item-unanalysed',
      title: 'Never analysed',
      summary: null,
      type: 'paper',
      currentAnalysisId: null,
      stale: false,
      analyses: [],
    },
    {
      // Current analysis is superseded: excluded by both.
      contentItemId: 'item-superseded',
      title: 'Superseded analysis',
      summary: null,
      type: 'paper',
      currentAnalysisId: 'analysis-superseded',
      stale: false,
      analyses: [
        {
          id: 'analysis-superseded',
          evidenceMaturity: 'clinical',
          evidenceAvailability: 'full_text',
          studyDesign: 'rct',
          organismLevel: 'human',
          createdAt: BASE + 6_000,
          supersededAt: BASE + 7_000,
        },
      ],
    },
    {
      // Intelligence state pointing at a content item that does not exist.
      contentItemId: 'item-missing',
      title: 'Orphaned state',
      summary: null,
      type: 'paper',
      createItem: false,
      currentAnalysisId: 'analysis-orphan',
      stale: false,
      analyses: [
        {
          id: 'analysis-orphan',
          evidenceMaturity: 'clinical',
          evidenceAvailability: 'full_text',
          studyDesign: 'rct',
          organismLevel: 'human',
          createdAt: BASE + 8_000,
          supersededAt: null,
        },
      ],
    },
  ];
}

export type SeededAssessmentDatabase = {
  db: ReturnType<typeof openDatabase>['db'];
  sqlite: ReturnType<typeof openDatabase>['sqlite'];
  dir: string;
};

export function seedAssessmentFixture(
  items: AssessmentFixtureItem[] = assessmentFixture(),
): SeededAssessmentDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-assessment-'));
  const live = openDatabase({
    dbPath: path.join(dir, 'healthspan-dashboard.sqlite3'),
    migrateOnOpen: true,
  });
  const now = Date.now();

  for (const item of items) {
    if (item.createItem !== false) {
      live.db
        .insert(contentItems)
        .values({
          id: item.contentItemId,
          type: item.type,
          dataOrigin: 'live',
          title: item.title,
          summary: item.summary,
          firstSeenAt: now,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    for (const analysis of item.analyses) {
      live.db
        .insert(intelligenceAnalyses)
        .values({
          id: analysis.id,
          contentItemId: item.contentItemId,
          analysisMode: 'deterministic',
          inputHash: `hash-${analysis.id}`,
          rulesetVersion: 'v1',
          segmentBuilderVersion: 'v1',
          claimSchemaVersion: 'v1',
          status: analysis.status ?? 'complete',
          classificationConfidence: 'low',
          assessmentCompleteness: 'partial',
          evidenceMaturity: analysis.evidenceMaturity,
          evidenceAvailability: analysis.evidenceAvailability,
          studyDesign: analysis.studyDesign,
          organismLevel: analysis.organismLevel,
          resultsPresent: false,
          methodologicalSignalsJson: analysis.methodologicalSignalsJson ?? '[]',
          hallmarksJson: analysis.hallmarksJson ?? '[]',
          createdAt: analysis.createdAt,
          supersededAt: analysis.supersededAt,
        })
        .run();
    }

    live.db
      .insert(contentIntelligenceState)
      .values({
        contentItemId: item.contentItemId,
        currentAnalysisId: item.currentAnalysisId,
        stale: item.stale,
        updatedAt: now,
      })
      .run();
  }

  return { db: live.db, sqlite: live.sqlite, dir };
}
