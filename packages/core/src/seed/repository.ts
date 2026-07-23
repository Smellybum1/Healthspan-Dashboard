import { SeedBundleSchema, type DashboardPayload, type SeedBundle } from '../schemas.js';
import { seedBundle, seedMeta } from './bundle.js';

let cached: SeedBundle | null = null;

export function getSeedBundle(): SeedBundle {
  if (!cached) {
    cached = SeedBundleSchema.parse(seedBundle);
  }
  return cached;
}

export function getDashboardPayload(): DashboardPayload {
  const seed = getSeedBundle();

  const watchedIds = new Set(seed.watchlists.flatMap((w) => w.itemIds));
  const interventionWatch = [...seed.interventions, ...seed.peptides].filter(
    (item) => watchedIds.has(item.id) || item.id === 'int-nmn' || item.id === 'pep-bpc157',
  );

  return {
    asOf: seedMeta.asOf,
    demoNotice: seed.demoNotice,
    lastVisitAt: seedMeta.lastVisitAt,
    sources: seed.sources,
    changes: seed.changeEvents,
    radar: seed.radar,
    trialPulse: seed.trials.filter((t) =>
      ['recruiting', 'terminated', 'withdrawn', 'completed'].includes(t.status),
    ),
    interventionWatch,
    safetyEvents: seed.regulatoryEvents,
    researchBrief: seed.papers.slice(0, 8),
    creatorClaims: seed.claims,
    needsReview: seed.reviewTasks,
  };
}

export function listAllItems() {
  const seed = getSeedBundle();
  return [
    ...seed.papers,
    ...seed.trials,
    ...seed.interventions,
    ...seed.peptides,
    ...seed.creators,
    ...seed.claims,
    ...seed.regulatoryEvents,
    ...seed.organisations,
  ];
}

export function getItemById(id: string) {
  const seed = getSeedBundle();
  const item = listAllItems().find((entry) => entry.id === id);
  if (!item) return null;
  const assessment = seed.assessments.find((a) => a.subjectId === id) ?? null;
  return { item, assessment, demoNotice: seed.demoNotice };
}

export function searchItems(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return listAllItems();
  return listAllItems().filter((item) => {
    const haystack = [item.title, item.summary, ...item.tags].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export function filterItems(params: {
  q?: string;
  type?: string;
  peerReviewStatus?: string;
  trialStatus?: string;
  jurisdiction?: string;
}) {
  let items = params.q ? searchItems(params.q) : listAllItems();
  if (params.type) {
    items = items.filter((item) => item.type === params.type);
  }
  if (params.peerReviewStatus) {
    items = items.filter(
      (item) =>
        item.type === 'paper' &&
        'peerReviewStatus' in item &&
        item.peerReviewStatus === params.peerReviewStatus,
    );
  }
  if (params.trialStatus) {
    items = items.filter(
      (item) => item.type === 'trial' && 'status' in item && item.status === params.trialStatus,
    );
  }
  if (params.jurisdiction) {
    items = items.filter(
      (item) =>
        item.type === 'regulatory_event' &&
        'jurisdiction' in item &&
        item.jurisdiction === params.jurisdiction,
    );
  }
  return items;
}
