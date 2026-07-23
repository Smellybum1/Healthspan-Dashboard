# Healthspan Dashboard — Milestone 4 Execution Brief

Healthspan Dashboard — Milestone 4 Execution Brief

Milestone: 4 — Intervention, Peptide, Regulatory & Safety Intelligence Issued: 23 July 2026 Project manager: ChatGPT Execution agent: Grok 4.5 in Cursor Repository: Smellybum1/Healthspan-Dashboard Bas

1. Controlling instruction

Begin Healthspan Dashboard Milestone 4 from the exact final Milestone 3 branch head:

Create and work on:

Recommended start sequence:

If the working branch already exists locally, verify that its starting tree contains 4d985d3c8e9208fadc01e529270bcf5f37f1503d and that no Milestone 5 work is present.

Milestone 4 must:

Complete the mandatory Milestone 3 follow-ups in Section 5.

Create a source-grounded canonical intervention identity layer without destructively merging ambiguous names.

Build first-class Live intervention and peptide dossiers from M2/M3 papers, trials, claims, and regulatory events.

Add product-, formulation-, jurisdiction-, and indication-scoped regulatory intelligence for Australia and the United States.

Add regulator notices, label safety information, and carefully caveated spontaneous adverse-event reporting patterns without turning reports into proof of causality or incidence.

Extend existing trials with reviewed intervention mappings, dossier links, portfolio summaries, and comparison views.

Preserve strict Live/Demo separation, immutable provenance, source versioning, append-only review decisions, background jobs, the Brisbane scheduler, and all M1–M3 quality gates.

Provide a transparent entity-resolution workflow for ambiguous aliases, salts, formulations, combinations, peptide fragments, and analogues.

Never provide dosing, protocols, sourcing, purchasing, vendor links, treatment recommendations, stacking advice, or personal medical guidance.

Complete every acceptance criterion, push the branch, commit the completion report, report the final commit hash and exact quality results, and stop before Milestone 5.

Routine implementation decisions are delegated to Grok. Do not pause for approval over ordinary dependency additions, file layout, component structure, forward migrations, test fixtures, internal clas

Do not start creator monitoring, YouTube, X/Twitter, podcasts, social attention, personal health tracking, hosted deployment, D1/R2, authentication, or any other Milestone 5+ functionality.

2. Milestone outcome

At completion, a user must be able to open a Live intervention or peptide dossier and answer:

What exact substance, biological, behaviour, dietary pattern, procedure, device, formulation, salt, analogue, fragment, or combination does this dossier represent?

Which source names and identifiers were mapped to it?

Which mappings were automatic, reviewed, unresolved, rejected, or superseded?

Is the name itself ambiguous?

Is this a peptide, a peptide analogue, a peptide fragment, a larger protein/biologic, or merely a marketing/research label with no verified sequence?

What papers, claims, and trials are linked to this exact entity or variant?

What evidence maturity, result directions, populations, outcomes, methodological signals, and translation gaps are represented?

Which trials are active, completed, terminated, or have results?

Which product records are present in the Australian ARTG, Drugs@FDA, or FDA Purple Book?

What exact product, route, formulation, indication statement, jurisdiction, and effective date does each regulatory fact cover?

Does a source explicitly identify a product as unapproved, cancelled, suspended, withdrawn, or subject to a market action?

Which label warnings, contraindications, adverse-reaction sections, regulator safety notices, or regulator-identified potential signals are linked?

What spontaneous adverse-event reporting patterns were returned for an exact reviewed query, and what can those counts not establish?

Is an apparent “absence” a genuine checked result, an unavailable source, an unresolved identity, or a connector that has not run?

What evidence is missing before a healthspan or longevity claim could be considered more mature?

What materially changed since the previous dossier snapshot?

How does this intervention compare with up to three others across independent dimensions, without a winner or recommendation?

The product remains a research intelligence tool. It is not a prescribing tool, peptide catalogue, supplement recommender, risk calculator, vendor directory, or personal clinical decision system.

3. Non-negotiable scientific and product principles

3.1 Entity identity is not a string match

Names can refer to:

An active moiety

A salt or ester

A stereoisomer

A metabolite or prodrug

A peptide fragment or analogue

A formulation

A route-specific product

A brand

A combination product

A drug class

A behavioural intervention

A dietary pattern

A marketing or research label with uncertain identity

Do not collapse these merely because text is similar.

3.2 Regulatory status is scoped, not universal

Never display a bare entity-level statement such as:

A regulatory assertion must be scoped to, where the source provides it:

An entity-level summary may say:

One or more matched products are authorised or included in this jurisdiction.

It must not imply that every formulation, route, use, dose, or longevity claim is authorised.

3.3 Register inclusion and evidence are separate

Regulatory inclusion, licensing, listing, registration, or approval is not itself evidence that an intervention extends healthy human lifespan.

Scientific evidence maturity remains the M3 evidence model.

3.4 Trial activity is not regulatory authorisation

A ClinicalTrials.gov record means a study is registered. It does not establish that the intervention is approved, supplied lawfully, effective, or safe for the studied use.

Keep:

as separate dimensions.

3.5 “Not found” is not “unapproved”

Use:

when appropriate.

Assign:

only when an official regulator source explicitly describes the relevant product or use as unapproved.

3.6 Labels are source statements, not recommendations

Official label text may provide indication, warning, contraindication, and adverse-reaction statements. It must not be transformed into instructions about what the user should take.

Do not ingest or display dosage-and-administration instructions in Milestone 4.

3.7 Spontaneous reports are not causal proof

Adverse-event reporting systems have missing reports, duplicate/update complexity, publicity effects, exposure differences, confounding, and uncertain product-event attribution.

The app must never use spontaneous report data to calculate or imply:

Use the term:

unless an official regulator source itself labels something a potential signal or new safety information.

3.8 Safety is not one score

Do not create an overall safety number.

Display separate source classes:

3.9 Approval by indication must remain exact

A product authorised for a disease indication is not thereby authorised for longevity, healthy ageing, general prevention, or use in a healthy person.

Where imported official label text does not explicitly contain a longevity/healthspan indication, the UI may state:

No imported official indication statement matched healthspan or longevity as of [date].

It must not silently generalise that statement beyond the checked products, labels, sources, and jurisdiction.

3.10 Peptide identity must be safety-first

Do not assume two products or research labels contain the same peptide because they share a marketing name.

Do not invent:

Amino-acid sequences

Modifications

Molecular identity

Purity

Sterility

Formulation

Human-use suitability

Regulatory standing

Unknown sequence or composition remains unknown.

3.11 No composite intervention score

Do not combine evidence, regulation, trial activity, safety, research activity, classification confidence, or popularity into one score.

Prohibited Live labels include:

3.12 Every dossier fact has provenance

Every Live dossier fact must trace to:

A source record version

A reviewed entity mapping

A deterministic aggregation rule

A human review decision

Or a clearly labelled optional AI candidate

A fact with invalid provenance must not become current Live dossier content.

3.13 Corrections, retractions, status changes, and mapping changes are historical

Never delete history to make the current dossier appear cleaner.

Preserve:

Prior source versions

Prior dossier snapshots

Prior mappings

Superseded aliases

Human decisions

Regulatory status history

Safety notice history

Retractions and corrections

4. Fixed branch, stop, and merge decisions

5. Mandatory Milestone 3 follow-ups

Complete these as part of M4 before declaring the dossier layer complete.

5.1 Expand deterministic claim extraction beyond one primary claim

M3 correctly delivered source-bound claim extraction but records a known limitation of one primary deterministic claim per record.

Implement a versioned claim_rules.v2 or equivalent that can emit multiple atomic claims from:

Structured PubMed result sections

Structured PubMed conclusion sections

Unstructured abstracts when sentence boundaries and assertion roles are sufficiently clear

Explicit ClinicalTrials.gov posted-result outcome structures

Explicit ClinicalTrials.gov adverse-event result structures

TGA/FDA regulator statement rows

FDA label sections imported during M4

Rules:

Preserve each claim’s source span.

Preserve assertion role.

Planned outcomes remain planned.

Maximum default claims per content item is bounded and configurable.

Do not retrieve full text.

Do not use model world knowledge.

Do not split one qualified sentence into more assertive fragments.

Deduplicate paraphrases using source-version-aware fingerprints.

Preserve M3 analyses and history.

Reanalyse only eligible current records through queued jobs.

Add multi-claim evaluation fixtures.

Do not make AI a completion dependency.

5.2 Add a dedicated assessments service/API

Implement a server-side, paginated Live assessments surface:

Support validated filters for:

Evidence maturity

Evidence availability

Study design

Organism

Population

Outcome family

Translation gap

Methodological signal

Retraction/correction

Source

Date

Linked intervention entity

Do not load all assessments into route memory.

5.3 Preserve and expose M3 provenance during dossier aggregation

Dossier aggregation must not copy assessment or claim text into an untraceable summary.

Every evidence-map cell, count, claim group, and “what is missing” statement must link back to the M3 analysis/claim IDs used.

5.4 Document M3 as complete and M4 as current

Update:

Rules:

Preserve M3_COMPLETION_REPORT.md as a historical report.

Do not rewrite its feature-complete hash to pretend the final report-only commit was the feature commit.

State that M4 began from final M3 HEAD 4d985d3c... .

Mark M5 as future and not started.

5.5 Preserve M3 optional-AI boundaries

Existing AI remains disabled by default.

M4 must not require a paid model for:

Mention extraction

Entity resolution

Regulatory matching

Peptide identity

Dossier construction

Safety linking

Comparison

If AI is reused to propose a candidate alias or relationship:

It may create a review candidate only.

It may not auto-merge.

It may not assign a sequence.

It may not assign regulatory status.

It may not interpret spontaneous reports causally.

It may not create a safety or efficacy recommendation.

6. Fixed source decisions

6.1 Existing sources retained

Continue to use:

No regression is permitted.

Existing TGA RSS notices must be linked to reviewed intervention entities and products where possible, while preserving the original regulatory event.

6.2 New identity sources

Implement targeted, cached identity enrichment from:

These establish vocabulary and substance identity only. They do not prove approval, supply, efficacy, purity, or safety.

6.3 New Australian regulatory source

Implement a bounded, targeted connector for the official TGA ARTG public search and detail pages:

Fixed policy:

Do not crawl the full ARTG.

Search only reviewed entity names, active ingredients, known product names, and known ARTG IDs.

Prefer exact ARTG IDs and exact active-ingredient/product matches.

Store source HTML as raw snapshots.

Parse only clearly labelled official fields.

Preserve raw TGA codes and source wording.

Use low request rates and caching.

Check current robots/terms and document the result before enabling scheduled access.

If the current official site prohibits or technically prevents the planned bounded access, stop only this connector, mark it unavailable, and consult the project manager. Do not substitute a third-par

Do not automatically download or parse Product Information or Consumer Medicine Information PDFs in M4.

Link to official PI/CMI documents when the ARTG page provides them.

An ARTG search miss becomes no_exact_match_found , not unapproved .

6.4 New United States regulatory sources

Implement:

Official source locations:

6.5 Sources explicitly not used as approval authority

Do not use the FDA NDC Directory as proof of FDA approval.

Do not ingest the Orange Book in M4; therapeutic-equivalence and patent data are not required for this milestone.

Do not infer approval from:

RxNorm

GSRS

PubChem

ClinicalTrials.gov

PubMed

Crossref

openFDA label presence by itself

A vendor or manufacturer page

A product being available online

6.6 TGA DAEN decision

Do not automate or scrape TGA DAEN in Milestone 4.

Reasons reflected in product design:

No stable documented public API is being adopted for this milestone.

The interactive database has usage terms and changing technical behaviour.

Raw spontaneous-report data would require the same strict caveats as FDA data.

The UI may link to the official TGA DAEN landing page and clearly state that Healthspan Dashboard has not imported DAEN report counts.

Australian safety coverage in M4 consists of:

Existing TGA safety-alert RSS

Existing TGA safety-update RSS

Existing TGA market-action RSS

Existing TGA media-release RSS

ARTG product/register information

Direct official links

6.7 FDA AEMS naming

Use stable internal source IDs such as:

Display:

where useful.

Preserve the exact source release/quarter and the terminology used on the official page.

6.8 openFDA credential decision

OPENFDA_API_KEY is optional for installation but required before regular scheduled openFDA label/event enrichment is enabled.

Rules:

Drugs@FDA and Purple Book remain usable without an openFDA key.

HEALTHSPAN_OPENFDA_ENABLED=false by default.

Enabling it without a key produces a clear configuration state.

Never place the key in persisted URLs, logs, browser APIs, screenshots, or raw snapshot metadata.

The opt-in live smoke test may run without a key only if the current official service permits it within documented limits; scheduled operation still remains disabled until configured.

Cache aggressively and remain far below official limits.

6.9 No new paid data sources

Milestone 4 must work with free official sources and fixture data.

Do not add commercial drug databases, proprietary peptide databases, subscription regulatory products, or paid safety platforms.

7. Source dependency and refresh plan

The orchestration model is a dependency graph, not one unsafe monolithic transaction.

7.1 Source-independent steps

7.2 Recommended connector order for a full M4 refresh

Independent bulk sources may run concurrently if job leases and resource limits remain safe.

7.3 Default freshness

A connector that has never run must show not_checked , not an empty fact.

7.4 Default caps

Make caps configurable and visible in run diagnostics. A cap creates a partial/capped state, never silent completeness.

8. Canonical intervention identity model

8.1 Entity types

Support:

The entity type is classification, not a recommendation or regulatory status.

8.2 Entity lifecycle

Support:

Only active entities appear in ordinary Live dossier lists by default.

8.3 Identity confidence

Support:

Do not convert this into scientific confidence.

8.4 Variants

A canonical entity may have distinct variants for:

Salt

Ester

Stereoisomer

Prodrug

Metabolite

Peptide analogue

Peptide fragment

Sequence modification

Formulation

Strength

Dosage form

Route

Combination

Brand/product

A broad dossier may aggregate variants only when the UI clearly exposes the aggregation and permits filtering.

8.5 Relationships

Support reviewed relationships:

Rules:

same_substance_as requires exact trusted identifiers or human review.

Relationships are directional where appropriate.

No therapeutic equivalence is inferred.

No combination result is attributed to each component unless the source supports component-level inference.

No class-level evidence is automatically copied to every member.

8.6 Aliases

Every alias stores:

Alias text

Normalized alias

Language

Alias type

Source

Source record/version where applicable

Review state

Valid-from/to

Collision flag

Alias types include:

Do not auto-match an abbreviation that maps to more than one entity.

8.7 External identifiers

Support, when supplied:

Identifiers require scheme, value, source, status, and review provenance.

8.8 Normalization policy

Normalization may:

Unicode-normalize

Trim and collapse whitespace

Normalize punctuation safely

Normalize case for matching

Remove clearly non-semantic surrounding punctuation

Normalize identifier prefixes

Normalization must not erase meaningful distinctions such as:

D- versus L-

alpha versus beta

17α versus 17β

Salt/ester names

Fragment numbers

Peptide amidation/acetylation

Pegylation/lipidation

Route/formulation

Combination separators

Brand versus ingredient

Version every normalization algorithm.

9. Entity-resolution policy

9.1 Auto-accept rules

Automatic mapping is permitted only for:

Exact trusted identifier match with no collision.

Exact source-native product/application/register identifier.

Unique exact normalized alias with compatible entity type and no material variant conflict.

A reviewed rule that has deterministic fixtures and no unresolved collision.

Every auto mapping records the rule ID and version.

9.2 Review-required rules

Review is required for:

Approximate/fuzzy name match

Abbreviation

Homonym

Class-versus-agent ambiguity

Salt/ester/formulation collapse

Combination-versus-component

Peptide fragment/analogue ambiguity

Marketing/research label without standardized identity

Name-only GSRS/PubChem/RxNorm disagreement

Conflicting identifiers

Cross-jurisdiction product-name collision

AI-proposed mapping

One source mention with multiple plausible entities

9.3 Prohibited auto-merges

Never automatically merge based only on:

Similar titles

Shared mechanism

Shared class

Shared target receptor

Shared prefix/suffix

Vendor terminology

A creator/social claim

One approximate API match

Molecular-weight proximity

Similar peptide sequence

A language model’s assertion

9.4 Review actions

Entity-resolution tasks support:

Decisions are append-only and source-version-scoped.

Do not delete an entity during merge. Use redirects and superseding mappings.

9.5 Reprocessing

A mapping change must enqueue:

Affected claim/entity relinking

Trial portfolio rebuild

Regulatory link reassessment

Safety link reassessment

Dossier rebuild

Comparison cache invalidation

Review tasks for any materially changed current dossier fact

10. Peptide identity policy

10.1 Peptide classification

Support:

10.2 Sequence provenance

Store a sequence only when an official or recognized identity source supplies it.

Every sequence stores:

Sequence string

Alphabet/version

Length

Source

Source record/version

Exact/partial state

Modifications

Review state

Hash

Do not derive a sequence from a product name.

10.3 Modifications

Support source-provided or reviewed modification types:

Do not infer a modification from a marketing name alone.

10.4 Peptide dossier warning states

Display prominent states for:

10.5 Prohibited peptide functionality

No:

Vendor directory

Purchasing links

Promo codes

Compounding recipes

Synthesis instructions

Reconstitution instructions

Injection guidance

Dosing protocol

Cycling/stacking

Purity claims

Sterility claims

“Research chemical” sourcing

Circumvention of prescribing or customs rules

Official product strength, dosage form, and route may be displayed strictly as regulator product identity, not as a user instruction.

11. Regulatory semantics

11.1 Jurisdictions

Milestone 4 supports:

The schema remains extensible.

11.2 Authorities

Support:

Preserve source-native agency/sub-centre where useful.

11.3 Regulatory assertion kinds

Support:

11.4 Normalized regulatory standing

Support:

Preserve the raw source value alongside the normalized status.

