import type { ConnectorFetchResult, SourceConnector } from './types.js';

/**
 * Optional X API connector — disabled by default, budget-capped, no external AI.
 * Compliance deletion/withholding must be honored when enabled.
 */
export function createXConnector(
  opts: {
    bearerToken?: string | null;
    monitoredUserIds?: string[];
    budgetAcknowledged?: boolean;
    capMicros?: number;
    spentMicros?: number;
  } = {},
): SourceConnector {
  const token = opts.bearerToken ?? process.env.X_BEARER_TOKEN ?? null;
  const enabledEnv = process.env.HEALTHSPAN_X_ENABLED === 'true';
  const acknowledged =
    opts.budgetAcknowledged === true || process.env.HEALTHSPAN_X_BUDGET_ACKNOWLEDGED === 'true';
  const cap = opts.capMicros ?? Number(process.env.HEALTHSPAN_X_BUDGET_CAP_MICROS ?? 0);
  const spent = opts.spentMicros ?? 0;
  const monitored = opts.monitoredUserIds ?? [];
  const enabled = enabledEnv && Boolean(token) && acknowledged && cap > 0 && spent < cap && monitored.length > 0;

  return {
    id: 'x',
    name: 'X API (optional)',
    enabled,
    async fetchWindow(): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      if (!enabled) {
        return {
          connectorId: 'x',
          fetchedAt,
          ok: true,
          pages: [],
          rawBodies: [],
          warnings: [
            'X connector is optional and disabled by default. Requires HEALTHSPAN_X_ENABLED, token, budget acknowledgement, positive cap, and monitored account IDs. No automatic recharge. X content is never sent to external AI.',
          ],
        };
      }
      return {
        connectorId: 'x',
        fetchedAt,
        ok: true,
        pages: [],
        rawBodies: [],
        warnings: [
          'X enabled but this build returns an empty page set without a fixture transport — monitored-account sync must be wired with compliance handlers before production use.',
        ],
      };
    },
  };
}
