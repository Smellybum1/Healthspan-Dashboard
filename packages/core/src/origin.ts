import { z } from 'zod';

export const DataOriginSchema = z.enum(['demo', 'live']);
export type DataOrigin = z.infer<typeof DataOriginSchema>;

export const DataModeSchema = z.enum(['demo', 'live']);
export type DataMode = z.infer<typeof DataModeSchema>;

export const SourceFamilyIdSchema = z.enum(['pubmed', 'clinicaltrials-gov', 'crossref', 'tga']);
export type SourceFamilyId = z.infer<typeof SourceFamilyIdSchema>;

export const SourceHealthStateSchema = z.enum([
  'never_run',
  'healthy',
  'degraded',
  'failed',
  'disabled',
  'running',
]);
export type SourceHealthState = z.infer<typeof SourceHealthStateSchema>;

export const IngestionRunStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'partial',
  'failed',
  'cancelled',
]);
export type IngestionRunStatus = z.infer<typeof IngestionRunStatusSchema>;

export const IngestionTriggerSchema = z.enum([
  'manual',
  'scheduled',
  'startup_catchup',
  'cli',
  'reprocess',
  'test',
]);
export type IngestionTrigger = z.infer<typeof IngestionTriggerSchema>;

export const LiveChangeKindSchema = z.enum([
  'new_paper',
  'paper_updated',
  'correction_or_retraction',
  'new_trial',
  'trial_status_change',
  'results_posted',
  'trial_material_change',
  'safety_alert',
  'regulatory_update',
  'other',
]);
export type LiveChangeKind = z.infer<typeof LiveChangeKindSchema>;
