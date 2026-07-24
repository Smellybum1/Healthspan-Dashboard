# Backup and restore

## Tiers

- `recovery_checkpoint` — local unencrypted recovery snapshot (default for scheduled/pre-restore)
- `portable_core` — encrypted portable archive (SQLite snapshot + manifest)
- `portable_full` — encrypted portable archive plus permitted official raw objects

## Format

Files use extension `.healthspan-backup` with magic `HSBKUP01`, AES-256-GCM, and versioned scrypt when encrypted.

Inner ZIP layout:

```text
manifest.json
database/healthspan-dashboard.sqlite3
checksums.json
raw/sha256/...   # portable_full only
```

Snapshots are taken with the SQLite Online Backup API (`better-sqlite3` `backup()`), never by copying a live WAL file.

## Commands

```text
pnpm backup:create -- --tier recovery_checkpoint
pnpm backup:create -- --tier portable_core --passphrase <secret>
pnpm backup:list
pnpm backup:verify -- --input <file>
pnpm backup:restore -- --input <file>
pnpm backup:prune -- --keep 14
pnpm backup:doctor
pnpm backup:eval
```

Restore is CLI-only, requires exclusive lock (or `HEALTHSPAN_RESTORE_FORCE=1` for controlled automation), creates a mandatory pre-restore recovery checkpoint, and rolls back on failed post-restore verification.
