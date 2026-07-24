Milestone 2 is now issued and authorised

1. SQLite path and filename

Use the operating system’s per-user application-data directory, not the Git repository.

Windows default
%LOCALAPPDATA%\Healthspan Dashboard\healthspan-dashboard.sqlite3

Typical resolved path:

C:\Users\<username>\AppData\Local\Healthspan Dashboard\healthspan-dashboard.sqlite3

Raw source snapshots will be stored alongside it:

%LOCALAPPDATA%\Healthspan Dashboard\
├─ healthspan-dashboard.sqlite3
└─ raw\
└─ sha256\
└─ <first-two-hash-characters>\
└─ <full-sha256>.<json|xml|rss>.gz

The cross-platform defaults are:

macOS:
~/Library/Application Support/Healthspan Dashboard/healthspan-dashboard.sqlite3

Linux:
${XDG_DATA_HOME:-~/.local/share}/healthspan-dashboard/healthspan-dashboard.sqlite3

The controlling rules are:

HEALTHSPAN_DATA_DIR overrides the application-data directory.

Normal-runtime overrides must be absolute paths.

.local-data/ inside the repository is allowed only as an explicit developer override and must be gitignored.

Tests use isolated temporary databases.

Platform-specific path resolution belongs centrally in @healthspan/db.

Add pnpm data:path to show the resolved database and raw-storage locations.

Use drizzle-orm, drizzle-kit, and better-sqlite3.

Configure the local connection with foreign keys, WAL mode, normal synchronous mode, and a 5-second busy timeout.

2. First connector set and order

Keep all four planned connector families. Implement and run them in this order:

1. PubMed
2. ClinicalTrials.gov
3. Crossref exact-DOI enrichment
4. TGA RSS
   PubMed

This is the primary paper-discovery and bibliographic source.

Use NCBI E-utilities with ESearch followed by batched EFetch. It must support the optional NCBI API key, appropriate application identification, pagination, overlap windows, XML snapshots, corrections, and retractions.

ClinicalTrials.gov

Use API v2 JSON.

This establishes trial versioning and the most important deterministic trial events, including:

Status changes

Results first posted

Withdrawn, suspended, or terminated trials

Material enrollment changes

Completion-date changes

Intervention and primary-outcome changes

Australian trial sites being added or removed

Crossref

Crossref is enrichment-only during Milestone 2.

It should perform exact DOI lookups for papers already held locally. It must not run a second broad paper-discovery pipeline.

It may enrich:

Publisher and venue metadata

Licences

Funding

ORCID and ROR identifiers

Deposited and update dates

Correction and retraction relationships

Other post-publication relationships

PubMed remains the primary source for PMID-linked bibliographic fields.

TGA RSS

Use these four TGA feed categories:

Safety alerts
Market actions
Safety updates
Media releases

Do not include the broad general-news feed in Milestone 2.

Each feed must fail independently. Ingest all entries returned by the selected feeds, then apply a deterministic, versioned longevity-relevance matcher for display.

ANZCTR remains deferred. Do not scrape it or create a placeholder production connector during Milestone 2.

3. D1 and ChatGPT Sites constraints

D1 and Sites constraints should shape the Milestone 2 schema now, but actual D1/Sites implementation waits until Milestone 7.

Milestone 2 must therefore use conservative, portable SQLite conventions:

Application-generated text UUIDs

Integer UTC timestamps in the database

ISO 8601 timestamps at API boundaries

Integer-backed booleans

Text enums validated with Zod

Ordinary tables, indexes, foreign keys, and explicit transactions

Junction tables for queryable relationships

Small validated JSON text only for cursors, diagnostics, parser metadata, and change diffs

Repository interfaces around the local database driver

A RawSnapshotStore interface around local files

A replaceable Scheduler interface

No schema dependency on local filesystem paths

No triggers, generated columns, stored procedures, custom SQLite extensions, or FTS5 dependency

Milestone 2 must not add:

.openai/hosting.json
D1 bindings
R2 bindings
Wrangler
Cloudflare runtime packages
Sites deployment configuration
Hosted scheduling

Those will be assessed and implemented in Milestone 7 against the Sites environment that exists at that time.

Required data-model correction

Replace the Milestone 1 canonical field:

TypeScript
demo: true

with:

TypeScript
dataOrigin: "demo" | "live"

Application and API state should use:

TypeScript
dataMode: "demo" | "live"

All seed records become dataOrigin: "demo". All SQLite-ingested records become dataOrigin: "live".

Demo and Live records must never be combined in one response or screen. A temporary internal compatibility adapter is acceptable while refactoring, but the completed Milestone 2 domain schemas and UI must use dataOrigin and dataMode.

Full Milestone 2 execution brief

The attached brief contains the complete architecture, database model, connector requirements, raw-snapshot system, ingestion engine, change-detection rules, API/UI work, scheduler, commands, tests, documentation requirements, 35 acceptance criteria, and completion-report format.

healthspan_dashboard_milestone_2_execution_brief.md

Controlling instruction for Grok

Begin Healthspan Dashboard Milestone 2 from the latest main. Create and work on milestone-2/persistent-data-backbone. Implement the complete persistent data backbone and official-source ingestion system within the supplied execution brief. Make routine implementation decisions autonomously. Replace the canonical demo: true field with dataOrigin: "demo" | "live", preserve strict Live/Demo separation, do not fabricate scientific assessments for Live data, and do not begin Milestone 3. When every acceptance criterion is met, push the branch, commit the required completion report, report the final commit hash and exact test results, and stop.

Milestone 2 is authorised

I reviewed the Milestone 1 implementation and completion report. The existing Hono API/repository boundary is appropriate for replacing seeded-memory persistence with SQLite. Milestone 1 currently has 89 seeded demo records, no database, no live connectors, and passing lint, type-check, unit, E2E, and build gates.
GitHub

1. SQLite path convention

Use the operating system’s per-user application-data directory, not the repository.

Windows default
%LOCALAPPDATA%\Healthspan Dashboard\
├─ healthspan-dashboard.sqlite3
└─ raw\
└─ sha256\
└─ <first-two-hash-characters>\
└─ <full-sha256>.<json|xml|rss>.gz

Typical resolved path:

C:\Users\<user>\AppData\Local\Healthspan Dashboard\healthspan-dashboard.sqlite3

Other platforms:

macOS:
~/Library/Application Support/Healthspan Dashboard/healthspan-dashboard.sqlite3

Linux:
${XDG_DATA_HOME:-~/.local/share}/healthspan-dashboard/healthspan-dashboard.sqlite3

Additional rules:

HEALTHSPAN_DATA_DIR overrides the application-data directory.

Normal runtime overrides must be absolute paths.

.local-data/ inside the repository is allowed only as an explicit developer override and must be gitignored.

Unit tests may use in-memory SQLite.

Migration, integration, API, and ingestion tests must use unique temporary on-disk databases.

Path resolution belongs centrally in @healthspan/db.

Add pnpm data:path to print the resolved database and raw-storage locations.

Use healthspan-dashboard.sqlite3 as the database filename.

The local driver decision is:

drizzle-orm
drizzle-kit
better-sqlite3

Configure the local connection with:

SQL
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000; 2. Connector set and order

Keep all four connectors, in this order:

1. PubMed
2. ClinicalTrials.gov
3. Crossref DOI enrichment
4. TGA RSS
   PubMed

Use NCBI E-utilities for paper discovery and bibliographic data. Throttle to no more than 2.5 requests per second without an API key and 8 requests per second with one, staying beneath NCBI’s documented ceilings of three and ten requests per second. Use batched EFetch requests rather than one request per paper.
NCBI

ClinicalTrials.gov

Use API v2 JSON for trial discovery, complete trial records, status changes, results-posted detection, outcomes, interventions, eligibility, and Australian trial locations.
ClinicalTrials.gov

Crossref

Use Crossref only to enrich papers already identified by DOI. Do not run a second broad paper-discovery pipeline during Milestone 2.

Crossref should contribute fields such as:

Publisher and container metadata

Licences

Funding

ORCID and ROR identifiers

Post-publication updates

Correction and retraction relationships

Crossref’s public REST API supports exact DOI retrieval and includes post-publication, funding, licence, and relationship metadata.
www.crossref.org

TGA RSS

Enable these four feeds:

Safety alerts
Market actions
Safety updates
Media releases

Do not ingest the broad general-news feed during Milestone 2. TGA officially provides each of those feeds separately.
Therapeutic Goods Administration (TGA)

Ingest every item returned by those four feeds, then apply a deterministic, versioned longevity relevance matcher for dashboard display. One failed TGA feed must not invalidate the other three.

ANZCTR remains deferred. Do not scrape or create a nominal production connector for it during this milestone.

3. ChatGPT Sites and D1 influence

Design for D1 portability now; implement D1 in Milestone 7.

ChatGPT Sites identifies D1 as its relational store for durable structured data and R2 as object storage for files. It also warns that some databases and background-service patterns may not be supported in the Sites runtime. That makes repository, raw-storage, and scheduler abstractions worthwhile now without introducing hosted dependencies prematurely.
OpenAI Developers
+2
OpenAI Developers
+2

Milestone 2 must therefore use:

Application-generated text UUIDs

Integer UTC timestamps in the database and ISO timestamps in APIs

Integer-backed booleans

Text enums validated by Zod

Explicit foreign keys and ordinary join tables

Forward-only portable migrations

A database/repository interface around better-sqlite3

A RawSnapshotStore interface around local content-addressed files

A replaceable Scheduler interface

JSON columns only for small opaque cursor, diagnostic, or change-diff data

No dependency on triggers, stored procedures, generated columns, custom SQLite extensions, or FTS5

Cloudflare describes D1 as using SQLite SQL semantics and supporting most SQLite conventions, so maintaining a conservative SQLite schema now should reduce the later migration burden.
Cloudflare Docs
+1

Do not add any of the following in Milestone 2:

.openai/hosting.json
D1 bindings
R2 bindings
Wrangler
Cloudflare runtime packages
Sites deployment configuration
Hosted scheduling

Those belong to Milestone 7, after the current Sites runtime and deployment constraints are reassessed.

Milestone 2 execution brief

The complete brief includes:

Fixed architecture decisions

Required database tables and relationships

Raw snapshot and record-versioning design

Baseline versus genuine change semantics

Detailed requirements for all four connectors

Exact identifier normalisation

API and UI requirements

Local scheduling behaviour

Commands and environment variables

Source-policy and security rules

Fixture, integration, API, UI, and E2E test requirements

34 acceptance criteria

Required completion-report format

Conditions under which Grok should consult the project manager

healthspan_dashboard_milestone_2_execution_brief.md

Controlling instruction for Grok

Begin Healthspan Dashboard Milestone 2 from the latest main. Create and work on milestone-2/persistent-data-backbone. Implement the complete persistent data backbone and official-source ingestion system exactly within the supplied execution brief. Make routine implementation decisions autonomously. Preserve strict Live/Demo separation, do not fabricate scientific assessments for live data, and do not begin Milestone 3. When every acceptance criterion is met, push the branch, commit the required completion report, report the final commit hash and test results, and stop.

Sources
ChatGPT can make mistakes. Check important info.

Pro
Library
/
healthspan_dashboard_milestone_2_execution_brief.md
Healthspan Dashboard — Milestone 2 Execution Brief

Milestone: 2 — Persistent Data Backbone and Primary-Source Ingestion
Issued: 23 July 2026
Project manager: ChatGPT
Execution agent: Grok 4.5 in Cursor
Repository: Smellybum1/Healthspan-Dashboard
Starting point: latest main
Working branch: milestone-2/persistent-data-backbone
Status: AUTHORISED TO BEGIN
Stop point: Complete Milestone 2, push the branch, submit the required completion report, and stop before Milestone 3.