11.5 Match scope

Every regulatory match records:

Only exact/reviewed matches contribute to current dossier regulatory summaries.

11.6 Indication model

Store:

Source indication text

Normalized condition/topic concepts

Population

Product/application

Route/formulation

Source section

Effective/source date

Source version

Match/review status

Distinguish:

Only the first two are regulatory indication/intended-purpose statements.

11.7 Healthspan/longevity status statement

A dossier may compute:

The displayed sentence must state:

Jurisdiction

Checked source set

Product scope

Last checked date

Limitations

11.8 Regulatory history

Material events include:

Initial source imports remain baseline and do not masquerade as fresh alerts.

12. Safety semantics

12.1 Safety evidence classes

Support:

12.2 Safety source precedence

Display sources by authority and type, not by an opaque rank.

Recommended visual ordering:

Active regulator action, explicit warning, recall, suspension, or unapproved-product notice

Official label warning/contraindication

Regulator-identified potential signal/new safety information

Trial or paper harm findings

Spontaneous report patterns

Coverage and identity limitations

This order is for comprehension, not a numerical safety score.

12.3 Label sections

Import only:

Do not ingest/display:

unless a later milestone explicitly changes policy.

Store source section hashes and bounded display excerpts. Link to the official label source.

12.4 Spontaneous report pattern model

For exact reviewed openFDA queries, store:

Query definition and hash

Identifier/alias used

Date range

Dataset update/retrieval date

Total matching reports

Top reported MedDRA reaction terms

Serious-report count where returned

Outcome categories where returned

Reporter-country or type only if useful and non-identifying

Annual/quarterly count series

Missing/unknown counts

Query limitations

Source version

Do not store individual case narratives or patient-level records.

12.5 OpenFDA query identity order

Prefer:

Do not issue a broad brand-only query without human review.

Do not combine alias query totals as though they were deduplicated.

12.6 Display language

Required banner:

These are spontaneous reports mentioning a matched product or substance. Reports are not proof that the product caused the event, do not provide an exposure denominator, may contain duplicates or foll

Use:

not:

12.7 No automatic safety alerts from count increases

A raw report-count increase must not create a prominent Safety Alert.

Prominent alerts require an official source event such as:

TGA safety alert/market action

FDA regulator potential-signal posting

Label warning change

Cancellation/suspension/withdrawal

Explicit regulator unapproved warning

Reporting-pattern refreshes may appear in audit history only.

13. Dossier aggregation model

13.1 Dossier identity

A dossier belongs to one canonical intervention entity.

Variant-level filtering must be available.

A dossier snapshot depends on:

Current reviewed mention mappings

Current M3 assessments and claims

Current source record versions

Trial records

Regulatory product/status records

Label sections

Safety notices/signals

Reporting-pattern snapshots

Dossier ruleset version

13.2 Dossier sections

Every Live dossier supports:

13.3 Evidence map

Aggregate M3 items by independent dimensions:

Organism

Study design

Evidence maturity

Evidence availability

Outcome family

Direction

Population

Retraction/correction

Review state

Rules:

Default excludes retracted items from supportive counts but shows a retraction warning/count.

Protocol-only studies do not contribute efficacy-result direction.

Combination evidence remains combination evidence unless source supports component attribution.

Class-level evidence does not automatically become member evidence.

Counts link to exact source items.

No weighted composite.

13.4 Trial portfolio

Show:

Total linked trials

Status distribution

Study types/phases

Results posted

Australia locations

Conditions

Source intervention terms

Entity/variant match scope

Status timeline

Trial-to-publication links where exact

Registry/publication discrepancy tasks

Do not duplicate the M2 trial store. Use canonical links to existing trials.

13.5 What evidence is missing

Aggregate M3 controlled evidence needs.

Dossier-level needs must be deterministic and explainable, for example:

Human evidence absent

Controlled human results absent

Results not posted

Only disease-population evidence

Only biomarker outcomes

Follow-up too short to address durable benefit

Independent replication absent

Safety coverage limited

Identity unresolved

Regulatory indication not established for the claimed use

Do not invent a clinical development plan or recommend self-experimentation.

13.6 Dossier history

Store immutable dossier snapshots.

A new snapshot is created only when material input or ruleset versions change.

Display:

Snapshot date

Material changes

Source/version changes

Mapping changes

Regulatory changes

Safety changes

Evidence changes

Identical rebuilds reuse the existing snapshot.

13.7 Comparison

Allow comparison of 2–4 active entities.

Compare:

Identity/type

Evidence maturity distribution

Results availability

Human/animal/cell distribution

Outcome families

Trial portfolio

Translation gaps

Regulatory matrix

Official safety sources

Reporting-pattern coverage

Retractions/corrections

Data freshness

Rules:

No winner

No recommendation

No rank

No stacking suggestion

No “safer” comparison based on spontaneous report counts

Clearly flag variant/class/combination incomparability

Link every cell to source-backed detail

14. Required database/schema work

Preserve all M2/M3 data. Add forward-only Drizzle migrations beginning after 0003_m3_review_provenance .

Use:

Text UUIDs generated in the application

UTC Unix-millisecond integer timestamps

Integer-backed booleans

Text enums validated with Zod

Explicit foreign keys

Normal tables and indexes

Validated small JSON only for opaque diagnostics/query definitions/diffs

No triggers

No generated columns

No stored procedures

No custom SQLite extensions

No FTS5 dependency

No vector extension

No filesystem paths as identifiers

The exact physical decomposition may be refined, but the following logical entities and semantics are required.

14.1 intervention_entities

Required concepts:

ID

Preferred name

Normalized preferred name

Entity type

Lifecycle state

Identity confidence

Short neutral description

Created/updated timestamps

Current dossier snapshot ID

Redirect target ID when redirected

Created by method/version

data_origin = live

14.2 intervention_aliases

Required concepts:

Entity ID

Alias text

Normalized alias

Alias type

Language

Source/source version

Review state

Collision flag

Validity timestamps

Unique constraints that do not suppress genuine collisions

14.3 intervention_identifiers

Required concepts:

Entity or variant ID

Identifier scheme

Normalized value

Source

Source record/version

Match/review state

Validity

Unique scheme/value constraints where the scheme is globally unique

14.4 intervention_variants

Required concepts:

ID

Parent entity ID

Variant type

Preferred name

Normalized name

Formulation/strength/route fields when applicable

Sequence/modification reference when applicable

Lifecycle/review state

Source provenance

14.5 intervention_relationships

Required concepts:

Source entity/variant

Target entity/variant

Relationship kind

Candidate/reviewed/rejected state

Direction

Source

Confidence

Human decision

Created/reviewed timestamps

Unique relation key

14.6 intervention_mentions

One row per source-bound mention.

Required concepts:

ID

Raw mention text

Normalized mention text

Mention type

Content item ID

Claim ID when applicable

Trial intervention ID when applicable

Regulatory event ID when applicable

Source object/version

Source field/span

Context hash

Extraction rule/version

Created timestamp

14.7 intervention_mapping_candidates

Required concepts:

Mention ID

Candidate entity/variant

Candidate source

Match method

Score only as matching confidence, not scientific score

Reasons/features

Collision state

Status

Created timestamp

14.8 intervention_mention_mappings

Required concepts:

Mention ID

Entity/variant ID

Mapping state

Mapping scope

Rule/decision ID

Source-version-set hash

Effective/superseded timestamps

Append-only history

Only one current accepted mapping per mapping scope unless a source explicitly names a combination/multiple entities.

14.9 entity_resolution_tasks

May extend the generic M3 review framework or use a linked subtype table.

Required concepts:

Mention/candidate references

Reason

Priority

Status

Proposed mapping

Current mapping

Source span

Created/resolved timestamps

Stale state

14.10 entity_resolution_decisions

Append-only decision log.

Required concepts:

Task ID

Action

Prior/resulting mapping hashes

Entity/variant changes

Reason/note

Source-version-set hash

Reviewer

Timestamp

14.11 peptide_profiles

Required concepts:

Entity/variant ID

Peptide classification

Sequence state

Sequence length

Molecular formula/mass only when source supplied

Structure/identity source

Review state

Updated timestamp

14.12 peptide_sequences

Required concepts:

Profile ID

Sequence

Sequence hash

Alphabet/version

Exact/partial state

Source/source version

Review state

14.13 peptide_modifications

Required concepts:

Sequence/profile ID

Modification type

Position/range when supplied

Source wording

Source/version

Review state

14.14 regulated_products

Required concepts:

ID

Jurisdiction

Authority

Source product/register/application identifier

Product name

Sponsor/applicant

Product type

Dosage form

Route

Strength

Marketing/register status

Source created/updated/effective dates

Current source version

Canonical official URL

Unique source-native product key

14.15 regulated_product_ingredients

Required concepts:

Product ID

Entity/variant ID when reviewed

Raw ingredient name

Role

Strength text

Mapping status

Source/version

14.16 regulatory_applications

Required concepts:

Product/application relationship

Application/licence/register number

Application type

Authority centre/source

Applicant/sponsor

Original approval/inclusion date

Current status

Source version

14.17 regulatory_assertions

Required concepts:

Product/application/entity references

Jurisdiction/authority

Assertion kind

Normalized standing

Raw source status

Scope fields

Match scope

Effective/expiry date

Source object/version

Current/superseded state

Review state

14.18 regulatory_indications

Required concepts:

Assertion/product/application

Raw indication text

Normalized condition/topic concepts

Population

Route/formulation scope

Source section/span

Source version

Review state

14.19 regulatory_status_history

Required concepts:

Product/application/assertion

Prior/new status

Effective/source date

Detected date

Source versions

Stable event deduplication key

14.20 product_label_records

Required concepts:

Product/application

SPL set ID or source-native label ID

Version/effective date

Source version

Current/superseded state

Disclaimer version

14.21 product_label_sections

Required concepts:

Label record

Allowed section kind

Section hash

Source text or stored segment reference

Bounded display excerpt

Source field path

Source version

Do not store dosage-and-administration as a dossier display section.

14.22 safety_items

A normalized linkable safety object.

Required concepts:

Kind

Authority/source

Title/summary

Source date

Source version

Official URL

Regulatory certainty class

Current/superseded state

Existing TGA regulatory events may be linked rather than duplicated. Document the mapping.

14.23 intervention_safety_links

Required concepts:

Safety item

Entity/variant/product

Match scope

Match method

Review state

Source wording

Created/superseded timestamps

14.24 regulator_signal_records

Required concepts:

FDA AEMS report quarter

Product/class text

Potential signal/new safety information text

Additional information/status

Source date/update date

Source version

Reviewed entity/product links

14.25 adverse_event_query_definitions

Required concepts:

Entity/variant/product

Query source

Identifier field/value

Date range policy

Query hash

Review state

Active/superseded state

Created/reviewed timestamps

14.26 adverse_event_reporting_snapshots

Required concepts:

Query definition

Dataset/source date

Retrieval date

Total report count

Serious count when returned

Time series coverage

Source snapshot/version

Formula/parser version

Limitations version

Unique input/query/source-date identity

14.27 adverse_event_term_counts

Required concepts:

Snapshot

MedDRA term/category

Count

Rank

Normalized term

Source field

14.28 dossier_snapshots

Required concepts:

Entity ID

Input dependency hash

Dossier ruleset version

Status

Created timestamp

Evidence/trial/regulatory/safety counts

Coverage states

Deterministic summary fields

Unique analysis identity

14.29 dossier_source_dependencies

Join dossier snapshots to:

Claims

Assessments

Content items

Trials

Source record versions

Mapping decisions

Regulatory assertions

Label records

Safety items

Reporting snapshots

14.30 intervention_dossier_state

One row per active entity:

Current dossier snapshot

Stale flag/reason

Pending job

Last successful rebuild

Last reviewed

Updated timestamp

14.31 dossier_change_events

Required concepts:

Entity

Prior/new snapshot

Event kind

Baseline flag

Deterministic summary

Material diff

Detected/source dates

Deduplication key

14.32 Existing-table extensions

Add reviewed intervention links to existing structures without replacing them:

Trial interventions

Live claims

Content-item concepts

Regulatory events

Review tasks

Background jobs

Change events

14.33 Required indexes

At minimum index:

Entity lifecycle/type/preferred name

Alias normalized value and collision

Identifier scheme/value

Current mention mapping

Mapping candidate status

Resolution task status/priority

Peptide classification/sequence hash

Jurisdiction/authority/product identifier

Application/licence/register number

Regulatory standing/effective date

Indication concepts

Label product/section/version

Safety kind/date

Safety entity/product link

Reporting query/entity/source date

Current/stale dossier state

Dossier dependency joins

Trial/entity joins

Claim/entity joins

Add query-plan tests or documented EXPLAIN QUERY PLAN checks for principal list, dossier, regulatory, safety, comparison, and resolution queries.

15. Package responsibilities

15.1 packages/core

Add versioned Zod schemas and taxonomies for:

Keep packages/core free of:

Database drivers

Network clients

React

Source-specific parser implementations

15.2 packages/db

Add:

Forward migrations

Entity/variant/alias/identifier repositories

Mention and mapping repositories

Resolution review persistence

Regulatory repositories

Label/safety/reporting repositories

Dossier snapshot/state repositories

Server-side filtering/pagination

Transactional mapping changes

Transactional dossier-current-pointer updates

Staleness queries

Doctor checks

Query plan/performance fixtures

No scientific or regulatory interpretation rules belong in the DB package.

15.3 packages/connectors

Add source adapters for:

All connectors must use the existing:

HTTP client

Raw snapshot store

Source/feed health model

Baseline model

Ingestion runs

Background jobs

Checkpoints

Retry/redaction policy

Where bulk ZIP/CSV files are used, add safe archive and staging utilities.

15.4 New packages/interventions

Create:

Recommended structure:

Responsibilities:

Mention extraction

Name/identifier normalization

Deterministic candidate generation

Collision policy

Entity/variant relationship rules

Peptide identity rules

Regulatory-scoping semantics

Safety display policy

Dossier aggregation

Comparison model

Dossier change detection

Evaluation harness

Most package tests must run without database or network.

15.5 packages/intelligence

Extend only as needed for:

Multi-claim deterministic extraction

Claim-to-intervention mention hooks

Dedicated assessment query contracts

Preserving M3 provenance

Reanalysis after source/label changes where applicable

Do not move canonical identity or regulatory logic into @healthspan/intelligence .

15.6 packages/ui

Add reusable components where justified:

15.7 apps/api

Add:

Intervention services

Entity-resolution orchestration

Regulatory/safety source orchestration

Dossier services

Comparison service

New job handlers

Scheduler stale-source checks

Admin-guarded mutation routes

Safe diagnostics

Source health integration

Graceful shutdown/recovery

15.8 apps/web

Add:

Live Interventions

Live Peptides

Intervention dossier

Peptide dossier

Regulatory & Safety workspace

Entity Resolution Queue

Comparison

Trial/entity links

Dossier history

New Today cards/events

Methodology expansion

Desktop/mobile E2E coverage

Demo regressions

16. Connector requirements

16.1 RxNorm

Official interface:

Use:

Exact string/name lookup

Concept properties

Related concepts

Ingredient/clinical-drug concept types

Current concept status

Rules:

Prefer exact matches.

Approximate match results are review candidates only.

Preserve RxCUI and term type.

Do not infer approval.

Do not map a clinical drug product directly to a broad active moiety without preserving the product/variant relationship.

Cache responses for at least 30 days.

One request per second by default.

Store JSON/XML raw snapshots according to endpoint.

Add deterministic fixtures for retired/historical/ambiguous concepts.

16.2 GSRS

Official interface:

Use for:

UNII

Standardized substance names

Substance type

Chemical/structurally diverse/protein/nucleic-acid identity

Source-provided relationships

Peptide/protein sequence and modification data where explicitly available

Rules:

Exact UNII is trusted identity.

Name-only search is a candidate until uniqueness/type compatibility is established.

GSRS presence is not approval.

Preserve GSRS source type and record version/retrieval date.

Do not infer sequence or modifications not supplied.

Cache 30 days.

One request per second by default.

Treat schema changes as connector health failures, not silent empty data.

16.3 PubChem

Official interface:

Use for chemical identity enrichment:

CID

Preferred title

Synonyms as candidates

Molecular formula

Molecular weight

InChIKey

Canonical/isomeric structure identifiers when supplied

Rules:

Exact CID/InChIKey is trusted.

Name-only matches require compatibility/review.

PubChem presence is not approval or efficacy evidence.

Do not use similarity search for auto-merging.

Do not use bioassay activity as dossier efficacy evidence in M4.

Do not fetch 2D/3D neighbor sets.

Cache 90 days.

One request per second by default.

16.4 TGA ARTG

Official interface:

Required behaviour:

Feature-specific official-site connector, not a generic scraper.

Targeted query by reviewed name, active ingredient, product name, or ARTG ID.

Parse search results and detail pages.

Preserve: ARTG ID ARTG name Product name ARTG date Registration type Therapeutic-good type Sponsor Ingredients Licence category Licence status Official URL PI/CMI links if exposed

Preserve:

ARTG ID

ARTG name

Product name

ARTG date

Registration type

Therapeutic-good type

Sponsor

Ingredients

Licence category

Licence status

Official URL

PI/CMI links if exposed

Do not infer human-use indication from product name.

Do not parse PI/CMI PDF contents in M4.

Store raw HTML.

Use conditional headers where supported.

Rate limit to 0.5 requests/second.

Cap query/detail work.

Detect HTML contract changes.

Parser contract failures mark the source degraded.

Exact ARTG ID can auto-link.

Ingredient/name matches create candidates unless unambiguous and type-compatible.

licence status remains source-native plus a documented normalization.

Search misses are recorded with query/date/scope and expire; they are not permanent facts.

Live smoke requirements:

One exact known ARTG ID fixture/smoke

One exact active ingredient query

One no-result query

One ambiguous multi-result query

