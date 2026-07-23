import { z } from 'zod';

export const ConnectorIdSchema = z.enum([
  'pubmed',
  'clinicaltrials-gov',
  'crossref',
  'tga',
]);
export type ConnectorId = z.infer<typeof ConnectorIdSchema>;

export type FetchTransport = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export type ConnectorPage = {
  externalId: string;
  canonicalUrl?: string;
  sourceCreatedAt?: string | null;
  sourceUpdatedAt?: string | null;
  payload: unknown;
  normalized: Record<string, unknown>;
};

export type ConnectorFetchResult = {
  connectorId: ConnectorId;
  feedId?: string;
  fetchedAt: string;
  ok: boolean;
  pages: ConnectorPage[];
  nextCursor?: Record<string, unknown> | null;
  rawBodies: Array<{
    bytes: Buffer;
    mediaType: string;
    ext: string;
    etag?: string;
    lastModified?: string;
  }>;
  errorMessage?: string;
  warnings?: string[];
};

export interface SourceConnector {
  readonly id: ConnectorId;
  readonly name: string;
  readonly enabled: boolean;
  fetchWindow(args: {
    cursor: Record<string, unknown>;
    lookbackDays: number;
    recordCap: number;
    transport?: FetchTransport;
  }): Promise<ConnectorFetchResult>;
}
