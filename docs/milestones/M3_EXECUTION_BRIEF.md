Healthspan Dashboard — Milestone 3 Execution Brief

Milestone: 3 — Evidence & Claim Intelligence
Issued: 23 July 2026
Project manager: ChatGPT
Execution agent: Grok 4.5 in Cursor
Repository: Smellybum1/Healthspan-Dashboard
Base branch: milestone-2/persistent-data-backbone
Base commit: 4a39a1c
Working branch: milestone-3/evidence-claim-intelligence
Status: AUTHORISED TO BEGIN
Stop point: Complete Milestone 3, push the working branch, submit the required completion report, and stop before Milestone 4. Do not merge to main unless the project owner separately instructs you to do so.

1. Controlling instruction

Begin Healthspan Dashboard Milestone 3 from the exact Milestone 2 completion commit:

4a39a1c

Create and work on:

milestone-3/evidence-claim-intelligence

Recommended start sequence:

git fetch origin
git switch --create milestone-3/evidence-claim-intelligence 4a39a1c

If the branch already exists locally, verify that its merge base and starting tree include commit 4a39a1c before continuing.

Milestone 3 must:

Close the mandatory Milestone 2 follow-up items in Section 4.

Build a deterministic-first, source-grounded, versioned evidence and claim intelligence pipeline.

Add optional provider-neutral AI enrichment that is disabled by default and cannot replace source facts or deterministic safeguards.

Give every live claim and assessment exact provenance to the source record version and source text location from which it came.

Present independent evidence dimensions rather than one opaque “truth,” “longevity,” or “evidence” score.

Add review, correction, retraction, staleness, and audit workflows.

Replace the Live-mode placeholder evidence experience with honest evidence profiles, claims, translation gaps, methodological signals, assessment history, and a transparent research-activity radar.

Preserve Milestone 1 Demo mode and all Milestone 2 ingestion behaviour.

Complete every acceptance criterion, push the branch, commit the completion report, and stop before Milestone 4.

Make routine implementation decisions autonomously. Do not request approval for normal dependency additions, internal file layout, component composition, migration implementation, fixture construction, ordinary refactors, recoverable defects, or visual polish that stays inside this brief.

Do not start canonical intervention or peptide dossiers, new regulatory-source integration, creator monitoring, social-media intelligence, personal-health tracking, hosted deployment, or any other Milestone 4+ work.

2. Product intent

Healthspan Dashboard is an evidence-first research intelligence product. Its central purpose is not to tell the user what to take. It should help the user answer:

What exactly is being claimed?

Is the statement a hypothesis, study objective, observed result, author conclusion, registry result, or regulatory statement?

What organism and population were studied?

What study design produced the evidence?

Were results actually reported, or is the record only a protocol or ongoing trial?

Did the study measure lifespan, clinical events, function, cognition, quality of life, safety, a surrogate, or an exploratory biomarker?

What translation gaps remain?

What methodological signals should make the result easier or harder to trust?

Is the record corrected, retracted, superseded, or stale?

Which other source-bound claims appear supportive, null, or potentially conflicting?

What additional evidence would materially change the assessment?

Which parts were extracted deterministically, assisted by AI, or reviewed by the user?

The product must support curiosity while resisting hype. Evidence maturity, study quality signals, result direction, outcome relevance, safety, research activity, and model extraction confidence are separate dimensions.

3. Non-negotiable product and scientific principles
3.1 No single composite truth score

Do not create or display any single number that purports to combine:

Evidence maturity

Study quality

Efficacy

Safety

Translation potential

Research activity

Social attention

Model confidence

Regulatory status

Prohibited labels include:

Longevity score
Truth score
Overall evidence score
Intervention score
Anti-ageing score
Probability this extends life

A categorical maturity stage may have an internal ordinal value solely for sorting and plotting. The UI must display the category name and explain that maturity is not effect size, safety, or certainty.

Milestone 1 Demo-mode scores may remain in the seeded demonstration experience. They must not be copied onto or inferred for Live-mode records.

3.2 Unknown is a valid result

Never invent a value because a source is incomplete.

Use explicit states such as:

unknown
not_reported
not_applicable
not_yet_assessed
insufficient_information
results_not_available

Do not infer peer review merely because a record is indexed in PubMed. Do not infer regulatory approval from a paper or clinical-trial record. Do not infer efficacy from an ongoing trial, protocol, planned outcome, or study objective.

3.3 Protocols and planned studies are not results

A registered randomized trial without posted results may establish that a controlled human study is planned or underway. It does not establish efficacy.

The product must visibly distinguish:

study design maturity
results availability
reported finding

A trial can therefore be labelled as a randomized controlled design while its evidence availability remains ongoing_no_results or completed_no_results.

3.4 Source facts outrank model output

The system of record is the cited official source and its preserved version.

AI may:

Extract candidate claims

Normalize wording into structured fields

Suggest study-design labels

Suggest concepts or translation gaps

Explain why a deterministic rule fired

Identify records that merit review

AI must not:

Override explicit source metadata

Create an uncited scientific claim

Write directly to the database

Change a human review decision silently

Treat source text as executable instructions

Produce medical recommendations

Infer dosing, purchasing, or treatment instructions

Claim causal efficacy from association

Turn a biomarker result into demonstrated lifespan extension

3.5 Formal evidence frameworks must not be impersonated

Milestone 3 does not implement formal GRADE certainty ratings, Cochrane risk-of-bias assessments, or clinical-practice recommendations.

Use the label:

Methodological signals

rather than:

Formal risk of bias
GRADE certainty
Clinical recommendation

unless a later milestone implements and validates such a framework with the necessary human review and methodology.

3.6 Claims remain source-bound

Every claim must point to:

The content item

The exact source object

The exact source-record version

The source section or structured field

A short supporting span or field path

The extraction method

The rule, prompt, provider/model, and analysis version where applicable

A claim without valid provenance must not be published in the Live UI.

3.7 Corrections and retractions are first-class events

A retraction, expression of concern, correction, or materially changed source record must:

Mark affected intelligence as stale

Trigger reassessment

Create a review task where appropriate

Display a prominent warning

Preserve the earlier assessment and source version

Never silently rewrite history

3.8 Research activity is not social attention or truth

Milestone 3 may calculate transparent research activity from Healthspan Dashboard’s ingested source records and change events.

It must not call this social attention, popularity, or public interest. YouTube and X signals belong to Milestone 5.

4. Mandatory Milestone 2 closure items

Complete these before treating the Milestone 3 intelligence layer as finished. These are closure tasks, not a reopening of the M2 scope.

4.1 Redact local filesystem paths from browser APIs

The browser-visible /health, /api/sources, diagnostics, and error responses must not expose:

Exact database path

Exact user data directory

Exact raw snapshot directory

Windows username or home directory

Secret-bearing URLs

Raw stack traces

Return safe values such as:

{
  "database": {
    "status": "healthy",
    "migrationVersion": "..."
  }
}

Exact local paths remain available through:

pnpm data:path

and local terminal diagnostics only.

Add automated tests proving browser API responses do not contain the temporary test path or user-home path.

4.2 Enforce the local administrative-mutation boundary

All mutation routes, including ingestion, intelligence runs, review resolution, and future administrative actions, must use one shared guard.

Rules:

Default server binding remains 127.0.0.1.

When bound to a non-loopback address, administrative mutations are disabled unless:

HEALTHSPAN_ALLOW_REMOTE_ADMIN=true

Enabling remote administration must emit a conspicuous startup warning.

Read-only routes may remain available under the configured host.

Do not add authentication in Milestone 3.

Test IPv4 loopback, IPv6 loopback, localhost, non-loopback, and explicit override behaviour.

4.3 Make baseline state source-scoped

Replace any global “database is empty” baseline inference.

Baseline completion must be tracked independently for:

PubMed

ClinicalTrials.gov

Crossref

Each enabled TGA feed, or a clearly documented TGA child-feed unit

Rules:

A source’s first successful import is its baseline.

Adding a new connector or feed later must not cause its old records to appear as fresh changes.

A source that previously completed a baseline must not become baseline again after another source is cleared or disabled.

Existing M2 data must migrate safely.

Preserve prior content and event history.

Add tests for staggered first runs and newly enabled TGA feeds.

4.4 Implement real queued run semantics

Replace long-running synchronous mutation behaviour with persisted jobs.

Required:

POST run endpoints return 202 Accepted.

The response includes job/run IDs.

The UI polls or refreshes job status.

An in-process worker executes jobs while the local API is running.

Jobs survive process restarts.

Stale leases are recoverable.

Duplicate equivalent jobs are coalesced or rejected deterministically.

One source failure does not destroy other completed source work.

Graceful shutdown stops claiming new work and safely releases or expires leases.

Default automated tests do not use real time or the live network.

Use the same job framework for ingestion and intelligence analysis.

4.5 Implement the local scheduler and startup catch-up

