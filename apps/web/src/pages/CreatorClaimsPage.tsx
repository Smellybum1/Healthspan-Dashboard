import { Link } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';

async function fetchClaims() {
  const res = await fetch('/api/creator-claims');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{ claims: Array<Record<string, unknown>> }>;
}

export function CreatorClaimsPage() {
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
        title="Creator Claims"
        description="Atomic creator claims from user-supplied or authorised documents. Alignment is multi-dimensional; no creator worth scores."
      />
      {error ? <p className="text-rose-300">{error}</p> : null}
      {(data?.claims ?? []).length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No Live creator claims yet.</p>
      ) : (
        <ul className="space-y-2">
          {(data?.claims ?? []).map((claim) => (
            <li key={String(claim.id)} className="rounded-lg border border-[var(--border)] px-3 py-2">
              <p className="font-medium">{String(claim.claimText)}</p>
              <p className="text-xs text-[var(--muted)]">
                {String(claim.assertionRole)} · {String(claim.claimKind ?? '—')} ·{' '}
                {String(claim.direction ?? '—')} · {String(claim.certaintyLanguage ?? '—')} · recurrence{' '}
                {String(claim.recurrenceKey).slice(0, 24)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {String((claim.alignment as { overallLabel?: string } | undefined)?.overallLabel ?? '')}
              </p>
              {Array.isArray((claim.alignment as { dimensions?: unknown[] } | undefined)?.dimensions) ? (
                <ul className="mt-2 grid gap-1 text-xs text-[var(--muted)] sm:grid-cols-2">
                  {(
                    (claim.alignment as { dimensions: Array<Record<string, unknown>> }).dimensions ?? []
                  ).map((d) => (
                    <li key={String(d.id)}>
                      {String(d.label)}: {String(d.state)}
                      {d.requiresHumanReview ? ' · review candidate' : ''}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <Link className="underline" to={`/creators/${String(claim.creatorId)}`}>
                  Creator
                </Link>
                <Link className="underline" to={`/creator-claims/${String(claim.id)}/alignment`}>
                  Evidence alignment
                </Link>
              </div>            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
