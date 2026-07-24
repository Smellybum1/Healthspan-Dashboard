import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { IdentityLookupResult } from '@healthspan/connectors';
import {
  interventionAliases,
  interventionIdentifiers,
  regulatedProducts,
  regulatoryAssertions,
  type HealthspanDb,
} from '@healthspan/db';
import { normalizeForMatch, normalizeIdentifierValue } from '@healthspan/interventions';

export type CoverageCell = {
  sourceId: string;
  jurisdiction?: string;
  state:
    | 'not_checked'
    | 'checked_with_matches'
    | 'no_exact_match_found'
    | 'ambiguous'
    | 'source_unavailable'
    | 'disabled'
    | 'identity_unresolved'
    | 'parser_contract_failure';
  matchKind?: string;
  checkedAt?: string | null;
  note: string;
};

/** Default matrix before any identity/regulatory connector has run. */
export function defaultRegulatoryCoverage(): CoverageCell[] {
  return [
    {
      sourceId: 'rxnorm',
      state: 'not_checked',
      note: 'Identity vocabulary not yet queried for this entity.',
    },
    {
      sourceId: 'pubchem',
      state: 'not_checked',
      note: 'Chemical identity not yet queried.',
    },
    {
      sourceId: 'gsrs',
      state: 'not_checked',
      note: 'UNII/GSRS identity not yet queried.',
    },
    {
      sourceId: 'artg',
      jurisdiction: 'AU',
      state: 'not_checked',
      note: 'ARTG has not been queried — not the same as unapproved.',
    },
    {
      sourceId: 'drugs-at-fda',
      jurisdiction: 'US',
      state: 'not_checked',
      note: 'Drugs@FDA catalog not checked for this entity.',
    },
    {
      sourceId: 'openfda',
      jurisdiction: 'US',
      state: 'disabled',
      note: 'openFDA label/event enrichment waits for OPENFDA_API_KEY (healthy disabled state).',
    },
    {
      sourceId: 'purple-book',
      jurisdiction: 'US',
      state: 'not_checked',
      note: 'Purple Book biologic licence catalog not checked for this entity.',
    },
    {
      sourceId: 'fda-aems',
      jurisdiction: 'US',
      state: 'not_checked',
      note: 'FDA AEMS potential-signal pages not checked. Potential signals are not proven causality.',
    },
  ];
}

export function coverageFromLookup(result: IdentityLookupResult): CoverageCell {
  const state =
    result.matchKind === 'exact'
      ? 'checked_with_matches'
      : result.matchKind === 'approximate'
        ? 'ambiguous'
        : (result.matchKind as CoverageCell['state']);
  return {
    sourceId: result.connectorId,
    jurisdiction:
      result.connectorId === 'artg'
        ? 'AU'
        : result.connectorId === 'openfda' ||
            result.connectorId === 'drugs-at-fda' ||
            result.connectorId === 'purple-book' ||
            result.connectorId === 'fda-aems'
          ? 'US'
          : undefined,
    state,
    matchKind: result.matchKind,
    checkedAt: result.fetchedAt,
    note:
      result.warnings?.[0] ??
      (result.approvalNeverInferred
        ? 'Source presence or register inclusion never implies longevity approval.'
        : 'Checked.'),
  };
}

/**
 * Persist exact trusted identifiers from identity lookups as candidates/accepted IDs.
 * Approximate/ambiguous results do not auto-write identifiers.
 */
