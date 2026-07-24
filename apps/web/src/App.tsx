import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { TodayPage } from './pages/TodayPage';
import {
  CreatorsListPage,
  DiscoverPage,
  InterventionsListPage,
  PeptidesListPage,
  ResearchListPage,
  TrialsListPage,
} from './pages/CatalogPages';
import { RegulatorySafetyWorkspacePage } from './pages/RegulatorySafetyWorkspacePage';
import { DetailPage } from './pages/DetailPage';
import { InterventionOrDossierPage } from './pages/InterventionOrDossierPage';
import { SettingsPage } from './pages/SettingsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SourceHealthPage } from './pages/SourceHealthPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { ClaimsPage } from './pages/ClaimsPage';
import { ClaimDetailPage } from './pages/ClaimDetailPage';
import { EntityResolutionPage } from './pages/EntityResolutionPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { CreatorClaimsPage } from './pages/CreatorClaimsPage';
import { CreatorClaimAlignmentPage } from './pages/CreatorClaimAlignmentPage';
import { CreatorProfilePage } from './pages/CreatorProfilePage';
import {
  AlertDetailPage,
  AlertsPage,
  AlertsSettingsPage,
  BackupSettingsPage,
  BriefDetailPage,
  BriefingsSettingsPage,
  BriefsPage,
  OperationsPage,
  PersonalisationMigrationPage,
  PrivacySecurityPage,
  MuteRulesPage,
  SavedSearchDetailPage,
  SavedSearchesPage,
  WatchlistsPage,
} from './pages/M6Pages';

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
        <Route path="interventions/:id" element={<InterventionOrDossierPage />} />
        <Route path="peptides" element={<PeptidesListPage />} />
        <Route path="peptides/:id" element={<InterventionOrDossierPage />} />
        <Route path="creators" element={<CreatorsListPage />} />
        <Route path="creators/:id" element={<CreatorProfilePage />} />
        <Route path="creator-claims" element={<CreatorClaimsPage />} />
        <Route path="creator-claims/:id/alignment" element={<CreatorClaimAlignmentPage />} />
        <Route path="creator-claims/:id" element={<CreatorClaimsPage />} />
        <Route path="safety" element={<RegulatorySafetyWorkspacePage />} />
        <Route path="sources" element={<SourceHealthPage />} />
        <Route path="claims" element={<ClaimsPage />} />
        <Route path="claims/:id" element={<ClaimDetailPage />} />
        <Route path="review" element={<ReviewQueuePage />} />
        <Route path="entity-resolution" element={<EntityResolutionPage />} />
        <Route path="compare" element={<ComparisonPage />} />
        <Route path="watchlists" element={<WatchlistsPage />} />
        <Route path="watchlists/:id" element={<WatchlistsPage />} />
        <Route path="saved-searches" element={<SavedSearchesPage />} />
        <Route path="saved-searches/:id" element={<SavedSearchDetailPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="alerts/:id" element={<AlertDetailPage />} />
        <Route path="briefs" element={<BriefsPage />} />
        <Route path="briefs/:id" element={<BriefDetailPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/personalisation" element={<PersonalisationMigrationPage />} />
        <Route path="settings/briefings" element={<BriefingsSettingsPage />} />
        <Route path="settings/alerts" element={<AlertsSettingsPage />} />
        <Route path="settings/mutes" element={<MuteRulesPage />} />
        <Route path="settings/backup" element={<BackupSettingsPage />} />
        <Route path="settings/privacy-security" element={<PrivacySecurityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
