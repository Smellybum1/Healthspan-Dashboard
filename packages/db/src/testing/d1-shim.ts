import type Database from 'better-sqlite3';
import type { D1Database, D1PreparedStatement, D1Result } from '@healthspan/core';

/**
 * A D1 binding surface backed by a local `better-sqlite3` handle. **Test support only.**
 *
 * ## What binding the contract suite through this actually proves
 *
 * The adapter under test is the real one, and so is the driver: `drizzle-orm/d1` builds
 * the SQL, prepares it, binds parameters, and takes its async `all` / `raw` / `run`
 * paths. So a green contract run demonstrates that the D1 adapter's query construction
 * produces SQL that executes and returns results matching the same eleven assertions the
 * local adapter satisfies — filtering, case-insensitive search, sort order, filtered
 * counts, paging bounds, and the null-summary and null-published normalisations.
 *
 * ## What it does not prove
 *
 * This is not D1. It does not exercise the D1 service at all, and nothing here is
 * evidence about:
 *
 * - network behaviour, request size caps, statement timeouts, or result-set limits;
 * - the real `meta` fields, which this shim returns as an empty object;
 * - `batch` atomicity — here it is a sequential loop, not a transaction;
 * - migrations applied to a real D1 database;
 * - any difference between D1's SQLite build and the local one.
 *
 * The database this wraps is opened by `openDatabase()` and migrated by the project's
 * own migrations, so the schema under test is the real schema rather than hand-written
 * DDL. That removes schema drift from the list of things this could be wrong about, but
 * it does not turn the shim into the hosted runtime.
 *
 * Closing that gap is the `sites:parity` row: a corpus run against a provisioned D1
 * instance. Until that exists, no ledger row may claim hosted verification on the
 * strength of this file.
 */

function toBindable(value: unknown): unknown {
  // SQLite bindings accept no booleans. Drizzle maps its own boolean columns, but a raw
  // predicate can still produce one, and silently failing to bind would look like a
  // query bug rather than a shim gap.
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === undefined) return null;
  return value;
}

const EMPTY_META: Record<string, unknown> = {};

class ShimPreparedStatement implements D1PreparedStatement {
  constructor(
    private readonly sqlite: Database.Database,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  /** Returns a new statement rather than mutating: the driver re-binds one prepared query repeatedly. */
  bind(...values: unknown[]): D1PreparedStatement {
    return new ShimPreparedStatement(this.sqlite, this.sql, values.map(toBindable));
  }

  private prepared() {
    return this.sqlite.prepare(this.sql);
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const stmt = this.prepared();
    if (!stmt.reader) {
      const info = stmt.run(...this.params);
      return { results: [], success: true, meta: { changes: info.changes } };
    }
    return { results: stmt.all(...this.params) as T[], success: true, meta: EMPTY_META };
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const stmt = this.prepared();
    if (!stmt.reader) {
      stmt.run(...this.params);
      return [];
    }
    return stmt.raw(true).all(...this.params) as T[];
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const stmt = this.prepared();
    if (!stmt.reader) {
      stmt.run(...this.params);
      return null;
    }
    const row = stmt.get(...this.params) as Record<string, unknown> | undefined;
    if (row === undefined) return null;
    return (colName ? (row[colName] as T) : (row as T)) ?? null;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    const stmt = this.prepared();
    if (stmt.reader) {
      return { results: stmt.all(...this.params) as T[], success: true, meta: EMPTY_META };
    }
    // `changes` is not decoration: the conditional job claim reads it to decide whether
    // this caller won the race, so the shim has to report the real count.
    const info = stmt.run(...this.params);
    return { results: [], success: true, meta: { changes: info.changes } };
  }
}

export function createD1Shim(sqlite: Database.Database): D1Database {
  return {
    prepare(query: string): D1PreparedStatement {
      return new ShimPreparedStatement(sqlite, query);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<D1Result<T>>> {
      // Sequential, not transactional — see the caveats above.
      const out: Array<D1Result<T>> = [];
      for (const statement of statements) out.push(await statement.all<T>());
      return out;
    },
  };
}
