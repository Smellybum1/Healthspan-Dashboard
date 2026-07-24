import { useEffect, useState } from 'react';
import { PageHeader } from '../components/Common';

type Summary = {
  productCount: number;
  assertionCount: number;
  signalCount: number;
  labelCount: number;
  reportingPatternCount: number;
  safetyLinkCount: number;
  caveats: string[];
};

type Tab = 'products' | 'assertions' | 'history' | 'items' | 'signals' | 'patterns';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export function RegulatorySafetyWorkspacePage() {
  const [tab, setTab] = useState<Tab>('products');
  const [jurisdiction, setJurisdiction] = useState<'all' | 'AU' | 'US'>('all');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<unknown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadSummary() {
    setSummary(await getJson<Summary>('/api/regulatory-safety/summary'));
  }

  async function loadTab(next: Tab = tab) {
    setError(null);
    const q = new URLSearchParams({ limit: '50' });
    if (jurisdiction !== 'all' && (next === 'products' || next === 'assertions' || next === 'items')) {
      q.set('jurisdiction', jurisdiction);
    }
    const path =
      next === 'products'
        ? `/api/regulatory/products?${q}`
        : next === 'assertions'
          ? `/api/regulatory/assertions?${q}`
          : next === 'history'
            ? `/api/regulatory/history?${q}`
            : next === 'items'
              ? `/api/safety/items?${q}`
              : next === 'signals'
                ? `/api/safety/signals?${q}`
                : `/api/safety/reporting-patterns?${q}`;
    const data = await getJson<{ items: unknown[] }>(path);
    setRows(data.items ?? []);
  }

  useEffect(() => {
    void loadSummary().catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    void loadTab(tab).catch((e) => setError(String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on tab/jurisdiction only
  }, [tab, jurisdiction]);

  async function run(kind: 'regulatory' | 'safety') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/${kind}/runs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) throw new Error(await res.text());
      await loadSummary();
      await loadTab(tab);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Safety & Regulation"
        description="Product- and indication-scoped AU/US regulatory status, label sections, TGA notices, FDA AEMS potential signals, and spontaneous-report patterns. Miss ≠ unapproved. Trial ≠ authorization. Label presence ≠ approval. AEMS/report counts ≠ causality or incidence."
      />

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
          <div>
            <div className="text-2xl font-semibold">{summary.productCount}</div>
            <div className="text-[var(--muted)]">Products</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{summary.assertionCount}</div>
            <div className="text-[var(--muted)]">Assertions</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{summary.signalCount}</div>
            <div className="text-[var(--muted)]">AEMS signals</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{summary.reportingPatternCount}</div>
            <div className="text-[var(--muted)]">Reporting patterns</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{summary.safetyLinkCount}</div>
            <div className="text-[var(--muted)]">Safety links</div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Jurisdiction{' '}
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value as 'all' | 'AU' | 'US')}
          >
            <option value="all">All</option>
            <option value="AU">Australia (AU)</option>
            <option value="US">United States (US)</option>
          </select>
        </label>
        <button type="button" className="btn" disabled={busy} onClick={() => void run('regulatory')}>
          Run regulatory refresh
        </button>
        <button type="button" className="btn" disabled={busy} onClick={() => void run('safety')}>
          Run safety refresh
        </button>
      </div>

      {summary?.caveats ? (
        <ul className="text-xs text-[var(--muted)] list-disc pl-5 space-y-1">
          {summary.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist">
        {(
          [
            ['products', 'Products'],
            ['assertions', 'Assertions'],
            ['history', 'History'],
            ['items', 'Safety items'],
            ['signals', 'AEMS signals'],
            ['patterns', 'Reporting patterns'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'btn' : 'btn btn-ghost'}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--border)]">
              <th className="py-2 pr-3">Record</th>
              <th className="py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-[var(--muted)]">
                  No rows yet. Run a regulatory or safety refresh in Live mode.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const r = row as Record<string, unknown>;
                const title = String(
                  r.productName ?? r.title ?? r.productOrClass ?? r.normalizedStanding ?? r.id ?? `#${i}`,
                );
                const detail = JSON.stringify(r);
                return (
                  <tr key={String(r.id ?? i)} className="border-b border-[var(--border)] align-top">
                    <td className="py-2 pr-3 font-medium">{title}</td>
                    <td className="py-2">
                      <code className="text-xs break-all">
                        {detail.slice(0, 280)}
                        {detail.length > 280 ? '…' : ''}
                      </code>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
