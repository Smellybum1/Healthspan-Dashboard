import { desc, inArray } from 'drizzle-orm';
import type { OperationalEventRow, OperationsReadRepository } from '@healthspan/core';
import type { SitesD1Database } from './client.js';
import { operationalEvents } from '../../personalization-schema.js';

/**
 * Sites/D1 implementation of {@link OperationsReadRepository}.
 *
 * The retired panel loaded every `operational_events` row, filtered by severity in
 * memory, and took the last twenty. This is the same twenty as a bounded query — ordered
 * newest first and reversed, so the panel still reads oldest-to-newest as it always did.
 */
export function createSitesOperationsReadRepository(db: SitesD1Database): OperationsReadRepository {
  return {
    async listRecentEvents(severities, limit): Promise<OperationalEventRow[]> {
      const rows = await db
        .select()
        .from(operationalEvents)
        .where(inArray(operationalEvents.severity, [...severities]))
        .orderBy(desc(operationalEvents.createdAt))
        .limit(limit);
      return rows.reverse();
    },
  };
}
