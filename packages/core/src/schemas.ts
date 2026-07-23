import { z } from 'zod';
import { DataModeSchema, DataOriginSchema } from './origin.js';
import {
  AgeingHallmarkSchema,
  ChangeKindSchema,
  ContentTypeSchema,
  CreatorTypeSchema,
  EvidenceMaturitySchema,
  JurisdictionSchema,
  PeerReviewStatusSchema,
  RegulatoryStatusSchema,
  ReviewTaskStatusSchema,
  SafetySeveritySchema,
  StudyDesignSchema,
  TranslationGapTypeSchema,
  TrialStatusSchema,
} from './taxonomies.js';

export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum([
    'registry',
    'publication_index',
    'regulator',
    'grant',
    'social',
    'rss',
    'manual_demo',
    'other',
  ]),
  homepageUrl: z.string().url().optional(),
  health: z.enum([
    'healthy',
    'degraded',
    'error',
    'unknown',
    'never_run',
    'failed',
    'disabled',
    'running',
  ]),
  lastSuccessfulFetchAt: z.string().datetime().nullable(),
  lastError: z.string().nullable(),
  dataOrigin: DataOriginSchema,
});
export type Source = z.infer<typeof SourceSchema>;

/** Lightweight live-list card used when full domain scoring is not yet available. */
export const LiveBriefItemSchema = z.object({
  id: z.string(),
  type: ContentTypeSchema,
  title: z.string(),
  summary: z.string().optional().default(''),
  meta: z.string().optional(),
  officialUrl: z.string().url().optional(),
  dataOrigin: z.literal('live'),
});
export type LiveBriefItem = z.infer<typeof LiveBriefItemSchema>;

export const SourceRecordSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  externalId: z.string(),
  fetchedAt: z.string().datetime(),
  rawHash: z.string(),
  url: z.string().url().optional(),
  dataOrigin: DataOriginSchema,
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

export const ProvenanceSchema = z.object({
  sourceIds: z.array(z.string()),
  sourceRecordIds: z.array(z.string()),
  notes: z.string().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const EvidenceAssessmentSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  subjectType: ContentTypeSchema,
  maturity: EvidenceMaturitySchema,
  studyDesign: StudyDesignSchema.optional(),
  peerReviewStatus: PeerReviewStatusSchema.optional(),
  confidenceScore: z.number().min(0).max(1),
  confidenceRationale: z.array(z.string()),
  translationGaps: z.array(TranslationGapTypeSchema),
  attentionScore: z.number().min(0).max(1),
  attentionRationale: z.array(z.string()),
  safetyNotes: z.array(z.string()),
  regulatoryStatuses: z.array(
    z.object({
      jurisdiction: JurisdictionSchema,
      status: RegulatoryStatusSchema,
      indication: z.string().optional(),
    }),
  ),
  whatWouldChangeAssessment: z.array(z.string()),
  provenance: ProvenanceSchema,
  dataOrigin: DataOriginSchema,
});
export type EvidenceAssessment = z.infer<typeof EvidenceAssessmentSchema>;

export const ContentItemSchema = z.object({
  id: z.string(),
  type: ContentTypeSchema,
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  publishedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
  assessmentId: z.string().optional(),
  dataOrigin: DataOriginSchema,
});
export type ContentItem = z.infer<typeof ContentItemSchema>;

export const PaperSchema = ContentItemSchema.extend({
  type: z.literal('paper'),
  authors: z.array(z.string()),
  venue: z.string(),
  doi: z.string().optional(),
  peerReviewStatus: PeerReviewStatusSchema,
  studyDesign: StudyDesignSchema,
  speciesOrPopulation: z.string(),
  findingDirection: z.enum(['positive', 'null', 'negative', 'mixed', 'inconclusive']),
  isCorrectionOrRetraction: z.boolean().default(false),
  correctionNote: z.string().optional(),
  relatedInterventionIds: z.array(z.string()),
  ageingHallmarks: z.array(AgeingHallmarkSchema),
  provenance: ProvenanceSchema,
});
export type Paper = z.infer<typeof PaperSchema>;