Implement the scheduler promised by the local architecture.

Defaults:

Timezone: Australia/Brisbane
Schedule: 06:00 daily
Startup catch-up: enabled
Stale threshold: 24 hours

The scheduler must enqueue rather than directly execute long-running work.

Rules:

Disabled in automated tests unless explicitly enabled.

Does not block API startup.

Never creates overlapping full refresh jobs.

Shows last run, next run, and catch-up reason.

Resumes correctly after restart.

Remains behind a replaceable Scheduler interface.

Does not add hosted scheduling or assume a permanently running cloud process.

4.6 Move list/search work behind services and server-side queries

Do not load every content row into application memory for ordinary list/search requests.

Required:

Repository/service boundaries for content, claims, assessments, reviews, and radar queries

Server-side pagination

Validated sort and filter fields

Bounded query limits

Indexed query paths

No route-level raw SQL except small health/diagnostic checks

Documented EXPLAIN QUERY PLAN checks for principal queries

Existing API response contracts preserved or versioned safely

4.7 Correct documentation status

Update stale project documentation so that it reflects reality:

README describes M2 as complete and M3 as current.

Roadmap marks M1 and M2 complete.

docs/milestones/M2.md is marked complete.

Architecture and data-model documents describe the implemented M2 system.

Decision log references the new M3 ADRs.

Do not rewrite the historical M2 completion report except to correct an objectively wrong link or typo; preserve it as a historical record.

5. Fixed Milestone 3 product-management decisions
5.1 Live source scope

Milestone 3 intelligence may use only the sources already ingested during M2:

PubMed
ClinicalTrials.gov
Crossref enrichment
TGA RSS

Do not add new external source connectors.

Permitted connector work is limited to extracting additional fields already present in those official responses, including structured abstract sections and explicit ClinicalTrials.gov results modules.

Do not scrape article webpages, paywalled full text, trial webpages, creator pages, or TGA linked articles.

5.2 Claim scope

Milestone 3 claims may come from:

Paper title and abstract sections

Explicit PubMed publication and relation metadata

ClinicalTrials.gov brief/detailed descriptions

Trial design and eligibility fields

Trial planned outcomes, clearly labelled as planned

Explicit ClinicalTrials.gov posted-results structures

TGA feed title and description

Crossref correction, retraction, licence, funding, and relationship metadata

Milestone 3 claims must not come from:

YouTube

X/Twitter

Podcasts

Creator websites

Vendor pages

User anecdotes

Personal-health data

Model world knowledge

Uncited web search

5.3 Claim roles

Every claim receives one assertion role:

background
hypothesis
objective
method
planned_outcome
result
author_conclusion
registry_result
regulatory_statement

Only these roles may be treated as observed/reported findings:

result
author_conclusion
registry_result
regulatory_statement

objective, hypothesis, and planned_outcome must never be displayed as demonstrated findings.

5.4 Claim kinds

Use an extensible controlled taxonomy including:

efficacy_or_benefit
harm_or_safety
null_or_no_effect
association
mechanism
biomarker_change
functional_outcome
mortality_or_lifespan
pharmacokinetic
feasibility
study_objective
regulatory_or_market_statement
other

A claim may have more than one outcome family but one primary claim kind.

5.5 Result direction

Use:

beneficial
harmful
null
mixed
unclear
not_applicable

Direction describes the source-bound reported result, not the project manager’s treatment recommendation.

5.6 Study-design taxonomy

Support at least:

mechanistic_or_theoretical
in_vitro
ex_vivo
animal_interventional
animal_observational
case_report
case_series
cross_sectional
case_control
cohort
observational_other
single_arm_interventional
nonrandomized_controlled
randomized_controlled
crossover_randomized
pragmatic_trial
systematic_review
meta_analysis
umbrella_review
protocol_or_registry_only
regulatory_notice
other
unknown

A source may expose multiple design characteristics. Preserve source wording and the normalized label.

5.7 Evidence-availability taxonomy

Support:

objective_or_protocol_only
not_yet_recruiting
recruiting_or_ongoing_no_results
completed_no_results
terminated_no_results
registry_results_posted
published_results
evidence_synthesis
regulatory_notice
unknown

This dimension remains independent from study design and evidence maturity.

5.8 Evidence-maturity ladder

Use this categorical ladder for Live-mode research records:

not_assessable
mechanistic_hypothesis
in_vitro_or_ex_vivo
animal_evidence
human_observational
early_human_interventional
controlled_human_trial
replicated_or_synthesized_human_evidence

Rules:

The ladder describes translation maturity, not effect magnitude, safety, or certainty.

A protocol-only record may describe a controlled design but must remain explicitly without results.

replicated_or_synthesized_human_evidence is assigned only for an explicit systematic review/meta-analysis/umbrella review or a human-reviewed group of sufficiently comparable independent human studies.

Do not add approved, guideline_supported, or clinically_recommended as a maturity stage in M3. Intervention approval and indication-specific regulatory modelling belong to M4.

Do not assign human maturity to animal or cell evidence.

Use not_assessable rather than guessing.

For plotting only, map the ordered categories to a documented ordinal. Never show the ordinal as a scientific score.

5.9 Organism and population

Support:

organism_level:
  in_vitro
  ex_vivo
  animal
  human
  mixed
  not_applicable
  unknown

population_context:
  healthy
  disease_specific
  frailty_or_age_related_condition
  mixed
  not_reported
  not_applicable
  unknown

Preserve age range, sex eligibility, sample size, condition, and healthy-volunteer status only when explicit.

5.10 Outcome relevance

Support multi-valued outcome families:

mortality_or_lifespan
major_clinical_event
physical_function_or_mobility
strength_or_sarcopenia
cognition
frailty
quality_of_life
patient_reported_outcome
safety_or_adverse_event
validated_surrogate
exploratory_biomarker
biological_age_measure
molecular_or_mechanistic
pharmacokinetic
feasibility_or_adherence
healthspan_composite
other
unknown

Do not label an endpoint a validated surrogate unless the source or a curated rule explicitly establishes that status. Otherwise use exploratory_biomarker or unknown.

5.11 Translation gaps

Use a controlled many-to-many taxonomy:

cell_to_organism
animal_to_human
disease_to_healthy_population
disease_treatment_to_longevity
biomarker_to_meaningful_outcome
surrogate_to_clinical_outcome
short_term_to_durable_benefit
association_to_causation
selected_sample_to_general_population
dose_route_or_formulation
sex_or_age_generalization
single_study_to_independent_replication
protocol_to_reported_results
mechanism_to_observed_benefit
other

A gap is a caution about translation, not proof that a finding is false.

5.12 Methodological signals

Use explicit, auditable signals rather than a formal quality score. Examples:

randomization_reported
randomization_not_reported
comparator_present
no_comparator
blinding_reported
blinding_not_reported
prospective
retrospective
observational_design
small_sample_context
short_follow_up_context
attrition_reported
attrition_not_available
prespecified_outcome
exploratory_outcome
registry_results_available
completed_without_results
preprint_or_nonfinal
conference_abstract_only
correction_present
expression_of_concern
retracted
funding_reported
funding_not_reported
conflict_disclosure_reported
conflict_disclosure_not_available
registry_publication_discrepancy
abstract_only_assessment
insufficient_methods_detail

Rules:

Signals must state what was observed or unavailable.

Do not convert “not reported” automatically into “did not happen.”

Thresholds such as “small sample” must be documented by design context and presented as context, not a universal verdict.

Never generate a formal overall risk-of-bias grade.

5.13 Classification confidence is not evidence confidence

Store and display a separate extraction/classification confidence:

high
medium
low
not_available

This answers:

How confident is the pipeline that it classified the source text correctly?

It does not answer:

How likely is the intervention to work?

Label it clearly as classification confidence or extraction confidence.

5.14 Assessment completeness

Use:

not_assessed
limited
partial
substantial

Completeness reflects available fields and processed source material, not scientific certainty.

5.15 What would change the assessment

Generate deterministic, source-grounded next-evidence needs. Examples:

Cell finding → animal and human evidence

Animal finding → controlled human study

Observational association → randomized or otherwise causal human evidence

Biomarker-only result → functional or clinical outcome

Short follow-up → durable follow-up

Small single study → larger independent replication

Protocol-only record → posted or published results

Disease population → evidence in generally healthy older adults, when that is the claimed target population

Corrected or retracted record → independent unaffected evidence

Store these as controlled needs plus a short deterministic explanation. AI may improve wording but may not invent a new scientific requirement without mapping it to a controlled need.

5.16 Hallmarks of ageing

Support the twelve expanded hallmarks as optional discovery tags:

genomic_instability
telomere_attrition
epigenetic_alterations
loss_of_proteostasis
disabled_macroautophagy
deregulated_nutrient_sensing
mitochondrial_dysfunction
cellular_senescence
stem_cell_exhaustion
altered_intercellular_communication
chronic_inflammation
dysbiosis