1. Controlling instruction

Begin Healthspan Dashboard Milestone 2 from the latest main.

Build a durable, Windows-first local data system using SQLite and Drizzle, then connect Healthspan Dashboard to these official source families, in this order:

PubMed

ClinicalTrials.gov

Crossref, used for exact-DOI enrichment

TGA RSS

The application must ingest, preserve, normalise, version, deduplicate, and display real source data. It must detect meaningful changes after an initial baseline import and show source freshness, health, failures, and ingestion history.

Preserve the Milestone 1 showcase as a separate Demo mode. Never mix Demo and Live records in the same API result or screen.

Replace the Milestone 1 demo: true model with an explicit canonical field:

dataOrigin: "demo" | "live"

Use dataMode: "demo" | "live" in API response metadata and application state. Do not keep demo as the canonical persisted/domain field. A temporary compatibility adapter is acceptable during implementation, but the completed Milestone 2 schemas and UI must use dataOrigin and dataMode.

Do not implement AI extraction, evidence scoring, creator monitoring, X, YouTube, ARTG lookup, canonical intervention or peptide resolution, personal health data, authentication, D1, R2, or hosted deployment in this milestone.

Make routine implementation decisions autonomously. Do not pause for approval over ordinary package additions, file layout refinements, component structure, migrations, test fixtures, refactors, debugging, or visual polish that remain inside this brief.

2. Fixed project-management decisions
   2.1 SQLite path and filename

The database must live in the operating system's per-user application-data directory by default. It must not live inside the Git repository.

Resolve the application data directory centrally:

Platform Default directory
Windows %LOCALAPPDATA%\Healthspan Dashboard
macOS ~~/Library/Application Support/Healthspan Dashboard
Linux ${XDG_DATA_HOME:-~~/.local/share}/healthspan-dashboard

Use this layout:

<application-data-directory>/
├─ healthspan-dashboard.sqlite3
└─ raw/
└─ sha256/
└─ <first-two-hash-characters>/
└─ <full-sha256>.<json|xml|rss>.gz

Expected Windows path:

C:\Users\<user>\AppData\Local\Healthspan Dashboard\healthspan-dashboard.sqlite3

Rules:

HEALTHSPAN_DATA_DIR overrides the application-data directory.

A normal-runtime override must resolve to an absolute path.

.local-data/ inside the repository is allowed only as an explicit developer override.

.local-data/, SQLite files, WAL/SHM files, raw snapshots, locally captured live responses, and temporary downloads must be gitignored.

Unit tests may use in-memory SQLite where persistence is not under test.

Migration, integration, API, and ingestion tests must use unique temporary on-disk databases.

All path resolution belongs in @healthspan/db; do not scatter platform-specific logic through the codebase.

Add pnpm data:path to print the resolved database and raw-snapshot paths without exposing secrets.

Use:

drizzle-orm
drizzle-kit
better-sqlite3

Isolate better-sqlite3 behind the local database adapter. Verify installation and runtime on the supported Windows/Node/pnpm setup.

Set these local connection pragmas:

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

These are local runtime settings, not assumptions embedded in portable migrations.

2.2 Connector set and order

Keep the original four source families. The full-ingestion order is fixed:

PubMed
↓
ClinicalTrials.gov
↓
Crossref exact-DOI enrichment
↓
TGA RSS

Rationale:

PubMed establishes the paper-ingestion and bibliographic path.

ClinicalTrials.gov establishes complex record versioning and high-value status/result change detection.

Crossref enriches papers already identified by DOI and must not become a duplicate broad-discovery stream.

TGA RSS establishes Australia-first regulatory and safety ingestion.

Do not add ANZCTR in Milestone 2. Keep it documented as a future source; do not scrape it or create a non-functional production connector.

2.3 D1 and ChatGPT Sites influence

D1/Sites constraints must shape the schema and architectural boundaries now, while actual D1, R2, and Sites work remains deferred until Milestone 7.

Apply these portability rules during Milestone 2:

Drizzle SQLite schema is the source of truth.

Generate text IDs in the application, using crypto.randomUUID() unless an existing project utility provides an equally portable stable identifier.

Store timestamps as UTC Unix milliseconds in integer columns.

Return ISO 8601 strings at API boundaries.

Store booleans as integer-backed booleans.

Store enums as text and validate them with Zod.

Use normal tables, explicit indexes, foreign keys, and transactions.

Use junction tables for queryable relationships.

Restrict JSON text columns to small opaque cursors, diagnostics, parser metadata, and before/after change diffs.

Validate all JSON text when reading it.

Do not depend on local-only triggers, generated columns, stored procedures, custom SQLite extensions, or filesystem paths as domain identifiers.

Do not make FTS5 a Milestone 2 dependency.

Keep driver-specific code behind database/repository interfaces.

Keep raw payloads behind a RawSnapshotStore interface so local files can later map to R2.

Keep scheduling behind a Scheduler interface so hosted execution can be redesigned later.

Keep local SQLite pragmas in the local adapter, not migrations.

Do not add any of the following in Milestone 2:

.openai/hosting.json
D1 bindings
R2 bindings
Wrangler
Cloudflare runtime packages
Sites deployment configuration
Hosted scheduling

Those belong to Milestone 7 after the then-current Sites runtime and deployment requirements are reassessed.

2.4 Live and Demo data origins

The canonical domain field is:

const DataOriginSchema = z.enum(["demo", "live"]);
type DataOrigin = z.infer<typeof DataOriginSchema>;

Rules:

All Milestone 1 seed records become dataOrigin: "demo".

All SQLite-ingested source records become dataOrigin: "live".

The selected application mode is dataMode: "demo" | "live".

live is the default for ordinary local use.

A response or screen must never combine origins.

Existing localStorage watchlists/preferences may remain in localStorage in Milestone 2, but stored identifiers must be namespaced by data mode.

Demo content retains conspicuous demo labelling.

Live content must not inherit seeded evidence, confidence, safety, or attention scores.

Intervention, Peptide, and Creator pages may show honest Live-mode empty states until their later milestones. They may offer a deliberate switch to Demo mode, but may not silently substitute Demo content.

3. Milestone goal

Milestone 2 succeeds when a clean local installation can:

Create and migrate its per-user SQLite database.

Run all four connectors.

Preserve immutable, content-addressed raw snapshots.

Normalise remote records into durable application entities.

Rerun ingestion without duplicate entities, versions, or change events.

Detect meaningful source changes after a baseline import.

Display real papers, trials, and relevant TGA notices with provenance.

Show source freshness, health, failures, and run history.

Perform manual refresh and process-local scheduled refresh.

Preserve the complete Milestone 1 Demo mode.

Pass all existing and new deterministic quality gates without relying on the live internet.

The milestone collects and structures evidence. It does not yet make scientific judgments about that evidence.

4. Required reading

Review and preserve the intent of:

README.md
AGENTS.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/SOURCE_POLICY.md
docs/PRIVACY_BOUNDARIES.md
docs/ROADMAP.md
docs/DECISIONS.md
docs/adr/ADR-0001-seeded-api-boundary.md
docs/adr/ADR-0002-independent-evidence-dimensions.md
docs/adr/ADR-0003-localstorage-preferences.md
docs/adr/ADR-0004-demo-snapshot-labelling.md
docs/milestones/M1.md
docs/milestones/M1_COMPLETION_REPORT.md
packages/core/
packages/db/
packages/connectors/
packages/intelligence/
apps/api/
apps/web/

The existing Hono API and repository seam are intentional. Replace the seeded-memory implementation behind that boundary rather than bypassing it.

5. Scope
   5.1 In scope

Windows-first application-data path resolution

SQLite, Drizzle, and forward-only migrations

Seed and live repository implementations

dataOrigin and dataMode migration

Durable source configuration and source-health state

Immutable raw snapshots

Record versioning

Exact-identifier matching

Ingestion-run history

Incremental checkpoints and overlap windows

Shared resilient HTTP client

PubMed connector

ClinicalTrials.gov API v2 connector

Crossref exact-DOI enrichment connector

TGA RSS connector

Deterministic change detection

Manual refresh

Local process scheduler

Source-health and run-status UI

Live papers, trials, and regulatory notices

Provenance and official links

First-run, empty, partial-failure, and offline states

Fixture-based automated tests

Opt-in live smoke tests

Documentation, ADRs, and completion report

5.2 Explicitly out of scope

LLM/AI calls

Claim extraction

Evidence-maturity or confidence scoring

Hallmarks-of-ageing classification

Translation-gap classification

Creator monitoring

YouTube or X

Canonical intervention or peptide entities

Peptide vendor, sourcing, purchasing, or dosing information

ARTG integration

FDA/openFDA

ANZCTR

User accounts

Hosted deployment

D1/R2 adapters

Personal labs, medications, supplement doses, diagnoses, or other personal medical information

Medical recommendations

FTS5

Paid API services

Production backup/restore UI

6. Target architecture
   Official source
   ↓
   Shared HTTP client
   ↓
   Connector fetch page/feed response
   ↓
   Immutable RawSnapshotStore
   ↓
   Source-specific parser
   ↓
   Zod validation
   ↓
   Normalised source record
   ↓
   Source object and version persistence
   ↓
   Exact identifier matching
   ↓
   Content entity projection
   ↓
   Deterministic change detection
   ↓
   Repository/API
   ↓
   Live UI, source health, and alerts

Cross-cutting rules:

Connectors fail independently.

A failed connector must not roll back successful work from another connector.

One malformed record must not invalidate an otherwise usable page.

Partial failures must be visible.

No secrets may enter URLs stored in diagnostics, logs, raw-snapshot metadata, screenshots, or completion reports.

Raw source material and normalised projections must remain distinguishable.

Every Live content item must trace to at least one source object and version.

No personal health data is stored.

7. Package boundaries
   packages/core

Own:

Domain types and Zod schemas

API envelopes

DataOrigin and DataMode

Source, run, event, and provenance enums

Identifier/date normalisation utilities that are source-independent

No database-driver imports

No network access

packages/db

Own:

Application-data path resolver

Drizzle schema

Migration runner

Local better-sqlite3 adapter

Repository interfaces and implementations

Transactions

Raw-snapshot metadata

File-backed RawSnapshotStore

Pagination and query helpers

Database health/integrity checks

No source-specific HTTP logic

packages/connectors

Own:

Connector contracts

Shared HTTP client, retry, throttling, caching headers, and redaction

Source-specific clients, parsers, normalisers, and fixtures

PubMed

ClinicalTrials.gov

Crossref

TGA RSS

No React code

packages/intelligence

May own deterministic comparisons and change-event generation. It must not contain AI calls or opaque scientific assessment.

apps/api

Own:

Dependency wiring

Repository-mode selection

Ingestion orchestration

Local scheduler

API routes

Health/diagnostics

Loopback-safe administrative mutation routes

apps/web

Own:

Live/Demo mode selection

First-sync and empty states

Source health and ingestion UI

Manual refresh

Live list/detail views

Provenance display

Existing Demo experience

8. Database model

Implement the logical model below. Exact file partitioning is delegated, but the semantics are required.

8.1 Operational tables
sources

One row per source family.

Required concepts:

Stable ID: pubmed, clinicaltrials-gov, crossref, tga

Display name

Source kind

Official base URL

Enabled flag

Health state: never_run, healthy, degraded, failed, disabled, running

Last attempt, success, and failure timestamps

