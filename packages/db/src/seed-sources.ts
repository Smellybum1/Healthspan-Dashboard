import { eq } from 'drizzle-orm';
import type { HealthspanDb } from './client.js';
import { sourceFeeds, sources } from './schema.js';

const now = () => Date.now();

export const DEFAULT_SOURCES = [
  {
    id: 'pubmed',
    displayName: 'PubMed / NCBI E-utilities',
    kind: 'publication_index',
    officialBaseUrl: 'https://eutils.ncbi.nlm.nih.gov/',
  },
  {
    id: 'clinicaltrials-gov',
    displayName: 'ClinicalTrials.gov',
    kind: 'registry',
    officialBaseUrl: 'https://clinicaltrials.gov/',
  },
  {
    id: 'crossref',
    displayName: 'Crossref',
    kind: 'publication_index',
    officialBaseUrl: 'https://api.crossref.org/',
  },
  {
    id: 'tga',
    displayName: 'TGA RSS',
    kind: 'regulator',
    officialBaseUrl: 'https://www.tga.gov.au/',
  },
  {
    id: 'rxnorm',
    displayName: 'RxNorm (NLM)',
    kind: 'identity',
    officialBaseUrl: 'https://rxnav.nlm.nih.gov/',
  },
  {
    id: 'pubchem',
    displayName: 'PubChem',
    kind: 'identity',
    officialBaseUrl: 'https://pubchem.ncbi.nlm.nih.gov/',
  },
  {
    id: 'gsrs',
    displayName: 'GSRS / UNII',
    kind: 'identity',
    officialBaseUrl: 'https://gsrs.ncats.nih.gov/',
  },
  {
    id: 'artg',
    displayName: 'TGA ARTG',
    kind: 'regulator',
    officialBaseUrl: 'https://www.tga.gov.au/',
  },
  {
    id: 'openfda',
    displayName: 'openFDA',
    kind: 'regulator',
    officialBaseUrl: 'https://open.fda.gov/',
  },
  {
    id: 'drugs-at-fda',
    displayName: 'Drugs@FDA',
    kind: 'regulator',
    officialBaseUrl: 'https://www.accessdata.fda.gov/scripts/cder/daf/',
  },
  {
    id: 'purple-book',
    displayName: 'FDA Purple Book',
    kind: 'regulator',
    officialBaseUrl: 'https://purplebooksearch.fda.gov/',
  },
  {
    id: 'fda-aems',
    displayName: 'FDA AEMS Potential Signals',
    kind: 'regulator',
    officialBaseUrl: 'https://www.fda.gov/drugs/questions-and-answers-fdas-adverse-event-reporting-system-faers/',
  },
  {
    id: 'youtube',
    displayName: 'YouTube Data API',
    kind: 'creator_platform',
    officialBaseUrl: 'https://www.googleapis.com/youtube/v3/',
  },
  {
    id: 'x',
    displayName: 'X API (optional)',
    kind: 'creator_platform',
    officialBaseUrl: 'https://api.x.com/',
  },
] as const;

export const DEFAULT_TGA_FEEDS = [
  {
    id: 'tga-safety-alerts',
    feedKey: 'safety-alerts',
    category: 'safety_alerts',
    url: 'https://www.tga.gov.au/news/safety-alerts/rss.xml',
  },
  {
    id: 'tga-market-actions',
    feedKey: 'market-actions',
    category: 'market_actions',
    url: 'https://www.tga.gov.au/news/safety-alerts/market-actions/rss.xml',
  },
  {
    id: 'tga-safety-updates',
    feedKey: 'safety-updates',
    category: 'safety_updates',
    url: 'https://www.tga.gov.au/news/safety-updates/rss.xml',
  },
  {
    id: 'tga-media-releases',
    feedKey: 'media-releases',
    category: 'media_releases',
    url: 'https://www.tga.gov.au/news/media-releases/rss.xml',
  },
] as const;

export function seedOperationalSources(db: HealthspanDb) {
  const t = now();
  for (const source of DEFAULT_SOURCES) {
    const existing = db.select().from(sources).where(eq(sources.id, source.id)).all();
    if (existing.length === 0) {
      db.insert(sources)
        .values({
          id: source.id,
          displayName: source.displayName,
          kind: source.kind,
          officialBaseUrl: source.officialBaseUrl,
          enabled: true,
          healthState: 'never_run',
          consecutiveFailures: 0,
          createdAt: t,
          updatedAt: t,
        })
        .run();
    }
  }

  for (const feed of DEFAULT_TGA_FEEDS) {
    const existing = db.select().from(sourceFeeds).where(eq(sourceFeeds.id, feed.id)).all();
    if (existing.length === 0) {
      db.insert(sourceFeeds)
        .values({
          id: feed.id,
          sourceId: 'tga',
          feedKey: feed.feedKey,
          url: feed.url,
          category: feed.category,
          enabled: true,
        })
        .run();
    }
  }
}
