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

export function createClinicalTrialsConnector(opts: {
  transport?: FetchTransport;
} = {}): SourceConnector {
  const client = createHttpClient({
    transport: opts.transport,
    userAgent: 'HealthspanDashboard/0.2 (clinicaltrials-gov)',
    minIntervalMs: 200,
  });

  return {
    id: 'clinicaltrials-gov',
    name: 'ClinicalTrials.gov',
    enabled: true,
    async fetchWindow({ lookbackDays, recordCap }): Promise<ConnectorFetchResult> {
      const fetchedAt = new Date().toISOString();
      const query = encodeURIComponent('aging OR longevity OR frailty OR senolytic');
      const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${query}&pageSize=${Math.min(recordCap, 100)}&format=json`;

      try {
        const res = await client.request(url);
        const json = (await res.json()) as {
          studies?: Array<{
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
          }>;
        };

        const studies = json.studies ?? [];
        const pages = studies.slice(0, recordCap).map((study) => {
          const p = study.protocolSection ?? {};
          const nctId = p.identificationModule?.nctId ?? 'unknown';
          const locations = p.contactsLocationsModule?.locations ?? [];
          const normalized = {
            type: 'trial',
            nctId,
            title: p.identificationModule?.briefTitle ?? p.identificationModule?.officialTitle ?? nctId,
            summary: p.identificationModule?.officialTitle ?? null,
            overallStatus: p.statusModule?.overallStatus ?? 'unknown',
            studyType: p.designModule?.studyType ?? null,
            phases: p.designModule?.phases ?? [],
            sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name ?? null,
            resultsPosted: Boolean(study.hasResults || p.statusModule?.resultsFirstPostDateStruct?.date),
            healthyVolunteers: p.eligibilityModule?.healthyVolunteers ?? null,
            minAgeText: p.eligibilityModule?.minimumAge ?? null,
            maxAgeText: p.eligibilityModule?.maximumAge ?? null,
            sexEligibility: p.eligibilityModule?.sex ?? null,
            conditions: p.conditionsModule?.conditions ?? [],
            interventions: p.armsInterventionsModule?.interventions ?? [],
            outcomes: p.outcomesModule?.primaryOutcomes ?? [],
            locations,
            australiaLocation: isAustraliaLocation(locations),
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
            sourceUpdatedAt: normalized.dates.lastUpdatePosted,
            payload: study,
            normalized: { ...normalized, normalizedHash: hashNormalized(normalized) },
          };
        });

        return {
          connectorId: 'clinicaltrials-gov',
          fetchedAt,
          ok: true,
          pages,
          nextCursor: { query, pageSize: recordCap },
          rawBodies: [
            {
              bytes: Buffer.from(JSON.stringify(json), 'utf8'),
              mediaType: 'application/json',
              ext: 'json',
            },
          ],
        };
      } catch (err) {
        return {
          connectorId: 'clinicaltrials-gov',
          fetchedAt,
          ok: false,
          pages: [],
          rawBodies: [],
          errorMessage: err instanceof Error ? err.message : 'ClinicalTrials.gov fetch failed',
        };
      }
    },
  };
}