One parser-change failure fixture

Do not hard-code a contemporary product fact as permanent truth.

16.5 Drugs@FDA

Official source:

Required behaviour:

Download the official ZIP.

Store the exact ZIP as a raw snapshot.

Extract only into a temporary controlled directory.

Reject zip-slip/path traversal.

Enforce compressed/uncompressed size limits.

Validate expected tables/headers.

Parse source release/update date.

Import to staging tables.

Validate row counts and referential relationships.

Atomically project/swap current source data after validation.

Preserve prior source version.

Idempotent identical refresh.

Create material regulatory events only after baseline.

Schedule at most once per 24 hours.

At minimum ingest:

Applications

Products

Active ingredients

Application actions

Marketing status

Sponsors/applicants

Dosage form/route

Strength

Application/product numbers

Approval/action dates

Source-native relationships

Rules:

Exact application/product mapping may contribute to authorization.

Preserve NDA/ANDA/BLA source type.

Do not infer indication from product name.

Do not infer current distribution from historic approval alone.

Do not claim every product under one active ingredient shares the same status.

16.6 FDA Purple Book

Official source:

Required behaviour:

Prefer official full-data CSV when available.

If current official distribution requires another supported tabular format, document and test the parser.

Preserve source release month/date.

Store raw file.

Stage, validate, and atomically project.

Refresh weekly, recognizing the official source is generally monthly.

Preserve: BLA/licence identifiers Proper name Proprietary name Applicant Product category Reference/biosimilar/interchangeable source fields Approval date Marketing status fields when supplied Source

Preserve:

BLA/licence identifiers

Proper name

Proprietary name

Applicant

Product category

Reference/biosimilar/interchangeable source fields

Approval date

Marketing status fields when supplied

Source relationships

Rules:

Purple Book is the authority for FDA-licensed biological products.

Preserve source wording.

Do not infer interchangeability unless explicitly supplied.

Do not infer a peptide identity merely because a product is biological.

Map to exact reviewed substances/products.

16.7 openFDA drug labels

Official source:

Required behaviour:

Disabled until HEALTHSPAN_OPENFDA_ENABLED=true and a key is configured for scheduled use.

Prefer exact application number or exact reviewed identifiers.

Store JSON raw snapshots.

Preserve SPL set ID, effective/version date, openFDA annotations, product identifiers, and selected sections.

Refresh 30 days or after product change.

Handle multiple labels per ingredient/product without arbitrary collapse.

Select current display labels through documented rules.

Preserve superseded versions.

Required disclaimer:

Label submissions may change over time.

openFDA reformats submitted labeling.

The returned label may not be identical to labeling on a currently distributed or approved product.

OTC listing/label presence is not necessarily FDA approval.

Do not import dosage-and-administration into the dossier display.

16.8 FDA AEMS potential-signal pages

Official source:

Required behaviour:

Parse the current quarterly report index and archived quarterly reports.

Store raw HTML.

Preserve report quarter, publication/update date, product/class text, signal/new-safety-information text, and additional information.

Version page structure/parser.

Link only through reviewed identity/product mappings.

Baseline old quarterly entries.

Material later additions/updates create official safety events.

Display exactly as potential signal or new safety information , not causal proof.

Use stable source ID fda-aems-signals .

16.9 openFDA drug adverse-event aggregates

Official source:

Required behaviour:

Aggregate queries only.

Do not store patient-level reports or narratives.

Require a reviewed query definition.

Prefer exact application/RxCUI/UNII.

Query counts and grouped fields in bounded calls.

Store query and source coverage.

Refresh no more than every 90 days by default.

Handle quarterly lag.

Never combine aliases without explaining possible overlap.

Never calculate incidence or comparative safety.

Never label an aggregate pattern as a regulator signal.

Never create a prominent safety alert solely from count change.

Disabled until regular openFDA access is configured.

16.10 Existing TGA RSS relinking

Reprocess current TGA regulatory events to create candidate links to entities/products.

Rules:

Preserve original event.

Exact ARTG/product/ingredient identity may auto-link.

Broad topic names require review.

Regulator wording is not expanded.

One event may link to multiple entities when explicit.

Link changes are append-only and audited.

17. Dossier and resolution jobs

Add job kinds such as:

Rules:

Persisted jobs

202 mutation semantics

Lease/restart recovery

Deduplication

Bounded retries

Parent/child orchestration

Source failures independent

Dossier rebuild after dependencies commit

Graceful shutdown

No unbounded fan-out

No automatic paid AI jobs

A material accepted mapping must enqueue downstream rebuilds transactionally or through an outbox-equivalent durable pattern.

18. Backfill and baseline behaviour

18.1 Existing data backfill

Backfill intervention mentions from:

Trial intervention rows

M3 claim intervention/exposure fields

Paper titles/abstract source segments where deterministic rules identify an intervention mention

TGA regulatory event title/description

Existing Demo data only within Demo mode

Do not mix Demo and Live.

18.2 Baselines

Each new source/feed has its own baseline completion state:

Targeted sources may use per-entity/per-query baseline state where appropriate.

Old records imported on the first run must not appear as newly issued today.

18.3 Dossier baseline

The first dossier snapshot is baseline.

Later material changes create non-baseline dossier change events.

18.4 Search misses

A search miss has:

Query

Source

Scope

Identity state

Date

Expiry/staleness date

Connector/parser version

A stale miss must be rechecked. It must not become permanent “unapproved” truth.

19. API requirements

Retain the existing response envelope and strict dataMode .

All lists are server-side paginated and filtered.

19.1 Interventions

Filters:

19.2 Peptides

Support:

Peptide classification

Sequence state

Human evidence

Trial status

Regulatory coverage

Official warning state

Identity ambiguity

19.3 Comparison

Body:

Rules:

2–4 IDs

Live-only

No recommendation field

No winner/rank

Return comparability warnings

Server-side aggregation

Safe bounded response

19.4 Entity resolution

All mutations:

Local-admin guarded

Zod validated

Source-version concurrency checked

Append-only audited

Return conflict when stale

19.5 Regulatory and safety

Required filters:

19.6 Dossiers

Mutations return 202 Accepted .

19.7 Assessments follow-up

19.8 Methodology

19.9 Safe API metadata

Include where relevant:

Never return:

Raw snapshots

Full label text

Individual adverse-event case records

API keys

Local filesystem paths

Raw stack traces

Vendor links

Dosing instructions

Hidden model reasoning

Unreviewed ambiguous regulatory matches as current facts

20. UI requirements

Preserve the premium scientific design, responsive behaviour, accessibility, and Demo mode.

20.1 Live Interventions page

Replace the Live placeholder with a real page.

Show:

Preferred name

Entity type

Identity confidence

Key variants

Human-results availability

Evidence-maturity distribution

Trial count/results

Regulatory coverage by AU/US

Official safety source indicators

Resolution/staleness state

Last checked

Do not show a single intervention score.

20.2 Intervention dossier

Use clear sections/tabs:

The overview should answer:

What it is

What exact identity is represented

What evidence exists

What evidence is missing

What regulatory sources cover

What the dossier does not establish

Current coverage/freshness

20.3 Live Peptides page

Replace the Live placeholder with a safety-first peptide registry.

Show:

Verified/partial/name-only identity

Peptide/analogue/fragment/protein classification

Sequence status, not sequence by default in list

Human evidence

Trial state

Regulatory match state

Official unapproved/warning notices

Identity ambiguity

No vendor or dosing content.

20.4 Peptide detail

Display:

Identity warning

Aliases/research codes

Sequence and modifications only when sourced

Related-but-distinct analogues/fragments

Evidence and claims

Trials

AU/US regulatory matrix

Official safety notices

Reporting-pattern coverage

Missing evidence

Provenance

Resolution history

20.5 Regulatory & Safety workspace

Add a first-class workspace with:

New/changed authorizations/register records

Cancellations/suspensions/withdrawals

Label indication/warning changes

TGA notices

FDA AEMS potential signals

Explicit unapproved-product warnings

Source health

Regulatory match-review tasks

Coverage limitations

Do not make raw spontaneous report count changes a top alert.

20.6 Entity Resolution Queue

Provide:

Mention context

Source span/link

Candidate entities/variants

Identifier evidence

Collision warnings

Exact versus fuzzy reasoning

Accept/map/create/ambiguous/reject/defer actions

Prior decisions/history

Stale source warning

Support desktop and mobile.

20.7 Evidence map

Use a matrix or grouped view with filters for:

Cell/animal/human

Design

Maturity

Result availability

Direction

Outcome

Population

Variant

Retracted/corrected

Every cell links to items.

20.8 Trial portfolio

Enhance Trial pages and dossier panels:

Canonical entity mapping

Source intervention term

Variant

Status/results

Australian locations

Change timeline

Exact/ambiguous mapping state

Dossier link

20.9 Regulatory matrix

Rows should represent exact products/applications/register entries.

Columns:

Jurisdiction

Authority

Product

Entity/variant match

Form/route/strength

Standing

Indication/intended-purpose coverage

Effective date

Last checked

Source link

Entity-level summary must be scoped.

20.10 Safety section

Visually separate:

Official action/warning

Label statements

Regulator potential signals

Trial/paper harm evidence

Reported-event patterns

Coverage limitations

Always display the spontaneous-report caveat next to those patterns.

20.11 Comparison

Provide a 2–4 intervention comparison screen.

No default recommendation.

No green “winner” styling.

No spontaneous-report count comparison as a safety ranking.

Show not comparable when applicable.

20.12 Today screen

Add non-baseline events such as:

New exact regulatory product match

Authorization/register status changed

Label warning changed

TGA notice linked

FDA potential signal linked

Explicit unapproved warning linked

Dossier evidence profile materially changed

Do not alert on:

Initial baseline imports

Raw report-count increases

Fuzzy candidate generation

Routine identical refresh

20.13 Source health

Show all new sources and targeted coverage:

Enabled/configured state

Key-required state

Last run/success

Baseline status

Records/entities covered

Capped/partial state

Parser contract state

Next due time

Sanitised errors

20.14 Methodology

Expand with:

Identity model

Alias/variant policy

Auto-match policy

Peptide identity limits

Regulatory scope

Register inclusion versus evidence

Label limitations

“Not found” versus unapproved

Safety-source classes

AEMS/FAERS/openFDA limitations

Dossier aggregation

Comparison policy

No dosing/sourcing/medical advice

Source coverage table

20.15 Demo mode

Preserve all M1 Demo pages.

Do not copy Demo Intervention/Peptide records into Live.

Keep mode badges.

No ID collisions.

Demo E2E remains green.

21. Commands

Add Windows-safe root scripts:

Existing commands must continue to work:

Rules:

Backfills default to deterministic-only.

Live tests are opt-in.

Live tests use caps and temporary/explicit data directories.

No committed live raw data.

No command prints keys or exact paths except pnpm data:path .

22. Environment configuration

Update .env.example without secrets.

Validate configuration.

An intentionally disabled connector is a visible state, not a failure.

23. Evaluation corpus

23.1 Intervention identity corpus

Create at least 120 licence-safe synthetic or reduced fixtures.

Coverage:

Exact identifier matches

Exact aliases

Ambiguous abbreviations

Brand/generic

Salt/ester

Stereoisomer

Prodrug/metabolite

Formulation/route

Combination/component

Drug class/member

Botanical/extract

Behavioural intervention

Dietary pattern

Research/development code

Misspelling

Cross-source identifier agreement/disagreement

Redirect/split

Source-version change

Unicode/scientific symbols

At least:

23.2 Regulatory corpus

Create at least 72 fixtures covering:

ARTG active register record

ARTG listed/registered/assessed-listed distinctions

ARTG cancelled/suspended source states

ARTG no-result query

ARTG ambiguous result

Drugs@FDA applications/products/actions

Drugs@FDA discontinued/marketing status

Purple Book licensed biologic

Biosimilar/interchangeability source fields

Exact and ambiguous product mappings

Label indication/warning version change

Product authorization without longevity indication

No exact match versus explicitly unapproved

Baseline versus later status change

Source unavailable

23.3 Safety corpus

Create at least 48 fixtures covering:

TGA safety alert

TGA market action

TGA explicit unapproved warning

FDA AEMS potential signal

Label boxed warning

Label contraindication

Label adverse reaction

Trial harm result

Paper harm claim

OpenFDA aggregate count

Duplicate/follow-up caveat

Multi-drug/multi-reaction ambiguity

Zero-result query

No denominator

Dataset lag

Alias overlap

No identity match

23.4 Multi-claim corpus

Add at least 32 cases to the M3 claim evaluation for:

Multiple result claims in one abstract

Null plus positive endpoint

Benefit plus harm

Primary versus secondary outcome

Planned versus reported outcome

Qualified conclusion

Registry result table

Label warning/indication statements

23.5 Deterministic evaluation gates

Required:

100% schema-valid output

100% source-span/source-record provenance

100% exact identifier mapping on unambiguous fixtures

0 fuzzy auto-merges

0 class-to-member evidence copying

0 combination-to-component result copying without source support

0 salt/fragment/analogue destructive collapse in no-collapse fixtures

100% protocol-versus-result separation

100% human/animal/cell separation

100% no-result versus explicitly-unapproved separation

100% product/jurisdiction scoping

100% spontaneous-report caveat attached

0 incidence/causality inference from report counts

0 dosing/sourcing output

0 composite intervention/safety score

100% idempotent identical dossier rebuild

100% stale dossier detection after dependency change

100% retraction/correction exclusion from supportive default aggregation

23.6 Live smoke tests

Opt-in only.

Record date, endpoint/source, release/version, counts, duration, cap, and sanitised errors.

Required source families:

openFDA label/event smoke is required only when a key is intentionally configured.

A genuine upstream outage or terms/contract issue must be documented honestly. Do not weaken fixture tests.

24. Testing requirements

All default tests remain deterministic and network-independent.

24.1 Migration tests

M3 database to M4

M2-shaped database through all migrations

Repeated migration

Existing claims/reviews/jobs preserved

Foreign-key integrity

Rollback on failed migration

No Demo/Live mixing

No destructive reset

24.2 Entity repository tests

Entity CRUD/state

Alias collision

Identifier uniqueness

Variant relationships

Redirect without deletion

Mention deduplication

Candidate generation

Accepted current mapping

Append-only decision

Mapping supersession

Staleness/downstream queue

Pagination/filtering

Query plans

24.3 Peptide tests

Verified sequence

Partial sequence

Unknown sequence

Analogue

Fragment

Protein versus peptide

Modification provenance

Ambiguous marketing label

No invented sequence

No vendor/dosing field

24.4 Connector parser tests

For each new connector:

Normal response

Minimal response

Missing optional fields

Malformed row/item

Pagination or archive index

Version/update

Identical refresh

Source contract change

Unicode

Large-file cap

Partial failure

Sanitised errors

Raw snapshot linkage

Bulk ZIP tests:

Valid archive

Zip-slip attempt

Oversized entry

Missing table/header

Referencing missing key

Atomic staging failure

Identical release

Changed release

24.5 Resolution tests

Auto exact ID

Auto unique exact alias

No auto fuzzy

Abbreviation collision

Salt/ester distinction

Combination distinction

Peptide fragment distinction

Conflicting source IDs

Human accept/edit/reject/defer/split/redirect

Stale task concurrency

Downstream rebuild

24.6 Regulatory tests

Jurisdiction/product/formulation/indication scope

Raw and normalized status

ARTG no-match semantics

Drugs@FDA authorization

Purple Book licence

openFDA label not used alone as approval

NDC never used as approval

Trial status never used as authorization

Label version change

Cancellation/suspension

Baseline change suppression

Healthspan indication statement scope

24.7 Safety tests

Official warning precedence

Potential signal wording

Label section allowlist

Dosage section exclusion

Spontaneous-report aggregate only

No individual case storage

No incidence/causality

Zero reports not “safe”

Raw count increase no prominent alert

Query overlap caveat

Unresolved identity means not queried

TGA DAEN marked not imported

24.8 Dossier tests

Evidence aggregation

Protocol exclusion from result direction

Retracted exclusion/warning

Multi-entity combination handling

Variant filter

Trial portfolio

Regulatory matrix

Safety classes

Evidence needs

Coverage states

Immutable/idempotent snapshot

Stale after dependency change

History diff

Provenance links

Comparison no winner/rank

24.9 Job/scheduler tests

All new job kinds

Deduplication

Parent/child orchestration

Lease recovery

Retry bounds

Connector isolation

Dossier rebuild after committed mapping

No overlapping bulk source refresh

Due-time scheduling

Key-disabled openFDA state

Shutdown/restart

24.10 API tests

All endpoints

Pagination/filter validation

Local-admin guard

202 semantics

Stale review conflict

Source coverage

Safe errors

No raw snapshot

No full label

No patient-level report

No key/path

No recommendation/dosing fields

Live/Demo separation

24.11 UI/E2E tests

Desktop and mobile:

Live Interventions list

Intervention dossier

Live Peptides list

Peptide unknown-sequence warning

Peptide analogue/fragment distinction

Evidence map drilldown

Trial portfolio

Regulatory matrix

ARTG no-match state

FDA product status

Label warning

AEMS potential signal

Reported-event caveat

Entity resolution accept/reject/ambiguous

Stale mapping task

Comparison with no winner

Today regulatory change

Source-health key-disabled state

Methodology

Demo regression

Accessibility of tables, badges, dialogs, charts, and mobile navigation

24.12 Quality gates

All must pass:

Report exact counts and skips.

25. Doctors and integrity checks

25.1 interventions:doctor

Check:

Orphan aliases/identifiers

Alias collisions

Invalid current mappings

Redirect cycles

Variant relationship cycles where prohibited

Mentions without source provenance

Accepted mappings without rule/decision

Peptide sequence without source

Ambiguous entities incorrectly active

Demo/Live contamination

25.2 regulatory:doctor

Check:

Product without source version

Assertion without jurisdiction/authority

