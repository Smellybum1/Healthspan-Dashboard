import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';

export function CreatorClaimAlignmentPage() {
  const { id = '' } = useParams();
  const claim = useAsync(async () => {
    const res = await fetch('/api/creator-claims');
    if (!res.ok) throw new Error(`claims ${res.status}`);
    const body = (await res.json()) as { claims: Array<Record<string, unknown>> };
    return body.claims.find((c) => String(c.id) === id) ?? null;
  }, [id]);
  const evidence = useAsync(async () => {
    const res = await fetch(`/api/creator-claims/${id}/evidence`);
    if (!res.ok) throw new Error(`evidence ${res.status}`);
    return res.json() as Promise<{ links: Array<Record<string, unknown>> }>;
  }, [id]);

  if (claim.loading || evidence.loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  if (!claim.data) {
    return (
      <div className="space-y-3">
        <PageHeader title="Evidence alignment" description="Claim not found." />
        <Link className="text-sm underline" to="/creator-claims">
          Back to creator claims
        </Link>
      </div>
    );
  }

  const alignment =
    (claim.data.alignment as {
      dimensions?: Array<Record<string, unknown>>;
      overallLabel?: string;
    }) ?? {};
  const links = evidence.data?.links ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Evidence alignment"
        description="Neutral, dimension-based comparison of a creator claim to linked local evidence. No overall claim or creator score."
      />
      <p className="text-sm">
        <Link className="underline" to="/creator-claims">
          Creator claims
        </Link>
        {' · '}
        <Link className="underline" to={`/creators/${String(claim.data.creatorId)}`}>
          Creator profile
        </Link>
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
          <h2 className="text-sm font-semibold">Creator claim</h2>
          <p className="text-sm">{String(claim.data.claimText)}</p>
          <p className="text-xs text-[var(--muted)]">
            {String(claim.data.assertionRole)} · {String(claim.data.claimKind ?? '—')} ·{' '}
            {String(claim.data.direction ?? '—')} · {String(claim.data.certaintyLanguage ?? '—')}
          </p>
          <p className="text-xs text-[var(--muted)]">{String(alignment.overallLabel ?? '')}</p>
        </section>
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Linked local evidence</h2>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs"
              onClick={() => {
                void fetch(`/api/creator-claims/${id}/evidence/link`, { method: 'POST' }).then(() =>
                  evidence.reload(),
                );
              }}
            >
              Re-link
            </button>
          </div>
          {links.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">
              No linked scientific claim/analysis yet in the current local corpus.
            </p>
          ) : (
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              {links.map((l) => (
                <li
                  key={String(l.id)}
                  className="rounded-lg border border-[var(--border)] px-2 py-1.5"
                >
                  {String(l.targetType)} · {String(l.targetId).slice(0, 12)} · {String(l.linkState)}
                  <br />
                  {String(l.rationale ?? '')}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
        <h2 className="text-sm font-semibold">Alignment dimensions</h2>
        <ul className="grid gap-1 text-xs text-[var(--muted)] sm:grid-cols-2">
          {(alignment.dimensions ?? []).map((d) => (
            <li key={String(d.id)}>
              {String(d.label)}: {String(d.state)}
              {d.requiresHumanReview ? ' · human review required before profile publish' : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
