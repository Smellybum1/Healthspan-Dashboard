# WCAG 2.2 Level AA checklist (target)

This project targets **WCAG 2.2 Level AA**. Automated checks support, but do not prove, conformance. This is not a certification claim.

## Critical pages

- Today / dashboard
- Alerts
- Watchlists / saved searches
- Brief detail
- Operations
- Review queues

## Automated

- `pnpm accessibility:audit` — static structural checks (≥24 states)
- Playwright/axe on critical routes when E2E runs (no serious/critical on scanned pages)

## Manual critical flows

| Flow                      | Keyboard           | Focus visible | Screen reader status | Reduced motion                   | Notes |
| ------------------------- | ------------------ | ------------- | -------------------- | -------------------------------- | ----- |
| Navigate primary IA       | PASS target        | PASS target   | landmarks            | respect `prefers-reduced-motion` |       |
| Open/close dialogs        | trap/restore       | PASS target   | announce             |                                  |       |
| Alert acknowledge         | PASS target        | PASS target   | live region          |                                  |       |
| Watchlist add             | PASS target        | PASS target   |                      |                                  |       |
| 200% zoom                 | usable             |               |                      |                                  |       |
| 400% reflow (applicable)  | usable             |               |                      |                                  |       |
| Colour-independent status | text/icon + colour |               |                      |                                  |       |

## Residual risks

- Chart alternatives must remain available as tables/text on evidence views.
- Touch targets documented at ≥24×24 CSS px where interactive.
