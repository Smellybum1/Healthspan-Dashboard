import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { TodayPage } from './pages/TodayPage';
import {
  CreatorsListPage,
  DiscoverPage,
  InterventionsListPage,
  PeptidesListPage,
  ResearchListPage,
  SafetyListPage,
  TrialsListPage,
} from './pages/CatalogPages';
import { DetailPage } from './pages/DetailPage';
import { WatchlistsPage } from './pages/WatchlistsPage';
import { SettingsPage } from './pages/SettingsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SourceHealthPage } from './pages/SourceHealthPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="research" element={<ResearchListPage />} />
        <Route path="research/:id" element={<DetailPage />} />
        <Route path="trials" element={<TrialsListPage />} />
        <Route path="trials/:id" element={<DetailPage />} />
        <Route path="interventions" element={<InterventionsListPage />} />
        <Route path="interventions/:id" element={<DetailPage />} />
        <Route path="peptides" element={<PeptidesListPage />} />
        <Route path="peptides/:id" element={<DetailPage />} />
        <Route path="creators" element={<CreatorsListPage />} />
        <Route path="creators/:id" element={<DetailPage />} />
        <Route path="safety" element={<SafetyListPage />} />
        <Route path="sources" element={<SourceHealthPage />} />
        <Route path="review" element={<ReviewQueuePage />} />
        <Route path="watchlists" element={<WatchlistsPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
