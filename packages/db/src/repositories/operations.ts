import { desc, inArray } from 'drizzle-orm';
import type { OperationalEventRow, OperationsReadRepository } from '@healthspan/core';
import { operationalEvents } from '../personalization-schema.js';
import type { HealthspanDb } from '../client.js';

/**
 * Local SQLite implementation of {@link OperationsReadRepository}.
 *
 * The retired panel loaded every `operational_events` row, filtered by severity in
 * memory, and took the last twenty. This is the same twenty as a bounded query — ordered
 * newest first and reversed, so the panel still reads oldest-to-newest as it always did.
 */
export function createLocalOperationsReadRepository(db: HealthspanDb): OperationsReadRepository {
  return {
    listRecentEvents(severities, limit): Promise<OperationalEventRow[]> {
      const rows = db
        .select()
        .from(operationalEvents)
        .where(inArray(operationalEvents.severity, [...severities]))
        .orderBy(desc(operationalEvents.createdAt))
        .limit(limit)
        .all();
      return Promise.resolve(rows.reverse());
    },
  };
}