Consecutive-failure count

Sanitised last error

Created/updated timestamps

source_feeds

Required because TGA has multiple feeds.

Required concepts:

ID

Parent source ID

Stable feed key

URL

Category

Enabled flag

ETag

Last-Modified

Last checked/success timestamps

connector_checkpoints

Required concepts:

Source/feed ID

Connector version

Checkpoint schema version

Cursor JSON

Window start/end

Updated timestamp

Advance a checkpoint only after the associated transactional work commits.

ingestion_runs

Required concepts:

ID

Source ID or parent orchestration ID plus child runs

Trigger: manual, scheduled, startup_catchup, cli, reprocess, test

Status: queued, running, succeeded, partial, failed, cancelled

Started/completed timestamps

Cursor before/after

Fetched page count

Remote-record count

Raw-snapshot count

New object/version counts

Unchanged count

Inserted/updated content count

Change-event count

Warning/error counts

Sanitised summary

ingestion_run_errors

Required concepts:

Run ID

Source ID

Optional external record ID

Pipeline stage

Stable error code

Sanitised message

Retryable flag

Timestamp

Small validated diagnostic JSON

Never store keys, full auth headers, or unredacted authenticated URLs.

raw_snapshots

Store metadata only; bytes live in RawSnapshotStore.

Required concepts:

ID

Source/feed ID

SHA-256 over exact response bytes before compression

Relative storage key

Media type

Encoding

Compression

Byte lengths before/after compression

Retrieval timestamp

ETag/Last-Modified

Sanitised request fingerprint

Connector version

Parser version

Unique source/hash constraint

ingestion_run_snapshots

Join runs to snapshots so content-addressed payloads can be reused.

source_objects

One row per stable remote logical record.

Examples:

PubMed PMID
ClinicalTrials.gov NCT ID
Crossref DOI
TGA GUID or canonical item URL

Required concepts:

ID

Source ID

Normalised external ID

First seen/last seen

Current version ID

Source-created/source-updated timestamps when available

Canonical source URL

Unique (source_id, external_id)

source_record_versions

One row per materially distinct normalised version.

Required concepts:

ID

Source-object ID

Monotonic version number

Raw-snapshot ID

Normalised-record SHA-256

Source timestamps

First observed timestamp

Parser version

Validation status

Compact validated diagnostics

Unique (source_object_id, normalized_hash)

An identical refetch updates last-seen/run metrics but creates no version.

external_identifiers

Required concepts:

Content-item ID

Scheme such as pmid, doi, nct, tga-guid

Normalised value

Source ID

Appropriate uniqueness constraints

content_item_sources

Map content items to source objects.

Required concepts:

Content-item ID

Source-object ID

Role: primary, enrichment, related

First/last linked timestamps

8.2 Content tables
content_items

Common projection for Live searchable content.

Required concepts:

ID

Type: paper, trial, regulatory_event

data_origin, always live for SQLite-ingested records

Title

Source-provided summary/abstract excerpt where allowed

Source publication date

Source update date

First seen/last seen

Canonical URL

Record status

Created/updated timestamps

Do not add evidence, confidence, safety, or attention scores to Live content in Milestone 2.

papers

Required concepts:

Content-item ID

PMID

Normalised DOI

Journal/venue

Publisher

Publication status/type

Language

Licence

Explicit correction/retraction flags and relationships

Null/unknown for unsupplied fields; never manufacture values

paper_authors

Required concepts:

Paper ID

Ordinal

Display name

Given/family names where supplied

ORCID

Affiliation text

paper_funders

Populate only from explicit source metadata.

trials

Required concepts:

Content-item ID

NCT ID

Overall status

Study type

Phase values

Brief/official title

Sponsor

Enrollment count/type

Start, primary-completion, and completion dates

First-posted, last-update-posted, and results-first-posted dates

Results-posted boolean

Healthy-volunteer status when explicit

Minimum/maximum ages as source text and optional parsed values

Sex eligibility

Australian-location boolean derived only from explicit location records

trial_conditions
trial_interventions

Keep source-specific intervention names. Do not resolve them into canonical intervention/peptide dossiers.

trial_outcomes

Store outcome type, measure, description, and time frame when supplied.

trial_locations

Store facility, city, state/region, postcode, country, and coordinates only when supplied. Do not geocode.

trial_status_history

Required concepts:

Trial ID

Status

Effective source timestamp where available

Detected timestamp

Source-record version

Unique event key

regulatory_events

Required concepts:

Content-item ID

Jurisdiction: AU

Authority: TGA

Feed key/category

Event kind based on feed/category rather than inferred clinical severity

GUID/canonical URL

Source description

Relevance state: matched, not_matched, unclassified

Matched deterministic terms

Matcher version

No causation inference

8.3 Taxonomy and event tables
tags
content_item_tags

Use deterministic discovery/source tags only. Do not present them as scientific conclusions.

change_events

Required concepts:

ID

Event kind

Deterministic title and summary

Source-object ID

New version ID

Optional previous version ID

Source occurrence timestamp

Detection timestamp

Importance class based on explicit event type

Baseline flag

Validated before/after JSON

Stable unique deduplication key

change_event_items

Map events to affected content items.

8.4 Required indexes

At minimum index:

Source/external identifiers

DOI, PMID, and NCT ID

Content type and publication/update dates

Change detection date, baseline flag, and kind

Trial status/results state

TGA feed/relevance state

Source health/last success

Ingestion run status/start time

Normalised searchable title fields

Use EXPLAIN QUERY PLAN in tests or documented manual checks for principal list/search queries.

9. Migration behaviour

Commit migration files.

Migrations are forward-only and deterministic.

API startup creates the data directory and applies pending safe migrations.

Provide:

pnpm db:migrate
pnpm db:status
pnpm db:doctor

Fail startup clearly if migration fails.

Do not add a normal-user destructive reset command.

A test-only reset helper must refuse non-test paths.

Test:

empty database to current schema

no-op repeated migration

close/reopen persistence

foreign-key integrity

invalid/corrupt-file handling

10. Raw snapshot storage

Define a portable interface equivalent in behaviour to:

interface RawSnapshotStore {
put(input: {
sourceId: string;
bytes: Uint8Array;
mediaType: string;
preferredExtension: "json" | "xml" | "rss";
}): Promise<{
contentHash: string;
storageKey: string;
uncompressedBytes: number;
compressedBytes: number;
compression: "gzip";
}>;

get(storageKey: string): Promise<Uint8Array>;
exists(storageKey: string): Promise<boolean>;
}

Rules:

Compute SHA-256 over exact received bytes before compression.

Use content-addressed storage.

Write temporary file then atomically rename.

Reuse existing source/hash objects.

Store only relative storage keys.

Prevent path traversal.

Verify hash on integrity reads.

Gzip payloads.

Do not expose raw payloads through the browser API.

Do not commit locally fetched payloads.

Repository fixtures must be synthetic or reduced to minimum required fields rather than copying large abstracts.

Add:

pnpm ingest:reprocess --source <source-id>

Reprocessing from stored snapshots must require no network and remain idempotent.

11. Ingestion engine

Build one source-independent orchestration engine.

Required sequence:

Acquire an in-process source/run lock.

Refuse or coalesce overlapping runs.

Create the ingestion-run record.

Load last successful checkpoint.

Fetch using an overlap window.

Save raw bytes before parsing.

Parse records independently where possible.

Validate normalised records with Zod.

Upsert source object.

Compare normalised hash with current version.

Create a version only if changed.

Resolve exact identifiers to a content item.

Project source fields according to documented precedence.

Generate deterministic non-baseline events.

Commit each bounded page/feed transactionally.

Advance checkpoint only after commit.

Mark partial when some records fail but valid work commits.

Update source health.

Store sanitised diagnostics.

Release lock in all paths.

A crash after a committed page but before final completion must be recoverable by idempotent replay.

11.1 Baseline semantics

The first successful import for each connector is a baseline.

Baseline content appears in lists and details.

Baseline events use baseline = true.

Baseline events are excluded from “What changed since your last visit.”

Recent source publication dates may appear in a separate “Recently published/indexed” area.

Never imply an old source changed today merely because Healthspan Dashboard first indexed it today.

Later newly discovered or changed records are non-baseline.

11.2 Overlap/staleness defaults
PubMed incremental overlap: 72 hours
ClinicalTrials.gov incremental overlap: 7 days
Crossref enrichment refresh: 30 days
TGA RSS: ETag / Last-Modified when available
11.3 Initial windows and caps
PubMed initial lookback: 90 days
ClinicalTrials.gov updated-record lookback: 365 days
Crossref: exact DOI enrichment for local papers
TGA RSS: all entries currently returned by enabled feeds
First-run cap per connector: 1,000
Live-smoke cap: 25

A cap must be visible as capped/partial; never silently imply exhaustion.

12. Shared HTTP client

Create a shared client using Node fetch with:

Abort timeout

Bounded retries

Exponential backoff and jitter

Retry-After

Per-source throttling

Pagination-loop protection

Response-size limit

Content-type validation

ETag and Last-Modified

Sanitised structured logging

Identifying User-Agent

Secret-free request fingerprint

Injectable fetch, clock, sleep, and random functions for tests

Defaults:

Timeout: 30 seconds
Maximum attempts: 5
Retryable statuses: 408, 425, 429, 500, 502, 503, 504
Other 4xx: non-retryable by default

Do not retry parser/schema errors as transient network failures.

13. Connector specifications
    13.1 PubMed

Use NCBI E-utilities.

https://eutils.ncbi.nlm.nih.gov/entrez/eutils/

Requirements:

ESearch followed by batched EFetch

Entrez history/WebEnv where useful

Application tool name and contact email

Optional NCBI_API_KEY

Throttle below official ceilings:

no key: maximum 2.5 requests/second

key: maximum 8 requests/second

Never persist/log API keys

Preserve XML snapshots

Incremental source-date filtering and pagination

Versioned discovery-query configuration

Initial discovery concepts:

healthspan

healthy ageing / healthy aging

longevity

geroscience

biological ageing / biological aging

cellular senescence

senolytics

frailty and sarcopenia interventions

epigenetic/biological-age clocks

ageing-related intervention trials

At minimum parse, when supplied:

PMID

Title

Structured abstract sections

Journal

Publication dates

Authors/affiliations

DOI/article IDs

Publication types

Language

Keywords/MeSH

Grants/funding

Comments/corrections

Retraction/correction markers

Source update metadata

Prominent deterministic events:

paper discovered after baseline

correction/erratum relationship added

retraction

material title/abstract change

publication-status change

Indexing-only metadata may create an audit version without a prominent event.

Display PubMed attribution and official record links. Do not expose raw XML through the app API.

13.2 ClinicalTrials.gov

Use API v2 JSON.

https://clinicaltrials.gov/api/v2/

Requirements:

Confirm endpoint/query syntax against current official API v2 docs during implementation.

Correct page-token handling.

Prefer source-side fields/filters.

Preserve complete responses.

Conservative maximum of 2 requests/second.

Honour Retry-After.

Seven-day updated-record overlap.

Versioned/documented query set.

Discovery concepts:

aging / ageing

healthy aging / healthy ageing

healthspan

longevity

geroscience

frailty

sarcopenia

cellular senescence

senolytic

biological age

epigenetic age

age-related functional decline

Do not restrict to recruiting trials.

At minimum parse:

NCT ID

Brief and official titles

Overall status

Study type and phases

Sponsor/collaborators

Enrollment count/type

Arms/interventions

Conditions/keywords

Primary/secondary outcomes

Eligibility