Active assertion with candidate match

Indication without product/application source

Invalid status history

Label without product/application

Approval inferred from prohibited source

ARTG miss misclassified as unapproved

Source baseline inconsistency

25.3 safety:doctor

Check:

Safety item without source

AEMS item labelled causal

Reporting pattern without query definition/caveat

Individual case payload accidentally persisted

Dosage section in dossier display store

Raw count change promoted to official alert

Unreviewed ambiguous safety link current

25.4 dossiers:doctor

Check:

Current pointer missing

Dependency missing

Stale dependency marked current

Retracted evidence counted supportively

Protocol counted as efficacy result

Comparison output contains rank/recommendation

Dossier contains vendor/dosing fields

Identical input with duplicate snapshot

Source coverage inconsistency

26. Performance and reliability targets

Generated performance fixtures, not committed databases.

Target local p95:

Rules:

No route loads all rows.

No browser renders unbounded tables.

Bulk imports use staging/transactions.

A malformed record does not destroy a valid bulk release.

Source contract failure remains visible.

Dossier rebuilds are bounded.

Identical snapshots are reused.

Worker remains responsive.

UI remains usable while jobs run.

27. Security, privacy, legal, and source-integrity requirements

No personal health information.

No medication/supplement log.

No user dosing data.

No API keys in browser, database diagnostics, logs, screenshots, or reports.

No exact local path in browser API.

Admin writes local-only by default.

No patient-level spontaneous-report storage.

No vendor data.

No pricing.

No purchasing/sourcing.

No dosing/administration guidance.

No medical recommendation.

No evasion of prescription, import, customs, or regulatory controls.

No full-text paywall scraping.

No TGA DAEN automation.

No broad ARTG crawl.

No full label republishing.

Display bounded excerpts and official links.

Respect source terms, robots, rate limits, attribution, and copyright.

Preserve retrieval/source dates separately.

Preserve raw official source snapshots privately.

Treat source HTML/labels as untrusted data.

No source text may execute instructions.

AI remains tool-less and optional.

Every regulatory/safety statement carries source provenance.

“Not found” expires and is scoped.

Corrections/status changes never erase history.

28. Documentation and ADR requirements

Create/update:

Add methodology:

Add source pages:

Add ADRs using the next available numbers for:

Canonical entity/variant/mention separation

Exact-first resolution and review-required ambiguity

Peptide sequence/modification provenance

Product- and indication-scoped regulatory assertions

Register inclusion, evidence, and trial status as independent dimensions

Regulator actions versus spontaneous report patterns

Bounded official ARTG HTML connector

Bulk regulatory source staging and atomic projection

Immutable dossier snapshots

No composite intervention/safety score and no recommendation

No DAEN automation in M4

OpenFDA key-disabled-by-default policy

Documentation must explain:

M1–M3 complete

M4 current

M5 not started

Exact base commit

Identity limits

“Not found” semantics

Regulatory scope

openFDA label limitations

AEMS/FAERS report limitations

ARTG coverage limits

DAEN not imported

No dosing/sourcing

No medical advice

Source refresh/caps

How to resolve entities

How to rebuild dossiers

How to back up M4 data

How to disable each connector

How to obtain/configure a free openFDA key without putting it in UI

Current known limitations

Save this brief at:

Do not silently remove controlling requirements.

29. What must NOT be done in Milestone 4

Do not implement:

YouTube

X/Twitter

Podcasts

Creator profiles

Creator trust scores

Social attention

Creator claim extraction

Paid creator APIs

Personal supplement tracking

Medication tracking

Lab tracking

Wearables

Exercise/pickleball personal logs

Personal-health correlations

Individual recommendations

Treatment or supplement changes

Dosing

Injection/reconstitution

Cycling/stacking

Vendor links

Purchasing

Prices

Promo codes

Import/customs evasion

Pharmacy/clinic finder

Telehealth

Authentication

Multi-user accounts

Public submissions

Community ratings

ChatGPT Sites

D1/R2

Wrangler/Cloudflare runtime

Hosted scheduler

Public deployment

Mobile native app

Vector database

Embedding search

Full-text article scraping

Paywall bypass

TGA DAEN scraping

Individual openFDA/AEMS case ingestion

Disproportionality algorithms such as PRR, ROR, EBGM

Incidence/risk estimates from spontaneous reports

Orange Book or patent analysis

NDC as approval authority

Formal clinical guidelines

Formal GRADE recommendations

A composite intervention/safety/longevity score

A “best intervention” ranking

A “recommended peptide” list

Milestone 5 work of any kind

30. Acceptance criteria checklist

Milestone 4 is complete only when every applicable item is checked and evidenced in the completion report.

A. Base, branch, and M3 follow-ups

A1. Work begins from exact commit 4d985d3c8e9208fadc01e529270bcf5f37f1503d .

A2. Work is on milestone-4/interventions-peptides-regulation .

A3. M3 history and completion report are preserved.

A4. Deterministic multi-claim extraction v2 is implemented.

A5. Multi-claim extraction preserves source spans and assertion roles.

A6. Planned outcomes still cannot become observed findings.

A7. Dedicated paginated /api/assessments endpoints exist.

A8. Dossier evidence aggregates retain M3 claim/assessment provenance.

A9. M3 optional AI boundaries remain intact.

A10. README/roadmap/docs show M3 complete, M4 current, M5 not started.

B. Entity model and resolution

B1. Canonical entity, variant, mention, alias, identifier, and relationship layers are separate.

B2. Entity type/lifecycle/identity-confidence taxonomies are implemented.

B3. Exact identifier matching is deterministic and versioned.

B4. Unique exact alias matching detects collisions.

B5. Fuzzy/approximate matches never auto-merge.

B6. Abbreviations with collisions require review.

B7. Salt, ester, stereoisomer, formulation, route, and strength distinctions are preserved.

B8. Combination products are not destructively split or collapsed.

B9. Class evidence is not copied to members.

B10. Mention mappings are source-versioned and append-only.

B11. Resolution decisions support accept/map/create/ambiguous/reject/defer/split/redirect.

B12. Entity redirects preserve history and avoid deletion.

B13. Mapping changes enqueue all required downstream rebuilds.

B14. Existing trials/claims/regulatory events are backfilled into mentions.

B15. Demo and Live entities never mix.

B16. interventions:doctor passes.

C. Peptides

C1. Live Peptides is backed by canonical entity data.

C2. Peptide/analogue/fragment/protein/name-only classifications are separate.

C3. Sequence is stored only with source provenance.

C4. Unknown sequence remains unknown.

C5. Modification provenance is modeled.

C6. Marketing/research-label ambiguity is visible.

C7. Related analogues/fragments are not marked identical without review.

C8. Peptide dossiers show human evidence, trials, regulation, safety, and gaps.

C9. No dosing, sourcing, vendors, purity, or sterility claims exist.

C10. Peptide evaluation fixtures pass.

D. Identity connectors

D1. RxNorm connector is implemented with exact-first matching and caching.

D2. GSRS connector supports UNII and source-provided sequence/type data.

D3. PubChem connector supports exact chemical identity enrichment.

D4. Presence in an identity source is never displayed as approval.

D5. Approximate API results remain candidates.

D6. Connector responses use raw snapshots, versions, health, baselines, and jobs.

D7. Connector contract failures are visible rather than empty successes.

D8. Default tests make no live calls.

E. TGA ARTG

E1. Bounded official ARTG search/detail connector is implemented.

E2. Current terms/robots/access assumptions are documented with check date.

E3. Full-register crawling is not implemented.

E4. Query/detail caps and low rate are enforced.

E5. Exact ARTG ID mapping works.

E6. Ambiguous search results create review tasks.

E7. ARTG fields and source-native status are preserved.

E8. Search misses become scoped, expiring no_exact_match_found .

E9. Search misses never become automatic unapproved .

E10. PI/CMI PDFs are linked, not automatically parsed.

E11. Parser contract change produces degraded source health.

E12. ARTG baseline/history/change behaviour is correct.

F. FDA regulatory and label sources

F1. Drugs@FDA bulk ZIP connector is implemented.

F2. Archive extraction rejects path traversal and unsafe sizes.

F3. Expected tables/headers and relationships are validated.

F4. Staging and atomic current projection work.

F5. Identical releases are idempotent.

F6. Products, ingredients, applications, actions, status, route/form, and strength are retained.

F7. FDA product status remains product/application scoped.

F8. Purple Book full-data connector is implemented.

F9. Licensed biologic and biosimilar/interchangeability source fields are preserved without inference.

F10. openFDA label connector is implemented behind configuration.

F11. Label sections use the allowlist.

F12. Dosage-and-administration is excluded from dossier display.

F13. Label presence alone is not used as approval proof.

F14. NDC Directory is not used as approval authority.

F15. Regulatory status and scientific evidence remain separate.

F16. regulatory:doctor passes.

G. Indication and regulatory semantics

G1. Regulatory assertions include jurisdiction, authority, product/application, status, and source version.

G2. Formulation/route/strength scope is retained when supplied.

G3. Regulatory indication differs from trial condition/research claim.

G4. Entity summaries do not imply every variant/use is authorized.

G5. Trial registration is never treated as authorization.

G6. explicitly_unapproved requires explicit regulator wording.

G7. not_checked , source_unavailable , and identity_unresolved are represented.

G8. Healthspan/longevity indication statements identify source, scope, and check date.

G9. Regulatory status history is immutable and versioned.

G10. Baseline regulatory records do not appear as newly issued alerts.

H. Safety and adverse-event reporting

H1. Existing TGA RSS notices are linked through reviewed mappings.

H2. FDA AEMS current/archive potential-signal connector is implemented.

H3. AEMS entries preserve quarter, wording, additional information, and source version.

H4. AEMS potential signals are not displayed as proven causality.

H5. openFDA event aggregate connector is implemented behind configuration.

H6. Only aggregate counts are stored.

H7. No patient-level report or narrative is stored.

H8. Every reporting snapshot has a reviewed query definition.

H9. Exact identifiers are preferred over broad names.

H10. Alias totals are not combined as deduplicated totals.

H11. Report patterns always show the mandatory caveat.

H12. No incidence, relative risk, causality, or comparative safety is inferred.

H13. Zero reports is not displayed as safe/no risk.

H14. Count changes do not create prominent safety alerts.

H15. TGA DAEN is clearly marked not imported.

H16. Label/regulator/trial/paper/reporting sources are visually separated.

H17. safety:doctor passes.

I. Dossiers and comparison

I1. Live Interventions list is functional.

I2. Live Peptides list is functional.

I3. Dossier identity/variant coverage is explicit.

I4. Evidence map uses independent M3 dimensions.

I5. Retracted evidence is excluded from supportive default counts and warned.

I6. Protocol-only records do not contribute efficacy direction.

I7. Combination evidence is not assigned to components without support.

I8. Trial portfolio links canonical entities and source terms.

I9. AU/US regulatory matrix is product scoped.

I10. Safety sections separate source classes.

I11. Evidence-needs aggregation is deterministic.

I12. Dossier source coverage/freshness is visible.

I13. Dossier snapshots are immutable and idempotent.

I14. Dependency changes mark dossiers stale and enqueue rebuild.

I15. Dossier history shows material diffs.

I16. Comparison supports 2–4 entities.

I17. Comparison has no winner, rank, recommendation, or report-count safety ranking.

I18. Incomparability warnings work.

I19. dossiers:doctor passes.

J. Jobs, scheduling, source health, and APIs

J1. All new long-running work uses persisted jobs and 202 semantics.

J2. Jobs have deduplication, leases, restart recovery, and bounded retries.

J3. Connector failure remains isolated.

J4. Scheduled freshness rules enqueue due work.

J5. openFDA disabled/key-missing state is healthy and visible.

J6. All list endpoints use server-side pagination.

J7. All filters/sorts are validated and bounded.

J8. All new mutation routes use the shared local-admin guard.

J9. No browser response contains keys, local paths, raw snapshots, full labels, or patient-level reports.

J10. Source health includes new sources, baselines, caps, and parser state.

J11. Existing M2/M3 commands/jobs/scheduler continue to work.

J12. Query-plan checks pass for principal queries.

K. UI, methodology, and accessibility

K1. Intervention dossier works on desktop and mobile.

K2. Peptide dossier works on desktop and mobile.

K3. Entity Resolution Queue is interactive and audited.

K4. Regulatory & Safety workspace is implemented.

K5. Evidence map drills to source items.

K6. Trial portfolio links work.

K7. Regulatory matrix is scoped and sourced.

K8. Reported-event caveat is visible at point of use.

K9. Today shows material official/dossier changes only.

K10. Methodology covers identity, regulation, safety, adverse reports, dossiers, and comparison.

K11. Honest empty/disabled/unresolved/stale states are implemented.

K12. Demo mode remains separate and functional.

K13. New dialogs, tables, badges, charts, and controls meet accessibility checks.

K14. No dosing, sourcing, vendors, or recommendation UI exists.

L. Evaluation, security, and quality

L1. Identity corpus has at least 120 cases and required subsets.

L2. Regulatory corpus has at least 72 cases.

L3. Safety corpus has at least 48 cases.

L4. Multi-claim corpus has at least 32 new cases.

L5. All deterministic gates in Section 23.5 pass.

L6. No new paid source is required.

L7. No personal-health feature is added.

L8. No prohibited data or secret is committed.

L9. No full-text/paywall/DAEN/broad-ARTG scraping is implemented.

L10. pnpm lint passes with zero warnings.

L11. pnpm typecheck passes.

L12. pnpm test passes.

L13. pnpm test:e2e passes on desktop and mobile projects.

L14. pnpm build passes.

L15. pnpm db:doctor passes.

L16. pnpm intelligence:eval passes.

L17. pnpm intelligence:doctor passes.

L18. pnpm interventions:eval passes.

L19. pnpm interventions:doctor passes.

L20. pnpm regulatory:eval passes.

L21. pnpm regulatory:doctor passes.

L22. pnpm safety:doctor passes.

L23. pnpm dossiers:doctor passes.

L24. Documentation and ADRs match implementation.

L25. M4 screenshots and completion report are committed.

L26. Working branch is pushed and final hash reported.

L27. No Milestone 5 work has begun.

31. Required completion report

Create and commit:

It must contain:

Executive summary

Exact base, branch, feature-complete commit, and final HEAD

One-row-per-acceptance-criterion checklist

M3 follow-up results

Significant file-tree changes

Migration files and schema summary

Package-boundary changes

Entity identity model

Normalization/ruleset versions

Auto-match and review policy

Peptide identity model

New connector implementation summary

Source terms/robots/access check dates

Source freshness/caps

Drugs@FDA staging/atomic import result

Purple Book import result

ARTG exact/no-match/ambiguous behaviour

openFDA configured/disabled state

Regulatory-scoping examples

“Not found” versus explicitly unapproved tests

Safety-source model

AEMS potential-signal behaviour

Spontaneous-report caveat and no-incidence tests

Dossier aggregation and provenance design

Dossier idempotency/staleness tests

Comparison no-winner/no-ranking tests

Evaluation-corpus composition

Exact deterministic evaluation results

Optional dated live-smoke result per source

Job/scheduler behaviour

Query-plan/performance checks

API route summary

UI/page summary

Security/privacy/source-policy/copyright review

Exact commands run and results

Lint result

Type-check result

Unit/integration test counts

E2E projects, passes, skips, failures

Build result

Doctor results

Screenshots: Live Interventions list Intervention dossier overview Evidence map drilldown Trial portfolio AU/US regulatory matrix Regulatory & Safety workspace FDA potential-signal item Reported-event

Screenshots:

Live Interventions list

Intervention dossier overview

Evidence map drilldown

Trial portfolio

AU/US regulatory matrix

Regulatory & Safety workspace

FDA potential-signal item

Reported-event pattern with caveat

Entity Resolution Queue

Accepted and ambiguous resolution decisions

Live Peptides list

Peptide identity warning/detail

Intervention comparison

Source Health with new sources

Methodology

Demo regression

Mobile intervention/peptide/resolution view

Known issues and technical debt

Deviations from this brief and rationale

Genuine decisions required before Milestone 5

Explicit statement that Milestone 5 has not begun

Do not claim a live connector passed unless it was actually exercised on the stated date.

32. Consult the project manager early only when

Exact base commit is unavailable or repository history materially differs.

A migration would destroy or silently reinterpret M2/M3 data.

The TGA site terms/robots or technical controls prohibit the bounded ARTG connector.

An official source withdraws or materially changes a required download/API.

Drugs@FDA/Purple Book cannot be parsed without a prohibited or paid dependency.

A source licence would prohibit intended local storage/display.

A paid credential becomes indispensable for core M4 completion.

Product/indication mapping cannot be represented without weakening regulatory scope.

A privacy/security boundary would be weakened.

Two acceptance criteria are genuinely incompatible.

A required capability remains technically impossible after documented attempts.

A proposed fix would start Milestone 5.

Do not consult for:

Routine dependencies

Internal naming

Migration organization

Parser fixture construction

CSS/layout details

Review-queue component structure

Ordinary source-field variation

Recoverable connector errors

Refactors

Performance tuning

Documentation phrasing

Optional openFDA key absence

A source returning no relevant matches

33. Stop conditions

After all M4 acceptance criteria and required quality gates pass:

Commit implementation, migrations, fixtures, evaluation corpora, docs, ADRs, screenshots, and completion report.

Push:

Report:

Stop.

Do not:

Merge to main

Create an M5 branch

Add creators or social sources

Begin YouTube or X integration

Add personal health tracking

Begin hosted deployment

Add authentication

Add dosing/sourcing/vendors

Begin any Milestone 5 work

Wait for the next project-manager brief.

34. AUTHORISED start message

AUTHORISED TO BEGIN: Start Healthspan Dashboard Milestone 4 from exact commit 4d985d3c8e9208fadc01e529270bcf5f37f1503d and create milestone-4/interventions-peptides-regulation . Complete the mandatory