export function applyIdentityLookupToEntity(
  db: HealthspanDb,
  entityId: string,
  result: IdentityLookupResult,
): { identifiersAdded: number; productsAdded: number; assertionsAdded: number } {
  let identifiersAdded = 0;
  let productsAdded = 0;
  let assertionsAdded = 0;
  if (!result.ok || result.pages.length === 0) {
    return { identifiersAdded, productsAdded, assertionsAdded };
  }
  if (result.matchKind !== 'exact') {
    return { identifiersAdded, productsAdded, assertionsAdded };
  }

  const now = Date.now();
  for (const page of result.pages) {
    const n = page.normalized;
    const scheme = String(n.scheme ?? '');
    const value = String(
      n.rxcui ??
        n.cid ??
        n.unii ??
        n.artgId ??
        n.applicationNumber ??
        n.blaNumber ??
        n.setId ??
        page.externalId,
    );
    if (scheme && value) {
      const normalizedValue = normalizeIdentifierValue(scheme, value);
      const existing = db
        .select()
        .from(interventionIdentifiers)
        .where(
          and(
            eq(interventionIdentifiers.scheme, scheme),
            eq(interventionIdentifiers.normalizedValue, normalizedValue),
          ),
        )
        .all()[0];
      if (!existing) {
        db.insert(interventionIdentifiers)
          .values({
            id: randomUUID(),
            entityId,
            scheme,
            value,
            normalizedValue,
            sourceId: result.connectorId,
            reviewState: 'accepted',
            createdAt: now,
          })
          .run();
        identifiersAdded += 1;
      }
      if (typeof n.name === 'string' && n.name.trim()) {
        const aliasNorm = normalizeForMatch(n.name);
        const aliasHit = db
          .select()
          .from(interventionAliases)
          .all()
          .find((a) => a.entityId === entityId && a.normalizedAlias === aliasNorm);
        if (!aliasHit) {
          db.insert(interventionAliases)
            .values({
              id: randomUUID(),
              entityId,
              aliasText: n.name,
              normalizedAlias: aliasNorm,
              aliasType: 'identity_source',
              sourceId: result.connectorId,
              reviewState: 'accepted',
              collisionFlag: false,
              createdAt: now,
            })
            .run();
        }
      }
    }

    if (n.type === 'regulated_product') {
      const authority = String(n.authority);
      const nativeId = String(n.artgId ?? n.applicationNumber ?? page.externalId);
      const existingProduct = db
        .select()
        .from(regulatedProducts)
        .where(
          and(
            eq(regulatedProducts.authority, authority),
            eq(regulatedProducts.sourceNativeId, nativeId),
          ),
        )
        .all()[0];
      const productId = existingProduct?.id ?? randomUUID();
      if (!existingProduct) {
        db.insert(regulatedProducts)
          .values({
            id: productId,
            jurisdiction: String(n.jurisdiction ?? 'unknown'),
            authority,
            sourceNativeId: nativeId,
            productName: String(n.productName ?? n.brandName ?? nativeId),
            sponsor: (n.sponsor as string | null) ?? null,
            productType: (n.registrationType as string | null) ?? (n.form as string | null) ?? null,
            dosageForm: (n.form as string | null) ?? null,
            strength: (n.strength as string | null) ?? null,
            marketingStatus:
              (n.licenceStatusRaw as string | null) ?? (n.marketingStatus as string | null) ?? null,
            rawStatusWording:
              (n.licenceStatusRaw as string | null) ?? (n.marketingStatus as string | null) ?? null,
            officialUrl: (n.officialUrl as string | null) ?? null,
            matchState: 'accepted',
            createdAt: now,
            updatedAt: now,
          })
          .run();
        productsAdded += 1;
      }

      const standing = String(
        n.licenceStandingNormalized ??
          (n.marketingStatus ? 'included_or_authorised' : 'unknown_source_status'),
      );
      db.insert(regulatoryAssertions)
        .values({
          id: randomUUID(),
          productId,
          entityId,
          jurisdiction: String(n.jurisdiction ?? 'unknown'),
          authority,
          assertionKind: 'register_inclusion',
          normalizedStanding: standing,
          rawSourceStatus:
            (n.licenceStatusRaw as string | null) ?? (n.marketingStatus as string | null) ?? null,
          scopeJson: JSON.stringify({
            productName: n.productName ?? n.brandName ?? null,
            form: n.form ?? null,
            strength: n.strength ?? null,
            ingredients: n.ingredients ?? null,
          }),
          matchScope: 'product',
          currentState: 'current',
          reviewState: 'accepted',
          createdAt: now,
        })
        .run();
      assertionsAdded += 1;
    }
  }

  return { identifiersAdded, productsAdded, assertionsAdded };
}
