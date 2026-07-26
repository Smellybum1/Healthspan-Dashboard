import { Link } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';

async function fetchClaims() {
  const res = await fetch('/api/claims?pageSize=50');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{
    dataMode: string;
    items: Array<Record<string, unknown>>;
    total: number;
    note?: string;
  }>;
}

export function ClaimsPage() {
  const { data, loading, error } = useAsync(() => fetchClaims(), []);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Claims workspace"
        description="Live atomic claims with provenance spans. Demo mode does not invent Live claims."
      />
      {error ? <p className="text-[var(--tone-flag-fg)]">{error}</p> : null}
      {data?.note ? <p className="text-sm text-[var(--muted)]">{data.note}</p> : null}
      {(data?.items ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No Live claims yet. Run ingestion then intelligence analysis.
        </p>
      ) : (
        <ul className="space-y-2">
          {(data?.items ?? []).map((claim) => (
            <li
              key={String(claim.id)}
              className="rounded-lg border border-[var(--border)] px-3 py-2"
            >
              <Link className="font-medium underline" to={`/claims/${String(claim.id)}`}>
                {String(claim.claimText)}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                {String(claim.claimKind)} · {String(claim.assertionRole)} · review{' '}
                {String(claim.reviewStatus)} · {String(claim.classificationConfidence)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-[var(--muted)]">Total: {data?.total ?? 0}</p>
    </div>
  );
}