Library healthspan_dashboard_milestone_4_execution_brief.md

Healthspan Dashboard — Milestone 4 Execution Brief

Milestone: 4 — Intervention, Peptide, Regulatory & Safety Intelligence Issued: 23 July 2026 Project manager: ChatGPT Execution agent: Grok 4.5 in Cursor Repository: Smellybum1/Healthspan-Dashboard Bas

1. Controlling instruction

Begin Healthspan Dashboard Milestone 4 from the exact final Milestone 3 branch head:

Create and work on:

Recommended start sequence:

If the working branch already exists locally, verify that its starting tree contains 4d985d3c8e9208fadc01e529270bcf5f37f1503d and that no Milestone 5 work is present.

Milestone 4 must:

Complete the mandatory Milestone 3 follow-ups in Section 5.

Create a source-grounded canonical intervention identity layer without destructively merging ambiguous names.

Build first-class Live intervention and peptide dossiers from M2/M3 papers, trials, claims, and regulatory events.

Add product-, formulation-, jurisdiction-, and indication-scoped regulatory intelligence for Australia and the United States.

Add regulator notices, label safety information, and carefully caveated spontaneous adverse-event reporting patterns without turning reports into proof of causality or incidence.

Extend existing trials with reviewed intervention mappings, dossier links, portfolio summaries, and comparison views.

Preserve strict Live/Demo separation, immutable provenance, source versioning, append-only review decisions, background jobs, the Brisbane scheduler, and all M1–M3 quality gates.

Provide a transparent entity-resolution workflow for ambiguous aliases, salts, formulations, combinations, peptide fragments, and analogues.

Never provide dosing, protocols, sourcing, purchasing, vendor links, treatment recommendations, stacking advice, or personal medical guidance.

Complete every acceptance criterion, push the branch, commit the completion report, report the final commit hash and exact quality results, and stop before Milestone 5.

Routine implementation decisions are delegated to Grok. Do not pause for approval over ordinary dependency additions, file layout, component structure, forward migrations, test fixtures, internal clas

Do not start creator monitoring, YouTube, X/Twitter, podcasts, social attention, personal health tracking, hosted deployment, D1/R2, authentication, or any other Milestone 5+ functionality.

2. Milestone outcome

At completion, a user must be able to open a Live intervention or peptide dossier and answer:

What exact substance, biological, behaviour, dietary pattern, procedure, device, formulation, salt, analogue, fragment, or combination does this dossier represent?

Which source names and identifiers were mapped to it?

Which mappings were automatic, reviewed, unresolved, rejected, or superseded?

Is the name itself ambiguous?

Is this a peptide, a peptide analogue, a peptide fragment, a larger protein/biologic, or merely a marketing/research label with no verified sequence?

What papers, claims, and trials are linked to this exact entity or variant?

What evidence maturity, result directions, populations, outcomes, methodological signals, and translation gaps are represented?

Which trials are active, completed, terminated, or have results?

Which product records are present in the Australian ARTG, Drugs@FDA, or FDA Purple Book?

What exact product, route, formulation, indication statement, jurisdiction, and effective date does each regulatory fact cover?

Does a source explicitly identify a product as unapproved, cancelled, suspended, withdrawn, or subject to a market action?

Which label warnings, contraindications, adverse-reaction sections, regulator safety notices, or regulator-identified potential signals are linked?

What spontaneous adverse-event reporting patterns were returned for an exact reviewed query, and what can those counts not establish?

Is an apparent “absence” a genuine checked result, an unavailable source, an unresolved identity, or a connector that has not run?

What evidence is missing before a healthspan or longevity claim could be considered more mature?

What materially changed since the previous dossier snapshot?

How does this intervention compare with up to three others across independent dimensions, without a winner or recommendation?

The product remains a research intelligence tool. It is not a prescribing tool, peptide catalogue, supplement recommender, risk calculator, vendor directory, or personal clinical decision system.

3. Non-negotiable scientific and product principles

3.1 Entity identity is not a string match

Names can refer to:

An active moiety

A salt or ester

A stereoisomer

A metabolite or prodrug

A peptide fragment or analogue

A formulation

A route-specific product

A brand

A combination product

A drug class

A behavioural intervention

A dietary pattern

A marketing or research label with uncertain identity

Do not collapse these merely because text is similar.

3.2 Regulatory status is scoped, not universal

Never display a bare entity-level statement such as:

A regulatory assertion must be scoped to, where the source provides it:

An entity-level summary may say:

One or more matched products are authorised or included in this jurisdiction.

It must not imply that every formulation, route, use, dose, or longevity claim is authorised.

3.3 Register inclusion and evidence are separate

Regulatory inclusion, licensing, listing, registration, or approval is not itself evidence that an intervention extends healthy human lifespan.

Scientific evidence maturity remains the M3 evidence model.

3.4 Trial activity is not regulatory authorisation

A ClinicalTrials.gov record means a study is registered. It does not establish that the intervention is approved, supplied lawfully, effective, or safe for the studied use.

Keep:

as separate dimensions.

3.5 “Not found” is not “unapproved”

Use:

when appropriate.

Assign:

only when an official regulator source explicitly describes the relevant product or use as unapproved.

3.6 Labels are source statements, not recommendations

Official label text may provide indication, warning, contraindication, and adverse-reaction statements. It must not be transformed into instructions about what the user should take.

Do not ingest or display dosage-and-administration instructions in Milestone 4.

3.7 Spontaneous reports are not causal proof

Adverse-event reporting systems have missing reports, duplicate/update complexity, publicity effects, exposure differences, confounding, and uncertain product-event attribution.

The app must never use spontaneous report data to calculate or imply:

Use the term:

unless an official regulator source itself labels something a potential signal or new safety information.

3.8 Safety is not one score

Do not create an overall safety number.

Display separate source classes:

3.9 Approval by indication must remain exact

A product authorised for a disease indication is not thereby authorised for longevity, healthy ageing, general prevention, or use in a healthy person.

Where imported official label text does not explicitly contain a longevity/healthspan indication, the UI may state:

No imported official indication statement matched healthspan or longevity as of [date].

It must not silently generalise that statement beyond the checked products, labels, sources, and jurisdiction.

3.10 Peptide identity must be safety-first

Do not assume two products or research labels contain the same peptide because they share a marketing name.

Do not invent:

Amino-acid sequences

Modifications

Molecular identity

Purity

Sterility

Formulation

Human-use suitability

Regulatory standing

Unknown sequence or composition remains unknown.

3.11 No composite intervention score

Do not combine evidence, regulation, trial activity, safety, research activity, classification confidence, or popularity into one score.

Prohibited Live labels include:

3.12 Every dossier fact has provenance

Every Live dossier fact must trace to:

A source record version

A reviewed entity mapping

A deterministic aggregation rule

A human review decision

Or a clearly labelled optional AI candidate

A fact with invalid provenance must not become current Live dossier content.

3.13 Corrections, retractions, status changes, and mapping changes are historical

Never delete history to make the current dossier appear cleaner.

Preserve:

Prior source versions

Prior dossier snapshots

Prior mappings

Superseded aliases

Human decisions

Regulatory status history

Safety notice history

Retractions and corrections

4. Fixed branch, stop, and merge decisions

5. Mandatory Milestone 3 follow-ups

Complete these as part of M4 before declaring the dossier layer complete.

5.1 Expand deterministic claim extraction beyond one primary claim

M3 correctly delivered source-bound claim extraction but records a known limitation of one primary deterministic claim per record.

Implement a versioned claim_rules.v2 or equivalent that can emit multiple atomic claims from:

Structured PubMed result sections

Structured PubMed conclusion sections

Unstructured abstracts when sentence boundaries and assertion roles are sufficiently clear

Explicit ClinicalTrials.gov posted-result outcome structures

Explicit ClinicalTrials.gov adverse-event result structures

TGA/FDA regulator statement rows

FDA label sections imported during M4

Rules:

Preserve each claim’s source span.

Preserve assertion role.

Planned outcomes remain planned.

Maximum default claims per content item is bounded and configurable.

Do not retrieve full text.

Do not use model world knowledge.

Do not split one qualified sentence into more assertive fragments.

Deduplicate paraphrases using source-version-aware fingerprints.

Preserve M3 analyses and history.

Reanalyse only eligible current records through queued jobs.

Add multi-claim evaluation fixtures.

Do not make AI a completion dependency.

5.2 Add a dedicated assessments service/API

Implement a server-side, paginated Live assessments surface:

Support validated filters for:

Evidence maturity

Evidence availability

Study design

Organism

Population

Outcome family

Translation gap

Methodological signal

Retraction/correction

Source

Date

Linked intervention entity

Do not load all assessments into route memory.

5.3 Preserve and expose M3 provenance during dossier aggregation

Dossier aggregation must not copy assessment or claim text into an untraceable summary.

Every evidence-map cell, count, claim group, and “what is missing” statement must link back to the M3 analysis/claim IDs used.

5.4 Document M3 as complete and M4 as current

Update:

Rules:

Preserve M3_COMPLETION_REPORT.md as a historical report.

Do not rewrite its feature-complete hash to pretend the final report-only commit was the feature commit.

State that M4 began from final M3 HEAD 4d985d3c... .

Mark M5 as future and not started.

5.5 Preserve M3 optional-AI boundaries

Existing AI remains disabled by default.

M4 must not require a paid model for:

Mention extraction

Entity resolution

Regulatory matching

Peptide identity

Dossier construction

Safety linking

Comparison

If AI is reused to propose a candidate alias or relationship:

It may create a review candidate only.

It may not auto-merge.

It may not assign a sequence.

It may not assign regulatory status.

It may not interpret spontaneous reports causally.

It may not create a safety or efficacy recommendation.

6. Fixed source decisions

6.1 Existing sources retained

Continue to use:

No regression is permitted.

Existing TGA RSS notices must be linked to reviewed intervention entities and products where possible, while preserving the original regulatory event.

6.2 New identity sources

Implement targeted, cached identity enrichment from:

These establish vocabulary and substance identity only. They do not prove approval, supply, efficacy, purity, or safety.

6.3 New Australian regulatory source

Implement a bounded, targeted connector for the official TGA ARTG public search and detail pages:

Fixed policy:

Do not crawl the full ARTG.

Search only reviewed entity names, active ingredients, known product names, and known ARTG IDs.

Prefer exact ARTG IDs and exact active-ingredient/product matches.

Store source HTML as raw snapshots.

Parse only clearly labelled official fields.

Preserve raw TGA codes and source wording.

Use low request rates and caching.

Check current robots/terms and document the result before enabling scheduled access.

If the current official site prohibits or technically prevents the planned bounded access, stop only this connector, mark it unavailable, and consult the project manager. Do not substitute a third-par

Do not automatically download or parse Product Information or Consumer Medicine Information PDFs in M4.

Link to official PI/CMI documents when the ARTG page provides them.

An ARTG search miss becomes no_exact_match_found , not unapproved .

6.4 New United States regulatory sources

Implement:

Official source locations:

6.5 Sources explicitly not used as approval authority

Do not use the FDA NDC Directory as proof of FDA approval.

Do not ingest the Orange Book in M4; therapeutic-equivalence and patent data are not required for this milestone.

Do not infer approval from:

RxNorm

GSRS

PubChem

ClinicalTrials.gov

PubMed

Crossref

openFDA label presence by itself

A vendor or manufacturer page

A product being available online

6.6 TGA DAEN decision

Do not automate or scrape TGA DAEN in Milestone 4.

Reasons reflected in product design:

No stable documented public API is being adopted for this milestone.

The interactive database has usage terms and changing technical behaviour.

Raw spontaneous-report data would require the same strict caveats as FDA data.

The UI may link to the official TGA DAEN landing page and clearly state that Healthspan Dashboard has not imported DAEN report counts.

Australian safety coverage in M4 consists of:

Existing TGA safety-alert RSS

Existing TGA safety-update RSS

Existing TGA market-action RSS

Existing TGA media-release RSS

ARTG product/register information

Direct official links

6.7 FDA AEMS naming

Use stable internal source IDs such as:

Display:

where useful.

Preserve the exact source release/quarter and the terminology used on the official page.

6.8 openFDA credential decision

OPENFDA_API_KEY is optional for installation but required before regular scheduled openFDA label/event enrichment is enabled.

Rules:

Drugs@FDA and Purple Book remain usable without an openFDA key.

HEALTHSPAN_OPENFDA_ENABLED=false by default.

Enabling it without a key produces a clear configuration state.

Never place the key in persisted URLs, logs, browser APIs, screenshots, or raw snapshot metadata.

The opt-in live smoke test may run without a key only if the current official service permits it within documented limits; scheduled operation still remains disabled until configured.

Cache aggressively and remain far below official limits.

6.9 No new paid data sources

Milestone 4 must work with free official sources and fixture data.

Do not add commercial drug databases, proprietary peptide databases, subscription regulatory products, or paid safety platforms.

7. Source dependency and refresh plan

The orchestration model is a dependency graph, not one unsafe monolithic transaction.

7.1 Source-independent steps

7.2 Recommended connector order for a full M4 refresh

Independent bulk sources may run concurrently if job leases and resource limits remain safe.

7.3 Default freshness

A connector that has never run must show not_checked , not an empty fact.

7.4 Default caps

Make caps configurable and visible in run diagnostics. A cap creates a partial/capped state, never silent completeness.

8. Canonical intervention identity model

8.1 Entity types

Support:

The entity type is classification, not a recommendation or regulatory status.

8.2 Entity lifecycle

Support:

Only active entities appear in ordinary Live dossier lists by default.

8.3 Identity confidence

Support:

Do not convert this into scientific confidence.

8.4 Variants

A canonical entity may have distinct variants for:

Salt

Ester

Stereoisomer

Prodrug

Metabolite

Peptide analogue

Peptide fragment

Sequence modification

Formulation

Strength

Dosage form

Route

Combination

Brand/product

A broad dossier may aggregate variants only when the UI clearly exposes the aggregation and permits filtering.

8.5 Relationships

Support reviewed relationships:

Rules:

same_substance_as requires exact trusted identifiers or human review.

Relationships are directional where appropriate.

No therapeutic equivalence is inferred.

No combination result is attributed to each component unless the source supports component-level inference.

No class-level evidence is automatically copied to every member.

8.6 Aliases

Every alias stores:

Alias text

Normalized alias

Language

Alias type

Source

Source record/version where applicable

Review state

Valid-from/to

Collision flag

Alias types include:

Do not auto-match an abbreviation that maps to more than one entity.

8.7 External identifiers

Support, when supplied:

Identifiers require scheme, value, source, status, and review provenance.

8.8 Normalization policy

Normalization may:

Unicode-normalize

Trim and collapse whitespace

Normalize punctuation safely

Normalize case for matching

Remove clearly non-semantic surrounding punctuation

Normalize identifier prefixes

Normalization must not erase meaningful distinctions such as:

D- versus L-

alpha versus beta

17α versus 17β

Salt/ester names

Fragment numbers

Peptide amidation/acetylation

Pegylation/lipidation

Route/formulation

Combination separators

Brand versus ingredient

Version every normalization algorithm.

9. Entity-resolution policy

9.1 Auto-accept rules

Automatic mapping is permitted only for:

Exact trusted identifier match with no collision.

Exact source-native product/application/register identifier.

Unique exact normalized alias with compatible entity type and no material variant conflict.

A reviewed rule that has deterministic fixtures and no unresolved collision.

Every auto mapping records the rule ID and version.

9.2 Review-required rules

Review is required for:

Approximate/fuzzy name match

Abbreviation

Homonym

Class-versus-agent ambiguity

Salt/ester/formulation collapse

Combination-versus-component

Peptide fragment/analogue ambiguity

Marketing/research label without standardized identity

Name-only GSRS/PubChem/RxNorm disagreement

Conflicting identifiers

Cross-jurisdiction product-name collision

AI-proposed mapping

One source mention with multiple plausible entities

9.3 Prohibited auto-merges

Never automatically merge based only on:

Similar titles

Shared mechanism

Shared class

Shared target receptor

Shared prefix/suffix

Vendor terminology

A creator/social claim

One approximate API match

Molecular-weight proximity

Similar peptide sequence

A language model’s assertion

9.4 Review actions

Entity-resolution tasks support:

Decisions are append-only and source-version-scoped.

Do not delete an entity during merge. Use redirects and superseding mappings.

9.5 Reprocessing

A mapping change must enqueue:

Affected claim/entity relinking

Trial portfolio rebuild

Regulatory link reassessment

Safety link reassessment

Dossier rebuild

Comparison cache invalidation

Review tasks for any materially changed current dossier fact

10. Peptide identity policy

10.1 Peptide classification

Support:

10.2 Sequence provenance

Store a sequence only when an official or recognized identity source supplies it.

Every sequence stores:

Sequence string

Alphabet/version

Length

Source

Source record/version

Exact/partial state

Modifications

Review state

Hash

Do not derive a sequence from a product name.

10.3 Modifications

Support source-provided or reviewed modification types:

Do not infer a modification from a marketing name alone.

10.4 Peptide dossier warning states

Display prominent states for:

10.5 Prohibited peptide functionality

No:

Vendor directory

Purchasing links

Promo codes

Compounding recipes

Synthesis instructions

Reconstitution instructions

Injection guidance

Dosing protocol

Cycling/stacking

Purity claims

Sterility claims

“Research chemical” sourcing

Circumvention of prescribing or customs rules

Official product strength, dosage form, and route may be displayed strictly as regulator product identity, not as a user instruction.

11. Regulatory semantics

11.1 Jurisdictions

Milestone 4 supports:

The schema remains extensible.

11.2 Authorities

Support:

Preserve source-native agency/sub-centre where useful.

11.3 Regulatory assertion kinds

Support:

11.4 Normalized regulatory standing

Support:

Preserve the raw source value alongside the normalized status.

11.5 Match scope

