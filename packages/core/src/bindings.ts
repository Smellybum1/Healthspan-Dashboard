/**
 * Structural shapes for the Sites platform bindings.
 *
 * Milestone 7 fixes two binding names: `DB` (D1) and `FILES` (R2). These interfaces are
 * a deliberate subset of the platform APIs — the operations the D1 adapters and the
 * hosted app actually call, not a re-declaration of `@cloudflare/workers-types`. They
 * live in `@healthspan/core` rather than in either consumer so `apps/sites` and the
 * `sites-d1` adapters cannot describe the same binding two different ways.
 *
 * The statement surface below is exactly what `drizzle-orm/d1` invokes: `prepare`,
 * `bind`, then one of `all`, `raw`, or `run`. `raw` matters as much as `all` — Drizzle
 * takes the array-mode path whenever a query has a selected field list, which is every
 * query the read adapters issue.
 */

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  /** Array-mode rows: one array of column values per row, no column names. */
  raw<T = unknown[]>(): Promise<T[]>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<D1Result<T>>>;
}

export interface R2Bucket {
  head(key: string): Promise<unknown | null>;
  get(key: string): Promise<unknown | null>;
  put(key: string, value: ArrayBuffer | ArrayBufferView | string): Promise<unknown>;
  delete(key: string): Promise<void>;
}
