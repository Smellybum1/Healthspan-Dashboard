import { createHash, randomUUID } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  contentItems,
  dossierChangeEvents,
  dossierSnapshots,
  dossierSourceDependencies,
  entityResolutionTasks,
  intelligenceAnalyses,
  contentIntelligenceState,
  interventionAliases,
  interventionDossierState,
  interventionEntities,
  interventionIdentifiers,
  interventionMappingCandidates,
  interventionMentionMappings,
  interventionMentions,
  liveClaims,
  peptideProfiles,
  regulatedProducts,
  regulatoryAssertions,
  type HealthspanDb,
} from '@healthspan/db';
import {
  classifyPeptideLabel,
  extractMentionsFromRecord,
  normalizeForMatch,
  proposeMapping,
  RESOLUTION_RULESET_VERSION,
} from '@healthspan/interventions';
import { defaultRegulatoryCoverage } from './identity-enrichment.js';
import { trialPortfolioForEntity } from './trial-portfolio.js';

const BOOTSTRAP: Array<{
  id: string;
  name: string;
  entityType: string;
  aliases?: string[];
  peptide?: boolean;
}> = [
  {
    id: 'ent-metformin',
    name: 'Metformin',
    entityType: 'substance',
    aliases: ['metformin hydrochloride'],
  },
  { id: 'ent-rapamycin', name: 'Rapamycin', entityType: 'substance', aliases: ['sirolimus'] },
  { id: 'ent-nmn', name: 'NMN', entityType: 'substance', aliases: ['nicotinamide mononucleotide'] },
  { id: 'ent-exercise', name: 'Exercise', entityType: 'behaviour' },
  { id: 'ent-bpc157', name: 'BPC-157', entityType: 'peptide', aliases: ['bpc157'], peptide: true },
  { id: 'ent-tb500', name: 'TB-500', entityType: 'peptide', aliases: ['tb500'], peptide: true },
];

export function bootstrapInterventionCatalog(db: HealthspanDb) {
  const now = Date.now();
  for (const row of BOOTSTRAP) {
    const existing = db
      .select()
      .from(interventionEntities)
      .where(eq(interventionEntities.id, row.id))
      .all()[0];
    if (existing) continue;
    db.insert(interventionEntities)
      .values({
        id: row.id,
        preferredName: row.name,
        normalizedPreferredName: normalizeForMatch(row.name),
        entityType: row.entityType,
        lifecycleState: 'active',
        identityConfidence: 'medium',
        shortDescription: `Bootstrap Live identity for ${row.name} (M4).`,
        createdByMethod: 'bootstrap',
        createdByVersion: 'm4.bootstrap.1',
        dataOrigin: 'live',
        createdAt: now,
        updatedAt: now,
      })
      .run();
    db.insert(interventionAliases)
      .values({
        id: randomUUID(),
        entityId: row.id,
        aliasText: row.name,
        normalizedAlias: normalizeForMatch(row.name),
        aliasType: 'preferred',
        reviewState: 'accepted',
        collisionFlag: false,
        createdAt: now,
      })
      .run();
    for (const alias of row.aliases ?? []) {
      db.insert(interventionAliases)
        .values({
          id: randomUUID(),
          entityId: row.id,
          aliasText: alias,
          normalizedAlias: normalizeForMatch(alias),
          aliasType: 'synonym',
          reviewState: 'accepted',
          collisionFlag: false,
          createdAt: now,
        })
        .run();
    }
    if (row.peptide || row.entityType === 'peptide') {
      const classified = classifyPeptideLabel(row.name);
      db.insert(peptideProfiles)
        .values({
          id: randomUUID(),
          entityId: row.id,
          classification: classified.classification,
          sequenceState: classified.sequenceState,
          warningState: classified.warning,
          reviewState: 'unreviewed',
          updatedAt: now,
        })
        .run();
    }
  }
}

