import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { SignalRadarPoint } from '@healthspan/core';
import { EVIDENCE_MATURITY_LABELS } from '@healthspan/core';
import { itemPath } from '../lib/nav';

const SHAPE_FILTERS = [
  'all',
  'paper',
  'trial',
  'intervention',
  'creator_claim',
  'regulatory_event',
] as const;

type ShapeFilter = (typeof SHAPE_FILTERS)[number];

export function SignalRadar({ points }: { points: SignalRadarPoint[] }) {
  const [shape, setShape] = useState<ShapeFilter>('all');
  const [selected, setSelected] = useState<SignalRadarPoint | null>(null);

  const filtered = useMemo(
    () => (shape === 'all' ? points : points.filter((p) => p.shape === shape)),
    [points, shape],
  );

  const data = filtered.map((p) => ({
    ...p,
    x: Number((p.evidenceX * 100).toFixed(1)),
    y: Number((p.attentionY * 100).toFixed(1)),
    z: Math.max(60, p.bubbleSize * 220),
  }));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Signal Radar filters">
        {SHAPE_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setShape(value)}
            className={[
              'rounded-md border px-2.5 py-1 text-xs',
              shape === value
                ? 'border-teal-500/50 bg-teal-500/15 text-[var(--fg)]'
                : 'border-[var(--border)] text-[var(--muted)]',
            ].join(' ')}
          >
            {value === 'all' ? 'All' : value.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      <div
        className="h-80 w-full"
        aria-hidden="true"
        title="Decorative Signal Radar chart; use the data table below"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 12, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Evidence maturity"
              unit="%"
              domain={[0, 100]}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              label={{
                value: 'Evidence maturity →',
                position: 'insideBottom',
                offset: -2,
                fill: 'var(--muted)',
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Research activity"
              unit="%"
              domain={[0, 100]}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              label={{
                value: 'Research activity ↑',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--muted)',
              }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 240]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                const p = payload?.[0]?.payload as
                  | (SignalRadarPoint & {
                      formulaVersion?: string;
                      researchActivityRaw?: number;
                      stale?: boolean;
                    })
                  | undefined;
                if (!p) return null;
                return (
                  <div className="max-w-xs rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-xs shadow">
                    <p className="font-semibold">{p.label}</p>
                    <p className="text-[var(--muted)]">
                      {EVIDENCE_MATURITY_LABELS[p.evidenceMaturity]}
                    </p>
                    <p>
                      Research activity: {Math.round(p.attentionY * 100)}% (raw{' '}
                      {p.researchActivityRaw ?? p.attentionY})
                    </p>
                    <p className="text-[var(--muted)]">
                      Formula: {p.formulaVersion ?? 'research_activity.v1'} — not social attention,
                      truth, or efficacy
                    </p>
                    {p.stale ? (
                      <p className="text-amber-300">Intelligence stale — awaiting reassessment</p>
                    ) : null}
                    {p.safetyConcern ? (
                      <p className="text-rose-300">Safety/regulatory concern</p>
                    ) : null}
                  </div>
                );
              }}
            />
            <Scatter
              data={data}
              onClick={(entry) => setSelected(entry as unknown as SignalRadarPoint)}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={
                    entry.safetyConcern ? 'rgba(251, 113, 133, 0.75)' : 'rgba(45, 212, 191, 0.7)'
                  }
                  stroke={entry.safetyConcern ? '#fb7185' : '#2dd4bf'}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Accessible Signal Radar data table</caption>
          <thead className="sticky top-0 bg-[var(--surface-2)] text-[var(--muted)]">
            <tr>
              <th className="px-2 py-1.5 font-medium">Signal</th>
              <th className="px-2 py-1.5 font-medium">Evidence</th>
              <th className="px-2 py-1.5 font-medium">Attention</th>
              <th className="px-2 py-1.5 font-medium">Safety</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="px-2 py-1.5">
                  <Link
                    className="underline-offset-2 hover:underline"
                    to={itemPath(p.itemType, p.itemId)}
                  >
                    {p.label}
                  </Link>
                </td>
                <td className="px-2 py-1.5">{EVIDENCE_MATURITY_LABELS[p.evidenceMaturity]}</td>
                <td className="px-2 py-1.5">{Math.round(p.attentionY * 100)}%</td>
                <td className="px-2 py-1.5">{p.safetyConcern ? 'Concern' : 'None flagged'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Selected: <span className="text-[var(--fg)]">{selected.label}</span> —{' '}
          <Link className="underline" to={itemPath(selected.itemType, selected.itemId)}>
            Open detail
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Click a bubble or use the table to inspect signals.
        </p>
      )}
    </div>
  );
}