Healthy-volunteer status

Sex/ages

Start, completion, posted, update, and results dates

Locations and explicit Australia flag

Results availability

Why-stopped text

References/links when supplied

Prominent events:

trial discovered after baseline

status change

results first posted

withdrawn/suspended/terminated

material enrollment change

completion-date change

intervention or primary-outcome change

Australian site added/removed

13.3 Crossref

Use the public REST API.

https://api.crossref.org/

Milestone 2 role: enrichment only.

Requirements:

Queue from locally held valid DOIs.

Use exact /works/{doi} lookups.

No broad Crossref keyword discovery.

Do not create duplicate papers when PubMed owns the primary record.

Refresh when absent, after source change, or after 30 days.

Send configured mailto and identifying User-Agent.

Honour server feedback and throttle conservatively.

Preserve, when supplied:

Publisher/container

Type/subtype

DOI

Licence

Funding

ORCID/ROR

Deposited/indexed/update dates

Relation metadata

Post-publication updates

Retraction/correction relationships

Reference counts/metadata

Precedence:

PubMed remains primary for PMID-linked title, abstract, journal, and PubMed bibliographic data.

Crossref enriches publisher, licence, funding, and relation fields.

Preserve conflicts in source versions.

Never overwrite a populated primary field with an empty/malformed enrichment value.

Link Crossref as source role enrichment.

13.4 TGA RSS

Enable these official feeds:

Safety alerts:
https://tga.gov.au/feeds/alert/safety-alerts.xml

Market actions:
https://tga.gov.au/feeds/alert/market-actions.xml

Safety updates:
https://tga.gov.au/feeds/article/safety-updates.xml

Media releases:
https://tga.gov.au/feeds/article/media-releases.xml

Exclude the broad general-news feed.

Requirements:

Fetch each feed independently.

Use ETag/Last-Modified when supplied.

Preserve RSS/XML snapshots.

Prefer GUID; fall back to canonical URL.

Do not scrape linked article pages in Milestone 2.

One feed failure must not invalidate the others.

Parse:

GUID

Title

Description

Publication date

Canonical link

Feed key/category

Author/category metadata when supplied

Ingest all returned entries, then apply a deterministic versioned relevance matcher for display.

Initial relevance groups:

ageing / aging / longevity / healthspan

peptide and named investigational peptide terms

senolytic/cellular-senescence terms

rapamycin/mTOR

metformin

NAD/nicotinamide-related interventions

growth hormone/hormone anti-ageing claims

high-interest metabolic agents discussed in longevity contexts

supplements/products explicitly marketed with anti-ageing claims

Store match state, matched terms, and matcher version. Do not infer causation or clinical severity.

14. Identifier normalisation and deduplication
    DOI

Trim.

Remove URL/prefix forms.

Decode safely.

Lowercase.

Validate a conservative DOI shape.

Exact-match only.

No fuzzy-title merging in Milestone 2.

PMID

Digits only after normalisation.

Preserve as text.

Exact unique match.

NCT ID

Uppercase.

Validate NCT plus eight digits.

Exact unique match.

TGA

Prefer GUID.

Otherwise canonical HTTPS URL with tracking parameters removed.

Never merge solely on similar titles.

Possible duplicates without exact identifiers may be logged for later review, but no review UI is required.

15. Deterministic change detection

A stable event deduplication key must incorporate:

source object
event kind
material field
normalised new value/version
effective or detected date as appropriate

Required event kinds:

record_discovered
record_materially_updated
paper_corrected
paper_retracted
trial_status_changed
trial_results_posted
trial_enrollment_changed
trial_outcomes_changed
trial_interventions_changed
trial_australian_locations_changed
regulatory_notice_published
regulatory_notice_updated

Rules:

Initial events are baseline events.

Identical records create no version/event.

Replayed changes create no duplicate event.

Events link old/new versions where applicable.

UI distinguishes source timestamp from Healthspan Dashboard detection timestamp.

No LLM-generated summaries.

Use deterministic templates.

Retraction/correction is visually distinct from ordinary metadata change.

TGA alerts do not automatically prove causation.

16. API

Retain existing routes where practical and make repository calls asynchronous.

Response envelope:

{
data: ...,
meta: {
dataMode: "live" | "demo",
generatedAt: string,
partial: boolean,
sourceFreshness?: ...
}
}

Required routes:

GET /health
GET /api/dashboard
GET /api/items
GET /api/items/:id
GET /api/search
GET /api/sources
GET /api/ingestion/status
GET /api/ingestion/runs
GET /api/ingestion/runs/:id
POST /api/ingestion/runs

Validated refresh body:

{
"sourceIds": ["pubmed", "clinicaltrials-gov", "crossref", "tga"],
"force": false
}

Behaviour:

Return 202 Accepted with identifiers.

UI polls status.

Coalesce/refuse duplicate concurrent runs.

Reject unknown sources.

Paginate list endpoints.

Never return raw snapshots.

Validate inputs and outputs.

/health includes database/source health but no usernames, exact private paths, secrets, raw stacks, or keys.

Security:

Default API host is 127.0.0.1.

Administrative mutations are local-only.

If bound beyond loopback, disable mutation routes unless HEALTHSPAN_ALLOW_REMOTE_ADMIN=true.

Show a warning when remote admin is deliberately enabled.

Do not add authentication in Milestone 2.

17. Scheduler

Create a replaceable scheduler interface and local process implementation.

Defaults:

Timezone: Australia/Brisbane
Schedule: 06:00 daily
One full refresh at a time

Environment controls:

HEALTHSPAN_SCHEDULER_ENABLED=true
HEALTHSPAN_REFRESH_CRON=0 6 * * *
HEALTHSPAN_TIME_ZONE=Australia/Brisbane
HEALTHSPAN_STARTUP_CATCHUP_ENABLED=true
HEALTHSPAN_STALE_AFTER_HOURS=24

Behaviour:

Disabled automatically in tests.

If startup catch-up is enabled and no successful run exists or data is stale, queue a run after server readiness.

Do not block API startup on network refresh.

If the process missed the scheduled time, startup catch-up handles it.

Show last and next runs in the UI.

Do not assume a permanent hosted background process.

18. User interface

Extend, do not replace, the Milestone 1 design system.

18.1 Mode control

Add clear Live/Demo selection in Settings and an unobtrusive global indicator.

Live: SQLite data only.

Demo: Milestone 1 seeds only.

Mode changes preserve preferences.

Mode changes never merge origins.

18.2 First-run Live state

When no Live content exists:

Explain that sources have not been synchronised.

Show enabled sources.

Offer Run first sync.

Show progress while the app remains usable.

Never fill with Demo content unless the user deliberately switches.

18.3 Source health

Show:

source/feed

enabled state

health

last attempt/success

next scheduled run

current run

latest counts

sanitised error

per-source refresh

refresh all

TGA may show four child feeds.

18.4 Today screen in Live mode

“What changed” uses non-baseline deterministic events.

“Recently published/indexed” is separate.

Trial Pulse uses real trial records.

Safety & Regulation uses matched TGA items.

Research Brief becomes a deterministic recent-paper list; do not imply AI authorship.

Signal Radar must not plot fabricated evidence/attention values. Replace it with an honest pending panel or source-activity view.

State that evidence classification arrives in Milestone 3.

Demo mode preserves the M1 Today screen.

18.5 Live lists/details

Research:

real paper list

date, journal, PMID/DOI

source links

correction/retraction state

permitted abstract/summary

provenance and retrieval dates

Trials:

real trial list

status, phase/type, sponsor

results state

Australia indicator

dates

conditions/interventions/outcomes

official source link

version/change timeline

Safety & Regulation:

matched TGA entries

feed category

date

source description

matched terms

official link

source-policy caveat

For all Live records:

distinguish publication/posted date, source-updated date, first-seen date, and last-checked date

no seeded scientific scores

later-milestone fields say “Not yet assessed,” not fabricated defaults

18.6 Unsupported Live sections

Interventions, Peptides, and Creators in Live mode:

polished explanatory empty state

identify the later milestone

deliberate Demo-mode action

no automatic seed substitution

19. Commands and environment

Add Windows-safe root scripts. Do not rely on POSIX-only inline environment assignment.

Required:

pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e

pnpm data:path
pnpm db:migrate
pnpm db:status
pnpm db:doctor

pnpm ingest:all
pnpm ingest --source pubmed
pnpm ingest --source clinicaltrials-gov
pnpm ingest --source crossref
pnpm ingest --source tga
pnpm ingest:status
pnpm ingest:reprocess --source <source-id>

pnpm test:connectors:live

The live connector test is opt-in and excluded from ordinary test/E2E runs.

Update .env.example without secrets:

HEALTHSPAN_DATA_MODE=live
HEALTHSPAN_DATA_DIR=
HEALTHSPAN_SCHEDULER_ENABLED=true
HEALTHSPAN_REFRESH_CRON=0 6 * * *
HEALTHSPAN_TIME_ZONE=Australia/Brisbane
HEALTHSPAN_STARTUP_CATCHUP_ENABLED=true
HEALTHSPAN_STALE_AFTER_HOURS=24

HEALTHSPAN_PUBMED_INITIAL_LOOKBACK_DAYS=90
HEALTHSPAN_CLINICALTRIALS_INITIAL_LOOKBACK_DAYS=365
HEALTHSPAN_FIRST_RUN_RECORD_CAP=1000
HEALTHSPAN_LIVE_SMOKE_RECORD_CAP=25

NCBI_TOOL=healthspan_dashboard
NCBI_EMAIL=
NCBI_API_KEY=
CROSSREF_MAILTO=

ClinicalTrials.gov and TGA require no project secret in this milestone.

20. Testing

All default automated tests must be deterministic and network-independent.

20.1 Path tests

Test:

Windows with LOCALAPPDATA

Windows missing-value fallback/error

macOS

Linux with XDG_DATA_HOME

Linux fallback

absolute override

relative production override rejection

explicit repo-local development override

temporary-test isolation

20.2 Database tests

Test:

empty/repeated migrations

persistence after reopen

foreign keys and WAL

repository CRUD

pagination and search

exact-ID uniqueness

rollback

checkpoint atomicity

source health

integrity/doctor result

no Demo/Live mixing

20.3 Raw-store tests

Test:

SHA-256

gzip round trip

atomic write

object reuse

path traversal rejection

missing object

corruption/hash mismatch

temporary cleanup

20.4 HTTP tests

Using injected fetch:

success

timeout

retryable/non-retryable status

Retry-After

backoff/jitter

rate limit

ETag/304

Last-Modified

pagination-loop protection

oversized response

wrong content type

secret redaction

20.5 Connector parser tests

For each connector:

normal record

minimal record

missing optional fields

one malformed record

pagination

updated version

duplicate fetch

source-specific correction/retraction/status event

Unicode

differing date precision

No default test contacts the internet.

20.6 End-to-end ingestion tests

Using fixture transports and temp databases:

First run creates baseline content.

Identical rerun creates no duplicate object/version/event.

Changed input creates exactly one version and expected event.

Malformed record yields partial run while valid records commit.

Crash/retry does not duplicate committed work.

Checkpoint advances only after commit.

Crossref enriches exact DOI paper and creates no second paper.

TGA deduplicates by GUID/canonical URL.

A second repository/process instance reads persisted data.

dataOrigin prevents Demo/Live mixing.

20.7 API/UI tests

Cover:

Live empty state

Run-first-sync flow via fixtures

running/success/partial/failure

source health

manual source/all refresh

Live paper detail/provenance

Live trial detail/timeline

Live TGA item

Demo remains functional