export const TrialSchema = ContentItemSchema.extend({
  type: z.literal('trial'),
  registryId: z.string(),
  registryUrl: z.string().url(),
  status: TrialStatusSchema,
  statusHistory: z.array(
    z.object({
      status: TrialStatusSchema,
      at: z.string().datetime(),
      note: z.string().optional(),
    }),
  ),
  phase: z.string(),
  design: z.string(),
  conditions: z.array(z.string()),
  interventions: z.array(z.string()),
  relatedInterventionIds: z.array(z.string()),
  locations: z.array(
    z.object({
      country: z.string(),
      city: z.string().optional(),
      australiaRelevant: z.boolean().optional(),
    }),
  ),
  healthyVolunteers: z.boolean(),
  ageRange: z.string(),
  sponsor: z.string(),
  primaryOutcomes: z.array(z.string()),
  enrollmentTarget: z.number().nullable(),
  enrollmentActual: z.number().nullable(),
  resultsPosted: z.boolean(),
  provenance: ProvenanceSchema,
});
export type Trial = z.infer<typeof TrialSchema>;

export const InterventionSchema = ContentItemSchema.extend({
  type: z.literal('intervention'),
  canonicalName: z.string(),
  aliases: z.array(z.string()),
  interventionClass: z.string(),
  claimedPurpose: z.string(),
  demonstratedIndications: z.array(z.string()),
  biologicalTargets: z.array(z.string()),
  ageingHallmarks: z.array(AgeingHallmarkSchema),
  wadaStatus: z.enum(['prohibited', 'monitored', 'not_listed', 'unknown']).optional(),
  relatedPaperIds: z.array(z.string()),
  relatedTrialIds: z.array(z.string()),
  isPeptide: z.boolean().default(false),
  unapprovedWarning: z.boolean().default(false),
  provenance: ProvenanceSchema,
});
export type Intervention = z.infer<typeof InterventionSchema>;

export const PeptideSchema = InterventionSchema.extend({
  type: z.literal('peptide'),
  isPeptide: z.literal(true),
  sequenceHint: z.string().optional(),
});
export type Peptide = z.infer<typeof PeptideSchema>;

export const CreatorSchema = ContentItemSchema.extend({
  type: z.literal('creator'),
  handle: z.string(),
  creatorType: CreatorTypeSchema,
  platform: z.string(),
  topics: z.array(z.string()),
  citationRateNote: z.string(),
  sponsorshipDisclosures: z.array(z.string()),
  relatedClaimIds: z.array(z.string()),
  provenance: ProvenanceSchema,
});
export type Creator = z.infer<typeof CreatorSchema>;

export const ClaimSchema = ContentItemSchema.extend({
  type: z.literal('claim'),
  creatorId: z.string(),
  claimText: z.string(),
  relatedInterventionIds: z.array(z.string()),
  supportingPaperIds: z.array(z.string()),
  conflictingPaperIds: z.array(z.string()),
  evidenceAttentionDivergence: z.enum(['aligned', 'overclaimed', 'undernoticed', 'unclear']),
  provenance: ProvenanceSchema,
});
export type Claim = z.infer<typeof ClaimSchema>;

export const RegulatoryEventSchema = ContentItemSchema.extend({
  type: z.literal('regulatory_event'),
  jurisdiction: JurisdictionSchema,
  authority: z.string(),
  severity: SafetySeveritySchema,
  eventKind: z.enum([
    'safety_alert',
    'recall',
    'label_change',
    'enforcement',
    'status_change',
    'advisory',
  ]),
  relatedInterventionIds: z.array(z.string()),
  officialUrl: z.string().url().optional(),
  provenance: ProvenanceSchema,
});
export type RegulatoryEvent = z.infer<typeof RegulatoryEventSchema>;

