import {
  NOTICE_CAVEAT,
  REGULATORY_WORKSPACE_CAVEATS,
  SAFETY_NOTICE_CAP,
  SIGNAL_CAVEAT,
  SPONTANEOUS_CAVEAT,
  normaliseRegulatoryPaging,
  paginateRegulatory,
  type ProductIngredientRow,
  type RegulatoryPageQuery,
  type RegulatoryReadRepository,
  type TermCountRow,
} from '@healthspan/core';

/**
 * Regulatory and safety read models.
 *
 * Filtering is pushed into the adapters; merging, ordering, and pagination stay here.
 * That split is forced by two of these: the safety list and the history list each combine
 * rows from several tables, and the combination has to be ordered and paged as one.
 *
 * Every caveat this product attaches to regulatory data is applied here rather than in
 * either app, so neither runtime can serve a count without the sentence that qualifies it.
 */

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = out.get(k) ?? [];
    list.push(row);
    out.set(k, list);
  }
  return out;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
}

export async function listRegulatoryProducts(
  repo: RegulatoryReadRepository,
  query: RegulatoryPageQuery & { jurisdiction?: string; authority?: string },
) {
  const rows = await repo.listProducts({
    jurisdiction: query.jurisdiction,
    authority: query.authority,
  });
  const page = paginateRegulatory(rows, query);
  // One statement for the page's ingredients, not one per product.
  const ingredients = await repo.listIngredientsForProducts(page.items.map((p) => p.id));
  const byProduct = groupBy<ProductIngredientRow>(ingredients, (i) => String(i.productId));
  return {
    ...page,
    items: page.items.map((p) => ({
      ...p,
      ingredients: byProduct.get(p.id) ?? [],
      missDoesNotMeanUnapproved: true,
    })),
  };
}

export async function listRegulatoryAssertions(
  repo: RegulatoryReadRepository,
  query: RegulatoryPageQuery & { jurisdiction?: string; entityId?: string },
) {
  const rows = await repo.listAssertions({
    jurisdiction: query.jurisdiction,
    entityId: query.entityId,
  });
  const page = paginateRegulatory(rows, query);
  return {
    ...page,
    items: page.items.map((a) => ({
      ...a,
      scope: safeJson(a.scopeJson),
      trialPresenceDoesNotAuthorize: true,
      labelPresenceDoesNotApprove: true,
    })),
  };
}

/**
 * Status history, assertions, and dossier change events as one timeline.
 *
 * Three sources merged then sorted then paged — the merge cannot move into an adapter
 * without the page boundaries changing.
 */
export async function listRegulatoryHistory(
  repo: RegulatoryReadRepository,
  query: RegulatoryPageQuery & { productId?: string; entityId?: string },
) {
  const [history, assertions, dossierEvents] = await Promise.all([
    repo.listStatusHistory({ productId: query.productId }),
    repo.listAssertions({ entityId: query.entityId }),
    repo.listDossierChangeEvents({ entityId: query.entityId }),
  ]);

  const merged = [
    ...history.map((h) => ({ kind: 'status_history' as const, ...h })),
    ...assertions.map((a) => ({
      kind: 'assertion' as const,
      id: a.id,
      productId: a.productId,
      entityId: a.entityId,
      jurisdiction: a.jurisdiction,
      authority: a.authority,
      normalizedStanding: a.normalizedStanding,
      currentState: a.currentState,
      createdAt: a.createdAt,
    })),
    ...dossierEvents.map((e) => ({
      kind: 'dossier_change' as const,
      id: e.id,
      entityId: e.entityId,
      fromSnapshotId: e.fromSnapshotId,
      toSnapshotId: e.toSnapshotId,
      changeSummary: e.changeSummary,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return paginateRegulatory(merged, query);
}

/**
 * Curated safety items plus TGA regulatory notices, as one list.
 *
 * The notices are capped before the merge, as they were before the port: they are a
 * secondary surface folded into the safety view, not the view itself.
 */
export async function listSafetyItems(
  repo: RegulatoryReadRepository,
  query: RegulatoryPageQuery & { jurisdiction?: string },
) {
  const [items, notices] = await Promise.all([
    repo.listSafetyItems({ jurisdiction: query.jurisdiction }),
    repo.listRegulatoryNotices(SAFETY_NOTICE_CAP),
  ]);

  const mappedNotices = notices.map((n) => ({
    id: n.id,
    kind: 'tga_rss_notice',
    title: n.title,
    summary: n.summary,
    jurisdiction: n.jurisdiction ?? 'AU',
    authority: n.authority ?? 'TGA',
    severityClass: n.category ?? null,
    officialUrl: n.officialUrl ?? n.canonicalUrl,
    severityCaveat: NOTICE_CAVEAT,
    currentState: 'current',
    createdAt: n.publishedAt ?? n.sourcePublishedAt ?? n.createdAt,
    updatedAt: n.updatedAt,
    source: 'regulatory_events',
  }));

  const combined = [
    ...items.map((i) => ({ ...i, source: 'safety_items' as const })),
    ...mappedNotices,
  ];

  // The jurisdiction filter reaches the safety items in SQL, but the notices carry their
  // jurisdiction from a joined table with a default, so the combined list is filtered
  // again here — exactly as the retired implementation did.
  if (query.jurisdiction) {
    const j = query.jurisdiction.toLowerCase();
    return paginateRegulatory(
      combined.filter((i) => String(i.jurisdiction).toLowerCase() === j),
      query,
    );
  }
  return paginateRegulatory(combined, query);
}

export async function listSafetySignals(
  repo: RegulatoryReadRepository,
  query: RegulatoryPageQuery & { entityId?: string },
) {
  const rows = await repo.listSignals({ entityId: query.entityId });
  const page = paginateRegulatory(rows, query);
  return {
    ...page,
    items: page.items.map((s) => ({ ...s, provenCausality: false, caveat: SIGNAL_CAVEAT })),
    rankingProhibited: true,
  };
}

export async function listReportingPatterns(
  repo: RegulatoryReadRepository,
  query: RegulatoryPageQuery & { entityId?: string },
) {
  const snapshots = await repo.listReportingSnapshots({ entityId: query.entityId });
  const page = paginateRegulatory(snapshots, query);
  // One statement for the page's term counts, not one per snapshot.
  const terms = await repo.listTermsForSnapshots(page.items.map((s) => s.id));
  const bySnapshot = groupBy<TermCountRow>(terms, (t) => String(t.snapshotId));
  return {
    ...page,
    items: page.items.map((s) => ({
      ...s,
      terms: bySnapshot.get(s.id) ?? [],
      caveat: s.caveat || SPONTANEOUS_CAVEAT,
      zeroIsNotSafe: true,
      notIncidence: true,
      notCausality: true,
    })),
  };
}

export async function regulatoryWorkspaceSummary(repo: RegulatoryReadRepository) {
  const counts = await repo.workspaceCounts();
  return { ...counts, caveats: [...REGULATORY_WORKSPACE_CAVEATS] };
}

export { normaliseRegulatoryPaging };