Display them as:

Potentially related hallmarks

They are navigation aids, not proof that modifying the tagged process extends human life.

Every tag must record assignment method and confidence. Low-confidence automatic tags require review or remain visibly unreviewed.

5.17 Claim relationships

Support:

duplicate_or_paraphrase
supports
qualifies
updates
potentially_conflicts
contradicts
related

Automated relationship creation is conservative:

Exact or near-exact paraphrases may be marked duplicate_or_paraphrase.

Source-declared updates/corrections may be marked updates.

Machine-detected disagreement must be labelled potentially_conflicts, not contradicts.

Only human review or an explicit source relationship may promote a relationship to contradicts.

Population, intervention/exposure, comparator, outcome family, direction, and timeframe compatibility must be recorded.

Disparate studies must not be synthesized merely because they mention the same broad topic.

5.18 Intervention and peptide boundary

Milestone 3 may extract:

Source intervention/exposure text

Normalized mention tokens

Controlled concept tags

Claim-level intervention phrases

It must not create:

Canonical intervention dossiers

Peptide dossiers

Alias-resolution systems presented as definitive

Regulatory status by intervention

Dosing guidance

Vendor or sourcing data

Comparison recommendations

Those belong to Milestone 4.

6. Deterministic-first intelligence architecture

Use the following pipeline:

Current source-record version
    ↓
Material input builder
    ↓
Versioned evidence text segments
    ↓
Deterministic study/profile extraction
    ↓
Deterministic evidence maturity and gap rules
    ↓
Deterministic source-fact claim candidates
    ↓
Optional AI enrichment for unresolved fields
    ↓
Strict schema and policy validation
    ↓
Immutable analysis package
    ↓
Review tasks for ambiguity/high-impact cases
    ↓
Current intelligence projection
    ↓
API, UI, history, and research-activity radar
6.1 Analysis inputs

An analysis input must identify:

Content item ID

Source object ID

Source-record version ID

Input segment hashes

Parser version

Ruleset version

Prompt/schema version if AI is used

Provider and model if AI is used

Creation timestamp

Input hash

Only current, validated source-record versions are eligible by default.

6.2 Evidence text segments

Create structured, versioned segments rather than passing an undifferentiated raw payload through the pipeline.

Segment kinds include:

title
abstract_background
abstract_objective
abstract_methods
abstract_results
abstract_conclusions
abstract_unstructured
trial_brief_summary
trial_detailed_description
trial_design
trial_eligibility
trial_planned_primary_outcome
trial_planned_secondary_outcome
trial_posted_result
trial_adverse_event_result
tga_title
tga_description
crossref_relation
source_metadata

Each segment stores:

Source-record version ID

Content item ID

Segment kind

Source field path or section label

Text hash

Character offsets where meaningful

Source language

Created timestamp

Whether the segment is eligible for claim extraction

Copyright/display policy

Do not add article-body or paywalled full-text acquisition.

6.3 Deterministic extraction

Deterministic rules should cover unambiguous explicit metadata such as:

Publication type

Trial allocation

Trial masking

Study phase

Recruitment/status state

Results availability

Organism terms when explicit

Human/animal/cell distinctions

Sample size where explicit

Outcome family from structured trial fields

Retraction/correction relations

TGA regulatory-source role

Funding and conflict fields when supplied

Protocol versus result separation

Research-activity counts

Use versioned rule modules. Every label must record the rule ID(s) that produced it.

6.4 Optional AI enrichment

AI is optional and disabled by default.

Define a provider-neutral interface similar to:

interface IntelligenceProvider {
  readonly providerId: string;

  analyze(input: IntelligenceProviderInput): Promise<IntelligenceProviderOutput>;
}

Implement:

DisabledIntelligenceProvider
FixtureIntelligenceProvider
OpenAIResponsesIntelligenceProvider

The OpenAI adapter must:

Use the current official Responses API.

Use schema-constrained structured output.

Set storage off for requests where the API supports it.

Use a model supplied through configuration; do not hard-code a model name as the permanent project default.

Send only the minimum public-source segments required for the task.

Never send local paths, environment variables, API keys, raw snapshots, user preferences, watchlists, or personal-health data.

Treat all source text as untrusted data and delimit it from system/developer instructions.

Use no web, shell, file, or other model tools.

Never request or store hidden chain-of-thought.

Return only validated structured fields and concise cited rationales.

Fail closed on invalid schema output.

Leave the deterministic result usable when the provider fails.

AI may be used for:

Candidate atomic claim extraction

Ambiguous study-design classification

Population/intervention/outcome phrase extraction

Translation-gap suggestions mapped to the controlled taxonomy

Hallmark suggestions

Potential claim-relationship candidates

Plain-language explanation constrained to source facts

AI must not be used for:

Medical advice

Treatment recommendations

Dosing

Sourcing

Predicted lifespan extension

Regulatory approval inference

Overall scoring

Uncited consensus claims

Provider world knowledge that is absent from the source input

6.5 AI publication policy

AI-assisted output may appear in Live mode only when:

It passes schema validation.

All source spans resolve.

Every claim maps to a permitted assertion role.

Policy checks find no species, protocol/result, or provenance violation.

It is visibly labelled AI-assisted, unreviewed unless human-reviewed.

High-impact cases create a review task.

High-impact review reasons include:

human_efficacy_claim
harm_or_safety_claim
mortality_or_lifespan_claim
retraction_or_correction
potential_conflict
low_extraction_confidence
ambiguous_population
ambiguous_outcome
missing_or_invalid_provenance
registry_publication_discrepancy

Deterministic explicit source facts may publish automatically with a Deterministic extraction label.

6.6 AI usage controls

Add configuration:

HEALTHSPAN_AI_ENABLED=false
HEALTHSPAN_AI_PROVIDER=openai
HEALTHSPAN_AI_MODEL=
HEALTHSPAN_AI_MAX_ITEMS_PER_RUN=20
HEALTHSPAN_AI_DAILY_REQUEST_CAP=50
HEALTHSPAN_AI_MAX_CONCURRENCY=1
HEALTHSPAN_AI_STORE=false
OPENAI_API_KEY=

Rules:

Empty model is valid while AI is disabled.

Enabling AI without a provider, model, or key fails with a clear configuration error.

No UI field for entering API keys.

No automatic paid AI backfill.

AI backfill requires an explicit CLI flag or validated local-admin action.

Enforce persisted daily request caps.

Report provider/model, request count, token usage where returned, latency, and status.

Never log the key or authorization header.

Do not store raw hidden reasoning.

Validated structured output and concise source-grounded rationale may be stored as analysis provenance.

7. Versioning, staleness, and review precedence
7.1 Immutable analysis packages

Each completed analysis package is immutable.

Its identity must include:

content item
source-record version set
input hash
ruleset version
segment-builder version
prompt/schema version
provider/model when used
analysis mode

If all relevant inputs and versions are unchanged, rerunning must not create a duplicate package.

7.2 Current intelligence state

Maintain a current-state pointer for each Live content item.

A new source-record version must:

Mark the prior current analysis stale.

Queue deterministic reassessment.

Preserve the old analysis.

Preserve human decisions.

Create a new review task when a prior human decision may no longer apply.

Never silently copy a human-reviewed result onto materially changed source text.

7.3 Precedence

For each field, current display precedence is:

valid human-reviewed decision
    ↓
validated deterministic source fact
    ↓
validated AI-assisted extraction
    ↓
unknown / not assessed

A human decision can explicitly accept, edit, reject, or mark uncertain. It cannot delete source history.

The UI must show the provenance of the displayed value.

7.4 Retraction/correction precedence

Retraction and expression-of-concern warnings override ordinary presentation.

A retracted record:

Remains discoverable for audit.

Is excluded from ordinary supportive evidence counts by default.

Displays a prominent retracted state.

Causes related current assessments to become stale.

Creates review tasks for dependent claim relationships.

Is never silently removed.

A corrected record retains links between versions and shows what changed when available.

8. Required database/schema work

Preserve all M2 data and migrations. Add forward-only Drizzle migrations.

Use text UUIDs, UTC Unix-millisecond integer timestamps, integer-backed booleans, text enums validated with Zod, explicit foreign keys, and ordinary indexes.

Do not use triggers, generated columns, custom SQLite extensions, stored procedures, FTS5, vector extensions, or filesystem paths as identifiers.

The exact physical table decomposition may be refined, but the following logical entities and semantics are required.

8.1 background_jobs

Supports ingestion and intelligence work.

Required concepts:

ID

Job kind

Status: queued, running, succeeded, partial, failed, cancelled

Priority

Validated payload JSON

Stable deduplication key

Available-at

Claimed-at

Lease-expires-at

Attempt count

Maximum attempts

Last sanitised error

Created/started/completed timestamps

Parent job ID when applicable

Related ingestion/intelligence run ID