export const OrganisationSchema = ContentItemSchema.extend({
  type: z.literal('organisation'),
  organisationKind: z.enum([
    'regulator',
    'registry',
    'university',
    'company',
    'nonprofit',
    'publisher',
    'other',
  ]),
  country: z.string().optional(),
  homepageUrl: z.string().url().optional(),
  provenance: ProvenanceSchema,
});
export type Organisation = z.infer<typeof OrganisationSchema>;

export const WatchlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  itemIds: z.array(z.string()),
  topics: z.array(z.string()),
  updatedAt: z.string().datetime(),
  dataOrigin: DataOriginSchema,
});
export type Watchlist = z.infer<typeof WatchlistSchema>;

export const ChangeEventSchema = z.object({
  id: z.string(),
  kind: ChangeKindSchema,
  title: z.string(),
  summary: z.string(),
  occurredAt: z.string().datetime(),
  relatedItemIds: z.array(z.string()),
  importance: z.enum(['low', 'medium', 'high']),
  dataOrigin: DataOriginSchema,
});
export type ChangeEvent = z.infer<typeof ChangeEventSchema>;

export const ReviewTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
  status: ReviewTaskStatusSchema,
  relatedItemIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
  dataOrigin: DataOriginSchema,
});
export type ReviewTask = z.infer<typeof ReviewTaskSchema>;

export const SignalRadarPointSchema = z.object({
  id: z.string(),
  label: z.string(),
  itemId: z.string(),
  itemType: ContentTypeSchema,
  evidenceMaturity: EvidenceMaturitySchema,
  evidenceX: z.number().min(0).max(1),
  attentionY: z.number().min(0).max(1),
  bubbleSize: z.number().min(0).max(1),
  safetyConcern: z.boolean(),
  shape: z.enum(['paper', 'trial', 'intervention', 'creator_claim', 'regulatory_event']),
});
export type SignalRadarPoint = z.infer<typeof SignalRadarPointSchema>;

export const DashboardPayloadSchema = z.object({
  asOf: z.string().datetime(),
  dataMode: DataModeSchema,
  dataOrigin: DataOriginSchema,
  demoNotice: z.string().nullable(),
  lastVisitAt: z.string().datetime().nullable(),
  sources: z.array(SourceSchema),
  changes: z.array(ChangeEventSchema),
  radar: z.array(SignalRadarPointSchema),
  radarUnavailableReason: z.string().nullable().optional(),
  trialPulse: z.union([z.array(TrialSchema), z.array(LiveBriefItemSchema)]),
  interventionWatch: z.array(z.union([InterventionSchema, PeptideSchema, LiveBriefItemSchema])),
  safetyEvents: z.union([z.array(RegulatoryEventSchema), z.array(LiveBriefItemSchema)]),
  researchBrief: z.union([z.array(PaperSchema), z.array(LiveBriefItemSchema)]),
  creatorClaims: z.array(ClaimSchema),
  needsReview: z.array(ReviewTaskSchema),
  firstSyncRequired: z.boolean().optional(),
  liveEmptySections: z
    .array(z.enum(['interventions', 'peptides', 'creators', 'radar', 'needs_review']))
    .optional(),
});
export type DashboardPayload = z.infer<typeof DashboardPayloadSchema>;

export const SeedBundleSchema = z.object({
  demoNotice: z.string(),
  generatedAt: z.string().datetime(),
  sources: z.array(SourceSchema),
  sourceRecords: z.array(SourceRecordSchema),
  assessments: z.array(EvidenceAssessmentSchema),
  papers: z.array(PaperSchema),
  trials: z.array(TrialSchema),
  interventions: z.array(InterventionSchema),
  peptides: z.array(PeptideSchema),
  creators: z.array(CreatorSchema),
  claims: z.array(ClaimSchema),
  regulatoryEvents: z.array(RegulatoryEventSchema),
  organisations: z.array(OrganisationSchema),
  watchlists: z.array(WatchlistSchema),
  changeEvents: z.array(ChangeEventSchema),
  reviewTasks: z.array(ReviewTaskSchema),
  radar: z.array(SignalRadarPointSchema),
});
export type SeedBundle = z.infer<typeof SeedBundleSchema>;
