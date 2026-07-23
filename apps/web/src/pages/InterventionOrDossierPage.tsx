import { fetchMode } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { DetailPage } from './DetailPage';
import { DossierPage } from './DossierPage';
import { SkeletonBlock } from '@healthspan/ui';

/** Demo keeps M1 seed detail pages; Live uses M4 dossiers. */
export function InterventionOrDossierPage() {
  const { data, loading } = useAsync(() => fetchMode(), []);
  if (loading || !data) {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }
  return data.dataMode === 'demo' ? <DetailPage /> : <DossierPage />;
}