export function runMentionExtractionAndResolution(db: HealthspanDb, limit = 100) {
  bootstrapInterventionCatalog(db);
  const items = db
    .select()
    .from(contentItems)
    .orderBy(desc(contentItems.lastSeenAt))
    .limit(limit)
    .all();
  const entities = db.select().from(interventionEntities).all();
  const aliases = db.select().from(interventionAliases).all();
  const identifiers = db.select().from(interventionIdentifiers).all();
  let mentions = 0;
  let autoMapped = 0;
  let reviewTasks = 0;

  for (const item of items) {
    const drafts = extractMentionsFromRecord({ title: item.title, summary: item.summary });
    for (const draft of drafts) {
      const contextHash = createHash('sha256')
        .update([item.id, draft.fieldPath, draft.normalizedText, draft.excerpt].join('|'))
        .digest('hex');
      const existing = db
        .select()
        .from(interventionMentions)
        .all()
        .find((m) => m.contextHash === contextHash);
      const mentionId = existing?.id ?? randomUUID();
      if (!existing) {
        db.insert(interventionMentions)
          .values({
            id: mentionId,
            rawText: draft.rawText,
            normalizedText: draft.normalizedText,
            mentionType: draft.mentionType,
            contentItemId: item.id,
            fieldPath: draft.fieldPath,
            excerpt: draft.excerpt,
            contextHash,
            extractionRuleVersion: draft.ruleVersion,
            createdAt: Date.now(),
          })
          .run();
        mentions += 1;
      }

      const candidates = proposeMapping({
        mentionNormalized: draft.normalizedText,
        mentionRaw: draft.rawText,
        entities,
        aliases,
        identifiers,
      });
      for (const candidate of candidates) {
        const candId = randomUUID();
        db.insert(interventionMappingCandidates)
          .values({
            id: candId,
            mentionId,
            candidateEntityId: candidate.entityId,
            matchMethod: candidate.method,
            matchConfidence: candidate.confidence,
            reasonsJson: JSON.stringify(candidate.reasons),
            collisionState: candidate.collision,
            status: 'proposed',
            createdAt: Date.now(),
          })
          .run();

        if (candidate.method === 'exact_alias_unique' || candidate.method === 'exact_identifier') {
          const current = db
            .select()
            .from(interventionMentionMappings)
            .where(
              and(
                eq(interventionMentionMappings.mentionId, mentionId),
                isNull(interventionMentionMappings.supersededAt),
              ),
            )
            .all()[0];
          if (current) {
            db.update(interventionMentionMappings)
              .set({ supersededAt: Date.now() })
              .where(eq(interventionMentionMappings.id, current.id))
              .run();
          }
          db.insert(interventionMentionMappings)
            .values({
              id: randomUUID(),
              mentionId,
              entityId: candidate.entityId,
              mappingState: 'accepted',
              mappingScope: 'content_item',
              ruleOrDecisionId: candidate.ruleId,
              effectiveAt: Date.now(),
            })
            .run();
          autoMapped += 1;
        } else {
          db.insert(entityResolutionTasks)
            .values({
              id: randomUUID(),
              mentionId,
              candidateId: candId,
              title: `Resolve mention “${draft.rawText}”`,
              reason: candidate.reasons.join('; '),
              priority: candidate.collision ? 'high' : 'medium',
              status: 'open',
              proposedEntityId: candidate.entityId,
              createdAt: Date.now(),
            })
            .run();
          reviewTasks += 1;
        }
      }
    }
  }

  return { mentions, autoMapped, reviewTasks, rulesetVersion: RESOLUTION_RULESET_VERSION };
}

