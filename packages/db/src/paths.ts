import { homedir } from 'node:os';
import path from 'node:path';

export type PathPlatform = 'win32' | 'darwin' | 'linux';

export type ResolveDataPathsInput = {
  platform?: PathPlatform | NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  /**
   * When true, relative HEALTHSPAN_DATA_DIR is allowed and resolved from cwd
   * (developer override only, e.g. `.local-data`).
   */
  allowRelativeOverride?: boolean;
  cwd?: string;
};

export type DataPaths = {
  dataDir: string;
  dbPath: string;
  rawDir: string;
  source: 'override' | 'win32' | 'darwin' | 'linux' | 'linux-xdg' | 'test';
};

const DB_FILENAME = 'healthspan-dashboard.sqlite3';

function pathApiFor(platform: PathPlatform | NodeJS.Platform) {
  return platform === 'win32' ? path.win32 : path.posix;
}

function requireAbsolute(p: string, label: string, api: path.PlatformPath) {
  if (!api.isAbsolute(p)) {
    throw new Error(`${label} must be an absolute path (got: ${p})`);
  }
}

/**
 * Resolve per-user application-data paths for Healthspan Dashboard.
 * Production default is never inside the Git repository.
 */
export function resolveDataPaths(input: ResolveDataPathsInput = {}): DataPaths {
  const platform = (input.platform ?? process.platform) as PathPlatform | NodeJS.Platform;
  const env = input.env ?? process.env;
  const home = input.homeDir ?? homedir();
  const cwd = input.cwd ?? process.cwd();
  // Override paths use the host OS path API (real filesystem on this machine).
  const hostApi = pathApiFor(process.platform);
  const targetApi = pathApiFor(platform);

  if (env.HEALTHSPAN_DATA_DIR && env.HEALTHSPAN_DATA_DIR.trim()) {
    const raw = env.HEALTHSPAN_DATA_DIR.trim();
    const dataDir = hostApi.isAbsolute(raw)
      ? hostApi.normalize(raw)
      : input.allowRelativeOverride
        ? hostApi.resolve(cwd, raw)
        : (() => {
            throw new Error(
              'HEALTHSPAN_DATA_DIR must be absolute in normal runtime. Use allowRelativeOverride only for explicit developer/test overrides.',
            );
          })();
    requireAbsolute(dataDir, 'HEALTHSPAN_DATA_DIR', hostApi);
    return {
      dataDir,
      dbPath: hostApi.join(dataDir, DB_FILENAME),
      rawDir: hostApi.join(dataDir, 'raw'),
      source: 'override',
    };
  }

  if (platform === 'win32') {
    const local = env.LOCALAPPDATA;
    if (!local) {
      throw new Error(
        'LOCALAPPDATA is required on Windows to resolve the Healthspan data directory.',
      );
    }
    const dataDir = targetApi.join(local, 'Healthspan Dashboard');
    return {
      dataDir,
      dbPath: targetApi.join(dataDir, DB_FILENAME),
      rawDir: targetApi.join(dataDir, 'raw'),
      source: 'win32',
    };
  }

  if (platform === 'darwin') {
    const dataDir = targetApi.join(home, 'Library', 'Application Support', 'Healthspan Dashboard');
    return {
      dataDir,
      dbPath: targetApi.join(dataDir, DB_FILENAME),
      rawDir: targetApi.join(dataDir, 'raw'),
      source: 'darwin',
    };
  }

  // linux and others
  if (env.XDG_DATA_HOME && env.XDG_DATA_HOME.trim()) {
    const dataDir = targetApi.join(env.XDG_DATA_HOME.trim(), 'healthspan-dashboard');
    return {
      dataDir,
      dbPath: targetApi.join(dataDir, DB_FILENAME),
      rawDir: targetApi.join(dataDir, 'raw'),
      source: 'linux-xdg',
    };
  }

  const dataDir = targetApi.join(home, '.local', 'share', 'healthspan-dashboard');
  return {
    dataDir,
    dbPath: targetApi.join(dataDir, DB_FILENAME),
    rawDir: targetApi.join(dataDir, 'raw'),
    source: 'linux',
  };
}

export function rawSnapshotRelativeKey(sha256: string, ext: string): string {
  const hash = sha256.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error('sha256 must be 64 lowercase hex characters');
  }
  const safeExt = ext.replace(/^\./, '').replace(/[^a-z0-9._-]/gi, '');
  return path.posix.join('sha256', hash.slice(0, 2), `${hash}.${safeExt}.gz`);
}
