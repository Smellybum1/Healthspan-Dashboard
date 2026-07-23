import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DemoBanner } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { PageHeader } from '../components/Common';
import { usePreferences } from '../state/PreferencesContext';
import { fetchMode, runIngestion, setMode, postIntelligenceRun } from '../lib/api';
import { useAsync } from '../hooks/useAsync';

export function SettingsPage() {
  const { prefs, setTheme, updatePrefs, exportJson, importJson } = usePreferences();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const modeState = useAsync(() => fetchMode(), []);

  function onExport() {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'healthspan-dashboard-preferences.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Preferences exported.');
  }

  function onImport() {
    try {
      importJson(importText);
      setMessage('Preferences imported.');
      setImportText('');
    } catch {
      setMessage('Import failed — check JSON format.');
    }
  }

  async function switchMode(next: 'demo' | 'live') {
    await setMode(next);
    modeState.reload();
    setMessage(`Switched to ${next} mode. Reload other pages to refresh payloads.`);
  }

  async function firstSync() {
    setSyncing(true);
    setMessage('Running first sync (capped). This may take a minute…');
    try {
      await setMode('live');
      const accepted = await runIngestion({ sourceId: 'all', recordCap: 25 });
      setMessage(`Queued job ${String(accepted.jobId)} — watch Source Health for status.`);
      modeState.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  const dataMode = modeState.data?.dataMode ?? 'live';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Prototype preferences only. Do not store diagnoses, labs, medications, or other sensitive health data here."
      />
      {dataMode === 'demo' ? <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} /> : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Data mode</h2>
        <p className="text-sm text-[var(--muted)]">
          Live uses SQLite-ingested primary sources. Demo preserves the Milestone 1 showcase. Modes never
          mix in the same response.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            aria-pressed={dataMode === 'live'}
            onClick={() => void switchMode('live')}
          >
            Live
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            aria-pressed={dataMode === 'demo'}
            onClick={() => void switchMode('demo')}
          >
            Demo
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">Current: {dataMode}</p>
        <button
          type="button"
          disabled={syncing}
          onClick={() => void firstSync()}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {syncing ? 'Syncing…' : 'Run first sync (Live)'}
        </button>
        <button
          type="button"
          disabled={syncing}
          onClick={() => {
            void (async () => {
              setSyncing(true);
              try {
                await setMode('live');
                const accepted = await postIntelligenceRun({ limit: 50 });
                setMessage(`Queued intelligence job ${String(accepted.jobId)}`);
              } catch (err) {
                setMessage(err instanceof Error ? err.message : 'Intelligence run failed');
              } finally {
                setSyncing(false);
              }
            })();
          }}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Run Live intelligence analysis
        </button>
        <p className="text-xs text-[var(--muted)]">
          See also <Link className="underline" to="/sources">Source Health</Link>.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => setTheme('dark')}
            aria-pressed={prefs.theme === 'dark'}
          >
            Dark
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => setTheme('light')}
            aria-pressed={prefs.theme === 'light'}
          >
            Light
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={prefs.denserLayout}
            onChange={(e) => updatePrefs({ denserLayout: e.target.checked })}
          />
          Denser enthusiast layout
        </label>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <h2 className="text-sm font-semibold">Export / import preferences</h2>
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
        >
          Export JSON
        </button>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste preferences JSON…"
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm"
        />
        <button
          type="button"
          onClick={onImport}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
        >
          Import JSON
        </button>
        {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      </section>
    </div>
  );
}
