import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { SkeletonBlock } from '@healthspan/ui';

async function fetchEntities() {
  const res = await fetch('/api/interventions?pageSize=50&entityType=all');
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{ items: Array<{ id: string; title: string; type: string }> }>;
}

async function fetchCompare(ids: string[]) {
  const res = await fetch(`/api/interventions/compare?ids=${encodeURIComponent(ids.join(','))}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<{
    entities: Array<{ id: string; preferredName: string; dossierHref: string }>;
    dimensions: Array<{
      id: string;
      label: string;
      cells: Array<{
        entityId: string;
        value: string;
        comparable: boolean;
        note?: string;
        detailHref?: string;
      }>;
    }>;
    caveat: string;
    rules: Record<string, boolean>;
  }>;
}

export function ComparisonPage() {
  const catalog = useAsync(() => fetchEntities(), []);
  const [selected, setSelected] = useState<string[]>([]);
  const selectedKey = selected.join(',');
  const compare = useAsync(
    () => (selected.length >= 2 ? fetchCompare(selected) : Promise.resolve(null)),
    [selectedKey],
  );

  const selectable = useMemo(() => catalog.data?.items ?? [], [catalog.data]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Intervention comparison"
        description="Compare 2–4 Live interventions side-by-side. No winner, rank, recommendation, stacking, or spontaneous-report safety ranking."
      />

      {catalog.loading ? <SkeletonBlock className="h-24 w-full" /> : null}
      {catalog.error ? <p className="text-rose-300">{catalog.error}</p> : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Select entities ({selected.length}/4)
        </h2>
        <ul className="flex flex-wrap gap-2">
          {selectable.map((item) => {
            const on = selected.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`rounded border px-2 py-1 text-sm ${
                    on ? 'border-teal-500/60 bg-teal-500/10' : 'border-[var(--border)]'
                  }`}
                  onClick={() => toggle(item.id)}
                >
                  {item.title}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selected.length < 2 ? (
        <p className="text-sm text-[var(--muted)]">Select at least two entities to compare.</p>
      ) : compare.loading ? (
        <SkeletonBlock className="h-40 w-full" />
      ) : compare.error ? (
        <p className="text-rose-300">{compare.error}</p>
      ) : compare.data ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">{compare.data.caveat}</p>
          <p className="text-xs text-[var(--muted)]">
            Rules: no winner · no recommendation · no rank · no stacking · no spontaneous-report
            ranking
          </p>
          {compare.data.dimensions.map((dim) => (
            <section key={dim.id} className="rounded-lg border border-[var(--border)] p-3">
              <h3 className="mb-2 text-sm font-semibold">{dim.label}</h3>
              <ul className="grid gap-2 md:grid-cols-2">
                {dim.cells.map((cell) => (
                  <li
                    key={`${dim.id}-${cell.entityId}`}
                    className="rounded border border-[var(--border)] px-2 py-2 text-sm"
                  >
                    <p className="font-medium">
                      {compare.data?.entities.find((e) => e.id === cell.entityId)?.preferredName ??
                        cell.entityId}
                    </p>
                    <p>{cell.value}</p>
                    {!cell.comparable ? (
                      <p className="text-xs text-amber-300">Not comparable on this dimension</p>
                    ) : null}
                    {cell.note ? <p className="text-xs text-[var(--muted)]">{cell.note}</p> : null}
                    {cell.detailHref ? (
                      <Link className="text-xs underline" to={cell.detailHref}>
                        Open dossier
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