Required indexes:

Status/available-at/priority

Lease expiration

Deduplication key

Parent job

Created timestamp

8.2 intelligence_runs

Required concepts:

ID

Trigger: automatic, manual, backfill, source_change, retraction, review, cli, test

Scope

Status

Ruleset version

AI enabled flag

Provider/model when used

Requested/completed item counts

Deterministic/AI/review-task counts

Reused/unchanged count

Warning/error counts

Started/completed timestamps

Sanitised summary

8.3 intelligence_run_items

Required concepts:

Run ID

Content item ID

Source-record version set hash

Status

Analysis ID when completed

Processing mode

Error code/message

Started/completed timestamps

8.4 intelligence_run_errors

Store:

Run/item ID

Pipeline stage

Stable error code

Sanitised message

Retryable flag

Small validated diagnostics

Timestamp

No raw prompts, keys, authorization headers, local paths, or unredacted source payloads.

8.5 evidence_text_segments

Store the structured source segments described in Section 6.2.

Required uniqueness should prevent duplicate segments for the same source version, kind, field path, and text hash.

8.6 intelligence_analyses

One immutable analysis package per unique analysis identity.

Required concepts:

ID

Content item ID

Analysis mode: deterministic, ai_assisted, human_reviewed_projection

Input/source-version-set hash

Ruleset version

Segment-builder version

Claim-schema version

Prompt version when applicable

Provider/model when applicable

Status: complete, partial, failed, stale, superseded

Classification confidence

Assessment completeness

Created timestamp

Superseded/stale timestamp

Unique analysis identity constraint

8.7 content_intelligence_state

One row per Live content item.

Required concepts:

Content item ID

Current analysis ID

Last successful analysis timestamp

Stale flag

Stale reason

Pending job ID

Last review timestamp

Updated timestamp

8.8 study_profiles

One profile per analysis.

Required concepts:

Analysis ID

Normalized study design

Evidence availability

Evidence maturity

Organism level

Population context

Sample size when explicit

Study phase when explicit

Randomization/masking/comparator fields as tri-state values

Follow-up duration/source text when explicit

Publication/source status

Results-present flag

Retraction/correction status

Extraction method and confidence

Source wording/metadata references

8.9 study_profile_outcomes

Required concepts:

Profile ID

Outcome family

Primary/secondary/exploratory role

Measure text

Timeframe text

Planned-versus-result state

Source segment/span ID

Extraction method and confidence

8.10 study_profile_signals

Required concepts:

Profile ID

Controlled methodological-signal code

State: present, absent, not_reported, not_applicable, unknown

Deterministic rule or extraction method

Source segment/span

Concise explanation

8.11 claims

One atomic, source-bound claim per analysis.

Required concepts:

ID

Analysis ID

Content item ID

Claim fingerprint

Claim kind

Assertion role

Canonical concise claim text

Direction

Subject/population text

Intervention/exposure text

Comparator text

Outcome text and family

Timeframe text

Organism/population context

Reported statistical fields only when explicit

Extraction method

Classification confidence

Review status

Active/stale state

Created timestamp

A canonical claim text must remain a faithful paraphrase. It must not be more assertive than the cited source.

8.12 claim_source_spans

Every claim requires one or more source spans.

Required concepts:

Claim ID

Segment ID

Source-record version ID

Source field path/section

Start/end offsets when meaningful

Short excerpt subject to display limits

Span hash

Primary-support flag

A claim without a valid primary span fails validation.

8.13 claim_concepts

Map claims to controlled concepts, source terms, and optional hallmark tags.

Store:

Assignment method

Confidence

Review state

Source phrase

Do not create a canonical intervention dossier.

8.14 claim_relationships

Required concepts:

Source claim ID

Target claim ID

Relationship kind

Relationship status: candidate, reviewed, rejected

Population compatibility

Intervention/exposure compatibility

Outcome compatibility

Timeframe compatibility

Detection method

Confidence

Rationale

Created/reviewed timestamps

Unique directed relationship constraint

8.15 evidence_assessments

One assessment projection per analysis.

Required concepts:

Analysis ID

Evidence maturity

Evidence availability

Assessment completeness

Classification confidence

Outcome-relevance summary

Retraction/correction state

Concise deterministic summary

“What this does not establish” summary

Assessment method/version

Created timestamp

Do not store a composite scientific score.

8.16 assessment_translation_gaps

Map assessments to controlled translation gaps.

Store:

Gap code

Rule/method

Confidence

Concise explanation

Source basis where applicable

8.17 assessment_methodological_signals

Map assessments to the relevant study-profile signals for efficient querying and history.

8.18 assessment_evidence_needs

Store the controlled “what would change the assessment” needs and deterministic explanations.

8.19 assessment_source_versions

Join each assessment to every source-record version on which it depends.

This table is the basis for staleness detection.

8.20 concepts

Controlled, versioned concept registry.

Concept types may include:

hallmark
mechanism
condition
outcome_family
source_keyword
research_topic
intervention_mention

Rules:

Stable slug

Preferred label

Aliases for matching only

Version/source

Active/deprecated state

No product dossier fields

8.21 content_item_concepts

Map content items to concepts with:

Assignment method

Confidence

Source phrase

Review state

Analysis ID

8.22 review_tasks

Required concepts:

ID

Task kind/reason

Priority

Status: open, in_review, resolved, dismissed, superseded

Content item/analysis/claim/relationship references

Machine-proposed value

Current displayed value

Source-span references

Created/updated/resolved timestamps

Stale/superseded reason

8.23 review_decisions

Immutable decision log.

Required concepts:

Review task ID

Decision: accept, edit, reject, uncertain, dismiss

Validated field patch

User reason/note

Prior and resulting value hashes

Decision timestamp

Local reviewer identity label, default owner

Source-version-set hash

A new source version never mutates an old decision.

8.24 model_runs

Required concepts:

ID

Intelligence run/item ID

Provider

Model

Task type

Prompt/schema version

Input hash

Output hash

Status

Start/end/latency

Request/token usage where returned

Estimated cost only when deterministically calculable from configured pricing; otherwise null

Validation/policy result

Sanitised error

Created timestamp

Do not store chain-of-thought. Do not store secrets. Raw provider payload storage is unnecessary; validated structured output belongs to the analysis package.

8.25 research_activity_snapshots

Required for reproducible Signal Radar history.

Store per topic/window:

Topic concept ID

Window start/end

New paper count

New/updated trial count

Results-posted count

TGA notice count

Correction/retraction count

Prior-window values

Activity percentile

Evidence-maturity category used for plotting

Linked item count

Formula version

Created timestamp

8.26 Required indexes and query checks

At minimum index:

Current/stale intelligence state

Analysis content item/input hash/version

Claim kind/assertion role/direction/review status

Claim concepts

Claim relationships

Evidence maturity/availability/organism/outcome

Translation gaps

Methodological signals

Review status/priority/created date

Model provider/model/status/date

Jobs status/availability/lease

Radar topic/window

Source-version dependency joins

Add query-plan tests or documented checks for:

Filtered Research list

Claims list

Review queue

Item intelligence detail

Potential-conflict query

Signal Radar query

Job claim query

9. Core schemas and taxonomies

All API/database boundaries must use Zod schemas from packages/core.

Required versioned schemas include:

EvidenceMaturitySchema
EvidenceAvailabilitySchema
StudyDesignSchema
OrganismLevelSchema
PopulationContextSchema
OutcomeFamilySchema
TranslationGapSchema
MethodologicalSignalSchema
ClaimKindSchema
ClaimAssertionRoleSchema
ClaimDirectionSchema
ClassificationConfidenceSchema
AssessmentCompletenessSchema
ReviewStatusSchema
ReviewDecisionSchema
ClaimRelationshipSchema
IntelligenceRunSchema
IntelligenceAnalysisSchema
EvidenceAssessmentSchema
StudyProfileSchema
ClaimSchema
ClaimSourceSpanSchema
ReviewTaskSchema
ModelRunSchema
ResearchActivityPointSchema

Rules:

No unvalidated arbitrary strings at API or persistence boundaries.

Preserve an unknown/other route where source variation demands it.

Every taxonomy has a human-readable label and methodology definition.

Taxonomy/ruleset versions are surfaced in provenance.

Demo V1 types may remain for backward compatibility, but Live mode must use a clearly named V2 evidence model.

Do not silently reinterpret old Demo fields as Live V2 fields.

10. Package requirements
10.1 packages/core

Add:

Live V2 evidence and claim schemas

Controlled taxonomies and labels

API request/response schemas

Version/provenance types

Review and model-run schemas

Job schemas

Pure identifier/fingerprint helpers where source-independent

Keep it free of:

Database drivers

Network calls

Provider SDKs

React

10.2 packages/db

Add:

Forward-only M3 migrations

Repository interfaces and implementations for all M3 logical entities

Background-job repository and lease logic

