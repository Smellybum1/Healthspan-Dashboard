import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';
import { apiFetch } from '../lib/api';

const RIGHTS_OPTIONS = [
  { value: 'user_owned', label: 'User-owned transcript/notes' },
  { value: 'authorised_caption_export', label: 'Authorised caption export' },
  { value: 'public_domain_or_licence', label: 'Public domain or licence' },
  { value: 'fair_dealing_research_notes', label: 'Fair dealing / research notes' },
  { value: 'other_declared', label: 'Other (declared)' },
] as const;

async function fetchCreator(id: string) {
  const res = await apiFetch(`/api/creators/${id}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const base64 = result.includes(',') ? result.slice(result.indexOf(',') + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function CreatorProfilePage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useAsync(() => fetchCreator(id), [id]);
  const [rightsBasis, setRightsBasis] =
    useState<(typeof RIGHTS_OPTIONS)[number]['value']>('user_owned');
  const [importBusy, setImportBusy] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [ytSyncBusy, setYtSyncBusy] = useState(false);
  const [ytSyncMessage, setYtSyncMessage] = useState<string | null>(null);
  const [claimText, setClaimText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-[var(--tone-flag-fg)]">Failed to load creator: {error}</p>;
  }

  const isLive = data.dataMode === 'live' || data.dataOrigin === 'live';
  const claims = (data.claims as Array<Record<string, unknown>> | undefined) ?? [];
  const accounts = (data.accounts as Array<Record<string, unknown>> | undefined) ?? [];
  const disclosures = (data.disclosures as Array<Record<string, unknown>> | undefined) ?? [];
  const documents = (data.documents as Array<Record<string, unknown>> | undefined) ?? [];
  const youtubeVideos = (data.youtubeVideos as Array<Record<string, unknown>> | undefined) ?? [];
  const recurrence = (data.recurrence as Array<Record<string, unknown>> | undefined) ?? [];

  async function onYoutubeSync() {
    setYtSyncBusy(true);
    setYtSyncMessage(null);
    try {
      const res = await apiFetch(`/api/creators/${id}/youtube-sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok && res.status !== 202) {
        throw new Error(String(body.error ?? body.status ?? `Sync failed: ${res.status}`));
      }
      const jobId = typeof body.jobId === 'string' ? body.jobId : null;
      if (jobId) {
        for (let i = 0; i < 40; i += 1) {
          await new Promise((r) => setTimeout(r, 400));
          const jobRes = await apiFetch(`/api/jobs/${jobId}`);
          const job = (await jobRes.json().catch(() => ({}))) as Record<string, unknown>;
          const status = String(job.status ?? '');
          if (status === 'succeeded' || status === 'partial') {
            setYtSyncMessage(`YouTube sync job ${status}. Metadata is never claim evidence.`);
            reload();
            return;
          }
          if (status === 'failed' || status === 'cancelled') {
            throw new Error(String(job.lastError ?? `Sync job ${status}`));
          }
        }
        setYtSyncMessage(`YouTube sync queued (job ${jobId}). Refresh shortly.`);
        return;
      }
      setYtSyncMessage(
        `Synced ${String(body.channelsSynced ?? 0)} channels · ${String(body.videosUpserted ?? 0)} videos · units ${String(body.unitsSpent ?? 0)}. Metadata is never claim evidence.`,
      );
      reload();
    } catch (err) {
      setYtSyncMessage(err instanceof Error ? err.message : 'YouTube sync failed');
    } finally {
      setYtSyncBusy(false);
    }
  }

  async function onImportDocument(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setImportBusy(true);
    setImportMessage(null);
    try {
      const contentBase64 = await fileToBase64(file);
      const res = await apiFetch(`/api/creators/${id}/documents`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentBase64,
          rightsBasis,
          mediaType: file.type || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(String(body.error ?? `Import failed: ${res.status}`));
      setImportMessage(
        `Imported ${file.name}: ${String(body.claimsCreated ?? 0)} claims, ${String(body.disclosures ?? 0)} disclosures.`,
      );
      reload();
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportBusy(false);
    }
  }

  async function onCreateManualClaim(e: FormEvent) {
    e.preventDefault();
    if (!claimText.trim()) return;
    setClaimBusy(true);
    setClaimMessage(null);
    try {
      const res = await apiFetch(`/api/creators/${id}/claims`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          claimText: claimText.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          assertionRole: 'assertion',
        }),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(String(body.error ?? `Claim create failed: ${res.status}`));
      setClaimText('');
      setSourceUrl('');
      setClaimMessage('Manual claim recorded with source link.');
      reload();
    } catch (err) {
      setClaimMessage(err instanceof Error ? err.message : 'Claim create failed');
    } finally {
      setClaimBusy(false);
    }
  }

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
          <p className="text-sm text-[var(--muted)]">
            {String(data.neutralDescription ?? data.summary ?? '')}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Kind: {String(data.creatorKind)} · Identity confidence:{' '}
            {String(data.identityConfidence)}
          </p>

          <section className="card space-y-2">
            <h2 className="t-section">Monitored accounts</h2>
            {accounts.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No platform accounts yet. Add a YouTube channel ID/URL/@handle or optional X
                username via admin API.
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
                        <a
                          className="underline"
                          href={String(a.canonicalUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          open
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={ytSyncBusy}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
                onClick={() => void onYoutubeSync()}
              >
                {ytSyncBusy ? 'Syncing YouTube…' : 'Sync YouTube metadata'}
              </button>
              {ytSyncMessage ? (
                <p className="text-xs text-[var(--muted)]">{ytSyncMessage}</p>
              ) : null}
            </div>
            <p className="text-xs text-[var(--muted)]">
              YouTube metadata is never claim evidence. Sync uses channels.list → uploads playlist →
              videos.list with daily quota ledger. X is optional, budget-capped, and never sent to
              external AI.
            </p>
          </section>

          <section className="card space-y-2">
            <h2 className="t-section">YouTube videos (metadata only)</h2>
            {youtubeVideos.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No synced video metadata yet. Run Sync YouTube metadata after adding a UC… channel
                ID.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {youtubeVideos.map((v) => (
                  <li
                    key={String(v.id)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <p className="font-medium">{String(v.title)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {v.displayEligible ? 'display-eligible' : 'refresh due / hidden'} · metadata
                      only · not claim evidence
                      {v.captionAvailable ? ' · captions available (flag only)' : ''}
                      {v.paidPlacementDeclared ? ' · paid placement declared' : ''}
                    </p>
                    {v.canonicalUrl ? (
                      <a
                        className="text-xs underline"
                        href={String(v.canonicalUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open on YouTube
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card space-y-3">
            <h2 className="t-section">Documents</h2>
            <p className="text-xs text-[var(--muted)]">
              Import user-supplied or authorised VTT/SRT/TXT/JSON only. Unofficial caption scrape,
              media download, and speech-to-text are prohibited. YouTube API metadata cannot become
              claim evidence.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block text-xs space-y-1 flex-1">
                <span className="text-[var(--muted)]">Rights basis (required)</span>
                <select
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
                  value={rightsBasis}
                  onChange={(e) => setRightsBasis(e.target.value as typeof rightsBasis)}
                >
                  {RIGHTS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs space-y-1">
                <span className="text-[var(--muted)]">File</span>
                <input
                  type="file"
                  accept=".vtt,.srt,.txt,.md,.json,text/vtt,text/plain,application/json"
                  disabled={importBusy}
                  className="block w-full text-sm"
                  onChange={(e) => {
                    void onImportDocument(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {importMessage ? <p className="text-xs text-[var(--muted)]">{importMessage}</p> : null}
            {documents.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No authorised transcripts/documents imported yet.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {documents.map((d) => (
                  <li key={String(d.id)} className="flex flex-wrap items-center gap-2">
                    <span>
                      {String(d.filename)} · {String(d.documentKind)} · rights{' '}
                      {String(d.rightsBasis)}
                      {d.claimEligible ? ' · claim-eligible' : ''}
                    </span>
                    <button
                      type="button"
                      className="text-xs underline text-[var(--muted)]"
                      onClick={() => {
                        void (async () => {
                          const res = await apiFetch(
                            `/api/creators/${id}/documents/${String(d.id)}`,
                            {
                              method: 'DELETE',
                            },
                          );
                          const body = (await res.json().catch(() => ({}))) as Record<
                            string,
                            unknown
                          >;
                          if (!res.ok) {
                            setImportMessage(String(body.error ?? `Delete failed: ${res.status}`));
                            return;
                          }
                          setImportMessage(
                            `Deleted document; ${String(body.staleClaims ?? 0)} dependent claims marked source-unavailable.`,
                          );
                          reload();
                        })();
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card space-y-3">
            <h2 className="t-section">Claims</h2>
            <form className="space-y-2" onSubmit={(e) => void onCreateManualClaim(e)}>
              <p className="text-xs text-[var(--muted)]">
                Manual source-linked claim capture. Assess the claim text — never invent trust or
                popularity scores.
              </p>
              <label className="block text-xs space-y-1">
                <span className="text-[var(--muted)]">Claim text</span>
                <textarea
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
                  rows={3}
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  required
                />
              </label>
              <label className="block text-xs space-y-1">
                <span className="text-[var(--muted)]">Source URL (optional)</span>
                <input
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <button
                type="submit"
                disabled={claimBusy || !claimText.trim()}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {claimBusy ? 'Saving…' : 'Add manual claim'}
              </button>
              {claimMessage ? <p className="text-xs text-[var(--muted)]">{claimMessage}</p> : null}
            </form>
            {claims.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No claims yet.</p>
            ) : (
              <ul className="space-y-2">
                {claims.map((claim) => (
                  <li
                    key={String(claim.id)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <p className="font-medium">{String(claim.claimText)}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {String(claim.assertionRole)} · {String(claim.confidence)}
                      {claim.reviewStatus ? ` · ${String(claim.reviewStatus)}` : ''}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {String(
                        (claim.alignment as { overallLabel?: string } | undefined)?.overallLabel ??
                          '',
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

          <section className="card space-y-2">
            <h2 className="t-section">Disclosures & monitored-claim recurrence</h2>
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
                    Theme {String(r.recurrenceKey).slice(0, 12)}… · reviewed{' '}
                    {String(r.reviewedClaimCount ?? r.count ?? 0)} · distinct sources{' '}
                    {String(r.distinctMonitoredSourceCount ?? '—')} · formula{' '}
                    {String(r.formulaVersion ?? 'm5.recurrence.1')} (not popularity)
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