Every regulatory match records:

Only exact/reviewed matches contribute to current dossier regulatory summaries.

11.6 Indication model

Store:

Source indication text

Normalized condition/topic concepts

Population

Product/application

Route/formulation

Source section

Effective/source date

Source version

Match/review status

Distinguish:

Only the first two are regulatory indication/intended-purpose statements.

11.7 Healthspan/longevity status statement

A dossier may compute:

The displayed sentence must state:

Jurisdiction

Checked source set

Product scope

Last checked date

Limitations

11.8 Regulatory history

Material events include:

Initial source imports remain baseline and do not masquerade as fresh alerts.

12. Safety semantics

12.1 Safety evidence classes

Support:

12.2 Safety source precedence

Display sources by authority and type, not by an opaque rank.

Recommended visual ordering:

Active regulator action, explicit warning, recall, suspension, or unapproved-product notice

Official label warning/contraindication

Regulator-identified potential signal/new safety information

Trial or paper harm findings

Spontaneous report patterns

Coverage and identity limitations

This order is for comprehension, not a numerical safety score.

12.3 Label sections

Import only:

Do not ingest/display:

unless a later milestone explicitly changes policy.

Store source section hashes and bounded display excerpts. Link to the official label source.

12.4 Spontaneous report pattern model

For exact reviewed openFDA queries, store:

Query definition and hash

Identifier/alias used

Date range

Dataset update/retrieval date

Total matching reports

Top reported MedDRA reaction terms

Serious-report count where returned

Outcome categories where returned

Reporter-country or type only if useful and non-identifying

Annual/quarterly count series

Missing/unknown counts

Query limitations

Source version

Do not store individual case narratives or patient-level records.

12.5 OpenFDA query identity order

Prefer:

Do not issue a broad brand-only query without human review.

Do not combine alias query totals as though they were deduplicated.

12.6 Display language

Required banner:

These are spontaneous reports mentioning a matched product or substance. Reports are not proof that the product caused the event, do not provide an exposure denominator, may contain duplicates or foll

Use:

not:

12.7 No automatic safety alerts from count increases

A raw report-count increase must not create a prominent Safety Alert.

Prominent alerts require an official source event such as:

TGA safety alert/market action

FDA regulator potential-signal posting

Label warning change

Cancellation/suspension/withdrawal

Explicit regulator unapproved warning

Reporting-pattern refreshes may appear in audit history only.

13. Dossier aggregation model

13.1 Dossier identity

A dossier belongs to one canonical intervention entity.

Variant-level filtering must be available.

A dossier snapshot depends on:

Current reviewed mention mappings

Current M3 assessments and claims

Current source record versions

Trial records

Regulatory product/status records

Label sections

Safety notices/signals

Reporting-pattern snapshots

Dossier ruleset version

13.2 Dossier sections

Every Live dossier supports:

13.3 Evidence map

Aggregate M3 items by independent dimensions:

Organism

Study design

Evidence maturity

Evidence availability

Outcome family

Direction

Population

Retraction/correction

Review state

Rules:

Default excludes retracted items from supportive counts but shows a retraction warning/count.

Protocol-only studies do not contribute efficacy-result direction.

Combination evidence remains combination evidence unless source supports component attribution.

Class-level evidence does not automatically become member evidence.

Counts link to exact source items.

No weighted composite.

13.4 Trial portfolio

Show:

Total linked trials

Status distribution

Study types/phases

Results posted

Australia locations

Conditions

Source intervention terms

Entity/variant match scope

Status timeline

Trial-to-publication links where exact

Registry/publication discrepancy tasks

Do not duplicate the M2 trial store. Use canonical links to existing trials.

13.5 What evidence is missing

Aggregate M3 controlled evidence needs.

Dossier-level needs must be deterministic and explainable, for example:

Human evidence absent

Controlled human results absent

Results not posted

Only disease-population evidence

Only biomarker outcomes

Follow-up too short to address durable benefit

Independent replication absent

Safety coverage limited

Identity unresolved

Regulatory indication not established for the claimed use

Do not invent a clinical development plan or recommend self-experimentation.

13.6 Dossier history

Store immutable dossier snapshots.

A new snapshot is created only when material input or ruleset versions change.

Display:

Snapshot date

Material changes

Source/version changes

Mapping changes

Regulatory changes

Safety changes

Evidence changes

Identical rebuilds reuse the existing snapshot.

13.7 Comparison

Allow comparison of 2–4 active entities.

Compare:

Identity/type

Evidence maturity distribution

Results availability

Human/animal/cell distribution

Outcome families

Trial portfolio

Translation gaps

Regulatory matrix

Official safety sources

Reporting-pattern coverage

Retractions/corrections

Data freshness

Rules:

No winner

No recommendation

No rank

No stacking suggestion

No “safer” comparison based on spontaneous report counts

Clearly flag variant/class/combination incomparability

Link every cell to source-backed detail

14. Required database/schema work

Preserve all M2/M3 data. Add forward-only Drizzle migrations beginning after 0003_m3_review_provenance .

Use:

Text UUIDs generated in the application

UTC Unix-millisecond integer timestamps

Integer-backed booleans

Text enums validated with Zod

Explicit foreign keys

Normal tables and indexes

Validated small JSON only for opaque diagnostics/query definitions/diffs

No triggers

No generated columns

No stored procedures

No custom SQLite extensions

No FTS5 dependency

No vector extension

No filesystem paths as identifiers

The exact physical decomposition may be refined, but the following logical entities and semantics are required.

14.1 intervention_entities

Required concepts:

ID

Preferred name

Normalized preferred name

Entity type

Lifecycle state

Identity confidence

Short neutral description

Created/updated timestamps

Current dossier snapshot ID

Redirect target ID when redirected

Created by method/version

data_origin = live

14.2 intervention_aliases

Required concepts:

Entity ID

Alias text

Normalized alias

Alias type

Language

Source/source version

Review state

Collision flag

Validity timestamps

Unique constraints that do not suppress genuine collisions

14.3 intervention_identifiers

Required concepts:

Entity or variant ID

Identifier scheme

Normalized value

Source

Source record/version

Match/review state

Validity

Unique scheme/value constraints where the scheme is globally unique

14.4 intervention_variants

Required concepts:

ID

Parent entity ID

Variant type

Preferred name

Normalized name

Formulation/strength/route fields when applicable

Sequence/modification reference when applicable

Lifecycle/review state

Source provenance

14.5 intervention_relationships

Required concepts:

Source entity/variant

Target entity/variant

Relationship kind

Candidate/reviewed/rejected state

Direction

Source

Confidence

Human decision

Created/reviewed timestamps

Unique relation key

14.6 intervention_mentions

One row per source-bound mention.

Required concepts:

ID

Raw mention text

Normalized mention text

Mention type

Content item ID

Claim ID when applicable

Trial intervention ID when applicable

Regulatory event ID when applicable

Source object/version

Source field/span

Context hash

Extraction rule/version

Created timestamp

14.7 intervention_mapping_candidates

Required concepts:

Mention ID

Candidate entity/variant

Candidate source

Match method

Score only as matching confidence, not scientific score

Reasons/features

Collision state

Status

Created timestamp

14.8 intervention_mention_mappings

Required concepts:

Mention ID

Entity/variant ID

Mapping state

Mapping scope

Rule/decision ID

Source-version-set hash

Effective/superseded timestamps

Append-only history

Only one current accepted mapping per mapping scope unless a source explicitly names a combination/multiple entities.

14.9 entity_resolution_tasks

May extend the generic M3 review framework or use a linked subtype table.

Required concepts:

Mention/candidate references

Reason

Priority

Status

Proposed mapping

Current mapping

Source span

Created/resolved timestamps

Stale state

14.10 entity_resolution_decisions

Append-only decision log.

Required concepts:

Task ID

Action

Prior/resulting mapping hashes

Entity/variant changes

Reason/note

Source-version-set hash

Reviewer

Timestamp

14.11 peptide_profiles

Required concepts:

Entity/variant ID

Peptide classification

Sequence state

Sequence length

Molecular formula/mass only when source supplied

Structure/identity source

Review state

Updated timestamp

14.12 peptide_sequences

Required concepts:

Profile ID

Sequence

Sequence hash

Alphabet/version

Exact/partial state

Source/source version

Review state

14.13 peptide_modifications

Required concepts:

Sequence/profile ID

Modification type

Position/range when supplied

Source wording

Source/version

Review state

14.14 regulated_products

Required concepts:

ID

Jurisdiction

Authority

Source product/register/application identifier

Product name

Sponsor/applicant

Product type

Dosage form

Route

Strength

Marketing/register status

Source created/updated/effective dates

Current source version

Canonical official URL

Unique source-native product key

14.15 regulated_product_ingredients

Required concepts:

Product ID

Entity/variant ID when reviewed

Raw ingredient name

Role

Strength text

Mapping status

Source/version

14.16 regulatory_applications

Required concepts:

Product/application relationship

Application/licence/register number

Application type

Authority centre/source

Applicant/sponsor

Original approval/inclusion date

Current status

Source version

14.17 regulatory_assertions

Required concepts:

Product/application/entity references

Jurisdiction/authority

Assertion kind

Normalized standing

Raw source status

Scope fields

Match scope

Effective/expiry date

Source object/version

Current/superseded state

Review state

14.18 regulatory_indications

Required concepts:

Assertion/product/application

Raw indication text

Normalized condition/topic concepts

Population

Route/formulation scope

Source section/span

Source version

Review state

14.19 regulatory_status_history

Required concepts:

Product/application/assertion

Prior/new status

Effective/source date

Detected date

Source versions

Stable event deduplication key

14.20 product_label_records

Required concepts:

Product/application

SPL set ID or source-native label ID

Version/effective date

Source version

Current/superseded state

Disclaimer version

14.21 product_label_sections

Required concepts:

Label record

Allowed section kind

Section hash

Source text or stored segment reference

Bounded display excerpt

Source field path

Source version

Do not store dosage-and-administration as a dossier display section.

14.22 safety_items

A normalized linkable safety object.

Required concepts:

Kind

Authority/source

Title/summary

Source date

Source version

Official URL

Regulatory certainty class

Current/superseded state

Existing TGA regulatory events may be linked rather than duplicated. Document the mapping.

14.23 intervention_safety_links

Required concepts:

Safety item

Entity/variant/product

Match scope

Match method

Review state

Source wording

Created/superseded timestamps

14.24 regulator_signal_records

Required concepts:

FDA AEMS report quarter

Product/class text

Potential signal/new safety information text

Additional information/status

Source date/update date

Source version

Reviewed entity/product links

14.25 adverse_event_query_definitions

Required concepts:

Entity/variant/product

Query source

Identifier field/value

Date range policy

Query hash

Review state

Active/superseded state

Created/reviewed timestamps

14.26 adverse_event_reporting_snapshots

Required concepts:

Query definition

Dataset/source date

Retrieval date

Total report count

Serious count when returned

Time series coverage

Source snapshot/version

Formula/parser version

Limitations version

Unique input/query/source-date identity

14.27 adverse_event_term_counts

Required concepts:

Snapshot

MedDRA term/category

Count

Rank

Normalized term

Source field

14.28 dossier_snapshots

Required concepts:

Entity ID

Input dependency hash

Dossier ruleset version

Status

Created timestamp

Evidence/trial/regulatory/safety counts

Coverage states

Deterministic summary fields

Unique analysis identity

14.29 dossier_source_dependencies

Join dossier snapshots to:

Claims

Assessments

Content items

Trials

Source record versions

Mapping decisions

Regulatory assertions

Label records

Safety items

Reporting snapshots

14.30 intervention_dossier_state

One row per active entity:

Current dossier snapshot

Stale flag/reason

Pending job

Last successful rebuild

Last reviewed

Updated timestamp

14.31 dossier_change_events

Required concepts:

Entity

Prior/new snapshot

Event kind

Baseline flag

Deterministic summary

Material diff

Detected/source dates

Deduplication key

14.32 Existing-table extensions

Add reviewed intervention links to existing structures without replacing them:

Trial interventions

Live claims

Content-item concepts

Regulatory events

Review tasks

Background jobs

Change events

14.33 Required indexes

At minimum index:

Entity lifecycle/type/preferred name

Alias normalized value and collision

Identifier scheme/value

Current mention mapping

Mapping candidate status

Resolution task status/priority

Peptide classification/sequence hash

Jurisdiction/authority/product identifier

Application/licence/register number

Regulatory standing/effective date

Indication concepts

Label product/section/version

Safety kind/date

Safety entity/product link

Reporting query/entity/source date

Current/stale dossier state

Dossier dependency joins

Trial/entity joins

Claim/entity joins

Add query-plan tests or documented EXPLAIN QUERY PLAN checks for principal list, dossier, regulatory, safety, comparison, and resolution queries.

15. Package responsibilities

15.1 packages/core

Add versioned Zod schemas and taxonomies for:

Keep packages/core free of:

Database drivers

Network clients

React

Source-specific parser implementations

15.2 packages/db

Add:

Forward migrations

Entity/variant/alias/identifier repositories

Mention and mapping repositories

Resolution review persistence

Regulatory repositories

Label/safety/reporting repositories

Dossier snapshot/state repositories

Server-side filtering/pagination

Transactional mapping changes

Transactional dossier-current-pointer updates

Staleness queries

Doctor checks

Query plan/performance fixtures

No scientific or regulatory interpretation rules belong in the DB package.

15.3 packages/connectors

Add source adapters for:

All connectors must use the existing:

HTTP client

Raw snapshot store

Source/feed health model

Baseline model

Ingestion runs

Background jobs

Checkpoints

Retry/redaction policy

Where bulk ZIP/CSV files are used, add safe archive and staging utilities.

15.4 New packages/interventions

Create:

Recommended structure:

Responsibilities:

Mention extraction

Name/identifier normalization

Deterministic candidate generation

Collision policy

Entity/variant relationship rules

Peptide identity rules

Regulatory-scoping semantics

Safety display policy

Dossier aggregation

Comparison model

Dossier change detection

Evaluation harness

Most package tests must run without database or network.

15.5 packages/intelligence

Extend only as needed for:

Multi-claim deterministic extraction

Claim-to-intervention mention hooks

Dedicated assessment query contracts

Preserving M3 provenance

Reanalysis after source/label changes where applicable

Do not move canonical identity or regulatory logic into @healthspan/intelligence .

15.6 packages/ui

Add reusable components where justified:

15.7 apps/api

Add:

Intervention services

Entity-resolution orchestration

Regulatory/safety source orchestration

Dossier services

Comparison service

New job handlers

Scheduler stale-source checks

Admin-guarded mutation routes

Safe diagnostics

Source health integration

Graceful shutdown/recovery

15.8 apps/web

Add:

Live Interventions

Live Peptides

Intervention dossier

Peptide dossier

Regulatory & Safety workspace

Entity Resolution Queue

Comparison

Trial/entity links

Dossier history

New Today cards/events

Methodology expansion

Desktop/mobile E2E coverage

Demo regressions

16. Connector requirements

16.1 RxNorm

Official interface:

Use:

Exact string/name lookup

Concept properties

Related concepts

Ingredient/clinical-drug concept types

Current concept status

Rules:

Prefer exact matches.

Approximate match results are review candidates only.

Preserve RxCUI and term type.

Do not infer approval.

Do not map a clinical drug product directly to a broad active moiety without preserving the product/variant relationship.

Cache responses for at least 30 days.

One request per second by default.

Store JSON/XML raw snapshots according to endpoint.

Add deterministic fixtures for retired/historical/ambiguous concepts.

16.2 GSRS

Official interface:

Use for:

UNII

Standardized substance names

Substance type

Chemical/structurally diverse/protein/nucleic-acid identity

Source-provided relationships

Peptide/protein sequence and modification data where explicitly available

Rules:

Exact UNII is trusted identity.

Name-only search is a candidate until uniqueness/type compatibility is established.

GSRS presence is not approval.

Preserve GSRS source type and record version/retrieval date.

Do not infer sequence or modifications not supplied.

Cache 30 days.

One request per second by default.

Treat schema changes as connector health failures, not silent empty data.

16.3 PubChem

Official interface:

Use for chemical identity enrichment:

CID

Preferred title

Synonyms as candidates

Molecular formula

Molecular weight

InChIKey

Canonical/isomeric structure identifiers when supplied

Rules:

Exact CID/InChIKey is trusted.

Name-only matches require compatibility/review.

PubChem presence is not approval or efficacy evidence.

Do not use similarity search for auto-merging.

Do not use bioassay activity as dossier efficacy evidence in M4.

Do not fetch 2D/3D neighbor sets.

Cache 90 days.

One request per second by default.

16.4 TGA ARTG

Official interface:

Required behaviour:

Feature-specific official-site connector, not a generic scraper.

Targeted query by reviewed name, active ingredient, product name, or ARTG ID.

Parse search results and detail pages.

Preserve: ARTG ID ARTG name Product name ARTG date Registration type Therapeutic-good type Sponsor Ingredients Licence category Licence status Official URL PI/CMI links if exposed

Preserve:

ARTG ID

ARTG name

Product name

ARTG date

Registration type

Therapeutic-good type

Sponsor

Ingredients

Licence category

Licence status

Official URL

PI/CMI links if exposed

Do not infer human-use indication from product name.

Do not parse PI/CMI PDF contents in M4.

Store raw HTML.

Use conditional headers where supported.

Rate limit to 0.5 requests/second.

Cap query/detail work.

Detect HTML contract changes.

Parser contract failures mark the source degraded.

Exact ARTG ID can auto-link.

Ingredient/name matches create candidates unless unambiguous and type-compatible.

licence status remains source-native plus a documented normalization.

Search misses are recorded with query/date/scope and expire; they are not permanent facts.

Live smoke requirements:

One exact known ARTG ID fixture/smoke

One exact active ingredient query

One no-result query

One ambiguous multi-result query

One parser-change failure fixture