export function buildDossierSnapshot(
  db: HealthspanDb,
  entityId: string,
  opts?: {
    coverage?: ReturnType<typeof defaultRegulatoryCoverage>;
    potentialSignals?: Array<Record<string, unknown>>;
  },
) {
  bootstrapInterventionCatalog(db);
  const entity = db
    .select()
    .from(interventionEntities)
    .where(eq(interventionEntities.id, entityId))
    .all()[0];
  if (!entity) return null;

  const mappings = db
    .select()
    .from(interventionMentionMappings)
    .all()
    .filter((m) => m.entityId === entityId && m.supersededAt == null);
  const mentionIds = new Set(mappings.map((m) => m.mentionId));
  const mentions = db
    .select()
    .from(interventionMentions)
    .all()
    .filter((m) => mentionIds.has(m.id));
  const contentIds = [...new Set(mentions.map((m) => m.contentItemId).filter(Boolean))] as string[];

  const linkedAnalyses = [];
  const linkedClaims = [];
  for (const contentId of contentIds) {
    const state = db
      .select()
      .from(contentIntelligenceState)
      .where(eq(contentIntelligenceState.contentItemId, contentId))
      .all()[0];
    if (state?.currentAnalysisId) {
      const analysis = db
        .select()
        .from(intelligenceAnalyses)
        .where(eq(intelligenceAnalyses.id, state.currentAnalysisId))
        .all()[0];
      if (analysis) {
        linkedAnalyses.push({
          analysisId: analysis.id,
          contentItemId: contentId,
          evidenceMaturity: analysis.evidenceMaturity,
          evidenceAvailability: analysis.evidenceAvailability,
          studyDesign: analysis.studyDesign,
        });
      }
    }
    const claims = db
      .select()
      .from(liveClaims)
      .where(eq(liveClaims.contentItemId, contentId))
      .all()
      .filter((c) => c.active);
    for (const claim of claims) {
      linkedClaims.push({
        claimId: claim.id,
        analysisId: claim.analysisId,
        claimText: claim.claimText,
        assertionRole: claim.assertionRole,
      });
    }
  }

  const peptide = db
    .select()
    .from(peptideProfiles)
    .where(eq(peptideProfiles.entityId, entityId))
    .all()[0];
  const assertions = db
    .select()
    .from(regulatoryAssertions)
    .all()
    .filter((a) => a.entityId === entityId && a.currentState === 'current');
  const products = db.select().from(regulatedProducts).all();
  const trialPortfolio = trialPortfolioForEntity(db, entityId);

  const summary = {
    entityId: entity.id,
    preferredName: entity.preferredName,
    entityType: entity.entityType,
    identityConfidence: entity.identityConfidence,
    linkedContentCount: contentIds.length,
    linkedAnalysisCount: linkedAnalyses.length,
    linkedClaimCount: linkedClaims.length,
    trialPortfolioCount: trialPortfolio.count,
    peptide: peptide
      ? {
          classification: peptide.classification,
          sequenceState: peptide.sequenceState,
          warningState: peptide.warningState,
          note: 'Sequence is never invented from a marketing name.',
        }
      : null,
    provenanceNote:
      'Evidence cells link to M3 analysis/claim IDs; text is not copied into an untraceable summary.',
    regulatoryVsEvidenceNote:
      'Regulatory register inclusion and scientific evidence maturity are separate dimensions. Trial registration is not authorisation.',
  };

  const evidenceMap = {
    analyses: linkedAnalyses,
    claims: linkedClaims.map((c) => ({ claimId: c.claimId, analysisId: c.analysisId })),
  };

  const regulatoryMatrix = {
    coverage: opts?.coverage ?? defaultRegulatoryCoverage(),
    assertions: assertions.map((a) => ({
      id: a.id,
      jurisdiction: a.jurisdiction,
      authority: a.authority,
      assertionKind: a.assertionKind,
      normalizedStanding: a.normalizedStanding,
      rawSourceStatus: a.rawSourceStatus,
      scope: JSON.parse(a.scopeJson),
      matchScope: a.matchScope,
    })),
    products: products
      .filter((p) => assertions.some((a) => a.productId === p.id))
      .map((p) => ({
        id: p.id,
        jurisdiction: p.jurisdiction,
        authority: p.authority,
        productName: p.productName,
        marketingStatus: p.marketingStatus,
        rawStatusWording: p.rawStatusWording,
        officialUrl: p.officialUrl,
      })),
    caveat:
      'No bare “approved” badge. Standing is product-, formulation-, route-, jurisdiction-, and indication-scoped when known. not_checked means the connector has not run — it is not a negative finding or unapproved status.',
  };

  const safety = {
    spontaneousReports: {
      enabled: false,
      daenImported: false,
      caveat:
        'Spontaneous reports are not proof of causation, do not provide an exposure denominator, and may contain duplicates. TGA DAEN is not imported in M4.',
    },
    potentialSignals: {
      items: opts?.potentialSignals ?? [],
      caveat:
        'FDA AEMS potential signals / new safety information are not proven causality and are not incidence rates. Do not rank interventions by report counts.',
    },
    peptideWarnings: peptide ? [peptide.warningState] : [],
    sourceClassesSeparated: ['label', 'regulator_notice', 'trial', 'paper', 'spontaneous_report'],
  };

  const inputHash = createHash('sha256')
    .update(
      JSON.stringify({
        entityId,
        contentIds,
        analysisIds: linkedAnalyses.map((a) => a.analysisId),
        claimIds: linkedClaims.map((c) => c.claimId),
        assertionIds: assertions.map((a) => a.id),
      }),
    )
    .digest('hex');

  const prior = entity.currentDossierSnapshotId
    ? db
        .select()
        .from(dossierSnapshots)
        .where(eq(dossierSnapshots.id, entity.currentDossierSnapshotId))
        .all()[0]
    : null;
  if (prior && prior.inputHash === inputHash) {
    return { reused: true, snapshotId: prior.id, summary, evidenceMap, regulatoryMatrix, safety };
  }

  const snapshotId = randomUUID();
  const now = Date.now();
  db.insert(dossierSnapshots)
    .values({
      id: snapshotId,
      entityId,
      snapshotKind: 'full',
      rulesetVersion: 'm4.dossier.1',
      inputHash,
      summaryJson: JSON.stringify(summary),
      evidenceMapJson: JSON.stringify(evidenceMap),
      regulatoryMatrixJson: JSON.stringify(regulatoryMatrix),
      safetyJson: JSON.stringify(safety),
      createdAt: now,
    })
    .run();

  for (const analysis of linkedAnalyses) {
    db.insert(dossierSourceDependencies)
      .values({
        id: randomUUID(),
        dossierSnapshotId: snapshotId,
        analysisId: analysis.analysisId,
        contentItemId: analysis.contentItemId,
        role: 'evidence_analysis',
        createdAt: now,
      })
      .run();
  }
  for (const claim of linkedClaims) {
    db.insert(dossierSourceDependencies)
      .values({
        id: randomUUID(),
        dossierSnapshotId: snapshotId,
        claimId: claim.claimId,
        analysisId: claim.analysisId,
        role: 'evidence_claim',
        createdAt: now,
      })
      .run();
  }

  db.insert(interventionDossierState)
    .values({
      entityId,
      currentSnapshotId: snapshotId,
      stale: false,
      lastBuiltAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: interventionDossierState.entityId,
      set: {
        currentSnapshotId: snapshotId,
        stale: false,
        lastBuiltAt: now,
        updatedAt: now,
      },
    })
    .run();

  db.update(interventionEntities)
    .set({ currentDossierSnapshotId: snapshotId, updatedAt: now })
    .where(eq(interventionEntities.id, entityId))
    .run();

  if (prior) {
    db.insert(dossierChangeEvents)
      .values({
        id: randomUUID(),
        entityId,
        fromSnapshotId: prior.id,
        toSnapshotId: snapshotId,
        changeSummary: 'Dossier rebuilt from current mappings and M3 intelligence pointers.',
        createdAt: now,
      })
      .run();
  }

  return { reused: false, snapshotId, summary, evidenceMap, regulatoryMatrix, safety };
}

