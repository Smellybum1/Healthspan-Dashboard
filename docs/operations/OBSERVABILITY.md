# Observability

Local-only observability:

- Rotating/redacted JSONL operational logs (no external telemetry)
- Correlation IDs on request/job boundaries where wired
- Bounded operational metrics in SQLite operational event tables
- Startup/shutdown markers

`redactLogLine` strips tokens, bearer credentials, passphrases, and emails before persistence or diagnostics export.
