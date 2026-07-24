import { createHash } from 'node:crypto';
import type { ConnectorFetchResult, FetchTransport, SourceConnector } from './types.js';
import { createHttpClient } from './http.js';

function hashNormalized(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function isAustraliaLocation(locations: unknown): boolean {
  if (!Array.isArray(locations)) return false;
  return locations.some((loc) => {
    const country = String((loc as { country?: string })?.country ?? '').toLowerCase();
    return country.includes('australia');
  });
}

type CtStudy = {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
    };
    statusModule?: {
      overallStatus?: string;
      startDateStruct?: { date?: string };
      primaryCompletionDateStruct?: { date?: string };
      completionDateStruct?: { date?: string };
      studyFirstPostDateStruct?: { date?: string };
      lastUpdatePostDateStruct?: { date?: string };
      resultsFirstPostDateStruct?: { date?: string };
    };
    designModule?: {
      studyType?: string;
      phases?: string[];
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name?: string };
    };
    eligibilityModule?: {
      healthyVolunteers?: boolean;
      sex?: string;
      minimumAge?: string;
      maximumAge?: string;
    };
    conditionsModule?: { conditions?: string[] };
    armsInterventionsModule?: {
      interventions?: Array<{ name?: string; type?: string }>;
    };
    outcomesModule?: {
      primaryOutcomes?: Array<{ measure?: string; description?: string; timeFrame?: string }>;
      secondaryOutcomes?: Array<{ measure?: string; description?: string; timeFrame?: string }>;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      }>;
    };
  };
  hasResults?: boolean;
  resultsSection?: unknown;
};

export function normalizeClinicalTrialStudy(
  study: CtStudy,
  lookbackDays: number,
): ConnectorFetchResult['pages'][number] {
  const p = study.protocolSection ?? {};
  const nctId = p.identificationModule?.nctId ?? 'unknown';
  const locations = p.contactsLocationsModule?.locations ?? [];
  const primaryOutcomes = p.outcomesModule?.primaryOutcomes ?? [];
  const secondaryOutcomes = p.outcomesModule?.secondaryOutcomes ?? [];
  const resultsPosted = Boolean(
    study.hasResults || p.statusModule?.resultsFirstPostDateStruct?.date,
  );
  const materialChangeHints = {
    status: p.statusModule?.overallStatus ?? null,
    resultsPosted,
    australiaLocation: isAustraliaLocation(locations),
    locationCount: locations.length,
    interventionCount: (p.armsInterventionsModule?.interventions ?? []).length,
    outcomeCount: primaryOutcomes.length + secondaryOutcomes.length,
  };
  const normalized = {
    type: 'trial',
    nctId,
    title: p.identificationModule?.briefTitle ?? p.identificationModule?.officialTitle ?? nctId,
    summary: p.identificationModule?.officialTitle ?? null,
    overallStatus: p.statusModule?.overallStatus ?? 'unknown',
    studyType: p.designModule?.studyType ?? null,
    phases: p.designModule?.phases ?? [],
    sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name ?? null,
    resultsPosted,
    healthyVolunteers: p.eligibilityModule?.healthyVolunteers ?? null,
    minAgeText: p.eligibilityModule?.minimumAge ?? null,
    maxAgeText: p.eligibilityModule?.maximumAge ?? null,
    sexEligibility: p.eligibilityModule?.sex ?? null,
    conditions: p.conditionsModule?.conditions ?? [],
    interventions: p.armsInterventionsModule?.interventions ?? [],
    outcomes: primaryOutcomes,
    secondaryOutcomes,
    locations,
    australiaLocation: isAustraliaLocation(locations),
    materialChangeHints,
    dates: {
      start: p.statusModule?.startDateStruct?.date ?? null,
      primaryCompletion: p.statusModule?.primaryCompletionDateStruct?.date ?? null,
      completion: p.statusModule?.completionDateStruct?.date ?? null,
      firstPosted: p.statusModule?.studyFirstPostDateStruct?.date ?? null,
      lastUpdatePosted: p.statusModule?.lastUpdatePostDateStruct?.date ?? null,
      resultsFirstPosted: p.statusModule?.resultsFirstPostDateStruct?.date ?? null,
    },
    canonicalUrl: `https://clinicaltrials.gov/study/${nctId}`,
    lookbackDays,
  };
  return {
    externalId: nctId,
    canonicalUrl: normalized.canonicalUrl,
    sourceUpdatedAt: normalized.dates.lastUpdatePosted ?? undefined,
    payload: study,
    normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
  };
}

