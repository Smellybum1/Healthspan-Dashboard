import { z } from 'zod';

/** Backward-compatible Milestone 1 contracts kept for existing imports/tests. */
export const ConnectorHealthSchema = z.enum(['healthy', 'degraded', 'error', 'disabled', 'unknown']);
export type ConnectorHealth = z.infer<typeof ConnectorHealthSchema>;

export const ConnectorFetchResultSchema = z.object({
  connectorId: z.string(),
  fetchedAt: z.string().datetime(),
  ok: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  errorMessage: z.string().optional(),
  rawHash: z.string().optional(),
});
export type ConnectorFetchResult = z.infer<typeof ConnectorFetchResultSchema>;

export interface SourceConnector {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  health(): Promise<ConnectorHealth>;
  fetchSince(sinceIso: string | null): Promise<ConnectorFetchResult>;
}

export const plannedConnectors = [
  'pubmed',
  'clinicaltrials_gov',
  'crossref',
  'tga_rss',
  'anzctr_enrichment',
] as const;

export class DisabledConnector implements SourceConnector {
  constructor(
    readonly id: string,
    readonly name: string,
  ) {}
  readonly enabled = false;
  async health(): Promise<ConnectorHealth> {
    return 'disabled';
  }
  async fetchSince(_sinceIso: string | null): Promise<ConnectorFetchResult> {
    return {
      connectorId: this.id,
      fetchedAt: new Date().toISOString(),
      ok: false,
      itemCount: 0,
      errorMessage: 'Connector disabled until configured.',
    };
  }
}
