/**
 * Policy: X content / platform metadata must never be passed to external AI interfaces.
 * This module is the only allowed boundary for "would we send this to AI?" checks in M5.
 */
export function assertXContentNotSentToExternalAi(payload: {
  provider?: string | null;
  includesXContent?: boolean;
  includesPlatformApiMetadata?: boolean;
}) {
  if (payload.includesXContent || payload.includesPlatformApiMetadata) {
    throw new Error(
      'Policy violation: X content and platform API metadata must not be sent to external AI providers.',
    );
  }
  if (payload.provider && payload.provider !== 'none' && payload.provider !== 'disabled') {
    // External providers may exist for other M3 fields, but never with X/platform payload flags.
    return;
  }
}

export function isExternalAiAllowedForX(): false {
  return false;
}
