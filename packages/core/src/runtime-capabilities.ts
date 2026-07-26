/**
 * Versioned runtime capability schema.
 *
 * Milestone 7 §8. Both runtimes report the same shape so a client can tell what the
 * runtime it is talking to can actually do. The rule that matters is the one the brief
 * states plainly: a disabled feature is reported as disabled, never hidden behind an
 * empty successful response.
 *
 * This lives in `@healthspan/core` rather than in either runtime so the two cannot
 * publish divergent schemas.
 */

export type RuntimeKind = 'local' | 'sites';

export const RUNTIME_CAPABILITIES_VERSION = 1;

export interface RuntimeCapabilities {
  /** Schema version, so a client can refuse an unrecognised shape rather than guess. */
  version: number;
  runtime: RuntimeKind;
  database: 'sqlite' | 'd1';
  objectStore: 'filesystem' | 'r2';
  persistentBackgroundScheduler: boolean;
  externalConnectors: boolean;
  platformMonitoring: boolean;
  optionalAi: boolean;
  localBackupRestore: boolean;
  hostedRecovery: 'full' | 'degraded' | 'none';
  ownerIdentity: 'local-owner' | 'sites-owner';
  publicAccess: false;
}

/** The local Node/SQLite runtime — the primary and reference runtime. */
export const LOCAL_RUNTIME_CAPABILITIES: RuntimeCapabilities = {
  version: RUNTIME_CAPABILITIES_VERSION,
  runtime: 'local',
  database: 'sqlite',
  objectStore: 'filesystem',
  persistentBackgroundScheduler: true,
  externalConnectors: true,
  platformMonitoring: true,
  optionalAi: true,
  localBackupRestore: true,
  hostedRecovery: 'full',
  ownerIdentity: 'local-owner',
  publicAccess: false,
};

/**
 * The hosted Sites runtime.
 *
 * Every disabled flag here is a project boundary, not a gap waiting to be filled:
 * M7 prohibits hosted connectors, platform monitoring, AI, and local backup/restore.
 * `hostedRecovery: 'degraded'` records that the hosted runtime has no equivalent of the
 * local SQLite online backup — see the porting ledger's `backup-service.ts` row.
 */
export const SITES_RUNTIME_CAPABILITIES: RuntimeCapabilities = {
  version: RUNTIME_CAPABILITIES_VERSION,
  runtime: 'sites',
  database: 'd1',
  objectStore: 'r2',
  persistentBackgroundScheduler: false,
  externalConnectors: false,
  platformMonitoring: false,
  optionalAi: false,
  localBackupRestore: false,
  hostedRecovery: 'degraded',
  ownerIdentity: 'sites-owner',
  publicAccess: false,
};
