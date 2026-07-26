import { describe, expect, it } from 'vitest';
import type { ContentReadRepository } from '@healthspan/core';

/**
 * Adapter-agnostic contract for {@link ContentReadRepository}.
 *
 * This is the parity harness in its smallest form. Every adapter — local SQLite today,
 * Sites/D1 next — runs *this same suite* rather than a parallel one written against its
 * own assumptions. Parity that is asserted by two separately-authored test files is not
 * parity; it is two opinions.
 *
 * `seed` receives the fixture rows the suite needs and must make them retrievable
 * through the adapter under test.
 */
export type ContentContractHarness = {
  /** Human-readable adapter name, used in the suite title. */
  name: string;
  /** Build a repository whose backing store contains exactly the given items. */
  create(items: ContentContractFixture[]): Promise<ContentReadRepository>;
};

export type ContentContractFixture = {
  id: string;
  type: string;
  title: string;
  summary: string | null;
  sourcePublishedAt: number | null;
  updatedAt: number;
  canonicalUrl: string | null;
};

const BASE = Date.UTC(2026, 0, 1);

export const CONTENT_CONTRACT_FIXTURES: ContentContractFixture[] = [
  {
    id: 'c-alpha',
    type: 'paper',
    title: 'Alpha metformin cohort',
    summary: 'A demo paper about metformin.',
    sourcePublishedAt: BASE,
    updatedAt: BASE + 3_000,
    canonicalUrl: 'https://example.invalid/alpha',
  },
  {
    id: 'c-bravo',
    type: 'trial',
    title: 'Bravo senolytic trial',
    summary: null,
    sourcePublishedAt: BASE + 1_000,
    updatedAt: BASE + 2_000,
    canonicalUrl: null,
  },
  {
    id: 'c-charlie',
    type: 'paper',
    title: 'Charlie rapamycin review',
    summary: 'Mentions METFORMIN in upper case.',
    sourcePublishedAt: null,
    updatedAt: BASE + 1_000,
    canonicalUrl: null,
  },
];

export function runContentReadContract(harness: ContentContractHarness) {
  describe(`ContentReadRepository contract — ${harness.name}`, () => {
    it('returns every item with normalised paging metadata', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const result = await repo.list({});
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.items).toHaveLength(3);
    });

    it('maps rows to the shared DTO shape', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const { items } = await repo.list({ type: 'trial' });
      expect(items).toHaveLength(1);
      const item = items[0]!;
      expect(item).toMatchObject({
        id: 'c-bravo',
        type: 'trial',
        title: 'Bravo senolytic trial',
        summary: '', // null summary normalises to empty string
        tags: [],
        dataOrigin: 'live',
      });
      // Absent canonical URL must be omitted, not null.
      expect(item.officialUrl).toBeUndefined();
      expect(item.updatedAt).toBe(new Date(BASE + 2_000).toISOString());
      expect(item.publishedAt).toBe(new Date(BASE + 1_000).toISOString());
    });

    it('reports a null published date as null rather than an epoch string', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const { items } = await repo.list({ q: 'rapamycin' });
      expect(items).toHaveLength(1);
      expect(items[0]!.publishedAt).toBeNull();
    });

    it('filters by type', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const result = await repo.list({ type: 'paper' });
      expect(result.total).toBe(2);
      expect(result.items.map((i) => i.id).sort()).toEqual(['c-alpha', 'c-charlie']);
    });

    it('searches title and summary case-insensitively', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const result = await repo.list({ q: 'metformin' });
      // Matches the alpha title and the charlie summary, which is upper case.
      expect(result.items.map((i) => i.id).sort()).toEqual(['c-alpha', 'c-charlie']);
      expect(result.total).toBe(2);
    });

    it('counts the filtered set, not the whole table', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const result = await repo.list({ type: 'trial', pageSize: 1 });
      expect(result.total).toBe(1);
    });

    it('sorts by updated descending by default', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const { items } = await repo.list({});
      expect(items.map((i) => i.id)).toEqual(['c-alpha', 'c-bravo', 'c-charlie']);
    });

    it('sorts by title ascending on request', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const { items } = await repo.list({ sort: 'title' });
      expect(items.map((i) => i.id)).toEqual(['c-alpha', 'c-bravo', 'c-charlie']);
    });

    it('clamps page size to the shared bounds', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      expect((await repo.list({ pageSize: 1_000 })).pageSize).toBe(100);
      expect((await repo.list({ pageSize: 0 })).pageSize).toBe(1);
      expect((await repo.list({ page: -5 })).page).toBe(1);
    });

    it('pages without overlap', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const first = await repo.list({ pageSize: 2, page: 1 });
      const second = await repo.list({ pageSize: 2, page: 2 });
      expect(first.items).toHaveLength(2);
      expect(second.items).toHaveLength(1);
      expect(first.total).toBe(3);
      expect(second.total).toBe(3);
      const ids = new Set([...first.items, ...second.items].map((i) => i.id));
      expect(ids.size).toBe(3);
    });

    it('returns an empty page rather than throwing past the end', async () => {
      const repo = await harness.create(CONTENT_CONTRACT_FIXTURES);
      const result = await repo.list({ page: 99 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(3);
    });
  });
}
