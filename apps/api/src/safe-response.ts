/**
 * Central sanitizer for creator/platform API and export-shaped payloads.
 * Never redistribute X post text or full document/transcript bodies.
 */

const FORBIDDEN_KEYS = new Set([
  'textBody',
  'text_body',
  'parsedTextExcerpt',
  'parsed_text_excerpt',
  'parsedText',
  'fullText',
  'transcript',
  'captionText',
  'segmentText',
  'rawBody',
  'rawBodies',
]);

export type SafeExportCreatorBundle = {
  creatorId: string;
  preferredName?: string;
  accounts: Array<{
    platform: string;
    externalAccountId: string;
    handle: string | null;
    canonicalUrl: string | null;
  }>;
  documents: Array<{
    id: string;
    filename: string;
    documentKind: string;
    rightsBasis: string;
    lifecycleState: string;
  }>;
  claims: Array<{ id: string; claimId: string; reviewStatus: string; assertionRole: string }>;
  youtubeVideos: Array<{ videoId: string; canonicalUrl: string | null; claimEvidence: false }>;
  xPosts: Array<{ postId: string; canonicalUrl: string | null; complianceState: string }>;
  reviewDecisions: Array<{ findingId: string; decision: string; decidedAt: string | null }>;
  policyNotes: string[];
};

export function stripForbiddenExportFields<T>(value: T): T {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripForbiddenExportFields(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    out[key] = stripForbiddenExportFields(child);
  }
  return out as T;
}

export function assertNoXTextInExport(payload: unknown): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const next = path ? `${path}.${key}` : key;
      if (FORBIDDEN_KEYS.has(key) && typeof child === 'string' && child.trim().length > 0) {
        violations.push(next);
      }
      walk(child, next);
    }
  };
  walk(payload, '');
  return { ok: violations.length === 0, violations };
}

export function buildSafeCreatorExportBundle(input: {
  creatorId: string;
  preferredName?: string;
  accounts?: Array<Record<string, unknown>>;
  documents?: Array<Record<string, unknown>>;
  claims?: Array<Record<string, unknown>>;
  youtubeVideos?: Array<Record<string, unknown>>;
  xPosts?: Array<Record<string, unknown>>;
  reviewDecisions?: Array<Record<string, unknown>>;
}): SafeExportCreatorBundle {
  return {
    creatorId: input.creatorId,
    preferredName: input.preferredName,
    accounts: (input.accounts ?? []).map((a) => ({
      platform: String(a.platform ?? ''),
      externalAccountId: String(a.externalAccountId ?? a.external_account_id ?? ''),
      handle: (a.handle as string | null | undefined) ?? null,
      canonicalUrl: (a.canonicalUrl as string | null | undefined) ?? null,
    })),
    documents: (input.documents ?? []).map((d) => ({
      id: String(d.id ?? ''),
      filename: String(d.filename ?? ''),
      documentKind: String(d.documentKind ?? d.document_kind ?? ''),
      rightsBasis: String(d.rightsBasis ?? d.rights_basis ?? ''),
      lifecycleState: String(d.lifecycleState ?? d.lifecycle_state ?? ''),
    })),
    claims: (input.claims ?? []).map((c) => ({
      id: String(c.id ?? ''),
      claimId: String(c.claimId ?? c.id ?? ''),
      reviewStatus: String(c.reviewStatus ?? c.review_status ?? ''),
      assertionRole: String(c.assertionRole ?? c.assertion_role ?? ''),
    })),
    youtubeVideos: (input.youtubeVideos ?? []).map((v) => ({
      videoId: String(v.videoId ?? v.externalId ?? ''),
      canonicalUrl: (v.canonicalUrl as string | null | undefined) ?? null,
      claimEvidence: false as const,
    })),
    xPosts: (input.xPosts ?? []).map((p) => ({
      postId: String(p.postId ?? p.externalId ?? ''),
      canonicalUrl: (p.canonicalUrl as string | null | undefined) ?? null,
      complianceState: String(p.complianceState ?? p.currentState ?? 'unknown'),
    })),
    reviewDecisions: (input.reviewDecisions ?? []).map((r) => ({
      findingId: String(r.findingId ?? r.id ?? ''),
      decision: String(r.decision ?? r.resolution ?? ''),
      decidedAt: (r.decidedAt as string | null | undefined) ?? null,
    })),
    policyNotes: [
      'Export excludes X post text and full document/transcript bodies.',
      'YouTube metadata is never claim evidence.',
      'App-authored review decisions only where policy permits.',
    ],
  };
}