export function getDossier(db: HealthspanDb, entityId: string) {
  const built = buildDossierSnapshot(db, entityId);
  if (!built) return null;
  const entity = db
    .select()
    .from(interventionEntities)
    .where(eq(interventionEntities.id, entityId))
    .all()[0]!;
  const aliases = db
    .select()
    .from(interventionAliases)
    .where(eq(interventionAliases.entityId, entityId))
    .all();
  const identifiers = db
    .select()
    .from(interventionIdentifiers)
    .where(eq(interventionIdentifiers.entityId, entityId))
    .all();
  const openTasks = db
    .select()
    .from(entityResolutionTasks)
    .all()
    .filter((t) => t.status === 'open' && t.proposedEntityId === entityId);
  return {
    entity: {
      id: entity.id,
      preferredName: entity.preferredName,
      entityType: entity.entityType,
      identityConfidence: entity.identityConfidence,
      lifecycleState: entity.lifecycleState,
      shortDescription: entity.shortDescription,
    },
    aliases: aliases.map((a) => ({
      aliasText: a.aliasText,
      aliasType: a.aliasType,
      reviewState: a.reviewState,
      collisionFlag: a.collisionFlag,
    })),
    identifiers: identifiers.map((i) => ({
      scheme: i.scheme,
      value: i.value,
      reviewState: i.reviewState,
    })),
    snapshotId: built.snapshotId,
    reused: built.reused,
    summary: built.summary,
    evidenceMap: built.evidenceMap,
    regulatoryMatrix: built.regulatoryMatrix,
    safety: built.safety,
    trialPortfolio: trialPortfolioForEntity(db, entityId),
    openResolutionTasks: openTasks.length,
  };
}