Do not hard-code a contemporary product fact as permanent truth.

16.5 Drugs@FDA

Official source:

Required behaviour:

Download the official ZIP.

Store the exact ZIP as a raw snapshot.

Extract only into a temporary controlled directory.

Reject zip-slip/path traversal.

Enforce compressed/uncompressed size limits.

Validate expected tables/headers.

Parse source release/update date.

Import to staging tables.

Validate row counts and referential relationships.

Atomically project/swap current source data after validation.

Preserve prior source version.

Idempotent identical refresh.

Create material regulatory events only after baseline.

Schedule at most once per 24 hours.

At minimum ingest:

Applications

Products

Active ingredients

Application actions

Marketing status

Sponsors/applicants

Dosage form/route

Strength

Application/product numbers

Approval/action dates

Source-native relationships

Rules:

Exact application/product mapping may contribute to authorization.

Preserve NDA/ANDA/BLA source type.

Do not infer indication from product name.

Do not infer current distribution from historic approval alone.

Do not claim every product under one active ingredient shares the same status.

16.6 FDA Purple Book

Official source:

Required behaviour:

Prefer official full-data CSV when available.

If current official distribution requires another supported tabular format, document and test the parser.

Preserve source release month/date.

Store raw file.

Stage, validate, and atomically project.

Refresh weekly, recognizing the official source is generally monthly.

Preserve: BLA/licence identifiers Proper name Proprietary name Applicant Product category Reference/biosimilar/interchangeable source fields Approval date Marketing status fields when supplied Source

Preserve:

BLA/licence identifiers

Proper name

Proprietary name

Applicant

Product category

Reference/biosimilar/interchangeable source fields

Approval date

Marketing status fields when supplied

Source relationships

Rules:

Purple Book is the authority for FDA-licensed biological products.

Preserve source wording.

Do not infer interchangeability unless explicitly supplied.

Do not infer a peptide identity merely because a product is biological.

Map to exact reviewed substances/products.

16.7 openFDA drug labels

Official source:

Required behaviour:

Disabled until HEALTHSPAN_OPENFDA_ENABLED=true and a key is configured for scheduled use.

Prefer exact application number or exact reviewed identifiers.

Store JSON raw snapshots.

Preserve SPL set ID, effective/version date, openFDA annotations, product identifiers, and selected sections.

Refresh 30 days or after product change.

Handle multiple labels per ingredient/product without arbitrary collapse.

Select current display labels through documented rules.

Preserve superseded versions.

Required disclaimer:

Label submissions may change over time.

openFDA reformats submitted labeling.

The returned label may not be identical to labeling on a currently distributed or approved product.

OTC listing/label presence is not necessarily FDA approval.

Do not import dosage-and-administration into the dossier display.

16.8 FDA AEMS potential-signal pages

Official source:

Required behaviour:

Parse the current quarterly report index and archived quarterly reports.

Store raw HTML.

Preserve report quarter, publication/update date, product/class text, signal/new-safety-information text, and additional information.

Version page structure/parser.

Link only through reviewed identity/product mappings.

Baseline old quarterly entries.

Material later additions/updates create official safety events.

Display exactly as potential signal or new safety information , not causal proof.

Use stable source ID fda-aems-signals .

16.9 openFDA drug adverse-event aggregates

Official source:

Required behaviour:

Aggregate queries only.

Do not store patient-level reports or narratives.

Require a reviewed query definition.

Prefer exact application/RxCUI/UNII.

Query counts and grouped fields in bounded calls.

Store query and source coverage.

Refresh no more than every 90 days by default.

Handle quarterly lag.

Never combine aliases without explaining possible overlap.

Never calculate incidence or comparative safety.

Never label an aggregate pattern as a regulator signal.

Never create a prominent safety alert solely from count change.

Disabled until regular openFDA access is configured.

16.10 Existing TGA RSS relinking

Reprocess current TGA regulatory events to create candidate links to entities/products.

Rules:

Preserve original event.

Exact ARTG/product/ingredient identity may auto-link.

Broad topic names require review.

Regulator wording is not expanded.

One event may link to multiple entities when explicit.

Link changes are append-only and audited.

17. Dossier and resolution jobs

Add job kinds such as:

Rules:

Persisted jobs

202 mutation semantics

Lease/restart recovery

Deduplication

Bounded retries

Parent/child orchestration

Source failures independent

Dossier rebuild after dependencies commit

Graceful shutdown

No unbounded fan-out

No automatic paid AI jobs

A material accepted mapping must enqueue downstream rebuilds transactionally or through an outbox-equivalent durable pattern.

18. Backfill and baseline behaviour

18.1 Existing data backfill

Backfill intervention mentions from:

Trial intervention rows

M3 claim intervention/exposure fields

Paper titles/abstract source segments where deterministic rules identify an intervention mention

TGA regulatory event title/description

Existing Demo data only within Demo mode

Do not mix Demo and Live.

18.2 Baselines

Each new source/feed has its own baseline completion state:

Targeted sources may use per-entity/per-query baseline state where appropriate.

Old records imported on the first run must not appear as newly issued today.

18.3 Dossier baseline

The first dossier snapshot is baseline.

Later material changes create non-baseline dossier change events.

18.4 Search misses

A search miss has:

Query

Source

Scope

Identity state

Date

Expiry/staleness date

Connector/parser version

A stale miss must be rechecked. It must not become permanent “unapproved” truth.

19. API requirements

Retain the existing response envelope and strict dataMode .

All lists are server-side paginated and filtered.

19.1 Interventions

Filters:

19.2 Peptides

Support:

Peptide classification

Sequence state

Human evidence

Trial status

Regulatory coverage

Official warning state

Identity ambiguity

19.3 Comparison

Body:

Rules:

2–4 IDs

Live-only

No recommendation field

No winner/rank

Return comparability warnings

Server-side aggregation

Safe bounded response

19.4 Entity resolution

All mutations:

Local-admin guarded

Zod validated

Source-version concurrency checked

Append-only audited

Return conflict when stale

19.5 Regulatory and safety

Required filters:

19.6 Dossiers

Mutations return 202 Accepted .

19.7 Assessments follow-up

19.8 Methodology

19.9 Safe API metadata

Include where relevant:

Never return:

Raw snapshots

Full label text

Individual adverse-event case records

API keys

Local filesystem paths

Raw stack traces

Vendor links

Dosing instructions

Hidden model reasoning

Unreviewed ambiguous regulatory matches as current facts

20. UI requirements

Preserve the premium scientific design, responsive behaviour, accessibility, and Demo mode.

20.1 Live Interventions page

Replace the Live placeholder with a real page.

Show:

Preferred name

Entity type

Identity confidence

Key variants

Human-results availability

Evidence-maturity distribution

Trial count/results

Regulatory coverage by AU/US

Official safety source indicators

Resolution/staleness state

Last checked

Do not show a single intervention score.

20.2 Intervention dossier

Use clear sections/tabs:

The overview should answer:

What it is

What exact identity is represented

What evidence exists

What evidence is missing

What regulatory sources cover

What the dossier does not establish

Current coverage/freshness

20.3 Live Peptides page

Replace the Live placeholder with a safety-first peptide registry.

Show:

Verified/partial/name-only identity

Peptide/analogue/fragment/protein classification

Sequence status, not sequence by default in list

Human evidence

Trial state

Regulatory match state

Official unapproved/warning notices

Identity ambiguity

No vendor or dosing content.

20.4 Peptide detail

Display:

Identity warning

Aliases/research codes

Sequence and modifications only when sourced

Related-but-distinct analogues/fragments

Evidence and claims

Trials

AU/US regulatory matrix

Official safety notices

Reporting-pattern coverage

Missing evidence

Provenance

Resolution history

20.5 Regulatory & Safety workspace

Add a first-class workspace with:

New/changed authorizations/register records

Cancellations/suspensions/withdrawals

Label indication/warning changes

TGA notices

FDA AEMS potential signals

Explicit unapproved-product warnings

Source health

Regulatory match-review tasks

Coverage limitations

Do not make raw spontaneous report count changes a top alert.

20.6 Entity Resolution Queue

Provide:

Mention context

Source span/link

Candidate entities/variants

Identifier evidence

Collision warnings

Exact versus fuzzy reasoning

Accept/map/create/ambiguous/reject/defer actions

Prior decisions/history

Stale source warning

Support desktop and mobile.

20.7 Evidence map

Use a matrix or grouped view with filters for:

Cell/animal/human

Design

Maturity

Result availability

Direction

Outcome

Population

Variant

Retracted/corrected

Every cell links to items.

20.8 Trial portfolio

Enhance Trial pages and dossier panels:

Canonical entity mapping

Source intervention term

Variant

Status/results

Australian locations

Change timeline

Exact/ambiguous mapping state

Dossier link

20.9 Regulatory matrix

Rows should represent exact products/applications/register entries.

Columns:

Jurisdiction

Authority

Product

Entity/variant match

Form/route/strength

Standing

Indication/intended-purpose coverage

Effective date

Last checked

Source link

Entity-level summary must be scoped.

20.10 Safety section

Visually separate:

Official action/warning

Label statements

Regulator potential signals

Trial/paper harm evidence

Reported-event patterns

Coverage limitations

Always display the spontaneous-report caveat next to those patterns.

20.11 Comparison

Provide a 2–4 intervention comparison screen.

No default recommendation.

No green “winner” styling.

No spontaneous-report count comparison as a safety ranking.

Show not comparable when applicable.

20.12 Today screen

Add non-baseline events such as:

New exact regulatory product match

Authorization/register status changed

Label warning changed

TGA notice linked

FDA potential signal linked

Explicit unapproved warning linked

Dossier evidence profile materially changed

Do not alert on:

Initial baseline imports

Raw report-count increases

Fuzzy candidate generation

Routine identical refresh

20.13 Source health

Show all new sources and targeted coverage:

Enabled/configured state

Key-required state

Last run/success

Baseline status

Records/entities covered

Capped/partial state

Parser contract state

Next due time

Sanitised errors

20.14 Methodology

Expand with:

Identity model

Alias/variant policy

Auto-match policy

Peptide identity limits

Regulatory scope

Register inclusion versus evidence

Label limitations

“Not found” versus unapproved

Safety-source classes

AEMS/FAERS/openFDA limitations

Dossier aggregation

Comparison policy

No dosing/sourcing/medical advice

Source coverage table

20.15 Demo mode

Preserve all M1 Demo pages.

Do not copy Demo Intervention/Peptide records into Live.

Keep mode badges.

No ID collisions.

Demo E2E remains green.

21. Commands

Add Windows-safe root scripts:

Existing commands must continue to work:

Rules:

Backfills default to deterministic-only.

Live tests are opt-in.

Live tests use caps and temporary/explicit data directories.

No committed live raw data.

No command prints keys or exact paths except pnpm data:path .

22. Environment configuration

Update .env.example without secrets.

Validate configuration.

An intentionally disabled connector is a visible state, not a failure.

23. Evaluation corpus

23.1 Intervention identity corpus

Create at least 120 licence-safe synthetic or reduced fixtures.

Coverage:

Exact identifier matches

Exact aliases

Ambiguous abbreviations

Brand/generic

Salt/ester

Stereoisomer

Prodrug/metabolite

Formulation/route

Combination/component

Drug class/member

Botanical/extract

Behavioural intervention

Dietary pattern

Research/development code

Misspelling

Cross-source identifier agreement/disagreement

Redirect/split

Source-version change

Unicode/scientific symbols

At least:

23.2 Regulatory corpus

Create at least 72 fixtures covering:

ARTG active register record

ARTG listed/registered/assessed-listed distinctions

ARTG cancelled/suspended source states

ARTG no-result query

ARTG ambiguous result

Drugs@FDA applications/products/actions

Drugs@FDA discontinued/marketing status

Purple Book licensed biologic

Biosimilar/interchangeability source fields

Exact and ambiguous product mappings

Label indication/warning version change

Product authorization without longevity indication

No exact match versus explicitly unapproved

Baseline versus later status change

Source unavailable

23.3 Safety corpus

Create at least 48 fixtures covering:

TGA safety alert

TGA market action

TGA explicit unapproved warning

FDA AEMS potential signal

Label boxed warning

Label contraindication

Label adverse reaction

Trial harm result

Paper harm claim

OpenFDA aggregate count

Duplicate/follow-up caveat

Multi-drug/multi-reaction ambiguity

Zero-result query

No denominator

Dataset lag

Alias overlap

No identity match

23.4 Multi-claim corpus

Add at least 32 cases to the M3 claim evaluation for:

Multiple result claims in one abstract

Null plus positive endpoint

Benefit plus harm

Primary versus secondary outcome

Planned versus reported outcome

Qualified conclusion

Registry result table

Label warning/indication statements

23.5 Deterministic evaluation gates

Required:

100% schema-valid output

100% source-span/source-record provenance

100% exact identifier mapping on unambiguous fixtures

0 fuzzy auto-merges

0 class-to-member evidence copying

0 combination-to-component result copying without source support

0 salt/fragment/analogue destructive collapse in no-collapse fixtures

100% protocol-versus-result separation

100% human/animal/cell separation

100% no-result versus explicitly-unapproved separation

100% product/jurisdiction scoping

100% spontaneous-report caveat attached

0 incidence/causality inference from report counts

0 dosing/sourcing output

0 composite intervention/safety score

100% idempotent identical dossier rebuild

100% stale dossier detection after dependency change

100% retraction/correction exclusion from supportive default aggregation

23.6 Live smoke tests

Opt-in only.

Record date, endpoint/source, release/version, counts, duration, cap, and sanitised errors.

Required source families:

openFDA label/event smoke is required only when a key is intentionally configured.

A genuine upstream outage or terms/contract issue must be documented honestly. Do not weaken fixture tests.

24. Testing requirements

All default tests remain deterministic and network-independent.

24.1 Migration tests

M3 database to M4

M2-shaped database through all migrations

Repeated migration

Existing claims/reviews/jobs preserved

Foreign-key integrity

Rollback on failed migration

No Demo/Live mixing

No destructive reset

24.2 Entity repository tests

Entity CRUD/state

Alias collision

Identifier uniqueness

Variant relationships

Redirect without deletion

Mention deduplication

Candidate generation

Accepted current mapping

Append-only decision

Mapping supersession

Staleness/downstream queue

Pagination/filtering

Query plans

24.3 Peptide tests

Verified sequence

Partial sequence

Unknown sequence

Analogue

Fragment

Protein versus peptide

Modification provenance

Ambiguous marketing label

No invented sequence

No vendor/dosing field

24.4 Connector parser tests

For each new connector:

Normal response

Minimal response

Missing optional fields

Malformed row/item

Pagination or archive index

Version/update

Identical refresh

Source contract change

Unicode

Large-file cap

Partial failure

Sanitised errors

Raw snapshot linkage

Bulk ZIP tests:

Valid archive

Zip-slip attempt

Oversized entry

Missing table/header

Referencing missing key

Atomic staging failure

Identical release

Changed release

24.5 Resolution tests

Auto exact ID

Auto unique exact alias

No auto fuzzy

Abbreviation collision

Salt/ester distinction

Combination distinction

Peptide fragment distinction

Conflicting source IDs

Human accept/edit/reject/defer/split/redirect

Stale task concurrency

Downstream rebuild

24.6 Regulatory tests

Jurisdiction/product/formulation/indication scope

Raw and normalized status

ARTG no-match semantics

Drugs@FDA authorization

Purple Book licence

openFDA label not used alone as approval

NDC never used as approval

Trial status never used as authorization

Label version change

Cancellation/suspension

Baseline change suppression

Healthspan indication statement scope

24.7 Safety tests

Official warning precedence

Potential signal wording

Label section allowlist

Dosage section exclusion

Spontaneous-report aggregate only

No individual case storage

No incidence/causality

Zero reports not “safe”

Raw count increase no prominent alert

Query overlap caveat

Unresolved identity means not queried

TGA DAEN marked not imported

24.8 Dossier tests

Evidence aggregation

Protocol exclusion from result direction

Retracted exclusion/warning

Multi-entity combination handling

Variant filter

Trial portfolio

Regulatory matrix

Safety classes

Evidence needs

Coverage states

Immutable/idempotent snapshot

Stale after dependency change

History diff

Provenance links

Comparison no winner/rank

24.9 Job/scheduler tests

All new job kinds

Deduplication

Parent/child orchestration

Lease recovery

Retry bounds

Connector isolation

Dossier rebuild after committed mapping

No overlapping bulk source refresh

Due-time scheduling

Key-disabled openFDA state

Shutdown/restart

24.10 API tests

All endpoints

Pagination/filter validation

Local-admin guard

202 semantics

Stale review conflict

Source coverage

Safe errors

No raw snapshot

No full label

No patient-level report

No key/path

No recommendation/dosing fields

Live/Demo separation

24.11 UI/E2E tests

Desktop and mobile:

Live Interventions list

Intervention dossier

Live Peptides list

Peptide unknown-sequence warning

Peptide analogue/fragment distinction

Evidence map drilldown

Trial portfolio

Regulatory matrix

ARTG no-match state

FDA product status

Label warning

AEMS potential signal

Reported-event caveat

Entity resolution accept/reject/ambiguous

Stale mapping task

Comparison with no winner

Today regulatory change

Source-health key-disabled state

Methodology

Demo regression

Accessibility of tables, badges, dialogs, charts, and mobile navigation

24.12 Quality gates

All must pass:

Report exact counts and skips.

25. Doctors and integrity checks

25.1 interventions:doctor

Check:

Orphan aliases/identifiers

Alias collisions

Invalid current mappings

Redirect cycles

Variant relationship cycles where prohibited

Mentions without source provenance

Accepted mappings without rule/decision

Peptide sequence without source

Ambiguous entities incorrectly active

Demo/Live contamination

25.2 regulatory:doctor

Check:

Product without source version

Assertion without jurisdiction/authority

Active assertion with candidate match

