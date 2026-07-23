import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { resolveDataPaths, rawSnapshotRelativeKey } from './paths.js';

describe('resolveDataPaths', () => {
  it('uses LOCALAPPDATA on Windows', () => {
    const paths = resolveDataPaths({
      platform: 'win32',
      env: { LOCALAPPDATA: 'C:\\Users\\tom\\AppData\\Local' },
      homeDir: 'C:\\Users\\tom',
    });
    expect(paths.dbPath.replace(/\//g, '\\')).toBe(
      'C:\\Users\\tom\\AppData\\Local\\Healthspan Dashboard\\healthspan-dashboard.sqlite3',
    );
    expect(paths.source).toBe('win32');
  });

  it('errors when LOCALAPPDATA missing on Windows', () => {
    expect(() =>
      resolveDataPaths({ platform: 'win32', env: {}, homeDir: 'C:\\Users\\tom' }),
    ).toThrow(/LOCALAPPDATA/);
  });

  it('uses Application Support on macOS', () => {
    const paths = resolveDataPaths({
      platform: 'darwin',
      env: {},
      homeDir: '/Users/tom',
    });
    expect(paths.dbPath).toBe(
      '/Users/tom/Library/Application Support/Healthspan Dashboard/healthspan-dashboard.sqlite3',
    );
  });

  it('uses XDG_DATA_HOME on Linux when set', () => {
    const paths = resolveDataPaths({
      platform: 'linux',
      env: { XDG_DATA_HOME: '/custom/share' },
      homeDir: '/home/tom',
    });
    expect(paths.dbPath).toBe('/custom/share/healthspan-dashboard/healthspan-dashboard.sqlite3');
    expect(paths.source).toBe('linux-xdg');
  });

  it('falls back to ~/.local/share on Linux', () => {
    const paths = resolveDataPaths({
      platform: 'linux',
      env: {},
      homeDir: '/home/tom',
    });
    expect(paths.dbPath).toBe(
      '/home/tom/.local/share/healthspan-dashboard/healthspan-dashboard.sqlite3',
    );
  });

  it('accepts absolute HEALTHSPAN_DATA_DIR override', () => {
    const paths = resolveDataPaths({
      platform: 'win32',
      env: {
        LOCALAPPDATA: 'C:\\Users\\tom\\AppData\\Local',
        HEALTHSPAN_DATA_DIR: 'D:\\HealthspanData',
      },
    });
    expect(paths.dataDir).toBe('D:\\HealthspanData');
    expect(paths.source).toBe('override');
  });

  it('rejects relative production override', () => {
    expect(() =>
      resolveDataPaths({
        platform: 'win32',
        env: { LOCALAPPDATA: 'C:\\x', HEALTHSPAN_DATA_DIR: '.local-data' },
      }),
    ).toThrow(/absolute/);
  });

  it('allows relative override when explicitly enabled', () => {
    const paths = resolveDataPaths({
      platform: 'win32',
      env: { LOCALAPPDATA: 'C:\\x', HEALTHSPAN_DATA_DIR: '.local-data' },
      allowRelativeOverride: true,
      cwd: 'C:\\repo',
    });
    expect(paths.dataDir).toBe(path.resolve('C:\\repo', '.local-data'));
  });

  it('builds content-addressed raw keys', () => {
    const hash = 'a'.repeat(64);
    expect(rawSnapshotRelativeKey(hash, 'json')).toBe(`sha256/aa/${hash}.json.gz`);
  });

  it('uses a real temp directory for isolation smoke', () => {
    const tmp = path.join(os.tmpdir(), `hs-path-${Date.now()}`);
    const paths = resolveDataPaths({
      platform: 'linux',
      env: { HEALTHSPAN_DATA_DIR: tmp },
    });
    expect(paths.dbPath.startsWith(tmp)).toBe(true);
  });
});