mode separation

no Live evidence score

mobile source-health layout

existing M1 tests remain green

20.8 Optional live smoke test

pnpm test:connectors:live:

explicit invocation only

low caps

temporary or explicitly selected data directory

no committed output

report date, source, counts, duration, sanitised errors

diagnostic only, not part of deterministic gates

21. Reliability, source, and privacy rules

Use official APIs/feeds; do not scrape source webpages in Milestone 2.

Respect source terms, attribution, identification, rate limits, and caching headers.

Batch PubMed calls.

Use Crossref’s polite request pattern.

Keep source and retrieval dates separate.

Preserve corrections, retractions, withdrawals, and terminated trials.

Never delete old versions because a newer one exists.

Never convert source errors into empty “success.”

Never present alerts, reports, associations, or mentions as causation.

Never infer regulatory approval from a paper/trial record.

Never provide medical advice, dosing, or purchasing information.

Never store personal health data.

Bind locally by default.

Never log secrets.

Add source/licence notes for committed fixtures.

22. Documentation and ADRs

Create/update:

README.md
AGENTS.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/SOURCE_POLICY.md
docs/PRIVACY_BOUNDARIES.md
docs/ROADMAP.md
docs/milestones/M2.md
docs/milestones/M2_COMPLETION_REPORT.md

Add:

docs/sources/PUBMED.md
docs/sources/CLINICALTRIALS_GOV.md
docs/sources/CROSSREF.md
docs/sources/TGA_RSS.md

Add ADRs using next available numbers for:

per-user data path/override policy

SQLite/Drizzle portability boundary for D1

content-addressed raw snapshots

versioned ingestion and deterministic events

strict Live/Demo separation and dataOrigin

Document:

path conventions

locating/manually backing up the DB

first sync

scheduling and disabling refresh

source queries and versions

rate-limit policy

source precedence

baseline vs detected changes

Crossref enrichment-only rationale

deferred functionality

informational/not-medical-advice boundary

Live records are not yet scientifically scored

23. Acceptance criteria

Milestone 2 is complete only when:

Clean Windows-first setup creates the DB in the specified per-user location.

HEALTHSPAN_DATA_DIR works and repo-local data is gitignored.

demo: true has been replaced canonically by dataOrigin, with dataMode at application/API level.

Drizzle migrations work automatically and through CLI.

Database survives restart and passes integrity checks.

Live and Demo are completely separate.

All M1 Demo screens/tests remain functional.

PubMed batching, identification, optional key, and compliant throttling work.

ClinicalTrials.gov v2 pagination/material changes work.

Crossref exact-DOI enrichment creates no broad-discovery duplicates.

All four TGA feeds ingest independently with deterministic relevance matching.

Successful responses have immutable snapshot metadata/content-addressed storage.

Reprocessing from snapshots works offline.

Identical reruns are idempotent.

Changed source input creates one version and one deduplicated event.

Initial imports are baseline and do not masquerade as new changes.

Partial failure preserves valid work and appears in diagnostics.

Source health, history, last success, and next run are visible.

Manual source/full refresh works.

Daily Australia/Brisbane scheduling and startup catch-up work while API is running.

Live paper/trial/TGA views show provenance and official links.

Live pages show no fabricated evidence/confidence/safety/attention scores.

Mutation endpoints remain local-only by default.

No secrets, DBs, raw payloads, or personal-health data are committed.

Default tests require no live internet.

Opt-in live smoke succeeds or documents a genuine upstream outage without weakening deterministic tests.

pnpm lint passes with zero warnings.

pnpm typecheck passes.

pnpm test passes.

pnpm test:e2e passes desktop and mobile.

pnpm build passes.

Documentation/ADRs match implementation.

M2 completion report/screenshots are committed.

Working branch is pushed.

No M3 work has begun.

24. Completion report

Commit docs/milestones/M2_COMPLETION_REPORT.md containing:

Executive summary

One-row-per-criterion checklist

Branch and commit hash

Major file-tree changes

Database location and migration version

Schema/table summary

Connector summary

Query versions/default windows

Dated live smoke result per source

Idempotency result

Material-change result

Source health/partial-failure behaviour

Scheduler behaviour

Security/privacy/copyright/source-policy observations

Commands and exact results

Lint result

Type-check result

Test counts

E2E result

Build result

Screenshots:

Live first-sync/running state

Live Today

Data Sources/health

Live paper

Live trial/timeline

Live TGA item

Demo after M2

Mobile source-health

Known issues/technical debt

Deviations and rationale

Genuine decisions required before M3

Do not begin Milestone 3.

25. Consult the project manager early only when

An official source materially changed/withdrew the required interface.

Source terms appear to prohibit planned local use.

A paid credential becomes indispensable.

better-sqlite3 cannot be made reliable on the supported Windows environment after reasonable debugging.

A change would destroy or silently rewrite user data.

A privacy/security boundary would be weakened.

Two acceptance criteria are genuinely incompatible.

A required capability is technically impossible after documented attempts.

Do not consult for routine dependencies, naming, schema implementation, component layout, fixtures, refactors, recoverable bugs, minor source-field differences, visual polish, or documentation wording.

26. Authorised start message

Begin Healthspan Dashboard Milestone 2 from the latest main. Create and work on milestone-2/persistent-data-backbone. Implement the complete persistent data backbone and official-source ingestion system within this execution brief. Make routine implementation decisions autonomously. Replace the canonical demo: true field with dataOrigin: "demo" | "live", preserve strict Live/Demo separation, do not fabricate scientific assessments for Live data, and do not begin Milestone 3. When every acceptance criterion is met, push the branch, commit the required completion report, report the final commit hash and exact test results, and stop.

Library
/
healthspan_dashboard_milestone_2_execution_brief.md
Healthspan Dashboard — Milestone 2 Execution Brief

Milestone: 2 — Persistent Data Backbone and Primary-Source Ingestion
Issued: 23 July 2026
Project manager: ChatGPT
Execution agent: Grok 4.5 in Cursor
Repository: Smellybum1/Healthspan-Dashboard
Starting point: latest main
Working branch: milestone-2/persistent-data-backbone
Status: AUTHORISED TO BEGIN
Stop point: Complete Milestone 2, push the branch, submit the required completion report, and stop before Milestone 3.

1. Controlling instruction

Begin Healthspan Dashboard Milestone 2 from the latest main.

Build a durable, Windows-first local data system using SQLite and Drizzle, then connect Healthspan Dashboard to these official source families, in this order:

PubMed

ClinicalTrials.gov

Crossref, used for exact-DOI enrichment

TGA RSS

The application must ingest, preserve, normalise, version, deduplicate, and display real source data. It must detect meaningful changes after an initial baseline import and show source freshness, health, failures, and ingestion history.

Preserve the Milestone 1 showcase as a separate Demo mode. Never mix Demo and Live records in the same API result or screen.

Replace the Milestone 1 demo: true model with an explicit canonical field:

dataOrigin: "demo" | "live"

Use dataMode: "demo" | "live" in API response metadata and application state. Do not keep demo as the canonical persisted/domain field. A temporary compatibility adapter is acceptable during implementation, but the completed Milestone 2 schemas and UI must use dataOrigin and dataMode.

Do not implement AI extraction, evidence scoring, creator monitoring, X, YouTube, ARTG lookup, canonical intervention or peptide resolution, personal health data, authentication, D1, R2, or hosted deployment in this milestone.

Make routine implementation decisions autonomously. Do not pause for approval over ordinary package additions, file layout refinements, component structure, migrations, test fixtures, refactors, debugging, or visual polish that remain inside this brief.

2. Fixed project-management decisions
   2.1 SQLite path and filename

The database must live in the operating system's per-user application-data directory by default. It must not live inside the Git repository.

Resolve the application data directory centrally:

Platform Default directory
Windows %LOCALAPPDATA%\Healthspan Dashboard
macOS ~~/Library/Application Support/Healthspan Dashboard
Linux ${XDG_DATA_HOME:-~~/.local/share}/healthspan-dashboard

Use this layout:

<application-data-directory>/
├─ healthspan-dashboard.sqlite3
└─ raw/
└─ sha256/
└─ <first-two-hash-characters>/
└─ <full-sha256>.<json|xml|rss>.gz

Expected Windows path:

C:\Users\<user>\AppData\Local\Healthspan Dashboard\healthspan-dashboard.sqlite3

Rules:

HEALTHSPAN_DATA_DIR overrides the application-data directory.

A normal-runtime override must resolve to an absolute path.

.local-data/ inside the repository is allowed only as an explicit developer override.

.local-data/, SQLite files, WAL/SHM files, raw snapshots, locally captured live responses, and temporary downloads must be gitignored.

Unit tests may use in-memory SQLite where persistence is not under test.

Migration, integration, API, and ingestion tests must use unique temporary on-disk databases.

All path resolution belongs in @healthspan/db; do not scatter platform-specific logic through the codebase.

Add pnpm data:path to print the resolved database and raw-snapshot paths without exposing secrets.

Use:

drizzle-orm
drizzle-kit
better-sqlite3

Isolate better-sqlite3 behind the local database adapter. Verify installation and runtime on the supported Windows/Node/pnpm setup.

Set these local connection pragmas:

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

These are local runtime settings, not assumptions embedded in portable migrations.

2.2 Connector set and order

Keep the original four source families. The full-ingestion order is fixed:

PubMed
↓
ClinicalTrials.gov
↓
Crossref exact-DOI enrichment
↓
TGA RSS

Rationale:

PubMed establishes the paper-ingestion and bibliographic path.

ClinicalTrials.gov establishes complex record versioning and high-value status/result change detection.

Crossref enriches papers already identified by DOI and must not become a duplicate broad-discovery stream.

TGA RSS establishes Australia-first regulatory and safety ingestion.

Do not add ANZCTR in Milestone 2. Keep it documented as a future source; do not scrape it or create a non-functional production connector.

2.3 D1 and ChatGPT Sites influence

D1/Sites constraints must shape the schema and architectural boundaries now, while actual D1, R2, and Sites work remains deferred until Milestone 7.

Apply these portability rules during Milestone 2:

Drizzle SQLite schema is the source of truth.

Generate text IDs in the application, using crypto.randomUUID() unless an existing project utility provides an equally portable stable identifier.

Store timestamps as UTC Unix milliseconds in integer columns.

Return ISO 8601 strings at API boundaries.

Store booleans as integer-backed booleans.

Store enums as text and validate them with Zod.

Use normal tables, explicit indexes, foreign keys, and transactions.

Use junction tables for queryable relationships.

Restrict JSON text columns to small opaque cursors, diagnostics, parser metadata, and before/after change diffs.

Validate all JSON text when reading it.

Do not depend on local-only triggers, generated columns, stored procedures, custom SQLite extensions, or filesystem paths as domain identifiers.

Do not make FTS5 a Milestone 2 dependency.

Keep driver-specific code behind database/repository interfaces.

Keep raw payloads behind a RawSnapshotStore interface so local files can later map to R2.

Keep scheduling behind a Scheduler interface so hosted execution can be redesigned later.

Keep local SQLite pragmas in the local adapter, not migrations.

Do not add any of the following in Milestone 2:

.openai/hosting.json
D1 bindings
R2 bindings
Wrangler
Cloudflare runtime packages
Sites deployment configuration
Hosted scheduling

Those belong to Milestone 7 after the then-current Sites runtime and deployment requirements are reassessed.

2.4 Live and Demo data origins

The canonical domain field is:

const DataOriginSchema = z.enum(["demo", "live"]);
type DataOrigin = z.infer<typeof DataOriginSchema>;

