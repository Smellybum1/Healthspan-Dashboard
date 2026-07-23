import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';

async function fetchCreator(id: string) {
  const res = await fetch(`/api/creators/${id}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

export function CreatorProfilePage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useAsync(() => fetchCreator(id), [id]);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-rose-300">Failed to load creator: {error}</p>;
  }

  const isLive = data.dataMode === 'live' || data.dataOrigin === 'live';
  const claims = (data.claims as Array<Record<string, unknown>> | undefined) ?? [];
  const accounts = (data.accounts as Array<Record<string, unknown>> | undefined) ?? [];
  const disclosures = (data.disclosures as Array<Record<string, unknown>> | undefined) ?? [];
  const documents = (data.documents as Array<Record<string, unknown>> | undefined) ?? [];
  const recurrence = (data.recurrence as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={String(data.title ?? data.preferredName ?? 'Creator')}
        description={
          isLive
            ? 'Curated Live creator profile. Claims are assessed — never trust, credibility, misinformation, influence, attention, engagement, or popularity scores.'
            : 'Demo creator profile from the M1 showcase snapshot.'
        }
      />

      {isLive ? (
        <>
          <p className="text-sm text-[var(--muted)]">{String(data.neutralDescription ?? data.summary ?? '')}</p>
          <p className="text-xs text-[var(--muted)]">
            Kind: {String(data.creatorKind)} · Identity confidence: {String(data.identityConfidence)}
          </p>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <h2 className="text-sm font-semibold">Monitored accounts</h2>
            {accounts.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No platform accounts yet. Add a YouTube channel ID/URL/@handle or optional X username via admin API.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {accounts.map((a) => (
                  <li key={String(a.id)}>
                    {String(a.platform)} · {String(a.handle ?? a.externalAccountId)}
                    {a.monitored ? ' · monitored' : ''}
                    {a.canonicalUrl ? (
                      <>
                        {' '}
                        ·{' '}
                        <a className="underline" href={String(a.canonicalUrl)} target="_blank" rel="noreferrer">
                          open
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-[var(--muted)]">
              YouTube metadata is never claim evidence. X is optional, budget-capped, and never sent to external AI.
            </p>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <h2 className="text-sm font-semibold">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No authorised transcripts/documents imported. Unofficial caption scrape, media download, and STT are
                prohibited.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {documents.map((d) => (
                  <li key={String(d.id)}>
                    {String(d.filename)} · {String(d.documentKind)} · rights {String(d.rightsBasis)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <h2 className="text-sm font-semibold">Claims</h2>
            {claims.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No claims yet.</p>
            ) : (
              <ul className="space-y-2">
                {claims.map((claim) => (
                  <li key={String(claim.id)} className="rounded-lg border border-[var(--border)] px-3 py-2">
                    <p className="font-medium">{String(claim.claimText)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {String(claim.assertionRole)} · {String(claim.confidence)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {String(
                        (claim.alignment as { overallLabel?: string } | undefined)?.overallLabel ?? '',
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link className="text-xs underline" to="/creator-claims">
              Open Creator Claims workspace
            </Link>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
            <h2 className="text-sm font-semibold">Disclosures & monitored-claim recurrence</h2>
            {disclosures.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No explicit disclosures recorded.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {disclosures.map((d) => (
                  <li key={String(d.id)}>{String(d.disclosureText)}</li>
                ))}
              </ul>
            )}
            {recurrence.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                No recurring monitored claim themes yet (recurrence ≠ popularity).
              </p>
            ) : (
              <ul className="text-xs text-[var(--muted)]">
                {recurrence.map((r) => (
                  <li key={String(r.recurrenceKey)}>
                    Theme {String(r.recurrenceKey).slice(0, 12)}… · count {String(r.count)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <p className="text-sm text-[var(--muted)]">{String(data.summary ?? '')}</p>
      )}
    </div>
  );
}
