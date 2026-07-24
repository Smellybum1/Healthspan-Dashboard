import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';
import { itemPath } from '../lib/nav';

async function fetchClaim(id: string) {
  const res = await fetch(`/api/claims/${id}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{
    claim: Record<string, unknown>;
    item: { id: string; title: string; type: string } | null;
    spans: Array<Record<string, unknown>>;
    relationships: Array<Record<string, unknown>>;
  }>;
}

export function ClaimDetailPage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useAsync(() => fetchClaim(id), [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-rose-300">{error ?? 'Claim not found'}</p>;
  }

  const claim = data.claim;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Claim provenance"
        description="Source-grounded excerpt spans for this Live claim."
      />
      <p className="text-lg font-medium">{String(claim.claimText)}</p>
      <p className="text-sm text-[var(--muted)]">
        {String(claim.claimKind)} · {String(claim.assertionRole)} · {String(claim.direction)} ·
        review {String(claim.reviewStatus)}
      </p>
      {data.item ? (
        <p className="text-sm">
          Source item:{' '}
          <Link className="underline" to={itemPath(data.item.type, data.item.id)}>
            {data.item.title}
          </Link>
        </p>
      ) : null}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Provenance spans
        </h2>
        <ul className="space-y-2">
          {data.spans.map((span) => (
            <li
              key={String(span.id)}
              className="rounded border border-[var(--border)] px-3 py-2 text-sm"
            >
              <p className="text-xs text-[var(--muted)]">{String(span.fieldPath)}</p>
              <p>{String(span.excerpt)}</p>
            </li>
          ))}
        </ul>
      </section>
      {data.relationships.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Potential relationships
          </h2>
          <ul className="space-y-2 text-sm">
            {data.relationships.map((rel) => (
              <li key={String(rel.id)} className="rounded border border-[var(--border)] px-3 py-2">
                <p className="font-medium">{String(rel.relationship)}</p>
                <p className="text-[var(--muted)]">{String(rel.rationale)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Link className="text-sm underline" to="/claims">
        Back to claims
      </Link>
    </div>
  );
}
