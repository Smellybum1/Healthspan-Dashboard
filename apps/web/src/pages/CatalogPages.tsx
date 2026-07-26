import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DemoBanner, SkeletonBlock } from '@healthspan/ui';
import { fetchItems } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { ItemList, PageHeader } from '../components/Common';
import { itemPath } from '../lib/nav';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';

export function CatalogPage({
  title,
  description,
  type,
  pathPrefix,
  extraFilters,
  liveEmptyHint,
}: {
  title: string;
  description: string;
  type?: string;
  pathPrefix?: string;
  extraFilters?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  liveEmptyHint?: string;
}) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'updated';
  const filterValues = Object.fromEntries(
    (extraFilters ?? []).map((f) => [f.key, params.get(f.key) ?? '']),
  );

  const { data, loading, error } = useAsync(
    () =>
      fetchItems({
        type,
        q: q || undefined,
        ...Object.fromEntries(Object.entries(filterValues).filter(([, value]) => Boolean(value))),
      }),
    [type, q, JSON.stringify(filterValues)],
  );

  const items = useMemo(() => {
    const list = [...(data?.items ?? [])];
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return list;
  }, [data, sort]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} />
      {data?.dataOrigin === 'demo' || (!data && !loading) ? (
        <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} />
      ) : data?.dataOrigin === 'live' ? (
        <p className="text-xs text-[var(--muted)]">Showing Live primary-source records only.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => update('q', e.target.value)}
          placeholder="Search…"
          className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          aria-label={`Search ${title}`}
        />
        <select
          value={sort}
          onChange={(e) => update('sort', e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          aria-label="Sort"
        >
          <option value="updated">Sort: recently updated</option>
          <option value="title">Sort: title</option>
        </select>
        {(extraFilters ?? []).map((filter) => (
          <select
            key={filter.key}
            value={filterValues[filter.key] ?? ''}
            onChange={(e) => update(filter.key, e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
            aria-label={filter.label}
          >
            <option value="">{filter.label}: all</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <p className="text-sm text-[var(--muted)]">
        {loading ? 'Loading…' : `${items.length} results`}
      </p>

      {loading ? (
        <div className="space-y-2">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="text-[var(--tone-flag-fg)]">{error}</p>
      ) : items.length === 0 && data?.dataOrigin === 'live' && liveEmptyHint ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-sm text-[var(--muted)]">
          {liveEmptyHint}
        </div>
      ) : (
        <ItemList
          items={items}
          hrefFor={(item) =>
            pathPrefix ? `${pathPrefix}/${item.id}` : itemPath(item.type, item.id)
          }
        />
      )}
    </div>
  );
}

export function DiscoverPage() {
  return (
    <CatalogPage
      title="Discover"
      description="Cross-type search across seeded papers, trials, interventions, peptides, creators, and safety events."
    />
  );
}

export function ResearchListPage() {
  return (
    <CatalogPage
      title="Research"
      description="Papers and preprints with explicit peer-review and evidence labels."
      type="paper"
      pathPrefix="/research"
      extraFilters={[
        {
          key: 'peerReviewStatus',
          label: 'Peer review',
          options: [
            { value: 'peer_reviewed', label: 'Peer-reviewed' },
            { value: 'preprint', label: 'Preprint' },
          ],
        },
      ]}
    />
  );
}

export function TrialsListPage() {
  return (
    <CatalogPage
      title="Trials"
      description="Registry-style demo trials including Australia locations and status changes."
      type="trial"
      pathPrefix="/trials"
      extraFilters={[
        {
          key: 'trialStatus',
          label: 'Status',
          options: [
            { value: 'recruiting', label: 'Recruiting' },
            { value: 'completed', label: 'Completed' },
            { value: 'terminated', label: 'Terminated' },
            { value: 'withdrawn', label: 'Withdrawn' },
          ],
        },
      ]}
    />
  );
}

export function InterventionsListPage() {
  return (
    <CatalogPage
      title="Interventions"
      description="Dossiers spanning approved drugs, lifestyle, and investigational ideas."
      type="intervention"
      pathPrefix="/interventions"
      liveEmptyHint="No Live intervention entities yet. Bootstrap catalog loads with the API; run mention resolution after ingestion."
    />
  );
}

export function PeptidesListPage() {
  return (
    <CatalogPage
      title="Peptides"
      description="Investigational/unapproved peptide examples with stronger safety warnings."
      type="peptide"
      pathPrefix="/peptides"
      liveEmptyHint="No Live peptide entities yet. Peptide dossiers never invent sequences from marketing names."
    />
  );
}

export function CreatorsListPage() {
  return (
    <CatalogPage
      title="Creators"
      description="Curated Live creator profiles. Claims are assessed — never trust, credibility, misinformation, influence, attention, engagement, or popularity scores."
      type="creator"
      pathPrefix="/creators"
      liveEmptyHint="No Live creator profiles yet. Bootstrap catalog creates a starter profile; import an authorised transcript/document to extract claims."
    />
  );
}

export function SafetyListPage() {
  return (
    <CatalogPage
      title="Safety & Regulation"
      description="TGA RSS alerts and related regulatory notices from Live ingestion, or Demo stand-ins."
      type="regulatory_event"
      pathPrefix="/safety"
      extraFilters={[
        {
          key: 'jurisdiction',
          label: 'Jurisdiction',
          options: [
            { value: 'AU', label: 'Australia' },
            { value: 'US', label: 'United States' },
            { value: 'global', label: 'Global' },
          ],
        },
      ]}
    />
  );
}