Indication without product/application source

Invalid status history

Label without product/application

Approval inferred from prohibited source

ARTG miss misclassified as unapproved

Source baseline inconsistency

25.3 safety:doctor

Check:

Safety item without source

AEMS item labelled causal

Reporting pattern without query definition/caveat

Individual case payload accidentally persisted

Dosage section in dossier display store

Raw count change promoted to official alert

Unreviewed ambiguous safety link current

25.4 dossiers:doctor

Check:

Current pointer missing

Dependency missing

Stale dependency marked current

Retracted evidence counted supportively

Protocol counted as efficacy result

Comparison output contains rank/recommendation

Dossier contains vendor/dosing fields

Identical input with duplicate snapshot

Source coverage inconsistency

26. Performance and reliability targets

Generated performance fixtures, not committed databases.

Target local p95:

Rules:

No route loads all rows.

No browser renders unbounded tables.

Bulk imports use staging/transactions.

A malformed record does not destroy a valid bulk release.

Source contract failure remains visible.

Dossier rebuilds are bounded.

Identical snapshots are reused.

Worker remains responsive.

UI remains usable while jobs run.

27. Security, privacy, legal, and source-integrity requirements

No personal health information.

No medication/supplement log.

No user dosing data.

No API keys in browser, database diagnostics, logs, screenshots, or reports.

No exact local path in browser API.

Admin writes local-only by default.

No patient-level spontaneous-report storage.

No vendor data.

No pricing.

No purchasing/sourcing.

No dosing/administration guidance.

No medical recommendation.

No evasion of prescription, import, customs, or regulatory controls.

No full-text paywall scraping.

No TGA DAEN automation.

No broad ARTG crawl.

No full label republishing.

Display bounded excerpts and official links.

Respect source terms, robots, rate limits, attribution, and copyright.

Preserve retrieval/source dates separately.

Preserve raw official source snapshots privately.

Treat source HTML/labels as untrusted data.

No source text may execute instructions.

AI remains tool-less and optional.

Every regulatory/safety statement carries source provenance.

“Not found” expires and is scoped.

Corrections/status changes never erase history.

28. Documentation and ADR requirements

Create/update:

Add methodology:

Add source pages:

Add ADRs using the next available numbers for:

Canonical entity/variant/mention separation

Exact-first resolution and review-required ambiguity

Peptide sequence/modification provenance

Product- and indication-scoped regulatory assertions

Register inclusion, evidence, and trial status as independent dimensions

Regulator actions versus spontaneous report patterns

Bounded official ARTG HTML connector

Bulk regulatory source staging and atomic projection

Immutable dossier snapshots

No composite intervention/safety score and no recommendation

No DAEN automation in M4

OpenFDA key-disabled-by-default policy

Documentation must explain:

M1–M3 complete

M4 current

M5 not started

Exact base commit

Identity limits

“Not found” semantics

Regulatory scope

openFDA label limitations

AEMS/FAERS report limitations

ARTG coverage limits

DAEN not imported

No dosing/sourcing

No medical advice

Source refresh/caps

How to resolve entities

How to rebuild dossiers

How to back up M4 data

How to disable each connector

How to obtain/configure a free openFDA key without putting it in UI

Current known limitations

Save this brief at:

Do not silently remove controlling requirements.

29. What must NOT be done in Milestone 4

Do not implement:

YouTube

X/Twitter

Podcasts

Creator profiles

Creator trust scores

Social attention

Creator claim extraction

Paid creator APIs

Personal supplement tracking

Medication tracking

Lab tracking

Wearables

Exercise/pickleball personal logs

Personal-health correlations

Individual recommendations

Treatment or supplement changes

Dosing

Injection/reconstitution

Cycling/stacking

Vendor links

Purchasing

Prices

Promo codes

Import/customs evasion

Pharmacy/clinic finder

Telehealth

Authentication

Multi-user accounts

Public submissions

Community ratings

ChatGPT Sites

D1/R2

Wrangler/Cloudflare runtime

Hosted scheduler

Public deployment

Mobile native app

Vector database

Embedding search

Full-text article scraping

Paywall bypass

TGA DAEN scraping

Individual openFDA/AEMS case ingestion

Disproportionality algorithms such as PRR, ROR, EBGM

Incidence/risk estimates from spontaneous reports

Orange Book or patent analysis

NDC as approval authority

Formal clinical guidelines

Formal GRADE recommendations

A composite intervention/safety/longevity score

A “best intervention” ranking

A “recommended peptide” list

Milestone 5 work of any kind

30. Acceptance criteria checklist

Milestone 4 is complete only when every applicable item is checked and evidenced in the completion report.

A. Base, branch, and M3 follow-ups

A1. Work begins from exact commit 4d985d3c8e9208fadc01e529270bcf5f37f1503d .

A2. Work is on milestone-4/interventions-peptides-regulation .

A3. M3 history and completion report are preserved.

A4. Deterministic multi-claim extraction v2 is implemented.

A5. Multi-claim extraction preserves source spans and assertion roles.

A6. Planned outcomes still cannot become observed findings.

A7. Dedicated paginated /api/assessments endpoints exist.

A8. Dossier evidence aggregates retain M3 claim/assessment provenance.

A9. M3 optional AI boundaries remain intact.

A10. README/roadmap/docs show M3 complete, M4 current, M5 not started.

B. Entity model and resolution

B1. Canonical entity, variant, mention, alias, identifier, and relationship layers are separate.

B2. Entity type/lifecycle/identity-confidence taxonomies are implemented.

B3. Exact identifier matching is deterministic and versioned.

B4. Unique exact alias matching detects collisions.

B5. Fuzzy/approximate matches never auto-merge.

B6. Abbreviations with collisions require review.

B7. Salt, ester, stereoisomer, formulation, route, and strength distinctions are preserved.

B8. Combination products are not destructively split or collapsed.

B9. Class evidence is not copied to members.

B10. Mention mappings are source-versioned and append-only.

B11. Resolution decisions support accept/map/create/ambiguous/reject/defer/split/redirect.

B12. Entity redirects preserve history and avoid deletion.

B13. Mapping changes enqueue all required downstream rebuilds.

B14. Existing trials/claims/regulatory events are backfilled into mentions.

B15. Demo and Live entities never mix.

B16. interventions:doctor passes.

C. Peptides

C1. Live Peptides is backed by canonical entity data.

C2. Peptide/analogue/fragment/protein/name-only classifications are separate.

C3. Sequence is stored only with source provenance.

C4. Unknown sequence remains unknown.

C5. Modification provenance is modeled.

C6. Marketing/research-label ambiguity is visible.

C7. Related analogues/fragments are not marked identical without review.

C8. Peptide dossiers show human evidence, trials, regulation, safety, and gaps.

C9. No dosing, sourcing, vendors, purity, or sterility claims exist.

C10. Peptide evaluation fixtures pass.

D. Identity connectors

D1. RxNorm connector is implemented with exact-first matching and caching.

D2. GSRS connector supports UNII and source-provided sequence/type data.

D3. PubChem connector supports exact chemical identity enrichment.

D4. Presence in an identity source is never displayed as approval.

D5. Approximate API results remain candidates.

D6. Connector responses use raw snapshots, versions, health, baselines, and jobs.

D7. Connector contract failures are visible rather than empty successes.

D8. Default tests make no live calls.

E. TGA ARTG

E1. Bounded official ARTG search/detail connector is implemented.

E2. Current terms/robots/access assumptions are documented with check date.

E3. Full-register crawling is not implemented.

E4. Query/detail caps and low rate are enforced.

E5. Exact ARTG ID mapping works.

E6. Ambiguous search results create review tasks.

E7. ARTG fields and source-native status are preserved.

E8. Search misses become scoped, expiring no_exact_match_found .

E9. Search misses never become automatic unapproved .

E10. PI/CMI PDFs are linked, not automatically parsed.

E11. Parser contract change produces degraded source health.

E12. ARTG baseline/history/change behaviour is correct.

F. FDA regulatory and label sources

F1. Drugs@FDA bulk ZIP connector is implemented.

F2. Archive extraction rejects path traversal and unsafe sizes.

F3. Expected tables/headers and relationships are validated.

F4. Staging and atomic current projection work.

F5. Identical releases are idempotent.

F6. Products, ingredients, applications, actions, status, route/form, and strength are retained.

F7. FDA product status remains product/application scoped.

F8. Purple Book full-data connector is implemented.

F9. Licensed biologic and biosimilar/interchangeability source fields are preserved without inference.

F10. openFDA label connector is implemented behind configuration.

F11. Label sections use the allowlist.

F12. Dosage-and-administration is excluded from dossier display.

F13. Label presence alone is not used as approval proof.

F14. NDC Directory is not used as approval authority.

F15. Regulatory status and scientific evidence remain separate.

F16. regulatory:doctor passes.

G. Indication and regulatory semantics

G1. Regulatory assertions include jurisdiction, authority, product/application, status, and source version.

G2. Formulation/route/strength scope is retained when supplied.

G3. Regulatory indication differs from trial condition/research claim.

G4. Entity summaries do not imply every variant/use is authorized.

G5. Trial registration is never treated as authorization.

G6. explicitly_unapproved requires explicit regulator wording.

G7. not_checked , source_unavailable , and identity_unresolved are represented.

G8. Healthspan/longevity indication statements identify source, scope, and check date.

G9. Regulatory status history is immutable and versioned.

G10. Baseline regulatory records do not appear as newly issued alerts.

H. Safety and adverse-event reporting

H1. Existing TGA RSS notices are linked through reviewed mappings.

H2. FDA AEMS current/archive potential-signal connector is implemented.

H3. AEMS entries preserve quarter, wording, additional information, and source version.

H4. AEMS potential signals are not displayed as proven causality.

H5. openFDA event aggregate connector is implemented behind configuration.

H6. Only aggregate counts are stored.

H7. No patient-level report or narrative is stored.

H8. Every reporting snapshot has a reviewed query definition.

H9. Exact identifiers are preferred over broad names.

H10. Alias totals are not combined as deduplicated totals.

H11. Report patterns always show the mandatory caveat.

H12. No incidence, relative risk, causality, or comparative safety is inferred.

H13. Zero reports is not displayed as safe/no risk.

H14. Count changes do not create prominent safety alerts.

H15. TGA DAEN is clearly marked not imported.

H16. Label/regulator/trial/paper/reporting sources are visually separated.

H17. safety:doctor passes.

I. Dossiers and comparison

I1. Live Interventions list is functional.

I2. Live Peptides list is functional.

I3. Dossier identity/variant coverage is explicit.

I4. Evidence map uses independent M3 dimensions.

I5. Retracted evidence is excluded from supportive default counts and warned.

I6. Protocol-only records do not contribute efficacy direction.

I7. Combination evidence is not assigned to components without support.

I8. Trial portfolio links canonical entities and source terms.

I9. AU/US regulatory matrix is product scoped.

I10. Safety sections separate source classes.

I11. Evidence-needs aggregation is deterministic.

I12. Dossier source coverage/freshness is visible.

I13. Dossier snapshots are immutable and idempotent.

I14. Dependency changes mark dossiers stale and enqueue rebuild.

I15. Dossier history shows material diffs.

I16. Comparison supports 2–4 entities.

I17. Comparison has no winner, rank, recommendation, or report-count safety ranking.

I18. Incomparability warnings work.

I19. dossiers:doctor passes.

J. Jobs, scheduling, source health, and APIs

J1. All new long-running work uses persisted jobs and 202 semantics.

J2. Jobs have deduplication, leases, restart recovery, and bounded retries.

J3. Connector failure remains isolated.

J4. Scheduled freshness rules enqueue due work.

J5. openFDA disabled/key-missing state is healthy and visible.

J6. All list endpoints use server-side pagination.

J7. All filters/sorts are validated and bounded.

J8. All new mutation routes use the shared local-admin guard.

J9. No browser response contains keys, local paths, raw snapshots, full labels, or patient-level reports.

J10. Source health includes new sources, baselines, caps, and parser state.

J11. Existing M2/M3 commands/jobs/scheduler continue to work.

J12. Query-plan checks pass for principal queries.

K. UI, methodology, and accessibility

K1. Intervention dossier works on desktop and mobile.

K2. Peptide dossier works on desktop and mobile.

K3. Entity Resolution Queue is interactive and audited.

K4. Regulatory & Safety workspace is implemented.

K5. Evidence map drills to source items.

K6. Trial portfolio links work.

K7. Regulatory matrix is scoped and sourced.

K8. Reported-event caveat is visible at point of use.

K9. Today shows material official/dossier changes only.

K10. Methodology covers identity, regulation, safety, adverse reports, dossiers, and comparison.

K11. Honest empty/disabled/unresolved/stale states are implemented.

K12. Demo mode remains separate and functional.

K13. New dialogs, tables, badges, charts, and controls meet accessibility checks.

K14. No dosing, sourcing, vendors, or recommendation UI exists.

L. Evaluation, security, and quality

L1. Identity corpus has at least 120 cases and required subsets.

L2. Regulatory corpus has at least 72 cases.

L3. Safety corpus has at least 48 cases.

L4. Multi-claim corpus has at least 32 new cases.

L5. All deterministic gates in Section 23.5 pass.

L6. No new paid source is required.

L7. No personal-health feature is added.

L8. No prohibited data or secret is committed.

L9. No full-text/paywall/DAEN/broad-ARTG scraping is implemented.

L10. pnpm lint passes with zero warnings.

L11. pnpm typecheck passes.

L12. pnpm test passes.

L13. pnpm test:e2e passes on desktop and mobile projects.

L14. pnpm build passes.

L15. pnpm db:doctor passes.

L16. pnpm intelligence:eval passes.

L17. pnpm intelligence:doctor passes.

L18. pnpm interventions:eval passes.

L19. pnpm interventions:doctor passes.

L20. pnpm regulatory:eval passes.

L21. pnpm regulatory:doctor passes.

L22. pnpm safety:doctor passes.

L23. pnpm dossiers:doctor passes.

L24. Documentation and ADRs match implementation.

L25. M4 screenshots and completion report are committed.

L26. Working branch is pushed and final hash reported.

L27. No Milestone 5 work has begun.

31. Required completion report

Create and commit:

It must contain:

Executive summary

Exact base, branch, feature-complete commit, and final HEAD

One-row-per-acceptance-criterion checklist

M3 follow-up results

Significant file-tree changes

Migration files and schema summary

Package-boundary changes

Entity identity model

Normalization/ruleset versions

Auto-match and review policy

Peptide identity model

New connector implementation summary

Source terms/robots/access check dates

Source freshness/caps

Drugs@FDA staging/atomic import result

Purple Book import result

ARTG exact/no-match/ambiguous behaviour

openFDA configured/disabled state

Regulatory-scoping examples

“Not found” versus explicitly unapproved tests

Safety-source model

AEMS potential-signal behaviour

Spontaneous-report caveat and no-incidence tests

Dossier aggregation and provenance design

Dossier idempotency/staleness tests

Comparison no-winner/no-ranking tests

Evaluation-corpus composition

Exact deterministic evaluation results

Optional dated live-smoke result per source

Job/scheduler behaviour

Query-plan/performance checks

API route summary

UI/page summary

Security/privacy/source-policy/copyright review

Exact commands run and results

Lint result

Type-check result

Unit/integration test counts

E2E projects, passes, skips, failures

Build result

Doctor results

Screenshots: Live Interventions list Intervention dossier overview Evidence map drilldown Trial portfolio AU/US regulatory matrix Regulatory & Safety workspace FDA potential-signal item Reported-event

Screenshots:

Live Interventions list

Intervention dossier overview

Evidence map drilldown

Trial portfolio

AU/US regulatory matrix

Regulatory & Safety workspace

FDA potential-signal item

Reported-event pattern with caveat

Entity Resolution Queue

Accepted and ambiguous resolution decisions

Live Peptides list

Peptide identity warning/detail

Intervention comparison

Source Health with new sources

Methodology

Demo regression

Mobile intervention/peptide/resolution view

Known issues and technical debt

Deviations from this brief and rationale

Genuine decisions required before Milestone 5

Explicit statement that Milestone 5 has not begun

Do not claim a live connector passed unless it was actually exercised on the stated date.

32. Consult the project manager early only when

Exact base commit is unavailable or repository history materially differs.

A migration would destroy or silently reinterpret M2/M3 data.

The TGA site terms/robots or technical controls prohibit the bounded ARTG connector.

An official source withdraws or materially changes a required download/API.

Drugs@FDA/Purple Book cannot be parsed without a prohibited or paid dependency.

A source licence would prohibit intended local storage/display.

A paid credential becomes indispensable for core M4 completion.

Product/indication mapping cannot be represented without weakening regulatory scope.

A privacy/security boundary would be weakened.

Two acceptance criteria are genuinely incompatible.

A required capability remains technically impossible after documented attempts.

A proposed fix would start Milestone 5.

Do not consult for:

Routine dependencies

Internal naming

Migration organization

Parser fixture construction

CSS/layout details

Review-queue component structure

Ordinary source-field variation

Recoverable connector errors

Refactors

Performance tuning

Documentation phrasing

Optional openFDA key absence

A source returning no relevant matches

33. Stop conditions

After all M4 acceptance criteria and required quality gates pass:

Commit implementation, migrations, fixtures, evaluation corpora, docs, ADRs, screenshots, and completion report.

Push:

Report:

Stop.

Do not:

Merge to main

Create an M5 branch

Add creators or social sources

Begin YouTube or X integration

Add personal health tracking

Begin hosted deployment

Add authentication

Add dosing/sourcing/vendors

Begin any Milestone 5 work

Wait for the next project-manager brief.

34. AUTHORISED start message

AUTHORISED TO BEGIN: Start Healthspan Dashboard Milestone 4 from exact commit 4d985d3c8e9208fadc01e529270bcf5f37f1503d and create milestone-4/interventions-peptides-regulation . Complete the mandatory