Server-side filter/sort/pagination query builders

Transactional current-analysis pointer updates

Staleness queries

Review-decision persistence

Research-activity snapshot persistence

Database doctor checks for orphan claims/spans/dependencies/jobs

Keep scientific rules out of this package.

10.3 packages/connectors

Permitted work:

Expose richer normalized sections already present in M2 source responses

Parse structured PubMed abstract sections

Parse explicit ClinicalTrials.gov results structures

Preserve source field paths needed for provenance

Expose TGA descriptions and Crossref relations cleanly

Reprocess existing raw snapshots after parser-version changes

Not permitted:

New external sources

Full-text scraping

AI calls

Scientific assessment

Canonical intervention resolution

10.4 packages/intelligence

This becomes the main Milestone 3 domain package.

Recommended structure:

packages/intelligence/src/
├─ inputs/
├─ segments/
├─ study-profile/
├─ claims/
├─ evidence/
├─ relationships/
├─ activity/
├─ review/
├─ providers/
│  ├─ disabled/
│  ├─ fixture/
│  └─ openai/
├─ prompts/
├─ policy/
├─ evaluation/
├─ pipeline/
└─ index.ts

Responsibilities:

Pure deterministic extraction/classification functions

Ruleset IDs and versions

Segment building

Claim fingerprinting

Evidence maturity and availability rules

Translation gaps

Methodological signals

“What would change the assessment”

Conservative relationship candidates

Research-activity formula

Provider-neutral AI contract

Prompt/schema definitions

Output validation and policy guard

Evaluation harness

Design functions so most tests run without a database or network.

10.5 apps/api

Add:

Application services for content, intelligence, reviews, jobs, radar, and methodology

Worker lifecycle

Scheduler integration

Intelligence orchestration

Local-admin mutation guard

Provider configuration

API routes

Safe health/diagnostics

Structured sanitised logging

Graceful startup/shutdown

Routes should depend on services, not issue broad table reads directly.

10.6 apps/web

Add:

Evidence-profile components

Claim cards and provenance views

Research filters

Trial result-availability distinction

Assessment history

Potential-conflict view

Review Queue

Intelligence status and run UI

Research-activity Signal Radar

Expanded Methodology pages

AI disclosure and provenance

Honest not-assessed/stale/error states

Mobile layouts

Demo regression preservation

10.7 packages/ui

Extract reusable presentation primitives when useful:

EvidenceMaturityBadge
EvidenceAvailabilityBadge
ClaimRoleBadge
OutcomeFamilyBadge
TranslationGapList
MethodologicalSignalList
ProvenancePanel
ReviewStatusBadge
RetractionWarning
ClassificationConfidenceBadge
AssessmentHistoryTimeline

Do not over-generalize components that are specific to one screen.

11. Evidence and claim processing rules
11.1 Paper processing

For PubMed/Crossref-linked papers:

Use title and available abstract sections.

Separate abstract background/objective/methods/results/conclusions when source structure permits.

Derive explicit publication types from source metadata.

Preserve correction/retraction/update relationships.

Extract claim candidates primarily from result and conclusion sections.

Background/objective statements remain labelled accordingly.

Do not infer a result from the title alone when the abstract contradicts or qualifies it.

Do not retrieve article body text.

Show an abstract-only assessment signal when appropriate.

A systematic review or meta-analysis label comes from explicit publication metadata/text, not model assumption.

Preprint status remains unknown unless explicitly available.

Funding/conflict absence means not reported/available, not no conflict.

11.2 Clinical-trial processing

For ClinicalTrials.gov records:

Keep design and results availability separate.

Planned outcome definitions are not findings.

Extract registry-result claims only from explicit posted-results structures.

Record recruitment/status changes as source facts.

A completed trial without results receives completed_no_results.

A terminated trial does not automatically imply harm or inefficacy; preserve why-stopped text when explicit.

Results-posted state must be traceable to the source version.

Trial intervention names remain source text.

If a linked publication is available through exact identifiers, relate the records but do not assume all publication claims exactly correspond to every registered outcome.

Surface potential registry/publication discrepancies conservatively and create review tasks.

11.3 TGA processing

For TGA RSS records:

Treat the title and description as regulatory statements.

Preserve feed category.

Do not infer causation or severity beyond source wording.

Do not infer ARTG status or approval.

Create harm/safety or regulatory claims only when explicit.

Display source-policy caveats.

TGA notices can add a visible safety/regulatory outline to a research topic, but they do not become a numerical safety score.

11.4 Crossref processing

Crossref may add:

Correction/retraction/update relationships

Funding

Licence

Publisher/container

ORCID/ROR

Publication type metadata

It must not create a second paper when an exact DOI match already exists.

11.5 Source text display limits

Use concise source excerpts for claim evidence.

A displayed claim excerpt should normally be no more than 25 consecutive source words.

Link to the official source.

Respect source/licence policy.

Do not expose full raw snapshots.

Internal analysis segments may contain the source-provided abstract/registry text already lawfully ingested under the documented source policy; browser display remains bounded and attributed.

12. Review workflow
12.1 Review Queue

Add a dedicated Live-mode Review Queue.

Filters:

priority
reason
source
content type
claim kind
review status
AI-assisted/deterministic
retraction/correction
date

Each task must show:

Proposed value/claim

Current value

Source span

Source link

Analysis and source-version provenance

Reason it needs review

Accept/edit/reject/uncertain/dismiss actions

Decision note

Consequences of the decision

12.2 Review actions

All writes are validated and audited.

accept: publish the proposed value as human-reviewed.

edit: publish a validated edited value.

reject: prevent the proposal from being current.

uncertain: preserve but label unresolved.

dismiss: close a non-substantive task without endorsing the proposal.

A review decision must not alter raw source data.

12.3 Stale reviews

When a source changes materially:

Preserve the earlier decision.

Mark the corresponding projection stale.

Create a new task if the changed source affects the reviewed field.

Explain why rereview is needed.

Do not silently reuse a prior human decision.

13. Research-activity Signal Radar

Replace the Live-mode placeholder/fabricated radar with a transparent research-activity view.

13.1 Axes and encodings

Use:

X-axis: categorical evidence maturity
Y-axis: research activity percentile or clearly documented activity change
Bubble size: linked evidence-item count in the selected window
Outline/marker: explicit TGA notice or correction/retraction presence

Rules:

Show raw counts in the tooltip.

Label the Y-axis Research activity, not attention or importance.

Explain that activity is not truth, efficacy, or popularity.

Do not combine social-media metrics; those arrive in M5.

Do not fabricate a point when the topic lacks enough records.

A topic’s X position must be derived from its linked, non-retracted evidence and a documented aggregation rule.

Retractions are excluded from supportive maturity aggregation but remain visible as warnings.

Ties and missing values are handled deterministically.

13.2 Topic construction

Use controlled concepts:

Hallmarks

Conditions

Mechanisms

Outcome families

Source-derived research topics

Intervention mentions only as mentions, not dossiers

Require a documented minimum evidence count, unless an explicit TGA notice makes the topic important to display.

13.3 Formula

Version the formula.

At minimum expose:

Current 30-day item count

Previous 30-day item count

Current 30-day material-change count

Results-posted count

Correction/retraction count

Activity percentile among eligible topics

Formula version

The exact weighting is delegated, but it must be simple, documented, tested, and inspectable. Do not use an opaque model score.

14. API requirements

Retain the M2 response envelope and strict Live/Demo separation.

All list endpoints require server-side pagination and validated filters.

14.1 Intelligence status and runs
GET  /api/intelligence/status
GET  /api/intelligence/runs
GET  /api/intelligence/runs/:id
POST /api/intelligence/runs
POST /api/items/:id/reassess

Suggested run body:

{
  "scope": "stale",
  "itemIds": [],
  "includeAi": false,
  "force": false,
  "maxItems": 100
}

Rules:

Mutation routes use the local-admin guard.

Return 202 Accepted.

includeAi defaults false.

Paid AI requires AI enabled plus explicit request.

Reject unknown item IDs and invalid scopes.

Report queued, running, partial, failed, and complete states.

14.2 Item evidence and history
GET /api/items/:id/intelligence
GET /api/items/:id/assessment
GET /api/items/:id/assessment/history
GET /api/items/:id/claims
GET /api/items/:id/source-segments

Source-segment output must respect display limits and never return raw snapshots.

14.3 Evidence/claim lists
GET /api/assessments
GET /api/claims
GET /api/claims/:id
GET /api/claim-relationships

Filters should include, where applicable:

content type
source
study design
organism
population context
evidence maturity
evidence availability
outcome family
translation gap
methodological signal
claim kind
assertion role
direction
review status
retracted/corrected
date range
has claims
has potential conflict
14.4 Review API
GET   /api/review-tasks
GET   /api/review-tasks/:id
PATCH /api/review-tasks/:id
POST  /api/review-tasks/:id/resolve
GET   /api/review-decisions