Rules:

All Milestone 1 seed records become dataOrigin: "demo".

All SQLite-ingested source records become dataOrigin: "live".

The selected application mode is dataMode: "demo" | "live".

live is the default for ordinary local use.

A response or screen must never combine origins.

Existing localStorage watchlists/preferences may remain in localStorage in Milestone 2, but stored identifiers must be namespaced by data mode.

Demo content retains conspicuous demo labelling.

Live content must not inherit seeded evidence, confidence, safety, or attention scores.

Intervention, Peptide, and Creator pages may show honest Live-mode empty states until their later milestones. They may offer a deliberate switch to Demo mode, but may not silently substitute Demo content.

3. Milestone goal

Milestone 2 succeeds when a clean local installation can:

Create and migrate its per-user SQLite database.

Run all four connectors.

Preserve immutable, content-addressed raw snapshots.

Normalise remote records into durable application entities.

Rerun ingestion without duplicate entities, versions, or change events.

Detect meaningful source changes after a baseline import.

Display real papers, trials, and relevant TGA notices with provenance.

Show source freshness, health, failures, and run history.

Perform manual refresh and process-local scheduled refresh.

Preserve the complete Milestone 1 Demo mode.

Pass all existing and new deterministic quality gates without relying on the live internet.

The milestone collects and structures evidence. It does not yet make scientific judgments about that evidence.

4. Required reading

Review and preserve the intent of:

README.md
AGENTS.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/SOURCE_POLICY.md
docs/PRIVACY_BOUNDARIES.md
docs/ROADMAP.md
docs/DECISIONS.md
docs/adr/ADR-0001-seeded-api-boundary.md
docs/adr/ADR-0002-independent-evidence-dimensions.md
docs/adr/ADR-0003-localstorage-preferences.md
docs/adr/ADR-0004-demo-snapshot-labelling.md
docs/milestones/M1.md
docs/milestones/M1_COMPLETION_REPORT.md
packages/core/
packages/db/
packages/connectors/
packages/intelligence/
apps/api/
apps/web/

The existing Hono API and repository seam are intentional. Replace the seeded-memory implementation behind that boundary rather than bypassing it.

5. Scope
   5.1 In scope

Windows-first application-data path resolution

SQLite, Drizzle, and forward-only migrations

Seed and live repository implementations

dataOrigin and dataMode migration

Durable source configuration and source-health state

Immutable raw snapshots

Record versioning

Exact-identifier matching

Ingestion-run history

Incremental checkpoints and overlap windows

Shared resilient HTTP client

PubMed connector

ClinicalTrials.gov API v2 connector

Crossref exact-DOI enrichment connector

TGA RSS connector

Deterministic change detection

Manual refresh

Local process scheduler

Source-health and run-status UI

Live papers, trials, and regulatory notices

Provenance and official links

First-run, empty, partial-failure, and offline states

Fixture-based automated tests

Opt-in live smoke tests

Documentation, ADRs, and completion report

5.2 Explicitly out of scope

LLM/AI calls

Claim extraction

Evidence-maturity or confidence scoring

Hallmarks-of-ageing classification

Translation-gap classification

Creator monitoring

YouTube or X

Canonical intervention or peptide entities

Peptide vendor, sourcing, purchasing, or dosing information

ARTG integration

FDA/openFDA

ANZCTR

User accounts

Hosted deployment

D1/R2 adapters

Personal labs, medications, supplement doses, diagnoses, or other personal medical information

Medical recommendations

FTS5

Paid API services

Production backup/restore UI

6. Target architecture
   Official source
   ↓
   Shared HTTP client
   ↓
   Connector fetch page/feed response
   ↓
   Immutable RawSnapshotStore
   ↓
   Source-specific parser
   ↓
   Zod validation
   ↓
   Normalised source record
   ↓
   Source object and version persistence
   ↓
   Exact identifier matching
   ↓
   Content entity projection
   ↓
   Deterministic change detection
   ↓
   Repository/API
   ↓
   Live UI, source health, and alerts

Cross-cutting rules:

Connectors fail independently.

A failed connector must not roll back successful work from another connector.

One malformed record must not invalidate an otherwise usable page.

Partial failures must be visible.

No secrets may enter URLs stored in diagnostics, logs, raw-snapshot metadata, screenshots, or completion reports.

Raw source material and normalised projections must remain distinguishable.

Every Live content item must trace to at least one source object and version.

No personal health data is stored.

7. Package boundaries
   packages/core

Own:

Domain types and Zod schemas

API envelopes

DataOrigin and DataMode

Source, run, event, and provenance enums

Identifier/date normalisation utilities that are source-independent

No database-driver imports

No network access

packages/db

Own:

Application-data path resolver

Drizzle schema

Migration runner

Local better-sqlite3 adapter

Repository interfaces and implementations

Transactions

Raw-snapshot metadata

File-backed RawSnapshotStore

Pagination and query helpers

Database health/integrity checks

No source-specific HTTP logic

packages/connectors

Own:

Connector contracts

Shared HTTP client, retry, throttling, caching headers, and redaction

Source-specific clients, parsers, normalisers, and fixtures

PubMed

ClinicalTrials.gov

Crossref

TGA RSS

No React code

packages/intelligence

May own deterministic comparisons and change-event generation. It must not contain AI calls or opaque scientific assessment.

apps/api

Own:

Dependency wiring

Repository-mode selection

Ingestion orchestration

Local scheduler

API routes

Health/diagnostics

Loopback-safe administrative mutation routes

apps/web

Own:

Live/Demo mode selection

First-sync and empty states

Source health and ingestion UI

Manual refresh

Live list/detail views

Provenance display

Existing Demo experience

8. Database model

Implement the logical model below. Exact file partitioning is delegated, but the semantics are required.

8.1 Operational tables
sources

One row per source family.

Required concepts:

Stable ID: pubmed, clinicaltrials-gov, crossref, tga

Display name

Source kind

Official base URL

Enabled flag

Health state: never_run, healthy, degraded, failed, disabled, running

Last attempt, success, and failure timestamps

Consecutive-failure count

Sanitised last error

Created/updated timestamps

source_feeds

Required because TGA has multiple feeds.

Required concepts:

ID

Parent source ID

Stable feed key

URL

Category

Enabled flag

ETag

Last-Modified

Last checked/success timestamps

connector_checkpoints

Required concepts:

Source/feed ID

Connector version

Checkpoint schema version

Cursor JSON

Window start/end

Updated timestamp

Advance a checkpoint only after the associated transactional work commits.

ingestion_runs

Required concepts:

ID

Source ID or parent orchestration ID plus child runs

Trigger: manual, scheduled, startup_catchup, cli, reprocess, test

Status: queued, running, succeeded, partial, failed, cancelled

Started/completed timestamps

Cursor before/after

Fetched page count

Remote-record count

Raw-snapshot count

New object/version counts

Unchanged count

Inserted/updated content count

Change-event count

Warning/error counts

Sanitised summary

ingestion_run_errors

Required concepts:

Run ID

Source ID

Optional external record ID

Pipeline stage

Stable error code

Sanitised message

Retryable flag

Timestamp

Small validated diagnostic JSON

Never store keys, full auth headers, or unredacted authenticated URLs.

raw_snapshots

Store metadata only; bytes live in RawSnapshotStore.

Required concepts:

ID

Source/feed ID

SHA-256 over exact response bytes before compression

Relative storage key

Media type

Encoding

Compression

Byte lengths before/after compression

Retrieval timestamp

ETag/Last-Modified

Sanitised request fingerprint

Connector version

Parser version

Unique source/hash constraint

ingestion_run_snapshots

Join runs to snapshots so content-addressed payloads can be reused.

source_objects

One row per stable remote logical record.

Examples:

PubMed PMID
ClinicalTrials.gov NCT ID
Crossref DOI
TGA GUID or canonical item URL

Required concepts:

ID

Source ID

Normalised external ID

First seen/last seen

Current version ID

Source-created/source-updated timestamps when available

Canonical source URL

Unique (source_id, external_id)

source_record_versions

One row per materially distinct normalised version.

Required concepts:

ID

Source-object ID

Monotonic version number

Raw-snapshot ID

Normalised-record SHA-256

Source timestamps

First observed timestamp

Parser version

Validation status

Compact validated diagnostics

Unique (source_object_id, normalized_hash)

An identical refetch updates last-seen/run metrics but creates no version.

external_identifiers

Required concepts:

Content-item ID

Scheme such as pmid, doi, nct, tga-guid

Normalised value

Source ID

Appropriate uniqueness constraints

content_item_sources

Map content items to source objects.

Required concepts:

Content-item ID

Source-object ID

Role: primary, enrichment, related

First/last linked timestamps

8.2 Content tables
content_items

Common projection for Live searchable content.

Required concepts:

ID

Type: paper, trial, regulatory_event

data_origin, always live for SQLite-ingested records

Title

Source-provided summary/abstract excerpt where allowed

Source publication date

Source update date

First seen/last seen

Canonical URL

Record status

Created/updated timestamps

Do not add evidence, confidence, safety, or attention scores to Live content in Milestone 2.

papers

Required concepts:

Content-item ID

PMID

Normalised DOI

Journal/venue

Publisher

Publication status/type

Language

Licence

Explicit correction/retraction flags and relationships

Null/unknown for unsupplied fields; never manufacture values

paper_authors

Required concepts:

Paper ID

Ordinal

Display name

Given/family names where supplied

ORCID

Affiliation text

paper_funders

Populate only from explicit source metadata.

trials

Required concepts:

Content-item ID

NCT ID

Overall status

Study type

Phase values

Brief/official title

Sponsor

Enrollment count/type

Start, primary-completion, and completion dates

First-posted, last-update-posted, and results-first-posted dates

Results-posted boolean

Healthy-volunteer status when explicit

Minimum/maximum ages as source text and optional parsed values

Sex eligibility

Australian-location boolean derived only from explicit location records

trial_conditions
trial_interventions

Keep source-specific intervention names. Do not resolve them into canonical intervention/peptide dossiers.

trial_outcomes

Store outcome type, measure, description, and time frame when supplied.

trial_locations

Store facility, city, state/region, postcode, country, and coordinates only when supplied. Do not geocode.

trial_status_history

Required concepts:

Trial ID

Status

Effective source timestamp where available

Detected timestamp

Source-record version

Unique event key

regulatory_events

Required concepts:

Content-item ID

Jurisdiction: AU

Authority: TGA

Feed key/category

Event kind based on feed/category rather than inferred clinical severity

GUID/canonical URL

Source description

Relevance state: matched, not_matched, unclassified

Matched deterministic terms

Matcher version

No causation inference

8.3 Taxonomy and event tables
tags
content_item_tags

Use deterministic discovery/source tags only. Do not present them as scientific conclusions.

change_events

Required concepts:

ID

Event kind

Deterministic title and summary

Source-object ID

New version ID

Optional previous version ID

Source occurrence timestamp

Detection timestamp

Importance class based on explicit event type

Baseline flag

Validated before/after JSON

Stable unique deduplication key

change_event_items

Map events to affected content items.

8.4 Required indexes

At minimum index:

Source/external identifiers

DOI, PMID, and NCT ID

Content type and publication/update dates

Change detection date, baseline flag, and kind

Trial status/results state

TGA feed/relevance state

Source health/last success

Ingestion run status/start time

Normalised searchable title fields

Use EXPLAIN QUERY PLAN in tests or documented manual checks for principal list/search queries.

9. Migration behaviour

Commit migration files.

Migrations are forward-only and deterministic.

