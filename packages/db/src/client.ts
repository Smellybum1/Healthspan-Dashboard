import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema.js';
import { resolveDataPaths, type ResolveDataPathsInput } from './paths.js';

export type HealthspanDb = BetterSQLite3Database<typeof schema>;

export type OpenDatabaseOptions = ResolveDataPathsInput & {
  dbPath?: string;
  migrateOnOpen?: boolean;
  readonly?: boolean;
};

function migrationsFolder(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, '..', 'migrations');
}

export function ensureDataDirectories(dataDir: string, rawDir: string) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(rawDir, 'sha256'), { recursive: true });
}

export function openDatabase(options: OpenDatabaseOptions = {}): {
  db: HealthspanDb;
  sqlite: Database.Database;
  paths: ReturnType<typeof resolveDataPaths> & { dbPath: string };
} {
  const paths = options.dbPath
    ? {
        ...resolveDataPaths(options),
        dbPath: options.dbPath,
        dataDir: path.dirname(options.dbPath),
        rawDir: path.join(path.dirname(options.dbPath), 'raw'),
      }
    : resolveDataPaths(options);

  ensureDataDirectories(paths.dataDir, paths.rawDir);

  const sqlite = new Database(paths.dbPath, { readonly: options.readonly ?? false });
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('busy_timeout = 5000');

  const db = drizzle(sqlite, { schema });

  if (options.migrateOnOpen !== false) {
    const folder = migrationsFolder();
    if (fs.existsSync(folder)) {
      migrate(db, { migrationsFolder: folder });
    }
  }

  return { db, sqlite, paths };
}

export function closeDatabase(sqlite: Database.Database) {
  sqlite.close();
}

export function databaseDoctor(sqlite: Database.Database): {
  ok: boolean;
  integrity: string;
  foreignKeys: string;
  journalMode: string;
} {
  const integrity = String(sqlite.pragma('integrity_check', { simple: true }));
  const foreignKeys = String(sqlite.pragma('foreign_key_check'));
  const journalMode = String(sqlite.pragma('journal_mode', { simple: true }));
  return {
    ok: integrity === 'ok' && foreignKeys === '',
    integrity,
    foreignKeys: foreignKeys || 'ok',
    journalMode,
  };
}