Review writes require:

Local-admin guard

Zod validation

Source-version concurrency check

Audit record

Clear conflict response if the task became stale

14.5 Radar and methodology
GET /api/signal-radar
GET /api/methodology/evidence-model
GET /api/methodology/rulesets
GET /api/methodology/ai-provenance

The methodology response should expose definitions and versions, not internal secrets or prompt text that would weaken safety boundaries.

14.6 Jobs and scheduler
GET /api/jobs
GET /api/jobs/:id
GET /api/scheduler/status

Administrative cancellation/retry may be added if safely implemented:

POST /api/jobs/:id/cancel
POST /api/jobs/:id/retry

These are local-admin mutations.

14.7 Response metadata

Include where relevant:

{
  dataMode: "live" | "demo";
  generatedAt: string;
  partial: boolean;
  stale?: boolean;
  rulesetVersion?: string;
  analysisVersion?: string;
  sourceVersionIds?: string[];
  extractionMethod?: "deterministic" | "ai_assisted" | "human_reviewed";
  provider?: string;
  model?: string;
}

Never return:

API keys

Raw provider prompts containing source text

Hidden reasoning

Full raw model response

Full raw source snapshots

Exact local filesystem paths

Raw error stacks

15. UI requirements

Preserve the visual quality and responsive behaviour of M1/M2.

15.1 Live Today

Add:

Intelligence processing status

“What changed” intelligence events, excluding baseline backfill

Recently assessed records

Retraction/correction alerts

Trial-results-posted events

Research-activity Signal Radar

Open review-task count

Honest partial/stale state

Do not imply that recently analyzed means scientifically new.

15.2 Research list

Add filters and columns/badges for:

Study design

Organism

Evidence maturity

Evidence availability

Outcome family

Retraction/correction state

Assessment status

Claim count

Potential-conflict state

Default sort remains recency or user-selected, not an opaque “best” ranking.

15.3 Paper detail

Add sections:

Evidence profile
What the source reports
Atomic claims
Outcome relevance
Translation gaps
Methodological signals
What this does not establish
What evidence would change the assessment
Funding/conflict information when supplied
Related and potentially conflicting claims
Corrections/retractions
Assessment provenance
Assessment history
Review state

Every claim card shows:

Assertion role

Direction

Source span

Official source link

Extraction method

Classification confidence

Review status

15.4 Trial detail

Make the distinction visually unavoidable:

Study design
Trial status
Results availability
Reported results
Planned outcomes

A protocol-only randomized trial must not receive a reported-benefit claim.

Show:

Trial design profile

Phase, enrollment, masking, allocation, comparator

Planned outcomes separately

Posted registry results separately

Status/change history

Australian sites

Assessment provenance and history

Potential publication links

Registry/publication discrepancy tasks where detected

15.5 TGA detail

Show:

Regulatory statement

Feed category

Source wording

Claim kind

Related topic mentions

Source and detection dates

TGA caveat

No inferred causation

No inferred approval status

15.6 Claims workspace

Add a Live-mode Claims page with:

Atomic claims

Filters

Source type

Role

Kind

Direction

Organism/population

Outcome

Evidence maturity

Review state

Potential conflicts

Source link and span

A claim detail page/drawer should show relationships and provenance.

15.7 Review Queue

Implement the workflow in Section 12 with desktop and mobile layouts.

15.8 Methodology

Expand Methodology with:

Evidence-maturity definitions

Results-availability definitions

Study-design taxonomy

Outcome taxonomy

Translation gaps

Methodological signals

Claim roles and kinds

Relationship policy

Retraction/correction policy

Research-activity formula

AI use, limitations, and provenance

Human-review precedence

Explicit statement that the product is informational and not medical advice

Explicit statement that no current record predicts personal lifespan

15.9 Honest states

Support:

not assessed
analysis queued
analysis running
partial analysis
AI disabled
AI provider error
needs review
human reviewed
stale after source update
retracted
corrected
insufficient source text

Do not replace missing intelligence with Demo data in Live mode.

15.10 Demo mode

Preserve all M1 Demo functionality.

Do not silently convert demo assessments into the Live V2 schema.

Keep Demo labels conspicuous.

Mode-specific IDs/preferences remain separated.

All existing Demo E2E coverage remains green.

16. Intelligence and job commands

Add Windows-safe root scripts:

pnpm intelligence:backfill
pnpm intelligence:run -- --item <content-item-id>
pnpm intelligence:reassess -- --stale
pnpm intelligence:status
pnpm intelligence:doctor
pnpm intelligence:eval
pnpm jobs:status
pnpm test:intelligence:live

Rules:

intelligence:backfill is deterministic-only by default.

AI use requires an explicit flag such as:

--allow-ai

intelligence:reassess -- --stale processes only stale/currently unassessed records unless --force is given.

intelligence:doctor checks provenance, orphan spans, stale pointers, unresolved source-version dependencies, and job leases.

intelligence:eval runs the committed offline evaluation corpus.

test:intelligence:live is opt-in and excluded from default gates.

Existing M2 commands remain functional.

17. Environment configuration

Add to .env.example without secrets:

# Evidence intelligence
HEALTHSPAN_INTELLIGENCE_AUTO_RUN=true
HEALTHSPAN_INTELLIGENCE_RULESET=evidence-rules-v1
HEALTHSPAN_INTELLIGENCE_MAX_ITEMS_PER_JOB=100
HEALTHSPAN_INTELLIGENCE_JOB_LEASE_SECONDS=300

# Optional AI
HEALTHSPAN_AI_ENABLED=false
HEALTHSPAN_AI_PROVIDER=openai
HEALTHSPAN_AI_MODEL=
HEALTHSPAN_AI_MAX_ITEMS_PER_RUN=20
HEALTHSPAN_AI_DAILY_REQUEST_CAP=50
HEALTHSPAN_AI_MAX_CONCURRENCY=1
HEALTHSPAN_AI_STORE=false
OPENAI_API_KEY=

# Existing local scheduler
HEALTHSPAN_SCHEDULER_ENABLED=true
HEALTHSPAN_REFRESH_CRON=0 6 * * *
HEALTHSPAN_TIME_ZONE=Australia/Brisbane
HEALTHSPAN_STARTUP_CATCHUP_ENABLED=true
HEALTHSPAN_STALE_AFTER_HOURS=24

# Local administration boundary
HEALTHSPAN_ALLOW_REMOTE_ADMIN=false

Validate configuration at startup.

Rules:

AI disabled is a normal healthy state.

AI enabled with missing/invalid configuration is a clear startup or provider-status error, not silent fallback.

A provider outage does not make deterministic intelligence unavailable.

Never print secrets during configuration validation.

18. Offline evaluation corpus

Create a committed, licence-safe evaluation corpus of at least 72 small synthetic or minimally quoted/reduced cases.

Coverage must include:

In-vitro/ex-vivo studies

Animal studies

Human observational studies

Single-arm human intervention studies

Controlled/randomized human trials

Protocol-only and ongoing trial records

Completed trials without results

Registry results

Systematic reviews/meta-analyses

Regulatory statements

Null findings

Harm/safety findings

Biomarker-only outcomes

Functional/clinical outcomes

Mixed results

Correction and retraction relationships

Missing metadata

Conflicting or ambiguous language

Prompt-injection-like source text

Human/animal species ambiguity

Disease-population versus generally healthy population

Short versus durable follow-up

Funding/conflict fields present and absent

Also include at least 16 claim-pair fixtures for:

duplicate/paraphrase
supports
qualifies
potentially conflicts
not comparable
explicit update/correction
18.1 Deterministic evaluation gates

The committed deterministic corpus must achieve:

100% schema-valid output

100% source-span resolution

100% correct protocol-versus-result separation on unambiguous fixtures

100% correct human-versus-animal separation on unambiguous fixtures

100% retraction/correction warning propagation

Zero Live composite truth scores

Zero uncited published claims

Zero planned outcomes classified as observed efficacy results

Zero regulatory/guideline maturity stages assigned by M3 rules

Idempotent repeat analysis

Document all expected labels in fixture manifests.

18.2 Optional AI evaluation

AI evaluation is not required for a default install and must not block completion when no provider credentials exist.

When credentials are intentionally supplied:

Use a bounded subset.

Record date, provider, model, prompt/schema version, item count, token usage, latency, and errors.

Measure exact structured-field accuracy, claim precision/recall, and provenance validity.

Do not weaken deterministic gates because AI output is variable.

Do not commit provider responses containing excessive source text.

Do not commit secrets.

The fixture provider must achieve 100% schema and policy compliance in automated tests.

19. Testing requirements

All default tests are network-independent and deterministic.

19.1 M2 closure tests

Cover:

Path redaction

Loopback/non-loopback admin guard

Source-scoped baselines

New TGA feed baseline after other sources are live

Persisted job claim/lease/recovery

