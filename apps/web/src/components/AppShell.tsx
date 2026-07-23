import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { NAV_ITEMS, formatWhen } from '../lib/nav';
import { usePreferences } from '../state/PreferencesContext';
import { searchApi } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { fetchDashboard } from '../lib/api';

export function AppShell() {
  const { prefs, setTheme } = usePreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const dash = useAsync(() => fetchDashboard(), []);

  const sourceHealth = useMemo(() => {
    const sources = dash.data?.sources ?? [];
    if (!sources.length) return 'unknown';
    if (sources.some((s) => s.health === 'error' || s.health === 'failed')) return 'error';
    if (sources.some((s) => s.health === 'degraded' || s.health === 'running')) return 'degraded';
    if (sources.every((s) => s.health === 'unknown' || s.health === 'never_run' || s.health === 'disabled'))
      return 'unknown';
    return 'healthy';
  }, [dash.data]);

  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
  }, [prefs.theme]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    await searchApi(query.trim());
    navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
    setMobileOpen(false);
  }

  const nav = (
    <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            [
              'rounded-lg px-3 py-2 text-sm transition',
              isActive
                ? 'bg-[var(--surface-2)] font-semibold text-[var(--fg)]'
                : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]',
            ].join(' ')
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--surface)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] p-2 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>
          <button
            type="button"
            className="hidden rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted)] lg:inline-flex"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? 'Expand nav' : 'Collapse nav'}
          </button>

          <div className="min-w-0">
            <p className="display truncate text-lg font-semibold leading-tight">Healthspan Dashboard</p>
            <p className="truncate text-xs text-[var(--muted)]">Longevity intelligence, evidence first.</p>
          </div>

          <form onSubmit={onSearch} className="ml-auto hidden min-w-[220px] flex-1 md:block md:max-w-md">
            <label className="relative block">
              <span className="sr-only">Global search</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 text-[var(--muted)]" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search papers, trials, interventions…"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm"
              />
            </label>
          </form>

          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span title="As-of time" className="hidden sm:inline">
              As of {formatWhen(dash.data?.asOf)}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1"
              title="Source health"
            >
              <Activity size={14} />
              {sourceHealth}
              {dash.data?.dataMode ? ` · ${dash.data.dataMode}` : ''}
            </span>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] p-2"
              aria-label={prefs.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme(prefs.theme === 'dark' ? 'light' : 'dark')}
            >
              {prefs.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={[
            'sticky top-[57px] hidden h-[calc(100vh-57px)] shrink-0 overflow-y-auto border-r border-[var(--border)] lg:block',
            collapsed ? 'w-0 overflow-hidden border-0' : 'w-60',
          ].join(' ')}
        >
          {nav}
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close navigation overlay"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-[var(--bg)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-3">
                <p className="font-semibold">Navigate</p>
                <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={onSearch} className="border-b border-[var(--border)] p-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                />
              </form>
              {nav}
            </div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 flex-1 px-3 py-4 sm:px-5">
          <Outlet />
          <footer className="mt-10 border-t border-[var(--border)] py-4 text-xs text-[var(--muted)]">
            Informational only — not medical advice, dosing guidance, or a prescribing tool. Personal health
            records belong in a separate My Healthspan module (not part of this dashboard).
          </footer>
        </main>
      </div>
    </div>
  );
}
