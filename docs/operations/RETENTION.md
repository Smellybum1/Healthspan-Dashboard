# Retention

Default retention rules live in `@healthspan/operations` (`DEFAULT_RETENTION_RULES`).

```text
pnpm retention:preview
pnpm retention:apply
```

Preview is required before apply. Protected classes:

- Newest successful recovery checkpoint
- Pre-restore checkpoints until restore succeeds
- Backups referenced by an active restore
- Content-addressed raw objects still referenced

Platform retention policies remain authoritative for platform-derived text.
