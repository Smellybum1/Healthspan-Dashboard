import {
  APP_VERSION,
  DEFAULT_RETENTION_RULES,
  OPERATIONS_ERROR_SEVERITIES,
  OPERATIONS_RECENT_LIMIT,
  SCHEMA_VERSION,
  SecurityHeaders,
  redactLogLine,
  type OperationsReadRepository,
  type OperationsSections,
} from '@healthspan/core';

/**
 * The operations panel, assembled once for both runtimes.
 *
 * Each runtime supplies the sections it can actually produce; the rest arrive as
 * `not_applicable` with a reason. That is the whole point of doing this through a shared
 * assembler — the hosted panel then cannot quietly omit the storage walk or show an empty
 * backup list that reads like "no backups" rather than "backups do not exist here".
 */
export async function operationsPanel(
  repo: OperationsReadRepository,
  sections: OperationsSections,
) {
  const events = await repo.listRecentEvents(OPERATIONS_ERROR_SEVERITIES, OPERATIONS_RECENT_LIMIT);

  const database = sections.database;
  const overall =
    database.status === 'healthy'
      ? 'healthy'
      : database.status === 'not_applicable'
        ? 'unknown'
        : 'degraded';

  return {
    overall,
    versions: {
      app: APP_VERSION,
      schema: SCHEMA_VERSION,
      runtime: sections.runtimeVersion,
    },
    database,
    worker: sections.worker,
    scheduler: sections.scheduler,
    jobs: sections.jobs,
    sources: { note: 'See Source Health for live feed status' },
    intelligence: { note: 'See Intelligence status endpoints' },
    alertsBriefs: { note: 'Alert Centre and Briefings are first-class Live routes' },
    backups: sections.backups,
    storage: sections.storage,
    retention: DEFAULT_RETENTION_RULES,
    security: {
      headers: Object.keys(SecurityHeaders),
      requestIntegrity: 'session+csrf',
      allowedHosts: 'loopback-only by default',
    },
    // Redacted here rather than at either call site, so neither runtime can serve an
    // operational message with a token or an address still in it.
    recentErrors: events.map((e) => ({
      ...e,
      message: redactLogLine(e.message),
      detailsJson: redactLogLine(e.detailsJson),
    })),
  };
}
