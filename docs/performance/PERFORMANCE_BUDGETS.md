# Performance budgets

Local production-facing budgets for Milestone 6. Measured with `pnpm performance:check` after `pnpm build` when possible.

## Hardware note

Record machine class in the completion report (OS, CPU, RAM). Deviations require justification.

## API p95 targets (local loopback, generated-scale dataset)

| Surface            | Target p95 |
| ------------------ | ---------- |
| Personalised Today | ≤ 250 ms   |
| Alerts             | ≤ 250 ms   |
| Watchlist list     | ≤ 250 ms   |
| Saved search       | ≤ 400 ms   |
| Brief detail       | ≤ 250 ms   |
| Since last visit   | ≤ 250 ms   |
| Operations         | ≤ 300 ms   |
| Production startup | ≤ 5 s      |

## Web budgets

| Asset              | Budget   |
| ------------------ | -------- |
| Largest initial JS | ≤ 900 KB |
| Total CSS          | ≤ 200 KB |
| Lazy route chunk   | ≤ 400 KB |

## Backup

Archive creation must stream/bound temporary files and avoid loading unbounded trees into memory beyond declared caps.
