# Design system

## Intent

Calm, premium, scientific, modern. Dark default with optional light theme. Not cyberpunk, casino-like, or aggressively neon.

## Tokens

CSS variables in `apps/web/src/index.css`:

- Surfaces: deep graphite/navy (`--bg`, `--surface`, `--surface-2`)
- Text: warm off-white (`--fg`), muted slate (`--muted`)
- Teal: verified / established
- Amber: emerging / uncertain
- Rose: genuine safety/regulatory warnings
- Sky: informational regulatory/off-label accents

## Typography

- UI: IBM Plex Sans
- Display headings: Source Serif 4

## Components

- Compact top bar: search, as-of, source health, theme toggle
- Collapsible left nav (desktop) / drawer (mobile)
- Rounded cards that stay restrained
- Evidence/regulatory/safety badges always include text labels (not colour alone)
- Persistent informational disclaimer in the footer; stronger alerts on unapproved peptides

## Signal Radar

Recharts scatter plot with shape filters, tooltips, and an accessible data table alternative.