API startup creates the data directory and applies pending safe migrations.

Provide:

pnpm db:migrate
pnpm db:status
pnpm db:doctor

Fail startup clearly if migration fails.

Do not add a normal-user destructive reset command.

A test-only reset helper must refuse non-test paths.

Test:

empty database to current schema

no-op repeated migration

close/reopen persistence

foreign-key integrity

invalid/corrupt-file handling

10. Raw snapshot storage

Define a portable interface equivalent in behaviour to:

interface RawSnapshotStore {
put(input: {
sourceId: string;
bytes: Uint8Array;
mediaType: string;
preferredExtension: "json" | "xml" | "rss";
}): Promise<{
contentHash: string;
storageKey: string;
uncompressedBytes: number;
compressedBytes: number;
compression: "gzip";
}>;

get(storageKey: string): Promise<Uint8Array>;
exists(storageKey: string): Promise<boolean>;
}

Rules:

Compute SHA-256 over exact received bytes before compression.

Use content-addressed storage.

Write temporary file then atomically rename.

Reuse existing source/hash objects.

Store only relative storage keys.

Prevent path traversal.

Verify hash on integrity reads.

Gzip payloads.

Do not expose raw payloads through the browser API.

Do not commit locally fetched payloads.

Repository fixtures must be synthetic or reduced to minimum required fields rather than copying large abstracts.

Add:

pnpm ingest:reprocess --source <source-id>

Reprocessing from stored snapshots must require no network and remain idempotent.

11. Ingestion engine

Build one source-independent orchestration engine.

Required sequence:

Acquire an in-process source/run lock.

Refuse or coalesce overlapping runs.

Create the ingestion-run record.

Load last successful checkpoint.

Fetch using an overlap window.

Save raw bytes before parsing.

Parse records independently where possible.

Validate normalised records with Zod.

Upsert source object.

Compare normalised hash with current version.

Create a version only if changed.

Resolve exact identifiers to a content item.

Project source fields according to documented precedence.

Generate deterministic non-baseline events.

Commit each bounded page/feed transactionally.

Advance checkpoint only after commit.

Mark partial when some records fail but valid work commits.

Update source health.

Store sanitised diagnostics.

Release lock in all paths.

A crash after a committed page but before final completion must be recoverable by idempotent replay.

11.1 Baseline semantics

The first successful import for each connector is a baseline.

Baseline content appears in lists and details.

Baseline events use baseline = true.

Baseline events are excluded from “What changed since your last visit.”

Recent source publication dates may appear in a separate “Recently published/indexed” area.

Never imply an old source changed today merely because Healthspan Dashboard first indexed it today.

Later newly discovered or changed records are non-baseline.

11.2 Overlap/staleness defaults
PubMed incremental overlap: 72 hours
ClinicalTrials.gov incremental overlap: 7 days
Crossref enrichment refresh: 30 days
TGA RSS: ETag / Last-Modified when available
11.3 Initial windows and caps
PubMed initial lookback: 90 days
ClinicalTrials.gov updated-record lookback: 365 days
Crossref: exact DOI enrichment for local papers
TGA RSS: all entries currently returned by enabled feeds
First-run cap per connector: 1,000
Live-smoke cap: 25

A cap must be visible as capped/partial; never silently imply exhaustion.

12. Shared HTTP client

Create a shared client using Node fetch with:

Abort timeout

Bounded retries

Exponential backoff and jitter

Retry-After

Per-source throttling

Pagination-loop protection

Response-size limit

Content-type validation

ETag and Last-Modified

Sanitised structured logging

Identifying User-Agent

Secret-free request fingerprint

Injectable fetch, clock, sleep, and random functions for tests

Defaults:

Timeout: 30 seconds
Maximum attempts: 5
Retryable statuses: 408, 425, 429, 500, 502, 503, 504
Other 4xx: non-retryable by default

Do not retry parser/schema errors as transient network failures.

13. Connector specifications
    13.1 PubMed

Use NCBI E-utilities.

https://eutils.ncbi.nlm.nih.gov/entrez/eutils/

Requirements:

ESearch followed by batched EFetch

Entrez history/WebEnv where useful

Application tool name and contact email

Optional NCBI_API_KEY

Throttle below official ceilings:

no key: maximum 2.5 requests/second

key: maximum 8 requests/second

Never persist/log API keys

Preserve XML snapshots

Incremental source-date filtering and pagination

Versioned discovery-query configuration

Initial discovery concepts:

healthspan

healthy ageing / healthy aging

longevity

geroscience

biological ageing / biological aging

cellular senescence

senolytics

frailty and sarcopenia interventions

epigenetic/biological-age clocks

ageing-related intervention trials

At minimum parse, when supplied:

PMID

Title

Structured abstract sections

Journal

Publication dates

Authors/affiliations

DOI/article IDs

Publication types

Language

Keywords/MeSH

Grants/funding

Comments/corrections

Retraction/correction markers

Source update metadata

Prominent deterministic events:

paper discovered after baseline

correction/erratum relationship added

retraction

material title/abstract change

publication-status change

Indexing-only metadata may create an audit version without a prominent event.

Display PubMed attribution and official record links. Do not expose raw XML through the app API.

13.2 ClinicalTrials.gov

Use API v2 JSON.

https://clinicaltrials.gov/api/v2/

Requirements:

Confirm endpoint/query syntax against current official API v2 docs during implementation.

Correct page-token handling.

Prefer source-side fields/filters.

Preserve complete responses.

Conservative maximum of 2 requests/second.

Honour Retry-After.

Seven-day updated-record overlap.

Versioned/documented query set.

Discovery concepts:

aging / ageing

healthy aging / healthy ageing

healthspan

longevity

geroscience

frailty

sarcopenia

cellular senescence

senolytic

biological age

epigenetic age

age-related functional decline

Do not restrict to recruiting trials.

At minimum parse:

NCT ID

Brief and official titles

Overall status

Study type and phases

Sponsor/collaborators

Enrollment count/type

Arms/interventions

Conditions/keywords

Primary/secondary outcomes

Eligibility

Healthy-volunteer status

Sex/ages

Start, completion, posted, update, and results dates

Locations and explicit Australia flag

Results availability

Why-stopped text

References/links when supplied

Prominent events:

trial discovered after baseline

status change

results first posted

withdrawn/suspended/terminated

material enrollment change

completion-date change

intervention or primary-outcome change

Australian site added/removed

13.3 Crossref

Use the public REST API.

https://api.crossref.org/

Milestone 2 role: enrichment only.

Requirements:

Queue from locally held valid DOIs.

Use exact /works/{doi} lookups.

No broad Crossref keyword discovery.

Do not create duplicate papers when PubMed owns the primary record.

Refresh when absent, after source change, or after 30 days.

Send configured mailto and identifying User-Agent.

Honour server feedback and throttle conservatively.

Preserve, when supplied:

Publisher/container

Type/subtype

DOI

Licence

Funding

ORCID/ROR

Deposited/indexed/update dates

Relation metadata

Post-publication updates

Retraction/correction relationships

Reference counts/metadata

Precedence:

PubMed remains primary for PMID-linked title, abstract, journal, and PubMed bibliographic data.

Crossref enriches publisher, licence, funding, and relation fields.

Preserve conflicts in source versions.

Never overwrite a populated primary field with an empty/malformed enrichment value.

Link Crossref as source role enrichment.

13.4 TGA RSS

Enable these official feeds:

Safety alerts:
https://tga.gov.au/feeds/alert/safety-alerts.xml

Market actions:
https://tga.gov.au/feeds/alert/market-actions.xml

Safety updates:
https://tga.gov.au/feeds/article/safety-updates.xml

Media releases:
https://tga.gov.au/feeds/article/media-releases.xml

Exclude the broad general-news feed.

Requirements:

Fetch each feed independently.

Use ETag/Last-Modified when supplied.

Preserve RSS/XML snapshots.

Prefer GUID; fall back to canonical URL.

Do not scrape linked article pages in Milestone 2.

One feed failure must not invalidate the others.

Parse:

GUID

Title

Description

Publication date

Canonical link

Feed key/category

Author/category metadata when supplied

Ingest all returned entries, then apply a deterministic versioned relevance matcher for display.

Initial relevance groups:

ageing / aging / longevity / healthspan

peptide and named investigational peptide terms

senolytic/cellular-senescence terms

rapamycin/mTOR

metformin

NAD/nicotinamide-related interventions

growth hormone/hormone anti-ageing claims

high-interest metabolic agents discussed in longevity contexts

supplements/products explicitly marketed with anti-ageing claims

Store match state, matched terms, and matcher version. Do not infer causation or clinical severity.

14. Identifier normalisation and deduplication
    DOI

Trim.

Remove URL/prefix forms.

Decode safely.

Lowercase.

Validate a conservative DOI shape.

Exact-match only.

No fuzzy-title merging in Milestone 2.

PMID

Digits only after normalisation.

Preserve as text.

Exact unique match.

NCT ID

Uppercase.

Validate NCT plus eight digits.

Exact unique match.

TGA

Prefer GUID.

Otherwise canonical HTTPS URL with tracking parameters removed.

Never merge solely on similar titles.

Possible duplicates without exact identifiers may be logged for later review, but no review UI is required.

15. Deterministic change detection

A stable event deduplication key must incorporate:

source object
event kind
material field
normalised new value/version
effective or detected date as appropriate

Required event kinds:

record_discovered
record_materially_updated
paper_corrected
paper_retracted
trial_status_changed
trial_results_posted
trial_enrollment_changed
trial_outcomes_changed
trial_interventions_changed
trial_australian_locations_changed
regulatory_notice_published
regulatory_notice_updated

Rules:

Initial events are baseline events.

Identical records create no version/event.

Replayed changes create no duplicate event.

Events link old/new versions where applicable.

UI distinguishes source timestamp from Healthspan Dashboard detection timestamp.

No LLM-generated summaries.

Use deterministic templates.

Retraction/correction is visually distinct from ordinary metadata change.

TGA alerts do not automatically prove causation.

16. API

Retain existing routes where practical and make repository calls asynchronous.

Response envelope:

{
data: ...,
meta: {
dataMode: "live" | "demo",
generatedAt: string,
partial: boolean,
sourceFreshness?: ...
}
}

Required routes:

GET /health
GET /api/dashboard
GET /api/items
GET /api/items/:id
GET /api/search
GET /api/sources
GET /api/ingestion/status
GET /api/ingestion/runs
GET /api/ingestion/runs/:id
POST /api/ingestion/runs

Validated refresh body:

{
"sourceIds": ["pubmed", "clinicaltrials-gov", "crossref", "tga"],
"force": false
}

Behaviour:

Return 202 Accepted with identifiers.

UI polls status.

Coalesce/refuse duplicate concurrent runs.

Reject unknown sources.

Paginate list endpoints.

Never return raw snapshots.

Validate inputs and outputs.

/health includes database/source health but no usernames, exact private paths, secrets, raw stacks, or keys.

Security:

Default API host is 127.0.0.1.

Administrative mutations are local-only.

If bound beyond loopback, disable mutation routes unless HEALTHSPAN_ALLOW_REMOTE_ADMIN=true.

Show a warning when remote admin is deliberately enabled.

Do not add authentication in Milestone 2.

17. Scheduler

Create a replaceable scheduler interface and local process implementation.

Defaults:

Timezone: Australia/Brisbane
Schedule: 06:00 daily
One full refresh at a time

Environment controls:

