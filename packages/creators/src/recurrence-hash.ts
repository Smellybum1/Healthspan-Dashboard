import { createHash } from 'node:crypto';

/**
 * Stable hash of the monitored-source scope behind a recurrence group.
 *
 * Kept out of `./recurrence.js` deliberately. That module is reached from the hosted
 * Sites runtime through the `@healthspan/creators/recurrence` subpath export, and a
 * `node:crypto` import anywhere in that graph would put the whole package on the wrong
 * side of the edge boundary. This function has exactly one caller —
 * `rebuildClaimRecurrence`, which is a local-only write — so it costs nothing to keep it
 * here.
 *
 * Web Crypto's `subtle.digest` would work in both runtimes but is asynchronous, which
 * would make a synchronous local write path async for no benefit to a caller that will
 * never run hosted.
 */
export function recurrenceSourceScopeHash(sourceKeys: string[]): string {
  return createHash('sha256')
    .update([...sourceKeys].sort().join('|'))
    .digest('hex')
    .slice(0, 24);
}