Duplicate-job coalescing

Scheduler next-run calculation in Australia/Brisbane

Startup catch-up

No overlapping full refresh

Server-side pagination and bounded queries

Migration of an M2-shaped database

19.2 Schema/repository tests

Cover:

Forward migration

Repeated migration

M2 data preservation

Analysis identity uniqueness

Claims require valid spans

Current-analysis pointer transaction

Staleness after source-version change

Review-decision immutability

Human decision precedence

Job lease recovery

Model-run redaction

Research-activity snapshots

Foreign-key integrity

Intelligence doctor checks

No Demo/Live mixing

19.3 Deterministic intelligence tests

Cover every taxonomy and rule:

Study design

Results availability

Maturity

Organism/population

Outcomes

Translation gaps

Methodological signals

Evidence needs

Claim roles/kinds/direction

Retraction/correction

Relationship candidate rules

Radar formula

Unknown/not-reported handling

Rule-version provenance

19.4 Claim safety tests

Required adversarial cases:

“The study aims to prove X” must remain objective/hypothesis.

“Primary outcome will measure X” must remain planned.

Animal lifespan extension must not become human lifespan extension.

Biomarker reduction must not become demonstrated slower ageing.

Association must not become causation.

TGA warning must not become proof of causal harm unless source wording supports it.

“No significant difference” must not become benefit.

Mixed endpoint results must not become uniformly positive.

Source text containing “ignore previous instructions” must be treated as data.

Missing comparator must not be invented.

Missing conflict statement must not become “no conflicts.”

Retraction must override ordinary supportive display.

19.5 AI adapter tests

Using the fixture/fake transport:

Structured-output validation

Invalid JSON/schema failure

Unsupported enum rejection

Missing provenance rejection

Source prompt-injection containment

Retry/timeout behaviour

Daily cap

Concurrency cap

AI-disabled path

Missing model/key configuration

Provider failure with deterministic fallback

Secret redaction

store disabled request option

No tool access

Model-run audit metadata

No hidden-reasoning field

No default test calls OpenAI.

19.6 API tests

Cover:

All new endpoints

Pagination/filter validation

202 run semantics

Job status

Review concurrency conflict

Stale assessments

Retraction state

Safe response metadata

No raw snapshots

No full prompts/provider payloads

No local paths

Local-admin guard

Live/Demo separation

19.7 UI/E2E tests

Desktop and mobile coverage:

Live unassessed state

Intelligence backfill/queued/running/complete

Research filters

Paper evidence profile and claim provenance

Protocol-only trial without efficacy finding

Trial with posted results

Retraction warning

Claim relationship/potential conflict

Review accept/edit/reject flow

Stale review after source update

Research-activity radar tooltip/methodology

AI-disabled state

AI-assisted unreviewed badge through fixtures

Human-reviewed state

Demo regression

Accessibility checks for new controls and status badges

19.8 Quality gates

At completion all must pass:

pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm intelligence:eval
pnpm intelligence:doctor
pnpm db:doctor

Report exact test counts and skipped tests.

20. Security, privacy, and source-integrity requirements

No personal health information.

No medications, diagnoses, labs, or supplement-dose tracking.

No API keys in UI, database diagnostics, logs, screenshots, or completion reports.

No exact local path in browser APIs.

Administrative writes are local-only by default.

Source text is untrusted data.

AI has no tools and receives only minimal public-source segments.

No chain-of-thought storage.

No model training/fine-tuning using user data.

No hidden network calls in default tests.

No full-text scraping.

No bypass of paywalls.

No vendor links, purchasing, sourcing, or dosing.

No medical recommendations.

Every Live claim has source provenance.

Every machine-generated label exposes its method/version.

Corrections and retractions remain visible.

Human review history is immutable.

Raw snapshots remain private to the local storage layer.

Source and retrieval timestamps remain distinct.

21. Performance and reliability targets

On a typical local Windows development machine:

Ordinary paginated list responses should target p95 under 500 ms for a local data set of 25,000 content items and 100,000 claims.

Item intelligence detail should target p95 under 750 ms.

The browser must not render thousands of rows at once.

Deterministic analysis should process in bounded batches.

A single malformed item must not fail the whole job.

Provider failure must not block deterministic results.

Job retries must be bounded.

Stale leases must recover after restart.

Reanalysis of unchanged inputs must reuse the existing immutable package.

UI remains usable while jobs run.

Create generated test data for query/performance checks; do not commit a large database.

22. Documentation and ADR requirements

Create or update:

README.md
AGENTS.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/SOURCE_POLICY.md
docs/PRIVACY_BOUNDARIES.md
docs/ROADMAP.md
docs/DECISIONS.md
docs/milestones/M2.md
docs/milestones/M3.md
docs/milestones/M3_COMPLETION_REPORT.md

Add methodology documentation:

docs/methodology/EVIDENCE_MODEL.md
docs/methodology/CLAIM_MODEL.md
docs/methodology/METHODOLOGICAL_SIGNALS.md
docs/methodology/TRANSLATION_GAPS.md
docs/methodology/RESEARCH_ACTIVITY.md
docs/methodology/AI_PROVENANCE.md
docs/methodology/HUMAN_REVIEW.md
docs/methodology/EVALUATION.md

Add ADRs using the next available numbers for:

Independent Live V2 evidence dimensions and rejection of a composite score

Source-bound, versioned claims and exact provenance

Immutable analysis packages and source-version staleness

Deterministic-first optional provider-neutral AI

Human-review precedence and immutable decisions

Research activity versus social attention

Persisted local job queue and scheduler

Local-admin mutation boundary and browser path redaction

Documentation must state:

M1 and M2 are complete.

M3 is the current milestone.

M4 remains future work.

Live evidence labels do not constitute medical advice.

Maturity is not efficacy or safety.

Protocols are not results.

Classification confidence is not evidence confidence.

Research activity is not popularity or truth.

AI is optional and off by default.

Every AI-assisted output is labelled and source-grounded.

Formal GRADE/risk-of-bias assessment is not implemented.

Current limitations and unsupported source types.

Save this execution brief into the repository as:

docs/milestones/M3_EXECUTION_BRIEF.md

Preserve its controlling decisions. Implementation notes may be added, but do not silently edit away requirements.

23. What must NOT be done in Milestone 3

Do not implement:

Canonical intervention dossiers

Canonical peptide dossiers

Peptide sourcing, vendors, prices, purchasing, or dosing

Intervention comparisons or recommendations

ARTG integration

FDA/openFDA integration

Adverse-event database signal analysis

ANZCTR or other new registry connectors

Guideline ingestion

Approval-by-indication modelling

Creator profiles

YouTube ingestion

X/Twitter ingestion

Social attention metrics

Creator trust scores

Podcasts

Personal supplement tracking

Medication tracking

Lab or wearable imports

Personal-health correlations

Medical advice

Treatment-change suggestions

Personal lifespan forecasts

Authentication or multi-user accounts

Public/community submissions

ChatGPT Sites deployment

D1 or R2 adapters

Wrangler or Cloudflare packages

Hosted scheduling

Vector database or embedding search

Paywalled or article-body scraping

Model fine-tuning

Autonomous web research by the model

A single composite evidence/truth/longevity score

Automatic claim synthesis presented as scientific consensus

Formal GRADE, Cochrane risk-of-bias, or clinical recommendations

Milestone 4 work of any kind

Do not weaken deterministic tests to accommodate variable AI output.

24. Acceptance criteria checklist

Milestone 3 is complete only when every applicable item is checked and evidenced in the completion report.

A. Base and M2 closure

A1. Work is based on commit 4a39a1c.

A2. Work is on milestone-3/evidence-claim-intelligence.

A3. Browser APIs no longer expose exact local database/data/raw paths.

A4. pnpm data:path still reports exact local paths in the terminal.

A5. One shared guard protects all administrative mutation routes.

A6. Non-loopback mutation access is disabled unless explicitly overridden.

A7. Source/feed baseline state is independent and migration-safe.

A8. Persisted queued jobs return 202 semantics and recover after restart.

A9. Duplicate equivalent jobs are coalesced/rejected.

A10. The real Australia/Brisbane scheduler and startup catch-up are implemented.

A11. Principal list/search routes use server-side pagination and bounded queries.

A12. Route handlers use service/repository boundaries.

A13. README, roadmap, M2 status, architecture, and data-model docs are current.

B. Schema and provenance

B1. Forward-only M3 migrations preserve M2 data.

B2. All required intelligence/job/review/model entities are implemented or equivalently mapped with documented rationale.

B3. Every current Live claim has a valid primary source span.

B4. Every assessment identifies all source-record versions it depends on.

B5. Analysis identity includes input and pipeline versions.

B6. Identical reanalysis reuses the existing immutable analysis.

B7. A material source change marks dependent intelligence stale.

B8. Prior analyses and review decisions remain historically available.

