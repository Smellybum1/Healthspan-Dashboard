import fs from 'node:fs';
import path from 'node:path';

export type ExclusiveLockHandle = {
  lockPath: string;
  release: () => void;
};

const DEFAULT_STALE_MS = 30 * 60 * 1000;

export function exclusiveLockPath(dataDir: string, name = 'healthspan.exclusive.lock') {
  return path.join(dataDir, name);
}

/**
 * Windows-safe exclusive lock via O_EXCL create.
 * Stale locks (dead pid or aged) are recovered.
 */
export function acquireExclusiveLock(
  dataDir: string,
  opts: { staleMs?: number; owner?: string } = {},
): ExclusiveLockHandle {
  fs.mkdirSync(dataDir, { recursive: true });
  const lockPath = exclusiveLockPath(dataDir);
  const staleMs = opts.staleMs ?? DEFAULT_STALE_MS;
  const payload = JSON.stringify({
    pid: process.pid,
    owner: opts.owner ?? 'healthspan',
    createdAt: Date.now(),
  });

  const tryCreate = () => {
    const fd = fs.openSync(lockPath, 'wx');
    try {
      fs.writeSync(fd, payload);
    } finally {
      fs.closeSync(fd);
    }
  };

  try {
    tryCreate();
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'EEXIST') throw err;
    let existing: { pid?: number; createdAt?: number; owner?: string } = {};
    try {
      existing = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as typeof existing;
    } catch {
      existing = {};
    }
    const age = Date.now() - Number(existing.createdAt ?? 0);
    const pidAlive =
      typeof existing.pid === 'number'
        ? (() => {
            try {
              process.kill(existing.pid, 0);
              return true;
            } catch {
              return false;
            }
          })()
        : false;
    if (pidAlive && age < staleMs) {
      throw new Error(
        `exclusive-lock-held: owner=${existing.owner ?? 'unknown'} pid=${existing.pid}`,
      );
    }
    fs.rmSync(lockPath, { force: true });
    tryCreate();
  }

  return {
    lockPath,
    release: () => {
      try {
        const cur = fs.readFileSync(lockPath, 'utf8');
        if (cur.includes(String(process.pid))) fs.rmSync(lockPath, { force: true });
      } catch {
        /* already released */
      }
    },
  };
}

export function assertNoExclusiveLock(dataDir: string) {
  const lockPath = exclusiveLockPath(dataDir);
  if (!fs.existsSync(lockPath)) return;
  try {
    const existing = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as {
      pid?: number;
      createdAt?: number;
    };
    try {
      if (typeof existing.pid === 'number') process.kill(existing.pid, 0);
      throw new Error(`exclusive-lock-held: pid=${existing.pid}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('exclusive-lock-held')) throw err;
      fs.rmSync(lockPath, { force: true });
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('exclusive-lock-held')) throw err;
  }
}