HEALTHSPAN_SCHEDULER_ENABLED=true
HEALTHSPAN_REFRESH_CRON=0 6 * * *
HEALTHSPAN_TIME_ZONE=Australia/Brisbane
HEALTHSPAN_STARTUP_CATCHUP_ENABLED=true
HEALTHSPAN_STALE_AFTER_HOURS=24

Behaviour:

Disabled automatically in tests.

If startup catch-up is enabled and no successful run exists or data is stale, queue a run after server readiness.

Do not block API startup on network refresh.

If the process missed the scheduled time, startup catch-up handles it.

Show last and next runs in the UI.

Do not assume a permanent hosted background process.

18. User interface

Extend, do not replace, the Milestone 1 design system.

18.1 Mode control

Add clear Live/Demo selection in Settings and an unobtrusive global indicator.

Live: SQLite data only.

Demo: Milestone 1 seeds only.

Mode changes preserve preferences.

Mode changes never merge origins.

18.2 First-run Live state

When no Live content exists:

Explain that sources have not been synchronised.

Show enabled sources.

Offer Run first sync.

Show progress while the app remains usable.

Never fill with Demo content unless the user deliberately switches.

18.3 Source health

Show:

source/feed

enabled state

health

last attempt/success

next scheduled run

current run

latest counts

sanitised error

per-source refresh

refresh all

TGA may show four child feeds.

18.4 Today screen in Live mode

“What changed” uses non-baseline deterministic events.

“Recently published/indexed” is separate.

Trial Pulse uses real trial records.

Safety & Regulation uses matched TGA items.

Research Brief becomes a deterministic recent-paper list; do not imply AI authorship.

Signal Radar must not plot fabricated evidence/attention values. Replace it with an honest pending panel or source-activity view.

State that evidence classification arrives in Milestone 3.

Demo mode preserves the M1 Today screen.

18.5 Live lists/details

Research:

real paper list

date, journal, PMID/DOI

source links

correction/retraction state

permitted abstract/summary

provenance and retrieval dates

Trials:

real trial list

status, phase/type, sponsor

results state

Australia indicator

dates

conditions/interventions/outcomes

official source link

version/change timeline

Safety & Regulation:

matched TGA entries

feed category

date

source description

matched terms

official link

source-policy caveat

For all Live records:

distinguish publication/posted date, source-updated date, first-seen date, and last-checked date

no seeded scientific scores

later-milestone fields say “Not yet assessed,” not fabricated defaults

18.6 Unsupported Live sections

Interventions, Peptides, and Creators in Live mode:

polished explanatory empty state

identify the later milestone

deliberate Demo-mode action

no automatic seed substitution

19. Commands and environment

Add Windows-safe root scripts. Do not rely on POSIX-only inline environment assignment.

Required:

pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e

pnpm data:path
pnpm db:migrate
pnpm db:status
pnpm db:doctor

pnpm ingest:all
pnpm ingest --source pubmed
pnpm ingest --source clinicaltrials-gov
pnpm ingest --source crossref
pnpm ingest --source tga
pnpm ingest:status
pnpm ingest:reprocess --source <source-id>

pnpm test:connectors:live

The live connector test is opt-in and excluded from ordinary test/E2E runs.

Update .env.example without secrets:

HEALTHSPAN_DATA_MODE=live
HEALTHSPAN_DATA_DIR=
HEALTHSPAN_SCHEDULER_ENABLED=true
HEALTHSPAN_REFRESH_CRON=0 6 * * *
HEALTHSPAN_TIME_ZONE=Australia/Brisbane
HEALTHSPAN_STARTUP_CATCHUP_ENABLED=true
HEALTHSPAN_STALE_AFTER_HOURS=24

HEALTHSPAN_PUBMED_INITIAL_LOOKBACK_DAYS=90
HEALTHSPAN_CLINICALTRIALS_INITIAL_LOOKBACK_DAYS=365
HEALTHSPAN_FIRST_RUN_RECORD_CAP=1000
HEALTHSPAN_LIVE_SMOKE_RECORD_CAP=25

NCBI_TOOL=healthspan_dashboard
NCBI_EMAIL=
NCBI_API_KEY=
CROSSREF_MAILTO=

ClinicalTrials.gov and TGA require no project secret in this milestone.

20. Testing

All default automated tests must be deterministic and network-independent.

20.1 Path tests

Test:

Windows with LOCALAPPDATA

Windows missing-value fallback/error

macOS

Linux with XDG_DATA_HOME

Linux fallback

absolute override

relative production override rejection

explicit repo-local development override

temporary-test isolation

20.2 Database tests

Test:

empty/repeated migrations

persistence after reopen

foreign keys and WAL

repository CRUD

pagination and search

exact-ID uniqueness

rollback

checkpoint atomicity

source health

integrity/doctor result

no Demo/Live mixing

20.3 Raw-store tests

Test:

SHA-256

gzip round trip

atomic write

object reuse

path traversal rejection

missing object

corruption/hash mismatch

temporary cleanup

20.4 HTTP tests

Using injected fetch:

success

timeout

retryable/non-retryable status

Retry-After

backoff/jitter

rate limit

ETag/304

Last-Modified

pagination-loop protection

oversized response

wrong content type

secret redaction

20.5 Connector parser tests

For each connector:

normal record

minimal record

missing optional fields

one malformed record

pagination

updated version

duplicate fetch

source-specific correction/retraction/status event

Unicode

differing date precision

No default test contacts the internet.

20.6 End-to-end ingestion tests

Using fixture transports and temp databases:

First run creates baseline content.

Identical rerun creates no duplicate object/version/event.

Changed input creates exactly one version and expected event.

Malformed record yields partial run while valid records commit.

Crash/retry does not duplicate committed work.

Checkpoint advances only after commit.

Crossref enriches exact DOI paper and creates no second paper.

TGA deduplicates by GUID/canonical URL.

A second repository/process instance reads persisted data.

dataOrigin prevents Demo/Live mixing.

20.7 API/UI tests

Cover:

Live empty state

Run-first-sync flow via fixtures

running/success/partial/failure

source health

manual source/all refresh

Live paper detail/provenance

Live trial detail/timeline

Live TGA item

Demo remains functional

mode separation

no Live evidence score

mobile source-health layout

existing M1 tests remain green

20.8 Optional live smoke test

pnpm test:connectors:live:

explicit invocation only

low caps

temporary or explicitly selected data directory

no committed output

report date, source, counts, duration, sanitised errors

diagnostic only, not part of deterministic gates

21. Reliability, source, and privacy rules

Use official APIs/feeds; do not scrape source webpages in Milestone 2.

Respect source terms, attribution, identification, rate limits, and caching headers.

Batch PubMed calls.

Use Crossref’s polite request pattern.

Keep source and retrieval dates separate.

Preserve corrections, retractions, withdrawals, and terminated trials.

Never delete old versions because a newer one exists.

Never convert source errors into empty “success.”

Never present alerts, reports, associations, or mentions as causation.

Never infer regulatory approval from a paper/trial record.

Never provide medical advice, dosing, or purchasing information.

Never store personal health data.

Bind locally by default.

Never log secrets.

Add source/licence notes for committed fixtures.

22. Documentation and ADRs

Create/update:

README.md
AGENTS.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/SOURCE_POLICY.md
docs/PRIVACY_BOUNDARIES.md
docs/ROADMAP.md
docs/milestones/M2.md
docs/milestones/M2_COMPLETION_REPORT.md

Add:

docs/sources/PUBMED.md
docs/sources/CLINICALTRIALS_GOV.md
docs/sources/CROSSREF.md
docs/sources/TGA_RSS.md

Add ADRs using next available numbers for:

per-user data path/override policy

SQLite/Drizzle portability boundary for D1

content-addressed raw snapshots

versioned ingestion and deterministic events

strict Live/Demo separation and dataOrigin

Document:

path conventions

locating/manually backing up the DB

first sync

scheduling and disabling refresh

source queries and versions

rate-limit policy

source precedence

baseline vs detected changes

Crossref enrichment-only rationale

deferred functionality

informational/not-medical-advice boundary

Live records are not yet scientifically scored

23. Acceptance criteria

Milestone 2 is complete only when:

Clean Windows-first setup creates the DB in the specified per-user location.

HEALTHSPAN_DATA_DIR works and repo-local data is gitignored.

demo: true has been replaced canonically by dataOrigin, with dataMode at application/API level.

Drizzle migrations work automatically and through CLI.

Database survives restart and passes integrity checks.

Live and Demo are completely separate.

All M1 Demo screens/tests remain functional.

PubMed batching, identification, optional key, and compliant throttling work.

ClinicalTrials.gov v2 pagination/material changes work.

Crossref exact-DOI enrichment creates no broad-discovery duplicates.

All four TGA feeds ingest independently with deterministic relevance matching.

Successful responses have immutable snapshot metadata/content-addressed storage.

Reprocessing from snapshots works offline.

Identical reruns are idempotent.

Changed source input creates one version and one deduplicated event.

Initial imports are baseline and do not masquerade as new changes.

Partial failure preserves valid work and appears in diagnostics.

Source health, history, last success, and next run are visible.

Manual source/full refresh works.

Daily Australia/Brisbane scheduling and startup catch-up work while API is running.

Live paper/trial/TGA views show provenance and official links.

Live pages show no fabricated evidence/confidence/safety/attention scores.

Mutation endpoints remain local-only by default.

No secrets, DBs, raw payloads, or personal-health data are committed.

Default tests require no live internet.

Opt-in live smoke succeeds or documents a genuine upstream outage without weakening deterministic tests.

pnpm lint passes with zero warnings.

pnpm typecheck passes.

pnpm test passes.

pnpm test:e2e passes desktop and mobile.

pnpm build passes.

Documentation/ADRs match implementation.

M2 completion report/screenshots are committed.

Working branch is pushed.

No M3 work has begun.

24. Completion report

Commit docs/milestones/M2_COMPLETION_REPORT.md containing:

Executive summary

One-row-per-criterion checklist

Branch and commit hash

Major file-tree changes

Database location and migration version

Schema/table summary

Connector summary

Query versions/default windows

Dated live smoke result per source

Idempotency result

Material-change result

Source health/partial-failure behaviour

Scheduler behaviour

Security/privacy/copyright/source-policy observations

Commands and exact results

Lint result

Type-check result

Test counts

E2E result

Build result

Screenshots:

Live first-sync/running state

Live Today

Data Sources/health

Live paper

Live trial/timeline

Live TGA item

Demo after M2

Mobile source-health

Known issues/technical debt

Deviations and rationale

Genuine decisions required before M3

Do not begin Milestone 3.

25. Consult the project manager early only when

An official source materially changed/withdrew the required interface.

Source terms appear to prohibit planned local use.

A paid credential becomes indispensable.

better-sqlite3 cannot be made reliable on the supported Windows environment after reasonable debugging.

A change would destroy or silently rewrite user data.

A privacy/security boundary would be weakened.

Two acceptance criteria are genuinely incompatible.

A required capability is technically impossible after documented attempts.

Do not consult for routine dependencies, naming, schema implementation, component layout, fixtures, refactors, recoverable bugs, minor source-field differences, visual polish, or documentation wording.

26. Authorised start message

Begin Healthspan Dashboard Milestone 2 from the latest main. Create and work on milestone-2/persistent-data-backbone. Implement the complete persistent data backbone and official-source ingestion system within this execution brief. Make routine implementation decisions autonomously. Replace the canonical demo: true field with dataOrigin: "demo" | "live", preserve strict Live/Demo separation, do not fabricate scientific assessments for Live data, and do not begin Milestone 3. When every acceptance criterion is met, push the branch, commit the required completion report, report the final commit hash and exact test results, and stop.