B9. No composite scientific score is persisted for Live intelligence.

B10. pnpm intelligence:doctor detects orphaned or inconsistent intelligence data.

C. Deterministic evidence model

C1. Study-design normalization is implemented and versioned.

C2. Evidence availability is separate from study design/maturity.

C3. Evidence maturity follows the fixed categorical ladder.

C4. Organism and population context are explicit and can be unknown.

C5. Outcome families are multi-valued and source-grounded.

C6. Translation gaps use the controlled taxonomy.

C7. Methodological signals are explicit and are not presented as formal risk-of-bias.

C8. Classification confidence is labelled separately from scientific confidence.

C9. Assessment completeness is implemented.

C10. “What would change the assessment” is deterministic and explainable.

C11. Hallmark tags are labelled as potential relationships, with method/confidence.

C12. Protocol-only trials cannot produce observed efficacy findings.

C13. Animal/cell findings cannot be displayed as human evidence.

C14. Biomarker changes cannot be presented as demonstrated lifespan extension.

C15. Retractions/corrections override ordinary presentation and trigger reassessment.

D. Claims and relationships

D1. Atomic claim extraction supports the fixed roles, kinds, and directions.

D2. Claim wording never exceeds the cited source’s assertion.

D3. Planned outcomes and objectives remain distinguishable from findings.

D4. Claim provenance includes source object/version, section/field, and span.

D5. Claim fingerprints prevent duplicate claims on identical input.

D6. Potential conflict detection records comparability dimensions.

D7. Automated disagreement is labelled potentially_conflicts, not definitive contradiction.

D8. Human review can accept, edit, reject, mark uncertain, or dismiss.

D9. Review decisions are immutable and version-scoped.

D10. A source update can make a previous review stale without deleting it.

E. Optional AI

E1. AI is disabled by default.

E2. Provider-neutral, disabled, fixture, and OpenAI Responses adapters exist.

E3. OpenAI output is schema-constrained and storage is disabled.

E4. No permanent hard-coded model default is required when AI is disabled.

E5. AI receives only minimal public-source segments.

E6. Source text is isolated as untrusted data and model tools are disabled.

E7. AI cannot write directly to persistence.

E8. Invalid or uncited output fails policy validation.

E9. Provider failure leaves deterministic intelligence usable.

E10. Daily/request/concurrency caps are enforced.

E11. Secrets and hidden reasoning are not stored or logged.

E12. AI-assisted Live output is visibly labelled and carries provider/model provenance.

E13. High-impact AI-assisted cases create review tasks.

E14. Default automated tests make no OpenAI calls.

F. API and UI

F1. Intelligence run/status/item/history APIs are implemented and validated.

F2. Assessment and claim lists support server-side filters/pagination.

F3. Review APIs enforce local-admin and source-version concurrency rules.

F4. Live Today shows intelligence status and non-baseline intelligence changes.

F5. Live Research displays evidence profiles without fabricated scores.

F6. Paper detail shows claims, gaps, signals, provenance, and history.

F7. Trial detail visibly separates planned design, status, and posted results.

F8. TGA detail preserves source wording and causal caveats.

F9. Claims workspace and claim provenance view are implemented.

F10. Review Queue works on desktop and mobile.

F11. Retraction/correction and stale states are prominent.

F12. Methodology explains all taxonomies, formulae, AI, and limitations.

F13. Live missing intelligence uses honest not-assessed states.

F14. Demo mode remains fully functional and separate.

F15. Accessibility checks cover new controls, badges, dialogs, and charts.

G. Research activity

G1. Live Signal Radar uses evidence maturity and transparent research activity.

G2. Activity is not labelled social attention, truth, or efficacy.

G3. Tooltips expose raw counts and formula version.

G4. Retractions are excluded from supportive maturity aggregation but remain warned.

G5. TGA/correction signals use visible markers rather than a hidden score.

G6. Insufficient-data topics are omitted or shown honestly.

G7. Research activity snapshots are reproducible and versioned.

H. Evaluation, security, and quality

H1. The committed offline corpus contains at least 72 cases.

H2. At least 16 claim-pair relationship cases are included.

H3. All deterministic evaluation gates in Section 18.1 pass.

H4. Prompt-injection-like source text is safely treated as data.

H5. No new external source connector or full-text scraper was added.

H6. No personal-health data or medical recommendation feature was added.

H7. No secret, raw database, raw live snapshot, or provider response is committed.

H8. pnpm lint passes with zero warnings.

H9. pnpm typecheck passes.

H10. pnpm test passes.

H11. pnpm test:e2e passes for desktop and mobile.

H12. pnpm build passes.

H13. pnpm intelligence:eval passes.

H14. pnpm intelligence:doctor passes.

H15. pnpm db:doctor passes.

H16. Documentation and ADRs match implementation.

H17. M3 screenshots and completion report are committed.

H18. The branch is pushed and the final commit hash is reported.

H19. No Milestone 4 work has begun.

25. Required completion report

Create and commit:

docs/milestones/M3_COMPLETION_REPORT.md

It must contain:

Executive summary

Base commit, working branch, and final commit hash

One-row-per-acceptance-criterion checklist

Mandatory M2 closure-item results

Significant file-tree changes

Migration versions and schema summary

Package-boundary changes

Background-job and scheduler design

Evidence model and taxonomy versions

Claim model and provenance design

Retraction/correction/staleness behaviour

Review precedence and audit design

Deterministic pipeline summary

Optional AI architecture

Provider/model configuration and privacy controls

AI request/cost-cap behaviour

Offline evaluation-corpus composition

Exact deterministic evaluation results

Optional dated live-AI evaluation, if intentionally performed

Idempotency/reuse test result

Source-update/reassessment test result

Protocol-versus-result safety test result

Human-versus-animal safety test result

Prompt-injection containment test result

Query-plan and performance checks

API route summary

UI/page summary

Security, privacy, source-policy, and copyright observations

Exact commands run and results

Lint result

Type-check result

Unit/integration test counts

E2E projects, passes, skips, and failures

Production build result

Database and intelligence doctor results

Screenshots of:

Live Today with research-activity radar

Intelligence job/status UI

Filtered Live Research list

Paper evidence profile

Atomic claim with provenance

Protocol-only trial separation

Trial with posted results

Retraction/correction warning

Potential-conflict relationship

Review Queue

Human-reviewed decision

Methodology and AI disclosure

Demo regression

Mobile evidence/review view

Known issues and technical debt

Deviations from this brief and rationale

Genuine decisions required before Milestone 4

Explicit statement that Milestone 4 has not begun

Do not claim an optional live-AI test occurred unless credentials were intentionally supplied and the report contains the actual dated result.

26. Consult the project manager early only when

Commit 4a39a1c is unavailable or the repository history materially differs.

A forward migration would destroy or silently rewrite M2 data.

An official source changed so materially that exact provenance cannot be preserved.

Current source terms appear to prohibit the planned local processing.

The OpenAI Responses API cannot support the required schema-constrained, non-stored workflow after checking current official documentation.

A paid credential becomes indispensable for deterministic Milestone 3 functionality.

A privacy or security boundary would be weakened.

Two acceptance criteria are genuinely incompatible.

A required capability remains technically impossible after documented attempts.

A proposed fix requires starting Milestone 4 scope.

Do not consult for:

Routine package additions

Migration file organization

Repository/service class names

UI component layout

Test-fixture wording

Rule module organization

Prompt wording within the fixed safety policy

Ordinary performance tuning

Recoverable bugs

Refactors

Visual polish

Documentation phrasing

27. Stop conditions

After all Milestone 3 acceptance criteria pass:

Commit all implementation, tests, migrations, docs, ADRs, screenshots, evaluation corpus, and completion report.

Push:

milestone-3/evidence-claim-intelligence

Report:

Final commit hash

Exact quality-gate results

Completion-report path

Any genuine decisions required before M4

Stop.

Do not:

Merge to main

Create a Milestone 4 branch

Add canonical intervention or peptide models

Add ARTG/FDA/new sources

Start creator/social work

Start hosted deployment

Start personal-health tracking

Wait for the next project-manager brief.

28. Authorised start message

AUTHORISED TO BEGIN: Start Healthspan Dashboard Milestone 3 from commit 4a39a1c and create milestone-3/evidence-claim-intelligence. First complete the mandatory M2 closure items, then implement the deterministic-first, source-grounded, versioned evidence and claim intelligence system defined in this brief. Preserve strict Live/Demo separation; treat protocols as plans rather than results; keep evidence maturity, methodological signals, outcome relevance, translation gaps, research activity, and classification confidence as independent dimensions; require exact provenance for every Live claim; keep AI optional and disabled by default; and do not implement any Milestone 4 functionality. When every acceptance criterion and quality gate passes, push the branch, commit docs/milestones/M3_COMPLETION_REPORT.md, report the final commit hash and exact results, and stop before Milestone 4.