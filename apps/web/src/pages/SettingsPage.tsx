import { useState } from 'react';
import { DemoBanner } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { PageHeader } from '../components/Common';
import { usePreferences } from '../state/PreferencesContext';

export function SettingsPage() {
  const { prefs, setTheme, updatePrefs, exportJson, importJson } = usePreferences();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Prototype preferences only. Do not store diagnoses, labs, medications, or other sensitive health data here."
      />
      <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} />

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