/** Re-parse stored ClinicalTrials.gov API v2 JSON without network. */
export function reparseClinicalTrialsRaw(
  bytes: Buffer,
  recordCap = 1000,
  lookbackDays = 365,
): ConnectorFetchResult {
  const fetchedAt = new Date().toISOString();
  try {
    const json = JSON.parse(bytes.toString('utf8')) as { studies?: CtStudy[] };
    const pages = (json.studies ?? [])
      .slice(0, recordCap)
      .map((s) => normalizeClinicalTrialStudy(s, lookbackDays));
    return {
      connectorId: 'clinicaltrials-gov',
      fetchedAt,
      ok: true,
      pages,
      rawBodies: [{ bytes, mediaType: 'application/json', ext: 'json' }],
    };
  } catch (err) {
    return {
      connectorId: 'clinicaltrials-gov',
      fetchedAt,
      ok: false,
      pages: [],
      rawBodies: [],
      errorMessage: err instanceof Error ? err.message : 'CT.gov reparse failed',
    };
  }
}

export function createClinicalTrialsConnector(
  opts: {
    transport?: FetchTransport;
  } = {},
): SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (clinicaltrials-gov)',
    minIntervalMs: 200,
  });

  return {
    id: 'clinicaltrials-gov',
    name: 'ClinicalTrials.gov',
    enabled: true,
    async fetchWindow({ cursor, lookbackDays, recordCap }): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      const query = encodeURIComponent('aging OR longevity OR frailty OR senolytic');
      const rawBodies: ConnectorFetchResult['rawBodies'] = [];
      const pages: ConnectorFetchResult['pages'] = [];
      let pageToken = typeof cursor.pageToken === 'string' ? cursor.pageToken : undefined;
      let pagesFetched = 0;

      try {
        while (pages.length < recordCap) {
          const pageSize = Math.min(100, recordCap - pages.length);
          const tokenQ = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
          const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${query}&pageSize=${pageSize}&format=json${tokenQ}`;
          const res = await client.request(url);
          const json = (await res.json()) as {
            studies?: CtStudy[];
            nextPageToken?: string;
          };
          rawBodies.push({
            bytes: Buffer.from(JSON.stringify(json), 'utf8'),
            mediaType: 'application/json',
            ext: 'json',
          });
          const batch = (json.studies ?? []).map((s) =>
            normalizeClinicalTrialStudy(s, lookbackDays),
          );
          pages.push(...batch);
          pagesFetched += 1;
          pageToken = json.nextPageToken;
          if (!pageToken || batch.length === 0) break;
          // Fixture transports usually lack nextPageToken; stop after one page when using transport.
          if (opts.transport && pagesFetched >= 1) break;
        }

        return {
          connectorId: 'clinicaltrials-gov',
          fetchedAt,
          ok: true,
          pages: pages.slice(0, recordCap),
          nextCursor: { query, pageSize: recordCap, pageToken: pageToken ?? null },
          rawBodies,
        };
      } catch (err) {
        return {
          connectorId: 'clinicaltrials-gov',
          fetchedAt,
          ok: false,
          pages: [],
          rawBodies,
          errorMessage: err instanceof Error ? err.message : 'ClinicalTrials.gov fetch failed',
        };
      }
    },
  };
}
