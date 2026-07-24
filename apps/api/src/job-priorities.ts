/** Lower number = higher priority (claimNextJob orders by ascending priority). */
export const JOB_PRIORITY = {
  /** Platform deletion / X compliance — outranks analytics and ordinary sync. */
  COMPLIANCE: 5,
  PURGE: 5,
  MANUAL_INGESTION: 10,
  INTELLIGENCE: 20,
  POST_INGEST_INTELLIGENCE: 30,
  CROSSREF_ENRICHMENT: 35,
  PLATFORM_SYNC: 40,
  SCHEDULED_INGESTION: 50,
} as const;

export type M5JobKind =
  | 'ingestion'
  | 'intelligence'
  | 'enrich_crossref_doi'
  | 'sync_youtube_channel'
  | 'sync_x_account'
  | 'run_x_batch_compliance'
  | 'purge_x_content'
  | 'import_creator_document'
  | 'delete_creator_document';
