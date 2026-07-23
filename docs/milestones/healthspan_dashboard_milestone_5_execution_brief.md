# Healthspan Dashboard — Milestone 5 Execution Brief

**Milestone:** 5 — Creator, YouTube & X Claim Intelligence  
**Issued:** 24 July 2026  
**Project manager:** ChatGPT  
**Execution agent:** Grok 4.5 in Cursor  
**Repository:** `Smellybum1/Healthspan-Dashboard`  
**Base branch:** `milestone-4/interventions-peptides-regulation`  
**Exact base commit:** `f809ffbbcb39a5d2fd50a9a2beb18a329f488233`  
**Working branch:** `milestone-5/creator-social-intelligence`  
**Status:** **AUTHORISED TO BEGIN**  
**Stop point:** Complete Milestone 5, push the working branch, submit the required completion report, and **stop before Milestone 6**. Do not merge to `main` unless the project owner separately instructs you to do so. Do not create a Milestone 6 branch.

---

# 1. Controlling instruction

Begin Healthspan Dashboard Milestone 5 from the exact final Milestone 4 branch head:

```text
f809ffbbcb39a5d2fd50a9a2beb18a329f488233
```

Create and work on:

```text
milestone-5/creator-social-intelligence
```

Recommended start sequence:

```bash
git fetch origin
git switch --create milestone-5/creator-social-intelligence f809ffbbcb39a5d2fd50a9a2beb18a329f488233
```

If the working branch already exists locally, verify that its starting tree contains the exact base commit and that no Milestone 6 work is present.

Milestone 5 must:

1. Complete the bounded Milestone 4 follow-ups in Section 5.
2. Add a curated, source-grounded creator intelligence layer.
3. Add a compliant YouTube metadata connector for explicitly monitored channels.
4. Add an optional, paid, budget-capped X connector for explicitly monitored accounts.
5. Add user-supplied and authorised transcript/document ingestion for claim extraction without unofficial caption scraping.
6. Create atomic creator claims with exact provenance.
7. Link creator claims to M3 scientific claims and assessments, M4 intervention dossiers, trials, regulatory assertions, and safety items.
8. Assess creator **claims**, not creator worth, using independent, reviewable alignment dimensions.
9. Add creator profiles, disclosure/correction history, a Creator Claims workspace, a Review Queue, and a monitored-claim recurrence view.
10. Preserve Live/Demo separation, all M1–M4 data, source versioning, queued jobs, append-only reviews, local-admin guards, source health, and the Brisbane scheduler.
11. Make platform retention, deletion, quota, budget, and compliance obligations executable and testable.
12. Keep optional AI disabled by default and prohibit external AI processing of X content or platform API metadata.
13. Complete every acceptance criterion, push the branch, commit the completion report, report the final commit hash and exact quality-gate results, and stop before Milestone 6.

Routine implementation decisions are delegated to Grok. Do not pause for approval over ordinary dependencies, file layout, component composition, migration organization, fixture construction, local refactors, recoverable defects, or visual polish within this brief.

Do not start personalisation, briefings, notification rules, authentication, hosted deployment, personal health tracking, or any other Milestone 6+ functionality.

---

# 2. Milestone outcome

At completion, the user must be able to:

- Add a YouTube channel by exact channel URL, channel ID, or handle.
- Add an X account by exact username when the optional connector is enabled and funded.
- See current metadata for monitored YouTube videos and current, compliance-checked X posts.
- Import a locally held transcript, notes file, or authorised caption file with a declared rights basis.
- Manually capture a claim with a source URL, timestamp or post identifier, and bounded quote or faithful paraphrase.
- Open a creator or organisation profile and see its monitored accounts, content, reviewed claims, explicit disclosures, corrections, and evidence links.
- See what a creator claim says, the population/species it concerns, the intervention or topic, the claimed outcome, direction, timeframe, certainty wording, and regulatory or safety scope.
- Compare a creator claim with the specific scientific claims, assessments, trials, intervention dossiers, regulatory assertions, and safety items held by Healthspan Dashboard.
- See where the claim is aligned, partially aligned, not comparable, unresolved, or potentially overstates a specific evidence dimension.
- Distinguish a protocol from a result, animal evidence from human evidence, biomarkers from health outcomes, association from causation, and product authorization from authorization for a longevity use.
- See an exact source span for every current creator claim.
- Review, edit, reject, mark uncertain, or supersede a machine-generated claim or alignment candidate.
- See correction/update relationships without treating deletion as a correction.
- See how often a reviewed claim theme recurs across the user’s monitored sources, without calling this platform-wide popularity or truth.
- See platform quota, budget, retention, compliance, and source-health status.
- Remove a monitored source or local document and trigger the required data deletion or invalidation.
- Use all Live M1–M4 research, trial, intervention, peptide, regulatory, and safety functionality unchanged.

Healthspan Dashboard remains a private local research-intelligence application. It does not become a creator-ranking site, social network, media downloader, influencer-monitoring service, misinformation blacklist, or personal medical recommender.

---

# 3. Non-negotiable product, fairness, and evidence principles

## 3.1 Assess claims, not people

The system may assess a specific source-bound claim against the evidence currently held in Healthspan Dashboard.

It must not assign a person or organisation:

```text
trust score
credibility score
misinformation score
bias score
authority score
influence score
reliability rank
blacklist status
good/bad creator label
```

Do not create leaderboards or rank creators.

A creator profile may show transparent counts and statuses such as:

- Reviewed claims
- Claims linked to primary sources
- Claims requiring review
- Explicit corrections
- Explicit commercial disclosures
- Claims whose evidence alignment changed

These are descriptive counts, not a score or judgement of character.

## 3.2 Use neutral, bounded language

Machine or rule-based output must use neutral language tied to a specific dimension.

Permitted examples:

```text
The source claim refers to human evidence, while the linked study is animal-only.
The linked trial is ongoing and has no posted results.
The claim describes a biomarker result as a health outcome.
The linked official authorization applies to a different indication.
No supporting source has been linked in the current Healthspan Dashboard corpus.
The available source text is insufficient to assess this claim.
```

Prohibited automatic labels include:

```text
liar
fraud
scammer
quack
dishonest
dangerous creator
spreads misinformation
false person
untrustworthy
```

Potentially adverse or reputational conclusions require human review before appearing as a current Live finding.

## 3.3 Creator content is not scientific evidence

Creator claims must never increase:

- M3 evidence maturity
- Scientific confidence
- Trial result status
- M4 regulatory standing
- Intervention efficacy
- Safety certainty

Creator claims may link to scientific or regulatory sources. They remain a separate content class.

## 3.4 Popularity is not evidence

Do not derive or display an attention, influence, popularity, or truth score from:

- Views
- Likes
- Reposts
- Replies
- Comments
- Followers
- Subscribers
- Engagement rates
- Algorithmic recommendations
- Search rank

Milestone 5 uses **monitored-claim recurrence**, based only on reviewed claim themes in the user’s explicitly monitored sources. It is not platform-wide prevalence or popularity.

## 3.5 Curated monitoring only

Live mode begins with no real creators or platform accounts.

The user explicitly adds every monitored channel or account.

Do not:

- Seed real people into Live mode
- Crawl broad creator lists
- Discover accounts from follower graphs
- Search platform trends
- Monitor replies from unrelated users
- Build political, ideological, health, or demographic profiles
- Infer private relationships

Demo mode may use clearly fictional creators and synthetic platform fixtures.

## 3.6 Public identity must remain explicit and reviewable

A creator entity may represent:

```text
person
organization
publication
journal
regulator
conference
company
channel_brand
collective
unknown
```

Do not assume a channel maps to a named person.

Link multiple accounts to one creator only when:

- The platform profile explicitly links them, or
- The user makes a reviewed identity decision using public evidence.

Do not use face recognition, voice recognition, biometric matching, hidden identity inference, or private data.

## 3.7 Credentials and affiliations are factual claims, not authority scores

Credentials, roles, affiliations, and commercial relationships require provenance and a status such as:

```text
self_described
publicly_documented
user_reviewed
superseded
disputed
unknown
```

Do not infer expertise from follower count, channel category, job title, or style.

Do not infer a commercial relationship merely because a creator mentions a product.

## 3.8 Explicit disclosures only

A sponsorship, affiliate relationship, ownership interest, advisory role, employment relationship, or product placement may be recorded only when:

- The source explicitly discloses it, or
- The user adds a reviewed public-source annotation.

A YouTube paid-product-placement API field may be displayed as the creator’s platform declaration.

Do not infer sponsorship from a link, discount code-shaped string, praise, product mention, or posting frequency.

## 3.9 Corrections are source relationships

Support:

```text
clarifies
updates
corrects
retracts
supersedes
responds_to
```

A deleted or unavailable post/video is not automatically a correction or retraction.

A creator correction must link to explicit source evidence or a reviewed user annotation.

## 3.10 Absence is bounded

Use:

> No supporting evidence is linked in the current Healthspan Dashboard corpus as of [date].

Do not state:

> No evidence exists.

The local corpus may be incomplete.

## 3.11 No overall creator-claim score

A creator claim can have multiple independent alignment findings. Do not collapse them into one numeric score.

Permitted dimensions include:

- Intervention identity
- Species/organism
- Population
- Study design
- Results availability
- Outcome type
- Direction
- Effect magnitude
- Causality
- Timeframe
- Regulatory scope
- Safety scope
- Certainty wording
- Evidence recency

## 3.12 Human review precedence

Current display precedence is:

```text
valid human-reviewed decision
    ↓
validated deterministic source fact
    ↓
validated optional AI-assisted candidate
    ↓
unknown / unresolved
```

Review decisions are append-only and version-scoped.

## 3.13 Source removal must propagate

When platform content is deleted, made private, withheld, protected, edited, or otherwise unavailable:

- Comply with the platform-specific deletion requirement.
- Remove or redact source text and current platform metadata.
- Mark dependent creator claims unavailable or stale.
- Rebuild profile and recurrence projections.
- Preserve only a minimal non-reconstructive audit record where policy permits.
- Do not preserve deleted text inside a historical snapshot.

## 3.14 No medical recommendation

Creator-claim intelligence must not produce:

- Advice to start or stop an intervention
- Dosing
- Stacking
- Purchasing
- Vendor recommendations
- Injection or reconstitution instructions
- Personal risk estimates
- Personal lifespan predictions

---

# 4. Platform-policy architecture

Milestone 5 introduces platform data whose retention rules differ from the immutable official-source snapshots used in M2–M4.

## 4.1 Compliance-aware platform storage

Create a separate interface such as:

```ts
interface ComplianceAwarePlatformStore {
  putCurrent(input: PlatformRecordInput): Promise<PlatformRecordRef>;
  getCurrent(ref: PlatformRecordRef): Promise<PlatformRecord | null>;
  markUnavailable(input: PlatformUnavailableInput): Promise<void>;
  purgeSourceContent(input: PlatformPurgeInput): Promise<void>;
  purgeExpired(now: number): Promise<PlatformPurgeResult>;
  verifyDisplayEligibility(input: PlatformDisplayCheck): Promise<PlatformDisplayEligibility>;
}
```

Do not place long-lived YouTube or X raw API payloads in the permanent immutable `RawSnapshotStore`.

Store:

- Current normalized platform data
- Short-lived raw transport data only when operationally necessary
- Retrieval and refresh timestamps
- Policy version
- Expiration/refresh deadline
- Compliance state
- Non-reconstructive hashes and run audit metadata

## 4.2 Retention classes

Support:

```text
official_immutable_source
platform_refresh_or_delete
platform_delete_on_compliance
user_supplied_local_document
user_manual_annotation
synthetic_fixture
```

Rules:

- Existing M2–M4 official records remain immutable.
- YouTube API data uses `platform_refresh_or_delete`.
- X content uses `platform_delete_on_compliance`.
- User-supplied files are local documents with explicit deletion.
- Synthetic fixtures are clearly non-live.

## 4.3 Historical snapshots and policy redaction

Creator profile and recurrence snapshots may be immutable only for app-owned analytical structure.

Any field dependent on platform content must support:

```text
active
stale
redacted_by_compliance
source_unavailable
purged
```

After a required purge, a snapshot may retain:

- Internal object ID
- One-way hash
- Event type
- Review decision ID
- Timestamp
- Reason for redaction

It must not retain reconstructable deleted platform text or stale platform metrics.

## 4.4 Current display gates

YouTube content is not display-eligible when it has exceeded the configured refresh deadline and has not been refreshed.

X content is not display-eligible when required compliance reconciliation is overdue.

The UI must state why content is hidden.

## 4.5 Policy versioning

Create a versioned policy registry containing:

- Platform
- Policy/rule ID
- Checked date
- Official reference URL
- Storage rule
- Refresh/deletion deadline
- Display rule
- Export rule
- AI-processing rule
- Current/retired state

Policy changes mark affected platform records and jobs for reassessment.

---

# 5. Mandatory Milestone 4 closure items

Complete these bounded hardening items before declaring M5 complete.

## 5.1 Operationalize scheduled FDA bulk refresh paths

Verify and, where still required by the M4 completion report, complete:

- Scheduled official Drugs@FDA ZIP download and projection
- Weekly Purple Book due-time wiring
- Source-specific baseline state
- Restart-safe queued jobs
- Atomic staging/projection
- Source-health next-run display

Do not redesign the M4 regulatory model.

## 5.2 Add M4 baseline/history edge regressions

Add deterministic regression coverage for:

- A newly enabled M4 source after other sources already have baselines
- An unchanged FDA bulk release
- A changed FDA bulk release
- A newly discovered historical regulator item on first baseline
- A later product status change
- A stale targeted no-match becoming due for recheck
- Dossier history after a mapping or source-status change

## 5.3 Re-run all M4 integrity surfaces

The M5 final quality run must include:

```text
pnpm interventions:doctor
pnpm regulatory:doctor
pnpm safety:doctor
pnpm dossiers:doctor
```

If a script is absent despite the M4 brief, implement the expected doctor or document an equivalent, test-covered command.

## 5.4 Preserve M4 scope and history

- Preserve the M4 completion report as a historical record.
- Update current docs to show M4 complete and M5 current.
- Do not rewrite M4 facts or hashes.
- Do not weaken regulatory, safety, peptide, no-ranking, no-dosing, or no-vendor boundaries.

---

# 6. Fixed creator and account model

## 6.1 Creator kinds

Support:

```text
person
organization
publication
journal
regulator
conference
company
channel_brand
collective
unknown
```

## 6.2 Creator roles

Multi-valued roles may include:

```text
researcher
clinician
science_communicator
journalist
educator
evidence_reviewer
biohacking_creator
industry_representative
company_account
journal_account
regulator_account
conference_account
podcast_host_reference_only
other
unknown
```

`podcast_host_reference_only` may identify a person’s public role. Podcast ingestion is not part of M5.

## 6.3 Creator lifecycle

Support:

```text
candidate
active
ambiguous
archived
redirected
rejected
```

Only active, explicitly monitored creators appear by default.

## 6.4 Platform accounts

Support:

```text
youtube_channel
x_account
manual_source
```

Account state:

```text
candidate
monitored
paused
unavailable
protected
deleted
withheld
archived
ambiguous
rejected
```

## 6.5 Identity confidence

Support:

```text
exact_platform_identifier
explicit_cross_link
human_reviewed
unique_exact_public_name
candidate
ambiguous
rejected
```

No fuzzy account-to-person merge may publish without review.

## 6.6 Creator aliases

Every alias stores:

- Alias text
- Normalized alias
- Alias type
- Source
- Review status
- Validity dates
- Collision state

Do not erase meaningful organization/person distinctions.

## 6.7 Profile statements

A profile statement may represent:

```text
credential
role
affiliation
employment
ownership
advisory_relationship
sponsorship
affiliate_relationship
product_placement_declaration
correction_policy
other_disclosure
```

Every statement requires:

- Source URL or local document
- Source date
- Supporting span
- Subject
- Predicate
- Object/value
- Provenance state
- Review state
- Validity/superseded state

## 6.8 No automatic credential verification

The system may distinguish:

```text
self_described
publicly_documented
user_reviewed
unverified
superseded
disputed
```

It must not call a credential “verified” merely because it appears in a platform biography.

---

# 7. YouTube source policy

## 7.1 Permitted use

Use the official YouTube Data API for current metadata for user-selected channels and videos.

Permitted metadata includes fields required for:

- Channel identity
- Uploads playlist
- Video identity
- Title
- Description for current display only
- Publication time
- Duration
- Live/upcoming state
- Thumbnail URL
- Caption availability flag
- Platform-declared paid product placement
- Availability/status
- Official video/channel links

Do not derive scientific claims from YouTube API metadata.

## 7.2 Channel onboarding

Accept:

```text
channel URL
channel ID
@handle
```

Resolution order:

1. Exact channel ID
2. Exact `forHandle` lookup
3. Exact custom/legacy URL resolution where officially supported
4. User-initiated `search.list` fallback

Rules:

- `search.list` is never part of scheduled discovery.
- Show candidates for user confirmation.
- Store the stable channel ID after confirmation.
- Never crawl related channels.

## 7.3 Video discovery

Use:

```text
channels.list
contentDetails.relatedPlaylists.uploads
playlistItems.list
videos.list
```

Batch `videos.list` IDs where allowed.

Initial default:

```text
lookback: 180 days
maximum videos per channel: 200
```

Incremental sync uses the uploads playlist and last-seen IDs.

## 7.4 Quota controls

Track quota by method and day.

Defaults:

```text
app daily quota cap: 5,000 units
manual search-list cap: 10 calls/day
maximum channels per sync job: 25
maximum videos per job: 500
```

Rules:

- Stay below the project’s actual Developer Console quota.
- Do not assume quota costs never change.
- Keep a versioned method-cost table with a checked date.
- Stop before the app cap.
- Show `quota_exhausted` or `quota_near_limit`.
- Never hide quota errors as empty results.

## 7.5 Retention and refresh

- Refresh current non-authorized API data within 25 days.
- Do not display it after 30 days without refresh.
- Delete or refresh expired metadata according to the current policy.
- Do not keep permanent raw API snapshots.
- Store only current thumbnail URLs; do not download thumbnail files.
- On unavailable/private/deleted video, purge current platform metadata and invalidate dependent platform-source claims.
- A separate user-supplied transcript may remain only under its own rights basis and deletion rules.

## 7.6 No unofficial transcript acquisition

Do not:

- Use `youtube-transcript-api`
- Scrape caption endpoints
- Scrape watch-page HTML
- Download audio/video
- Run speech-to-text
- Bypass caption permissions
- Use browser automation
- Use third-party transcript aggregators

The official caption download API generally requires authorization to edit the video. M5 therefore does not depend on caption download.

## 7.7 No comments or engagement metrics

Do not ingest:

- Comments
- Replies
- Likes
- View counts
- Subscriber counts
- Comment counts
- Engagement rates
- Recommendation/search rank

These fields are unnecessary for evidence-first creator claim intelligence.

## 7.8 Display

- Attribute YouTube clearly.
- Link to the official video/channel.
- Do not autoplay.
- Do not present platform metadata as scientific evidence.
- Show metadata retrieval time.
- Show when a video is hidden pending refresh.

---

# 8. X source policy

## 8.1 Optional paid connector

The X connector is optional and disabled by default.

Required configuration:

```text
HEALTHSPAN_X_ENABLED=false
X_BEARER_TOKEN=
HEALTHSPAN_X_MONTHLY_BUDGET_USD=5.00
HEALTHSPAN_X_BUDGET_ACKNOWLEDGED=false
HEALTHSPAN_X_AUTO_RECHARGE_ALLOWED=false
```

Rules:

- Enabling X requires an explicit budget acknowledgement.
- The app must instruct the user to configure a spending limit in the X Developer Console.
- The app must not enable or encourage automatic recharge.
- Current console pricing is the source of truth.
- A dated local pricing snapshot may be used for estimates only.
- Stop before the app’s budget cap.
- Budget exhaustion is a healthy visible state, not a crash.

## 8.2 Account onboarding

Accept an exact X username.

Use official user lookup to obtain the stable user ID.

Do not:

- Search for related accounts
- Discover followers/following
- Infer alternate identities
- Monitor private/protected accounts
- Monitor DMs
- Monitor lists
- Use broad search or trends

## 8.3 Timeline ingestion

Use the official user-post timeline endpoint for explicitly monitored accounts.

Defaults:

```text
initial lookback: 90 days
maximum initial posts/account: 200
exclude reposts: true
exclude replies: true
include creator-authored replies: per-account opt-in
scheduled sync: false by default
```

Incremental sync uses source-native pagination and `since_id`/equivalent current semantics.

## 8.4 Scope

Ingest only:

- Original public posts from monitored accounts
- Creator-authored replies when explicitly enabled
- Edit/history identifiers when supplied
- Source links and current text
- Publication time
- Availability/withholding state
- Official post/account URL

Do not ingest:

- Replies from unrelated users
- Quote-post source text from unmonitored accounts
- Likes
- Bookmarks
- Followers
- Following
- DMs
- Spaces
- Media files
- Engagement metrics
- Trend/search results

A quote-post reference may be retained as a link/ID without importing the unmonitored account’s content.

## 8.5 Compliance

Implement:

- Batch compliance reconciliation on startup and at least daily while X is enabled.
- Optional compliance stream only while the local process is running, if current access permits.
- Immediate application of delete, withhold, protect, suspend, and edit events.
- A durable compliance cursor/job.
- A display gate when reconciliation is overdue.
- Source-health state for compliance lag.

On deletion/withholding/protection:

- Remove text and current metadata.
- Remove bounded excerpts.
- Invalidate or redact derived claims based solely on that content.
- Rebuild creator profiles and recurrence.
- Retain only policy-permitted non-reconstructive audit data.

## 8.6 No external AI processing of X content

Never send X content, metadata, or derived post text to:

- OpenAI
- xAI
- Another hosted model
- Embedding service
- Vector service
- Model fine-tuning/training

X claim extraction is deterministic and/or manual only.

## 8.7 Cost controls

Track:

- Resource reads
- Estimated cost using the dated configured price table
- Actual billing period
- App cap
- Remaining app budget
- Last sync cost
- Cost by monitored account
- Pricing-table checked date

Do not guarantee exact billing from estimates.

No request may proceed when its conservative estimated cost would exceed the app cap.

## 8.8 Export and display

- Show clear X attribution and an official post link.
- Preserve current display requirements.
- Do not create a redistribution export of X post text.
- App exports, if any existing export path touches creator data, include IDs/links and app-authored review decisions only where policy permits.
- Deleted/withheld text must not remain in exported data.

---

# 9. Claim-eligible source text

Platform metadata and claim-eligible text are distinct.

## 9.1 YouTube claim-eligible sources

A YouTube-linked creator claim may be extracted only from:

1. A user-supplied transcript file.
2. A user-supplied caption file.
3. User-created notes.
4. A manually captured claim with video URL and timestamp.
5. A creator-authorized transcript supplied locally.
6. A public/openly licensed transcript supplied by the user with a declared rights basis.

YouTube API title/description metadata is not claim-eligible.

## 9.2 X claim-eligible sources

Current, compliance-eligible post text may be claim-eligible.

Rules:

- Deterministic/manual extraction only.
- No external AI.
- Every claim keeps the post ID and exact text span.
- A deleted/withheld post invalidates its source text and dependent current claim.
- Manual user annotations may remain only if they do not reconstruct prohibited deleted content.

## 9.3 Manual claim capture

Permit a local form with:

- Creator/account
- Source URL
- Platform content ID where known
- Timestamp or time range
- Faithful paraphrase
- Optional quotation
- Quote word count
- Intervention/topic
- User note
- Rights/source basis
- Review state

Default maximum quotation:

```text
25 consecutive words
```

The application may enforce a lower platform/source-specific limit.

## 9.4 Transcript/document formats

Support:

```text
.vtt
.srt
.txt
.json
```

JSON requires a documented schema.

Default maximum file size:

```text
10 MiB
```

Requirements:

- UTF-8 validation or safe conversion
- MIME/extension validation
- No HTML execution
- No macros
- No OCR
- No archive upload
- Safe filename handling
- Content hash
- Local-only storage
- Explicit deletion
- Bounded segment API
- No full transcript browser export

## 9.5 Rights-basis declaration

Support:

```text
creator_owned_or_authorized
user_created_notes
user_supplied_with_permission
public_domain
open_licence
research_excerpt_or_manual_quote
unknown_not_claim_eligible
```

This is a user declaration and workflow control, not a legal determination by Healthspan Dashboard.

Required fields:

- Rights basis
- User confirmation
- Source URL
- Licence/permission note when applicable
- Date declared
- Deletion state

`unknown_not_claim_eligible` may be stored as a private reference but cannot feed automated claim extraction.

## 9.6 Document deletion

Deleting a local creator document must:

- Delete raw file bytes
- Delete or redact segments
- Mark dependent claims stale/unavailable
- Rebuild creator snapshots
- Preserve only non-content audit records
- Never leave a duplicate copy in temporary storage

---

# 10. Creator claim model

## 10.1 Separation from M3 scientific claims

Create a distinct creator-claim domain.

A creator claim may link to M3 claims but must not be inserted into the scientific evidence tables as a research result.

Suggested origin:

```text
creator_claim
```

## 10.2 Assertion roles

Support:

```text
factual_assertion
interpretation
prediction
recommendation
personal_anecdote
mechanism_explanation
efficacy_claim
safety_claim
regulatory_claim
causal_claim
uncertainty_statement
correction
disclosure
other
```

Anecdotes remain anecdotes and are not scientific evidence.

## 10.3 Claim kinds

Support:

```text
benefit_or_efficacy
harm_or_safety
null_or_no_effect
association
causation
mechanism
biomarker
functional_outcome
mortality_or_lifespan
biological_age
trial_status
regulatory_status
approval_or_legality
dosage_or_protocol_reference
commercial_or_disclosure
evidence_quality
prediction
other
```

A `dosage_or_protocol_reference` may be recorded to classify a source claim, but the application must not reproduce actionable dosing instructions. Store a redacted/non-actionable summary and source location.

## 10.4 Claim direction

Support:

```text
beneficial
harmful
null
mixed
unclear
not_applicable
```

## 10.5 Certainty language

Support:

```text
certain
strong
moderate
tentative
speculative
conditional
unknown
```

Preserve source wording and do not make it stronger.

## 10.6 Population and organism

Reuse compatible M3 taxonomies:

```text
in_vitro
ex_vivo
animal
human
mixed
not_applicable
unknown
```

and:

```text
healthy
disease_specific
frailty_or_age_related_condition
mixed
not_reported
not_applicable
unknown
```

## 10.7 Atomicity

Each claim should represent one principal assertion.

Do not combine:

- Benefit and safety
- Animal and human
- Protocol and result
- Two different interventions
- Two unrelated outcomes
- Present evidence and future prediction

Split only when the source text supports faithful independent spans.

## 10.8 Source provenance

Every current creator claim requires:

- Creator ID
- Account ID
- Content/document ID
- Source version/current-content identity
- Source type
- Start/end timestamp or character range
- Bounded source span
- Source URL
- Extraction method
- Ruleset/prompt version
- Review status
- Compliance/display eligibility
- Creation/update timestamp

## 10.9 Extraction methods

Support:

```text
manual
deterministic
ai_assisted_authorized_document
human_edited
```

No `ai_assisted` value is permitted for X content or YouTube API metadata.

## 10.10 Claim fingerprint

Include:

- Source identity/version
- Source-span hash
- Normalized atomic text
- Claim kind
- Intervention/topic concept
- Ruleset version

Identical reprocessing must not create duplicates.

---

# 11. Creator claim evidence alignment

## 11.1 Alignment dimensions

Assess each dimension independently:

```text
intervention_identity
species_or_organism
population
study_design
results_availability
outcome_type
result_direction
effect_magnitude
causality
timeframe
regulatory_scope
safety_scope
certainty_language
evidence_recency
source_citation
```

## 11.2 Dimension states

Support:

```text
aligned
partially_aligned
overstated
understated
not_comparable
insufficient_information
unresolved
not_applicable
source_unavailable
```

`understated` is descriptive and must not be used as praise.

## 11.3 Assessment findings

Support multi-valued findings:

```text
aligned_with_linked_evidence
partially_aligned
overstates_evidence_maturity
overstates_translation
overstates_outcome
overstates_effect_magnitude
overstates_causality
protocol_as_result
animal_to_human_overreach
biomarker_to_health_outcome_overreach
regulatory_scope_overreach
safety_scope_overreach
potentially_conflicts_with_current_evidence
unsupported_by_linked_local_evidence
insufficient_context
not_comparable
unresolved
superseded_or_corrected
source_unavailable
```

There is no single numeric total.

## 11.4 Candidate versus published finding

Deterministic rules may create a candidate finding.

Before a potentially adverse finding appears as current Live profile content, require human review for:

```text
overstates_*
protocol_as_result
animal_to_human_overreach
biomarker_to_health_outcome_overreach
regulatory_scope_overreach
safety_scope_overreach
potentially_conflicts_with_current_evidence
unsupported_by_linked_local_evidence
```

The Review Queue may show unreviewed candidates.

## 11.5 Evidence links

Support links to:

```text
M3 scientific claim
M3 evidence assessment
paper
trial
M4 intervention entity or variant
M4 dossier snapshot
regulatory assertion
regulatory indication
safety item
regulator signal
creator correction
external reference unresolved
```

Link roles:

```text
cited_by_creator
supports
partially_supports
qualifies
provides_context
potentially_conflicts
not_comparable
updates
regulatory_context
safety_context
```

## 11.6 No absence fallacy

`unsupported_by_linked_local_evidence` means:

> No supporting source is linked in the current local corpus.

It does not mean the entire world’s literature has been searched.

## 11.7 Compatibility checks

Potential conflicts require recorded compatibility for:

- Intervention/entity/variant
- Population
- Organism
- Comparator
- Outcome family
- Direction
- Timeframe
- Study status
- Regulatory jurisdiction/scope

Automated disagreement is `potentially_conflicts`, never definitive contradiction.

## 11.8 Evidence updates

When linked M3/M4 evidence changes:

- Mark alignment stale.
- Queue reassessment.
- Preserve the prior assessment.
- Preserve human decisions.
- Require review when a prior adverse/positive conclusion may materially change.
- Add a Creator Watch event after non-baseline reassessment.

---

# 12. Claim recurrence and correction model

## 12.1 Monitored-claim recurrence

Measure recurrence only within:

- Explicitly monitored sources
- Claim-eligible text
- Active, reviewed creator claims
- A specified date window

Do not claim platform-wide prevalence.

## 12.2 Recurrence relationships

Support:

```text
exact_duplicate
reviewed_paraphrase
potential_paraphrase
same_claim_theme
updates
corrects
retracts
responds_to
unrelated
```

Do not label repetition as plagiarism.

## 12.3 Claim Recurrence view

Use:

```text
X-axis: linked evidence maturity category
Y-axis: number of distinct monitored sources carrying a reviewed claim theme
Bubble size: reviewed active claim count
Marker: correction, disclosure, potential conflict, or source-unavailable state
```

Tooltips must show raw counts and source scope.

Required explanation:

> Recurrence measures repetition among the sources you chose to monitor. It is not platform-wide popularity, influence, truth, or scientific support.

## 12.4 First-observed language

Use:

```text
First observed in monitored sources
```

Never claim:

```text
originated with
first person to say
caused the trend
```

## 12.5 Correction handling

A correction relationship requires:

- Explicit correction/update wording or human review
- Source link
- Prior claim link
- Date
- Scope of correction

Deletion alone creates `source_unavailable`, not `retracts`.

---

# 13. Optional AI policy

## 13.1 Default state

AI remains disabled by default.

M5 completion cannot depend on a paid AI provider.

## 13.2 Permitted input

Optional external AI may process only:

- User-supplied transcript/document text
- Rights basis eligible for claim extraction
- Explicit local opt-in
- Minimal necessary segments

## 13.3 Prohibited input

Never send to an external model:

- X content
- YouTube API metadata
- Platform IDs combined with personal profiling
- Deleted/withheld content
- Unreviewed private notes
- Local paths
- API keys
- Platform credentials
- Personal-health data
- Full document when bounded segments suffice

## 13.4 Permitted tasks

Optional AI may propose:

- Atomic creator claim candidates
- Claim type
- Intervention/topic phrase
- Organism/population
- Outcome
- Certainty language
- Candidate evidence links
- Candidate alignment dimensions

All output must:

- Be schema-constrained
- Resolve to source spans
- Pass policy validation
- Create review candidates
- Be labelled `AI-assisted, unreviewed`

## 13.5 Prohibited tasks

AI must not:

- Rank creators
- Assign trust/credibility
- Auto-publish adverse findings
- Infer hidden motives
- Infer undisclosed sponsorship
- Infer private identity
- Train/fine-tune on platform content
- Produce medical recommendations
- Generate dosing/sourcing
- Declare a claim definitively false
- Override human decisions
- Write directly to persistence

## 13.6 Existing adapters

Reuse the M3 provider-neutral interface where appropriate:

```text
disabled
fixture
openai
```

Do not add xAI or another paid provider as an M5 requirement.

---

# 14. Required database/schema work

Preserve all M1–M4 data and migrations. Add forward-only Drizzle migrations after the current M4 migration sequence.

Use:

- Application-generated text UUIDs
- UTC Unix-millisecond integer timestamps
- Integer-backed booleans
- Text enums validated with Zod
- Explicit foreign keys
- Normal tables and indexes
- Small validated JSON only for opaque diagnostics/diffs/cursors
- No triggers
- No stored procedures
- No custom SQLite extensions
- No FTS5 dependency
- No vector extension
- No filesystem paths as domain identifiers

The exact physical decomposition may be refined, but the following logical entities and semantics are required.

## 14.1 `creator_entities`

Required concepts:

- ID
- Preferred display name
- Normalized name
- Creator kind
- Lifecycle state
- Identity confidence
- Neutral description
- Current profile snapshot ID
- Redirect target
- Created/updated timestamps
- `data_origin = live`

## 14.2 `creator_aliases`

Required concepts:

- Creator ID
- Alias text
- Normalized alias
- Alias type
- Source/provenance
- Review state
- Collision flag
- Validity timestamps

## 14.3 `creator_roles`

Required concepts:

- Creator ID
- Role
- Source statement ID
- Provenance state
- Review state
- Validity dates

## 14.4 `creator_accounts`

Required concepts:

- Creator ID when resolved
- Platform
- Stable platform account ID
- Current handle/display name
- Official URL
- Account state
- Monitoring state
- Identity confidence
- Last checked
- Current platform-data expiry
- Compliance state
- Source policy version
- Unique platform/account ID

## 14.5 `creator_account_identity_candidates`

Required concepts:

- Account ID
- Candidate creator ID
- Match method
- Evidence
- State
- Confidence
- Created timestamp

## 14.6 `creator_identity_tasks`

May extend the generic review system.

Required concepts:

- Account/candidate
- Reason
- Proposed creator
- Current state
- Source evidence
- Priority
- Review status
- Stale state

## 14.7 `creator_profile_statements`

Required concepts:

- Creator ID
- Statement type
- Subject/predicate/value
- Provenance state
- Source URL
- Source content/document ID
- Source span
- Review state
- Effective/superseded dates

## 14.8 `monitored_creator_sources`

Required concepts:

- Account ID
- Enabled/paused
- Onboarding method
- User label/tags
- Sync policy
- Initial lookback
- Reply/repost settings
- Added timestamp
- Last/next due
- Budget/quota policy
- Removal timestamp

## 14.9 `platform_policy_versions`

Required concepts:

- Platform
- Policy ID/version
- Checked date
- Official reference
- Refresh/delete rule
- Display rule
- Export rule
- AI rule
- Current state

## 14.10 `platform_content_items`

Required concepts:

- ID
- Platform
- Stable platform content ID
- Account ID
- Content type
- Official URL
- Current state
- Published timestamp
- Last retrieved
- Refresh/compliance deadline
- Policy version
- Unique platform/content ID

## 14.11 `platform_content_current`

Current policy-eligible fields only:

- Content item ID
- Current text/title/description as permitted
- Duration/status fields
- Thumbnail URL
- Paid-placement declaration field
- Caption-available flag
- Source version/edit identity
- Content hash
- Retrieval timestamp
- Expiry timestamp
- Display eligibility

Do not place engagement metrics here.

## 14.12 `platform_content_tombstones`

Required concepts:

- Content item internal ID
- Platform
- One-way content/ID hash where permitted
- Unavailability reason
- Compliance event
- Purged timestamp
- Non-reconstructive audit metadata

No deleted text.

## 14.13 `platform_compliance_events`

Required concepts:

- Platform
- Content/account reference
- Event type
- Source event/cursor
- Received/applied timestamps
- Action taken
- Error/retry state

## 14.14 `platform_retention_jobs`

Required concepts:

- Platform
- Policy version
- Due records
- Refreshed count
- Purged count
- Hidden count
- Status
- Started/completed timestamps

This may be represented through `background_jobs` plus a dedicated result table.

## 14.15 `platform_quota_ledgers`

Required concepts:

- Platform
- Date/billing period
- Method/resource
- Units/reads
- Estimated cost
- Price-table version
- App cap
- Remaining allowance
- Last updated

## 14.16 `platform_price_tables`

Required concepts:

- Platform
- Checked date
- Currency
- Resource type
- Unit price
- Source URL
- Active/superseded state

Prices are estimates for app gating, not billing records.

## 14.17 `creator_documents`

Required concepts:

- Creator/account/content link
- Document type
- Local storage reference
- File name/safe display name
- MIME
- Size
- Content hash
- Rights basis
- Rights declaration timestamp
- Claim eligibility
- Source URL
- Current/deleted state
- Created timestamp

## 14.18 `creator_document_segments`

Required concepts:

- Document ID
- Segment kind
- Start/end time
- Character offsets
- Text
- Text hash
- Source line/cue IDs
- Claim eligibility
- Created timestamp

## 14.19 `creator_claims`

Required concepts:

- ID
- Creator ID
- Account ID
- Content/document ID
- Claim fingerprint
- Assertion role
- Claim kind
- Faithful concise claim text
- Direction
- Certainty language
- Intervention/exposure text
- Subject/population
- Organism
- Comparator
- Outcome/outcome family
- Timeframe
- Regulatory jurisdiction/scope when applicable
- Extraction method
- Review status
- Current/stale/source-unavailable state
- Created timestamp

## 14.20 `creator_claim_source_spans`

Every claim requires a current valid primary source span.

Required concepts:

- Claim ID
- Content/document/segment ID
- Platform content version
- Start/end time or character offsets
- Bounded excerpt
- Excerpt word count
- Span hash
- Source URL
- Primary-support flag
- Display eligibility

## 14.21 `creator_claim_concepts`

Map to:

- M4 intervention entities/variants
- M3 outcome families
- M3 hallmarks/topics
- Conditions
- Regulatory/safety concepts
- Source terms

Store assignment method, confidence, and review state.

## 14.22 `creator_claim_evidence_links`

Required concepts:

- Creator claim ID
- Target type/ID
- Link role
- Detection method
- Compatibility dimensions
- Candidate/reviewed/rejected state
- Rationale
- Source/version
- Created/reviewed timestamps

## 14.23 `creator_claim_alignment_assessments`

Immutable assessment package.

Required concepts:

- Creator claim ID
- Input dependency hash
- Ruleset version
- Status
- Completeness
- Extraction/classification confidence
- Current/stale/superseded state
- Deterministic summary
- Created timestamp
- Unique analysis identity

## 14.24 `creator_claim_alignment_dimensions`

Required concepts:

- Assessment ID
- Dimension
- State
- Creator-claim value
- Linked-evidence value
- Explanation
- Evidence link
- Method
- Review state

## 14.25 `creator_claim_findings`

Required concepts:

- Assessment ID
- Finding type
- Candidate/current/rejected state
- Explanation
- Review requirement
- Review decision
- Created/reviewed timestamps

## 14.26 `creator_claim_relationships`

Required concepts:

- Source claim
- Target claim
- Relationship type
- Candidate/reviewed/rejected state
- Similarity features
- Scope compatibility
- Created/reviewed timestamps

## 14.27 `creator_corrections`

Required concepts:

- Original claim/content
- Correction/update claim/content
- Relationship kind
- Source evidence
- Review state
- Effective date

## 14.28 `creator_profile_snapshots`

Required concepts:

- Creator ID
- Input dependency hash
- Profile ruleset version
- Status
- Counts by reviewed claim state
- Disclosure/correction counts
- Source coverage
- Policy-redaction state
- Created timestamp
- Unique input identity

Snapshots must not embed full platform text.

## 14.29 `creator_profile_state`

Required concepts:

- Creator ID
- Current snapshot
- Stale flag/reason
- Pending job
- Last successful rebuild
- Last reviewed
- Updated timestamp

## 14.30 `creator_events`

Required concepts:

- Creator/account/claim reference
- Event kind
- Baseline flag
- Deterministic summary
- Source date
- Detection date
- Source/policy state
- Dedupe key

Event kinds may include:

```text
monitored_content_published
creator_claim_reviewed
creator_claim_alignment_changed
creator_correction_linked
creator_disclosure_linked
creator_source_unavailable
platform_content_purged
account_state_changed
```

## 14.31 `claim_recurrence_snapshots`

Required concepts:

- Claim-theme concept
- Window start/end
- Distinct monitored source count
- Reviewed claim count
- Linked evidence maturity
- Correction/conflict/source-unavailable counts
- Formula version
- Source-scope hash
- Created timestamp

## 14.32 Existing table extensions

Extend where required:

- `background_jobs`
- `review_tasks`
- `review_decisions`
- M3 claims/assessments
- M4 intervention/dossier links
- source-health tables
- scheduler status
- change-event feeds

Do not mutate creator claims into M3 scientific claims.

## 14.33 Required indexes

At minimum index:

- Creator lifecycle/name
- Platform/account ID
- Monitored-source due state
- Content platform/account/published date
- Refresh/compliance deadline
- Tombstone/content hash
- Document rights/eligibility
- Claim creator/kind/status/date
- Claim concepts
- Evidence links
- Alignment findings/review state
- Correction relationships
- Review queue priority/status
- Quota period/method
- Budget period
- Recurrence topic/window
- Profile current/stale state
- Dependency joins

Add query-plan tests for creator lists, content lists, claim lists, review queues, creator detail, evidence-alignment detail, recurrence, quota/budget, and compliance queries.

---

# 15. Package responsibilities

## 15.1 `packages/core`

Add versioned Zod schemas and taxonomies for:

```text
CreatorEntity
CreatorAccount
CreatorProfileStatement
MonitoredCreatorSource
PlatformPolicyVersion
PlatformContent
PlatformComplianceEvent
PlatformQuotaLedger
CreatorDocument
CreatorDocumentRights
CreatorClaim
CreatorClaimSourceSpan
CreatorClaimEvidenceLink
CreatorClaimAlignmentAssessment
CreatorClaimAlignmentDimension
CreatorClaimFinding
CreatorClaimRelationship
CreatorCorrection
CreatorProfileSnapshot
ClaimRecurrenceSnapshot
```

Keep it free of:

- Database drivers
- React
- Platform HTTP clients
- Provider SDKs

## 15.2 `packages/db`

Add:

- Forward migrations
- Creator/account repositories
- Compliance-aware current platform-data persistence
- Document repositories and deletion
- Creator claim/alignment repositories
- Profile/recurrence snapshots
- Quota/budget ledgers
- Retention/compliance queries
- Server-side pagination/filtering
- Transactional review and current-pointer changes
- Doctor checks
- Generated performance fixtures

## 15.3 `packages/connectors`

Add:

```text
YouTube Data API connector
X user lookup/timeline connector
X compliance connector
```

Use the shared HTTP/retry/redaction infrastructure, but route raw storage through the compliance-aware platform store rather than the permanent official-source snapshot store.

No unofficial APIs.

## 15.4 New `packages/creators`

Create:

```text
@healthspan/creators
```

Recommended structure:

```text
packages/creators/src/
├─ identity/
├─ sources/
├─ documents/
├─ segments/
├─ claims/
├─ alignment/
├─ corrections/
├─ disclosures/
├─ recurrence/
├─ policy/
├─ evaluation/
└─ index.ts
```

Responsibilities:

- Creator/account identity
- Rights-basis validation
- Transcript/document parsing
- Deterministic creator-claim extraction
- Evidence-link candidates
- Alignment rules
- Neutral-language policy
- Correction/disclosure relationships
- Recurrence formula
- Platform-policy enforcement helpers
- Evaluation harness

Most tests must run without a database or network.

## 15.5 `packages/intelligence`

Extend only for:

- Shared controlled taxonomies
- Linking creator claims to scientific claims
- Stale dependency signaling
- Optional authorized-document AI adapter
- Existing evidence/provenance reuse

Do not place platform connectors or creator ranking logic here.

## 15.6 `packages/interventions`

Extend only for:

- Creator claim/entity links
- Dossier references
- Regulatory/safety context links
- Stale alignment signaling after dossier changes

Creator claims must not affect dossier evidence maturity.

## 15.7 `packages/ui`

Add reusable components where justified:

```text
CreatorKindBadge
AccountPlatformBadge
SourceEligibilityBadge
RightsBasisBadge
ClaimKindBadge
ClaimCertaintyBadge
AlignmentDimensionTable
CreatorClaimFinding
PlatformComplianceBadge
QuotaBudgetPanel
CreatorDisclosureCard
CreatorCorrectionTimeline
ClaimRecurrenceChart
SourceUnavailableBanner
```

## 15.8 `apps/api`

Add:

- Creator services
- Source onboarding/sync services
- Document import/delete services
- Creator claim/alignment services
- Review orchestration
- Platform compliance/retention jobs
- Quota/budget enforcement
- Recurrence/profile rebuilds
- Local-admin mutations
- Safe source-health diagnostics
- Graceful shutdown/restart

## 15.9 `apps/web`

Add:

- Live Creators
- Creator detail
- Source Management
- Creator Content
- Creator Claims workspace
- Claim evidence-alignment detail
- Creator Review Queue
- Transcript/document import
- Manual claim capture
- Disclosures/corrections
- Monitored Claim Recurrence
- Creator Watch on Today
- Platform health/quota/budget/compliance
- Methodology
- Desktop/mobile E2E
- Demo regression preservation

---

# 16. YouTube connector requirements

## 16.1 Official interface

Use the current official YouTube Data API v3 documentation.

Primary methods:

```text
channels.list
playlistItems.list
videos.list
search.list — manual onboarding fallback only
```

## 16.2 Source onboarding

Flow:

1. User enters exact channel URL, ID, or handle.
2. Resolve candidates using low-cost exact methods.
3. If exact resolution fails, offer a manual search fallback.
4. Display candidate channel name, ID, official link, and thumbnail URL.
5. User confirms.
6. Create a monitored source and baseline job.
7. Do not monitor until confirmation.

## 16.3 Baseline and incremental sync

Baseline:

- Fetch uploads playlist.
- Walk newest-first.
- Stop at 180 days or 200 videos.
- Batch video details.
- Mark imported historical records baseline.
- Do not create “new today” events for old videos.

Incremental:

- Fetch newest uploads.
- Stop at known video IDs or cap.
- Re-fetch due current metadata before expiry.
- Create non-baseline event only for genuinely new monitored content.

## 16.4 Method cost ledger

Every API call records:

- Method
- Quota cost version
- Estimated units
- Actual response
- Retry count
- Date
- Job/account

Enforce app caps before calls.

## 16.5 Error states

Support:

```text
not_configured
disabled
healthy
quota_near_limit
quota_exhausted
permission_error
channel_not_found
channel_unavailable
video_unavailable
retention_refresh_due
policy_hold
degraded
failed
```

## 16.6 Data minimization

Do not request parts not used by the product.

Do not fetch comments, subscriptions, search trends, playlists unrelated to uploads, or engagement statistics.

## 16.7 Test fixtures

Cover:

- Channel ID
- Handle
- Uploads playlist
- Pagination
- Batch videos
- New upload
- Existing upload
- Deleted/private video
- Caption-available flag
- Paid-placement declaration
- Quota cap
- Search fallback
- Expired metadata
- Policy purge
- Unicode
- Malformed response
- Retryable error

---

# 17. X connector requirements

## 17.1 Official interface

Use current official X API v2 documentation.

Primary capabilities:

```text
user lookup by username
user posts timeline
batch compliance
optional compliance stream
```

## 17.2 Enablement flow

Before first live sync, require:

- Bearer token configured
- App monthly budget greater than zero
- Budget acknowledgement
- Confirmation that a Developer Console spending limit is configured
- Current price-table checked date
- User confirmation of monitored account

Do not test credentials by performing unbounded reads.

## 17.3 Baseline sync

- Resolve username to stable user ID.
- Fetch up to 200 original posts within 90 days.
- Exclude reposts/replies by default.
- Baseline historical posts.
- Record resource reads and cost estimate.
- Stop before budget/cap.

## 17.4 Incremental sync

- Use latest source-native ID/cursor.
- Fetch bounded new posts.
- Apply edits/current versions.
- Run compliance reconciliation.
- Create non-baseline events for genuinely new active posts.
- Do not schedule unless explicitly enabled.

## 17.5 Compliance processing

Test:

- Deleted post
- Withheld post
- Protected account
- Suspended/deleted account
- Edited post
- Compliance job failure
- Overdue reconciliation
- Restart recovery
- Source text purge
- Dependent claim invalidation
- Profile/recurrence rebuild

## 17.6 Cost gating

The app must conservatively estimate the maximum cost of a job before claiming it.

If it could exceed remaining budget:

- Do not run.
- Mark `budget_blocked`.
- Show the estimate and cap.
- Require the user to change the cap explicitly.

## 17.7 No AI path

Code-level policy tests must prove X content cannot be passed to the external AI provider interface.

## 17.8 Test fixtures

Cover:

- User lookup
- Timeline pagination
- Excluded repost/reply
- Optional self-authored reply
- Edited post
- Deleted/withheld content
- Protected account
- Budget exhaustion
- Price-table version
- Compliance cursor
- Unicode
- URL entities
- Source unavailable
- No external-AI route

---

# 18. Document and manual-source pipeline

## 18.1 Import workflow

1. Select creator/account or create an unresolved source.
2. Select local file.
3. Validate type/size/encoding.
4. Declare rights basis.
5. Associate source URL and date.
6. Save locally.
7. Parse to timed or text segments.
8. Show preview.
9. Confirm claim eligibility.
10. Queue deterministic claim extraction.

## 18.2 Parsers

VTT/SRT:

- Preserve cue times
- Strip markup safely
- Merge only bounded adjacent cues
- Preserve cue IDs
- Detect malformed timing
- Do not execute HTML

TXT:

- Paragraph/sentence segmentation
- Optional user-supplied time markers
- Preserve line ranges

JSON:

- Versioned schema
- Explicit text/timestamp fields
- Reject extra executable/content fields as needed

## 18.3 Manual notes

User-created notes may link:

- Video/post
- Time range
- Scientific source
- Intervention
- Claim
- Correction/disclosure

Clearly label them `User note`.

## 18.4 Deletion and replacement

Replacing a document creates a new version.

Deleting a document triggers the policy in Section 9.6.

No orphan temporary files.

---

# 19. Deterministic creator-claim extraction

## 19.1 Ruleset

Create a versioned ruleset such as:

```text
creator-claim-rules-v1
```

## 19.2 Candidate extraction

Use:

- Sentence/cue boundaries
- Assertion verbs
- Intervention/topic lexicon
- Outcome lexicon
- Population/species terms
- Trial/regulatory language
- Certainty terms
- Negation
- Temporal qualifiers
- Recommendation/dosage-reference detection
- Correction/disclosure markers

## 19.3 Safety constraints

- Preserve negation.
- Preserve uncertainty.
- Preserve source timeframe.
- Do not turn a question into a claim.
- Do not turn quoted third-party speech into the creator’s claim unless context establishes endorsement.
- Do not reproduce actionable dosing.
- Do not infer hidden meaning.
- Do not extract from YouTube title/description.
- Do not use external AI for X.
- Bound claims per source item.

## 19.4 Quote handling

Store a bounded excerpt.

Default display maximum:

```text
25 consecutive words
```

Longer local segments may be used internally for context under the declared rights basis but are not returned as a public-style excerpt.

## 19.5 High-impact review

Create high-priority review tasks for:

```text
mortality_or_lifespan
human efficacy
harm or safety
dosing/protocol reference
regulatory or legality claim
causal claim
commercial disclosure
credential/affiliation
potential conflict
overstatement candidate
source ambiguity
```

---

# 20. Creator profile aggregation

## 20.1 Profile sections

Support:

```text
Overview
Accounts
Recent Content
Claims
Evidence Alignment
Sources Cited
Disclosures
Corrections
History
Provenance
```

## 20.2 Overview

Show:

- Creator kind
- Monitored accounts
- Publicly sourced roles
- Current source coverage
- Reviewed claim counts
- Open-review count
- Corrections/disclosures
- Latest monitored activity
- Data freshness
- Platform compliance state

Do not show an overall rating.

## 20.3 Sources cited

Show only sources explicitly linked by:

- Creator claim source text
- User-reviewed evidence link
- Manual annotation

Distinguish:

```text
primary research
trial record
regulator source
review/synthesis
news/commentary
commercial source
unresolved external source
```

Do not infer that a source was read or endorsed merely because it appears in a platform description.

## 20.4 Disclosures

Display factual source statements with:

- Type
- Source
- Date
- Review state
- Current/superseded state

No inference of undisclosed conflicts.

## 20.5 Corrections

Display explicit correction relationships and status history.

## 20.6 Profile snapshots

A profile snapshot depends on:

- Current monitored accounts
- Active/current reviewed claims
- Review decisions
- Disclosures/corrections
- Platform policy/compliance state
- Ruleset version

Identical rebuilds reuse the snapshot.

Platform purge can redact policy-dependent fields from old snapshots.

---

# 21. Background jobs and scheduling

Add job kinds such as:

```text
onboard_youtube_channel
sync_youtube_channel
refresh_youtube_metadata
purge_expired_youtube_data

onboard_x_account
sync_x_account
run_x_batch_compliance
apply_x_compliance_event
purge_x_content

import_creator_document
delete_creator_document
segment_creator_document
extract_creator_claims
reassess_creator_claim
reassess_stale_creator_claims
link_creator_evidence
rebuild_creator_profile
rebuild_claim_recurrence
run_creator_policy_audit
```

Rules:

- Persisted jobs
- `202 Accepted`
- Durable leases
- Restart recovery
- Deduplication
- Bounded retries
- Parent/child orchestration
- Quota/budget reservation before external work
- Compliance priority over ordinary sync
- Graceful shutdown
- No unbounded fan-out
- No paid AI jobs unless explicitly requested
- Platform deletion jobs outrank analytics jobs

## 21.1 Scheduler defaults

YouTube:

```text
scheduled sync: daily at 06:30 Australia/Brisbane when enabled
metadata retention audit: daily
```

X:

```text
scheduled content sync: disabled by default
compliance reconciliation: startup and daily when enabled
```

Creator analytics:

```text
stale claim reassessment: after evidence/source changes
profile rebuild: after committed dependency change
recurrence rebuild: after reviewed claim changes
```

Do not add notifications or briefings.

---

# 22. API requirements

Retain the existing response envelope and strict Live/Demo separation.

All lists use server-side pagination and validated filters.

## 22.1 Creators

```text
GET /api/creators
GET /api/creators/:id
GET /api/creators/:id/accounts
GET /api/creators/:id/content
GET /api/creators/:id/claims
GET /api/creators/:id/alignment
GET /api/creators/:id/disclosures
GET /api/creators/:id/corrections
GET /api/creators/:id/history
GET /api/creators/:id/provenance
```

Filters:

```text
creator kind
role
platform
account state
claim kind
alignment finding
review state
correction/disclosure present
source freshness
compliance state
date
```

## 22.2 Source management

```text
GET    /api/creator-sources
POST   /api/creator-sources/youtube
POST   /api/creator-sources/x
PATCH  /api/creator-sources/:id
DELETE /api/creator-sources/:id
POST   /api/creator-sources/:id/sync
GET    /api/creator-sources/:id/status
```

All mutations are local-admin guarded.

Deletion must show and execute platform/document data consequences.

## 22.3 Creator identity

```text
GET  /api/creator-identity/tasks
GET  /api/creator-identity/tasks/:id
POST /api/creator-identity/tasks/:id/resolve
GET  /api/creator-identity/decisions
```

Append-only and concurrency checked.

## 22.4 Creator content

```text
GET /api/creator-content
GET /api/creator-content/:id
```

Do not return expired, deleted, withheld, or non-display-eligible content.

Do not return engagement metrics.

## 22.5 Documents and manual capture

```text
GET    /api/creator-documents
POST   /api/creator-documents
GET    /api/creator-documents/:id
DELETE /api/creator-documents/:id
GET    /api/creator-documents/:id/segments
POST   /api/creator-claims/manual
```

Requirements:

- Multipart/file safety
- Local-admin guard
- Size/type validation
- Rights declaration
- Bounded segments
- No full transcript export
- Deletion audit

## 22.6 Creator claims

```text
GET  /api/creator-claims
GET  /api/creator-claims/:id
GET  /api/creator-claims/:id/evidence
GET  /api/creator-claims/:id/alignment
GET  /api/creator-claims/:id/history
POST /api/creator-claims/runs
POST /api/creator-claims/:id/reassess
```

Filters:

```text
creator
platform
claim kind
assertion role
intervention
organism
population
outcome
certainty
review state
alignment finding
source eligibility
source availability
date
```

## 22.7 Review

Extend the generic Review Queue or add creator-specific views:

```text
GET  /api/creator-review-tasks
GET  /api/creator-review-tasks/:id
POST /api/creator-review-tasks/:id/resolve
```

Actions:

```text
accept
edit
reject
uncertain
dismiss
supersede
link_evidence
unlink_evidence
mark_not_comparable
```

## 22.8 Recurrence

```text
GET /api/claim-recurrence
GET /api/claim-recurrence/:topicId
```

Expose:

- Window
- Monitored source scope
- Raw counts
- Evidence maturity
- Formula version
- Correction/conflict markers
- Limitations

## 22.9 Platform status

```text
GET  /api/platforms/status
GET  /api/platforms/youtube/quota
GET  /api/platforms/x/budget
GET  /api/platforms/x/compliance
POST /api/platforms/policy-audit
```

Mutations use local-admin guard.

## 22.10 Methodology

```text
GET /api/methodology/creator-claims
GET /api/methodology/claim-alignment
GET /api/methodology/creator-fairness
GET /api/methodology/claim-recurrence
GET /api/methodology/platform-compliance
GET /api/methodology/document-rights
```

## 22.11 Safe response rules

Never return:

- Platform API keys/tokens
- Exact local paths
- Raw platform API payloads
- Full transcripts
- Deleted/withheld content
- Hidden model reasoning
- X text in export endpoints
- Engagement metrics
- Creator rankings
- Dosing/sourcing text
- Unreviewed adverse person-level findings as current profile facts

---

# 23. UI requirements

## 23.1 Live Creators page

Replace the Live placeholder.

Show:

- Creator/organization name
- Kind
- Monitored platforms
- Current account state
- Reviewed claim count
- Claims requiring review
- Explicit corrections/disclosures
- Latest monitored content date
- Compliance/freshness state

No score, ranking, or default “best creator” sort.

Default sort:

```text
most recently updated
```

## 23.2 Creator detail

Tabs:

```text
Overview
Content
Claims
Evidence Alignment
Sources
Disclosures
Corrections
Accounts
History
```

Every claim card shows:

- Faithful claim text
- Source type
- Timestamp/post date
- Bounded source span
- Claim kind
- Certainty
- Intervention/topic
- Review state
- Evidence links
- Alignment findings
- Source availability
- Provenance

## 23.3 Source Management

Support:

- Add YouTube channel
- Add X account
- Pause/resume
- Manual sync
- Remove
- Initial lookback/caps
- X reply setting
- Platform configuration state
- Quota/budget
- Last/next sync
- Compliance/retention state

Require confirmation before paid X reads.

## 23.4 Transcript/document import

Wizard:

1. Select source/creator
2. Select file
3. Validate
4. Declare rights basis
5. Preview segments
6. Confirm claim eligibility
7. Queue extraction

Show deletion consequences.

## 23.5 Manual claim capture

Provide a bounded, source-linked form.

Do not encourage copying long passages.

## 23.6 Creator Claims workspace

Show:

- Atomic claims
- Filters
- Creator/account/platform
- Claim kind
- Intervention
- Species/population
- Outcome
- Certainty
- Review state
- Evidence links
- Alignment findings
- Corrections
- Source availability

## 23.7 Evidence Alignment detail

Use a side-by-side view:

```text
Creator claim
Source context
Linked scientific/regulatory/safety evidence
Dimension-by-dimension comparison
Review history
```

No red/green overall grade.

Use neutral accessible language.

## 23.8 Review Queue

Support desktop/mobile:

- Source span
- Claim candidate
- Evidence candidates
- Alignment candidates
- Correction/disclosure candidate
- Creator identity candidate
- Rights/source issue
- Platform compliance issue

Actions are audited.

## 23.9 Monitored Claim Recurrence

Implement the recurrence view from Section 12.

Do not label it social attention.

Do not use platform engagement.

## 23.10 Creator Watch on Today

Show non-baseline events:

- New content from monitored source
- New reviewed creator claim
- Creator correction linked
- Explicit disclosure linked
- Alignment changed after evidence update
- Source removed/unavailable
- Compliance action applied

Do not show:

- Historical baseline content as new
- Raw platform metric changes
- Quota usage as a scientific event
- Unreviewed adverse creator finding as a headline

## 23.11 Source health

Show:

- Platform enabled/configured
- Channels/accounts monitored
- Last successful sync
- Quota/budget usage
- Compliance last checked
- Retention refresh deadline
- Hidden/purged item count
- Current policy version/check date
- Sanitised error
- Next due time

## 23.12 Methodology

Explain:

- Claim-versus-person distinction
- No trust score
- Curated-source limits
- Claim eligibility
- YouTube metadata limits
- No unofficial transcripts
- X paid/budget model
- X compliance/deletion
- Evidence alignment dimensions
- Human review
- Corrections/disclosures
- Monitored recurrence
- AI restrictions
- Local-corpus limitation
- No medical advice
- No platform-wide popularity inference

## 23.13 Honest states

Support:

```text
not configured
disabled
budget blocked
quota exhausted
retention refresh due
compliance overdue
source unavailable
document not claim-eligible
claim unassessed
claim needs review
claim source removed
alignment stale
creator identity ambiguous
no monitored creators
```

## 23.14 Demo mode

- Preserve all Demo functionality.
- Add fictional creator fixtures if needed.
- Never seed real creator records into Live.
- No ID collision.
- Demo remains conspicuously labelled.
- Existing E2E remains green.

## 23.15 Accessibility

New:

- Tables
- Badges
- Dialogs
- Upload forms
- Review controls
- Charts
- Timelines
- Status banners

must be keyboard accessible, screen-reader labelled, and not rely on colour alone.

---

# 24. Commands

Add Windows-safe root scripts:

```text
pnpm creators:backfill
pnpm creators:refresh
pnpm creators:status
pnpm creators:eval
pnpm creators:doctor

pnpm creator-claims:extract
pnpm creator-claims:reassess
pnpm creator-claims:eval
pnpm creator-claims:doctor

pnpm creator-documents:doctor

pnpm youtube:sync
pnpm youtube:status
pnpm youtube:doctor

pnpm x:sync
pnpm x:status
pnpm x:compliance
pnpm x:doctor

pnpm platform-policy:audit
pnpm platform-policy:doctor

pnpm test:youtube:live
pnpm test:x:live
```

Existing commands remain functional.

Live tests:

- Explicit invocation only
- Low caps
- Temporary/explicit data directory
- No committed output
- No X test without budget acknowledgement
- No source text or tokens in logs

---

# 25. Environment configuration

Update `.env.example` without secrets.

```text
# Creator intelligence
HEALTHSPAN_CREATORS_ENABLED=true
HEALTHSPAN_CREATOR_RULESET=creator-claim-rules-v1
HEALTHSPAN_CREATOR_MAX_CLAIMS_PER_ITEM=12
HEALTHSPAN_CREATOR_DOCUMENT_MAX_BYTES=10485760
HEALTHSPAN_CREATOR_QUOTE_MAX_WORDS=25
HEALTHSPAN_CREATOR_RECURRENCE_WINDOW_DAYS=30

# YouTube
HEALTHSPAN_YOUTUBE_ENABLED=false
YOUTUBE_API_KEY=
HEALTHSPAN_YOUTUBE_INITIAL_LOOKBACK_DAYS=180
HEALTHSPAN_YOUTUBE_MAX_VIDEOS_PER_CHANNEL=200
HEALTHSPAN_YOUTUBE_MAX_CHANNELS_PER_JOB=25
HEALTHSPAN_YOUTUBE_MAX_VIDEOS_PER_JOB=500
HEALTHSPAN_YOUTUBE_DAILY_QUOTA_CAP=5000
HEALTHSPAN_YOUTUBE_SEARCH_DAILY_CAP=10
HEALTHSPAN_YOUTUBE_METADATA_REFRESH_DAYS=25

# X
HEALTHSPAN_X_ENABLED=false
X_BEARER_TOKEN=
HEALTHSPAN_X_MONTHLY_BUDGET_USD=5.00
HEALTHSPAN_X_BUDGET_ACKNOWLEDGED=false
HEALTHSPAN_X_AUTO_RECHARGE_ALLOWED=false
HEALTHSPAN_X_SCHEDULED_SYNC=false
HEALTHSPAN_X_INITIAL_LOOKBACK_DAYS=90
HEALTHSPAN_X_MAX_POSTS_PER_ACCOUNT=200
HEALTHSPAN_X_MAX_ACCOUNTS_PER_JOB=10
HEALTHSPAN_X_INCLUDE_REPLIES=false
HEALTHSPAN_X_INCLUDE_REPOSTS=false
HEALTHSPAN_X_COMPLIANCE_MODE=batch
HEALTHSPAN_X_COMPLIANCE_MAX_AGE_HOURS=24

# Existing optional AI remains off
HEALTHSPAN_AI_ENABLED=false
OPENAI_API_KEY=
```

Rules:

- Missing YouTube key while disabled is healthy.
- Missing X token while disabled is healthy.
- Enabling without required configuration is a clear source state.
- `HEALTHSPAN_X_AUTO_RECHARGE_ALLOWED` must remain false; reject true as unsupported.
- Secrets never appear in diagnostics.
- Current official pricing/quota remains the source of truth.

---

# 26. Evaluation corpora

## 26.1 Creator identity corpus

Create at least **48** licence-safe synthetic fixtures covering:

- Person versus organization
- Channel brand versus person
- Multiple accounts for one reviewed creator
- Same display name collision
- Handle change
- Redirect/archived account
- Explicit cross-link
- Ambiguous public identity
- Self-described credential
- Publicly documented role
- Superseded affiliation
- Explicit sponsorship/disclosure
- No inferred sponsorship

## 26.2 Creator source/document corpus

Create at least **48** fixtures covering:

- VTT
- SRT
- TXT
- JSON
- Timed claims
- Malformed cues
- Unicode
- HTML-like markup
- Oversized file
- Wrong MIME/extension
- Rights eligible
- Rights ineligible
- Document replacement
- Document deletion
- Manual quote
- Manual paraphrase
- Transcript source unavailable

## 26.3 Creator claim corpus

Create at least **120** creator-claim fixtures.

Required coverage:

- Human, animal, cell
- Protocol versus result
- Biomarker versus clinical outcome
- Association versus causation
- Regulatory scope
- Safety scope
- Efficacy
- Null result
- Mixed result
- Prediction
- Personal anecdote
- Mechanism
- Recommendation reference
- Dosage reference redaction
- Uncertainty
- Question rather than assertion
- Quoted third-party speech
- Correction
- Disclosure
- Multiple atomic claims
- Negation
- Timeframe
- No supporting local link
- Source unavailable

At least:

```text
32 transcript/document cases
32 X-style post cases
24 evidence-overstatement cases
16 correction/disclosure cases
16 no-assessment/insufficient-context cases
```

## 26.4 Alignment-pair corpus

Create at least **72** creator-claim/evidence pairs covering:

- Fully aligned
- Partially aligned
- Species mismatch
- Population mismatch
- Protocol as result
- Biomarker overreach
- Effect-magnitude overreach
- Causality overreach
- Regulatory indication mismatch
- Safety-scope overreach
- Not comparable
- Potential conflict
- Evidence update
- Retraction
- Source unavailable
- No linked local evidence

## 26.5 Recurrence corpus

Create at least **24** claim-theme groups covering:

- Exact duplicate
- Reviewed paraphrase
- Potential paraphrase
- Same theme/different claim
- Correction
- Source unavailable
- Mixed evidence maturity
- One source repeating itself
- Multiple distinct monitored sources
- No platform-wide inference

## 26.6 Compliance and retention corpus

Create at least **40** fixtures covering:

- YouTube metadata under 25 days
- Due refresh
- Over 30 days
- Refreshed
- Deleted/private video
- X deleted post
- X withheld post
- Protected account
- Edited post
- Compliance overdue
- Compliance caught up
- Purged text
- Redacted profile snapshot
- Document deletion
- Export exclusion
- Quota exhaustion
- Budget exhaustion
- Policy version change

## 26.7 Deterministic evaluation gates

Required:

- 100% schema-valid output
- 100% current creator claims have valid source provenance
- 100% current X claims have compliance-eligible source text
- 0 creator claims extracted from YouTube API title/description
- 0 unofficial caption/transcript acquisition
- 0 X content sent to external AI
- 0 platform engagement-derived score or ranking
- 0 creator trust/credibility score
- 0 platform-wide prevalence claim
- 0 automatic adverse person-level label
- 0 automatic sponsorship inference
- 100% protocol-versus-result separation on unambiguous fixtures
- 100% human/animal/cell separation on unambiguous fixtures
- 100% regulatory jurisdiction/indication scope on unambiguous fixtures
- 100% source deletion invalidation
- 100% document deletion removes raw bytes/segments
- 100% quote limit enforcement
- 100% rights-ineligible documents excluded from claim extraction
- 100% correction relationship requires source/review
- 100% recurrence counts distinct monitored sources correctly
- 100% idempotent identical reprocessing
- 100% stale alignment after linked evidence change
- 0 medical recommendation, dosing reproduction, sourcing, or vendor output

---

# 27. Testing requirements

All default tests are deterministic and network-independent.

## 27.1 Migration tests

- M4 database to M5
- Earlier-shaped database through all migrations
- Repeated migration
- M1–M4 data preserved
- Foreign-key integrity
- Rollback
- No Demo/Live mixing
- Platform data current/tombstone constraints

## 27.2 Creator repository tests

- Creator/account CRUD
- Identity collision
- Multiple accounts
- Redirect/history
- Profile statement provenance
- Monitored source state
- Pagination/filtering
- Profile snapshot idempotency
- Staleness
- Query plans

## 27.3 Platform store tests

- Current record
- Expiry
- Hide after deadline
- Refresh
- Purge
- Tombstone without text
- Compliance event
- Policy-version change
- No permanent raw API snapshot
- No deleted text in old snapshot
- Export exclusion

## 27.4 YouTube tests

- Exact channel ID/handle
- Manual search fallback
- Uploads playlist
- Pagination
- Batch video details
- Baseline
- New upload
- Unavailable video
- Quota cap
- Retention audit
- Metadata purge
- No comments/metrics
- No claim extraction from metadata
- Safe logging

## 27.5 X tests

- Account lookup
- Timeline
- Baseline
- Incremental
- Exclude replies/reposts
- Budget reservation
- Budget block
- Price-table version
- Delete/withhold/protect/edit
- Compliance overdue display gate
- Text purge
- Dependent claim invalidation
- No external AI
- No export text
- Safe logging

## 27.6 Document tests

- All formats
- File validation
- Segment timing
- Rights basis
- Claim eligibility
- Quote limit
- No HTML execution
- No temp orphan
- Replacement
- Deletion

## 27.7 Creator claim tests

- Atomicity
- Negation
- Certainty
- Question exclusion
- Third-party quotation
- Anecdote
- Dosage redaction
- Correction/disclosure
- Fingerprint/idempotency
- Source availability
- Review precedence

## 27.8 Alignment tests

- Every dimension
- Candidate/current distinction
- Human review requirement
- Compatibility
- No absence fallacy
- Stale on evidence change
- Retraction/correction
- Neutral language
- No overall score

## 27.9 Recurrence tests

- Distinct source count
- Same-source repetitions
- Reviewed-only
- Active-only
- Source-unavailable exclusion
- Correction marker
- Formula version
- No engagement data
- No platform-wide language

## 27.10 API tests

- All new endpoints
- Pagination/filter validation
- Local-admin guard
- 202 jobs
- Rights validation
- Review concurrency
- Safe platform display
- No expired/deleted text
- No secrets/paths
- No full transcript
- No X export text
- No engagement metrics
- No trust/rank fields
- Live/Demo separation

## 27.11 UI/E2E tests

Desktop and mobile:

- No monitored creators state
- Add YouTube channel
- YouTube quota state
- Add disabled/unconfigured X state
- X budget acknowledgement fixture
- Creator list/detail
- Content list
- Import transcript
- Rights-ineligible document
- Manual claim
- Claim evidence alignment
- Review accept/edit/reject/uncertain
- Creator correction
- Explicit disclosure
- Source unavailable
- Compliance purge
- Recurrence chart
- Creator Watch
- Source health
- Methodology
- Demo regression
- Accessibility

## 27.12 M4 regression tests

All M4 intervention, peptide, regulatory, safety, dossiers, comparison, Today, and no-dosing/no-ranking tests remain green.

## 27.13 Quality gates

All must pass:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

pnpm db:doctor
pnpm intelligence:eval
pnpm intelligence:doctor
pnpm interventions:doctor
pnpm regulatory:doctor
pnpm safety:doctor
pnpm dossiers:doctor

pnpm creators:eval
pnpm creators:doctor
pnpm creator-claims:eval
pnpm creator-claims:doctor
pnpm creator-documents:doctor
pnpm youtube:doctor
pnpm x:doctor
pnpm platform-policy:doctor
```

Report exact counts and skips.

---

# 28. Doctor requirements

## 28.1 `creators:doctor`

Check:

- Orphan creator accounts
- Ambiguous account marked active without review
- Redirect cycles
- Profile statement without provenance
- Unmonitored Live content
- Profile snapshot with deleted text
- Demo/Live contamination
- Stale current profile

## 28.2 `creator-claims:doctor`

Check:

- Claim without valid source span
- Claim from rights-ineligible document
- Claim from YouTube API metadata
- X claim without current compliance eligibility
- X claim marked AI-assisted
- Unreviewed adverse finding current
- Claim/evidence dependency stale
- Deleted source text retained
- Duplicate current claim fingerprint
- Dosing instruction exposed

## 28.3 `creator-documents:doctor`

Check:

- Missing local file
- Hash mismatch
- Temporary orphan
- Deleted document with bytes
- Rights status/eligibility mismatch
- Segment without document
- Oversized/unsupported file persisted
- Full transcript exposed through API configuration

## 28.4 `youtube:doctor`

Check:

- API data older than allowed display period
- Missing policy version
- Permanent raw API snapshot
- Quota ledger mismatch
- Search used by scheduled job
- Engagement metric persisted
- Metadata-derived scientific claim
- Deleted/private content still displayed

## 28.5 `x:doctor`

Check:

- Enabled without budget acknowledgement
- Auto-recharge true
- Compliance overdue while content displayed
- Deleted/withheld text retained
- X content in AI model-run input
- X text in export
- Budget ledger mismatch
- Unmonitored account content
- Engagement metric persisted

## 28.6 `platform-policy:doctor`

Check:

- Missing current policy version
- Expired policy check
- Record without retention class
- Display eligibility violation
- Purge job overdue
- Deleted content in snapshot
- Unsupported platform
- Platform data in permanent official snapshot store

---

# 29. Performance and reliability targets

Use generated local fixtures, not committed databases.

Target p95:

```text
Creators list: < 500 ms at 10,000 creators
Creator content list: < 600 ms at 500,000 content items
Creator claims list: < 700 ms at 250,000 claims
Creator detail: < 1,000 ms
Alignment detail: < 1,000 ms
Review Queue: < 700 ms at 100,000 tasks
Recurrence view: < 1,200 ms
Platform health/quota/budget: < 500 ms
```

Rules:

- No route loads all records.
- No browser renders unbounded lists.
- Document parsing is bounded.
- One malformed source item does not fail a whole sync.
- Compliance jobs pre-empt ordinary jobs.
- Budget/quota reservation is transactional.
- Identical claim/profile/recurrence builds are reused.
- UI remains usable during sync and analysis.

---

# 30. Security, privacy, rights, and platform-integrity requirements

- No personal health information.
- No private creator data.
- No home address, private email, private phone, or inferred sensitive attributes.
- No face, voice, or biometric recognition.
- No platform credential in browser, logs, screenshots, database diagnostics, or reports.
- No exact local path in browser APIs.
- Local-admin guard on all mutations.
- No unofficial scraping.
- No browser automation.
- No media download.
- No speech-to-text.
- No comment/reply harvesting from unrelated users.
- No X external-AI processing.
- No model training/fine-tuning on platform content.
- No permanent raw YouTube/X API snapshots.
- No deleted/withheld content retention.
- No full transcript browser export.
- No X text redistribution export.
- No creator trust score or blacklist.
- No unsupported reputational allegation.
- No inferred sponsorship.
- No engagement-derived ranking.
- No medical recommendation.
- No dosing/sourcing/vendors.
- No platform write actions.
- No DMs.
- No broad trend or surveillance workflow.
- Every claim has provenance.
- Every adverse alignment finding has review state.
- Rights-ineligible documents cannot feed extraction.
- Platform policy references and check dates are documented.
- Source and retrieval dates remain distinct.

---

# 31. Documentation and ADR requirements

Create/update:

```text
README.md
AGENTS.md
ROADMAP.md
docs/ARCHITECTURE.md
docs/DATA_MODEL.md
docs/SOURCE_POLICY.md
docs/PRIVACY_BOUNDARIES.md
docs/DECISIONS.md
docs/milestones/M4.md
docs/milestones/M5.md
docs/milestones/M5_EXECUTION_BRIEF.md
docs/milestones/M5_COMPLETION_REPORT.md
```

Add methodology:

```text
docs/methodology/CREATOR_IDENTITY.md
docs/methodology/CREATOR_CLAIMS.md
docs/methodology/CLAIM_EVIDENCE_ALIGNMENT.md
docs/methodology/CREATOR_FAIRNESS.md
docs/methodology/CREATOR_DISCLOSURES.md
docs/methodology/CREATOR_CORRECTIONS.md
docs/methodology/MONITORED_CLAIM_RECURRENCE.md
docs/methodology/CREATOR_DOCUMENT_RIGHTS.md
docs/methodology/PLATFORM_DATA_COMPLIANCE.md
```

Add source pages:

```text
docs/sources/YOUTUBE_DATA_API.md
docs/sources/X_API.md
```

Add ADRs using the next available numbers for:

1. Creator claims remain separate from scientific claims.
2. Claim-level assessment replaces creator-level trust scoring.
3. Curated monitoring instead of platform-wide discovery.
4. Compliance-aware platform storage instead of permanent raw snapshots.
5. YouTube metadata is not claim-eligible source text.
6. No unofficial caption or media acquisition.
7. X is optional, paid, budget-capped, and compliance-gated.
8. External AI is prohibited for X content and platform API metadata.
9. User-supplied document rights and deletion.
10. Monitored-claim recurrence is not popularity or truth.
11. Neutral language and human review for adverse creator findings.
12. No engagement metrics or creator ranking.

Documentation must state:

- M1–M4 complete
- M5 current
- Work began from exact base commit
- Live starts with no real creator seed list
- How to add/remove/pause sources
- How YouTube quota works
- How X pricing/budget works
- Current official policy check date
- How compliance deletion works
- Why captions are not scraped
- How to import a transcript
- Rights-basis limitations
- How claim alignment works
- Why “unsupported locally” is not “false”
- No trust score
- No platform-wide popularity inference
- No external AI for X
- No medical advice/dosing/sourcing
- Known limitations

Save this brief at:

```text
docs/milestones/M5_EXECUTION_BRIEF.md
```

Do not silently remove controlling requirements.

---

# 32. Official platform-policy references

Before implementation and again before completion, verify current official documentation and record the check date.

YouTube:

```text
Quota costs:
https://developers.google.com/youtube/v3/determine_quota_cost

channels.list:
https://developers.google.com/youtube/v3/docs/channels/list

playlistItems.list:
https://developers.google.com/youtube/v3/docs/playlistItems/list

videos.list:
https://developers.google.com/youtube/v3/docs/videos/list

captions.download:
https://developers.google.com/youtube/v3/docs/captions/download

YouTube API Services Developer Policies:
https://developers.google.com/youtube/terms/developer-policies
```

X:

```text
Pricing:
https://docs.x.com/x-api/getting-started/pricing

User posts timeline:
https://docs.x.com/x-api/users/user-posts-timeline-by-user-id

User lookup:
https://docs.x.com/x-api/users/get-users-by-usernames

Batch compliance:
https://docs.x.com/x-api/compliance/batch-compliance/introduction

Compliance streams:
https://docs.x.com/x-api/compliance/compliance-streams/introduction

Developer policy:
https://developer.x.com/en/developer-terms/policy
```

If current official policy materially conflicts with this brief:

- Stop only the affected platform connector.
- Keep fixture-based and platform-independent creator work proceeding.
- Document the conflict.
- Consult the project manager before weakening compliance.

---

# 33. What must NOT be done in Milestone 5

Do not implement:

- Milestone 6 work
- Personalised daily briefings
- Weekly email/report generation
- Push notifications
- Saved-search alert rules
- Expanded reading/dismissal workflows
- Production backup/recovery hardening
- Authentication
- Multi-user accounts
- Public profiles
- Public/community ratings
- Public submissions
- Creator outreach
- Posting to YouTube or X
- DMs
- Following/unfollowing
- Podcast ingestion
- Spotify/Apple Podcasts
- Instagram
- TikTok
- Facebook
- Reddit
- Bluesky
- LinkedIn
- Telegram
- Discord
- Broad web crawling
- Broad platform search
- Trending-topic mining
- Follower/following graphs
- Comments from YouTube
- Replies from unrelated X users
- Likes/views/subscribers/followers/engagement metrics
- Social attention score
- Creator influence score
- Trust/credibility/misinformation score
- Creator leaderboard
- Creator blacklist
- Face/voice recognition
- Private identity inference
- Sensitive-person profiling
- Unofficial transcript/caption scraping
- Audio/video download
- Speech-to-text
- OCR
- Paywall bypass
- External AI processing of X content
- AI training/fine-tuning on platform content
- Embedding/vector search over platform content
- Automatic sponsorship inference
- Automatic credential verification
- Definitive automatic “false” labels
- Medical recommendations
- Dosing, cycling, stacking, reconstitution, injection, sourcing, vendors, prices, or promo codes
- Personal supplement/medication/lab/wearable tracking
- ChatGPT Sites
- D1/R2
- Wrangler/Cloudflare runtime
- Hosted deployment or hosted scheduler
- Native mobile app
- Any Milestone 6+ implementation

---

# 34. Acceptance criteria checklist

Milestone 5 is complete only when every applicable item is checked and evidenced in the completion report.

## A. Base, branch, and M4 closure

- [ ] A1. Work begins from exact commit `f809ffbbcb39a5d2fd50a9a2beb18a329f488233`.
- [ ] A2. Work is on `milestone-5/creator-social-intelligence`.
- [ ] A3. M4 completion history/report remains unchanged.
- [ ] A4. Scheduled Drugs@FDA/Purple Book hardening is completed or verified.
- [ ] A5. M4 baseline/history edge regressions pass.
- [ ] A6. All M4 doctors pass.
- [ ] A7. M4 evidence/regulatory/safety/dosing/vendor boundaries remain intact.
- [ ] A8. Docs show M4 complete and M5 current.
- [ ] A9. No Milestone 6 work is present.

## B. Creator identity and profiles

- [ ] B1. Creator entity and platform account are separate.
- [ ] B2. Creator kinds, roles, lifecycle, and identity-confidence taxonomies are implemented.
- [ ] B3. Live mode starts with no real creator seeds.
- [ ] B4. Multiple accounts can map to one reviewed creator.
- [ ] B5. Ambiguous identities require review.
- [ ] B6. No biometric or private-identity inference exists.
- [ ] B7. Credentials/roles have provenance and status.
- [ ] B8. Commercial relationships require explicit source/review.
- [ ] B9. No automatic sponsorship inference exists.
- [ ] B10. Profile snapshots are versioned and policy-redactable.
- [ ] B11. No creator score or rank exists.
- [ ] B12. Creator identity decisions are append-only and concurrency checked.

## C. Platform-policy storage

- [ ] C1. Compliance-aware platform storage is separate from permanent official-source snapshots.
- [ ] C2. Every platform record has a retention class and policy version.
- [ ] C3. YouTube metadata has refresh/delete deadlines.
- [ ] C4. X content has compliance state and deletion handling.
- [ ] C5. Expired/non-compliant content is not displayed.
- [ ] C6. Required purges remove reconstructable source text.
- [ ] C7. Historical snapshots support policy redaction.
- [ ] C8. Minimal tombstones contain no deleted text.
- [ ] C9. Platform-policy audits are queued and visible.
- [ ] C10. No platform data is leaked through exports or raw APIs.
- [ ] C11. `platform-policy:doctor` passes.

## D. YouTube

- [ ] D1. Official YouTube Data API connector is implemented.
- [ ] D2. Exact channel ID/handle onboarding works.
- [ ] D3. Manual search is fallback-only and user initiated.
- [ ] D4. Uploads-playlist discovery works.
- [ ] D5. Video detail batching works.
- [ ] D6. Initial lookback/caps are enforced.
- [ ] D7. Baseline historical uploads do not appear as new events.
- [ ] D8. Incremental new-upload events work.
- [ ] D9. Method-level quota ledger works.
- [ ] D10. App quota/search caps are enforced.
- [ ] D11. Metadata refresh occurs before display expiry.
- [ ] D12. Unavailable/private/deleted videos are purged/hidden appropriately.
- [ ] D13. No comments are ingested.
- [ ] D14. No engagement metrics are ingested or displayed.
- [ ] D15. No unofficial transcript/caption/media acquisition exists.
- [ ] D16. YouTube API metadata cannot become creator claims.
- [ ] D17. No permanent raw YouTube API snapshots exist.
- [ ] D18. YouTube attribution/current retrieval state is displayed.
- [ ] D19. `youtube:doctor` passes.

## E. X

- [ ] E1. X connector is optional and disabled by default.
- [ ] E2. Enabling requires token, budget, and acknowledgement.
- [ ] E3. Auto-recharge true is rejected as unsupported.
- [ ] E4. Exact username-to-user-ID onboarding works.
- [ ] E5. Timeline sync is limited to monitored accounts.
- [ ] E6. Reposts/replies are excluded by default.
- [ ] E7. Initial lookback/caps are enforced.
- [ ] E8. Resource-read/cost ledger works.
- [ ] E9. A job cannot exceed the app budget cap.
- [ ] E10. Budget blocked/exhausted states are visible.
- [ ] E11. Scheduled post sync remains off by default.
- [ ] E12. Startup/daily compliance reconciliation works.
- [ ] E13. Deleted/withheld/protected content is purged/hidden.
- [ ] E14. Edited content is handled according to current policy.
- [ ] E15. Compliance-overdue content is not displayed.
- [ ] E16. Dependent claims become unavailable/stale after purge.
- [ ] E17. X content cannot reach external AI.
- [ ] E18. X post text is excluded from exports.
- [ ] E19. No broad search/trends/follower graphs/DMs exist.
- [ ] E20. No engagement metrics are ingested or displayed.
- [ ] E21. `x:doctor` passes.

## F. Documents and rights

- [ ] F1. VTT import works.
- [ ] F2. SRT import works.
- [ ] F3. TXT import works.
- [ ] F4. Versioned JSON import works.
- [ ] F5. File size/type/encoding validation works.
- [ ] F6. HTML-like content cannot execute.
- [ ] F7. Rights-basis declaration is required.
- [ ] F8. Rights-ineligible documents cannot feed extraction.
- [ ] F9. Timed/character segments preserve provenance.
- [ ] F10. Full transcripts are not exposed/exported.
- [ ] F11. Manual claim capture enforces bounded quote limits.
- [ ] F12. Document replacement creates a new version.
- [ ] F13. Document deletion removes bytes and segments.
- [ ] F14. Dependent claims/profiles become stale after deletion.
- [ ] F15. No temporary orphan remains.
- [ ] F16. `creator-documents:doctor` passes.

## G. Creator claims

- [ ] G1. Creator claims are separate from M3 scientific claims.
- [ ] G2. Required assertion-role/kind/direction/certainty taxonomies are implemented.
- [ ] G3. Claims are atomic and faithful.
- [ ] G4. Every current claim has a valid source span.
- [ ] G5. Questions are not silently converted into assertions.
- [ ] G6. Third-party quotation is not attributed as endorsement without context.
- [ ] G7. Negation and uncertainty are preserved.
- [ ] G8. Actionable dosing details are redacted/non-reproduced.
- [ ] G9. Fingerprints make identical reprocessing idempotent.
- [ ] G10. High-impact claims create review tasks.
- [ ] G11. Source-unavailable state works.
- [ ] G12. No platform metadata claim path exists.
- [ ] G13. No external-AI X claim path exists.
- [ ] G14. `creator-claims:doctor` passes.

## H. Evidence alignment

- [ ] H1. All fixed alignment dimensions are implemented.
- [ ] H2. Findings are multi-valued rather than a numeric score.
- [ ] H3. Creator claims link to M3/M4 evidence with exact provenance.
- [ ] H4. Intervention/entity compatibility is checked.
- [ ] H5. Species mismatch is detected.
- [ ] H6. Population mismatch is detected.
- [ ] H7. Protocol-as-result is detected.
- [ ] H8. Biomarker-to-health-outcome overreach is detected.
- [ ] H9. Causality overreach is detected.
- [ ] H10. Regulatory scope mismatch is detected.
- [ ] H11. Safety scope mismatch is detected.
- [ ] H12. Not-comparable state is available.
- [ ] H13. No-local-evidence wording is bounded to the local corpus.
- [ ] H14. Automated disagreement remains potential, not definitive contradiction.
- [ ] H15. Adverse findings require human review before current profile publication.
- [ ] H16. Linked evidence changes mark alignment stale.
- [ ] H17. Prior assessments/reviews remain historical.
- [ ] H18. Creator claims never alter scientific evidence maturity or regulatory status.
- [ ] H19. No overall claim/creator score exists.

## I. Corrections, disclosures, and recurrence

- [ ] I1. Explicit correction/update relationships are modeled.
- [ ] I2. Deletion alone is not a correction.
- [ ] I3. Disclosure statements require source/review.
- [ ] I4. No undisclosed-conflict inference exists.
- [ ] I5. Exact duplicate/reviewed paraphrase/potential paraphrase are distinct.
- [ ] I6. No plagiarism label is generated.
- [ ] I7. Recurrence uses reviewed active claims only.
- [ ] I8. Recurrence counts distinct monitored sources correctly.
- [ ] I9. Same-source repetition does not inflate source count.
- [ ] I10. Source-unavailable claims are excluded/marked appropriately.
- [ ] I11. Recurrence exposes raw counts and formula version.
- [ ] I12. Recurrence is not labelled popularity, influence, attention, or truth.
- [ ] I13. No engagement data enters recurrence.
- [ ] I14. “First observed” is scoped to monitored sources.

## J. Optional AI

- [ ] J1. AI remains disabled by default.
- [ ] J2. Completion does not require paid AI.
- [ ] J3. Only rights-eligible user-supplied segments may reach external AI.
- [ ] J4. YouTube API metadata cannot reach AI.
- [ ] J5. X content cannot reach AI.
- [ ] J6. Minimal segments are used.
- [ ] J7. Output is schema-constrained and source-bound.
- [ ] J8. AI candidates never auto-publish adverse findings.
- [ ] J9. AI cannot rank creators or infer motives/sponsorship.
- [ ] J10. No model training/fine-tuning exists.
- [ ] J11. Default tests make no model calls.

## K. Jobs, APIs, source health, and UI

- [ ] K1. All long-running work uses persisted jobs and 202 semantics.
- [ ] K2. Compliance jobs take priority over analytics.
- [ ] K3. Jobs have leases, retries, deduplication, and restart recovery.
- [ ] K4. Quota/budget reservation is enforced transactionally.
- [ ] K5. All new lists use server-side pagination.
- [ ] K6. All filters/sorts are validated and bounded.
- [ ] K7. All mutations use the local-admin guard.
- [ ] K8. Creator/source/document/claim/alignment/review/recurrence APIs work.
- [ ] K9. Safe response rules are enforced.
- [ ] K10. Live Creators page is functional.
- [ ] K11. Creator detail is functional on desktop/mobile.
- [ ] K12. Source Management is functional.
- [ ] K13. Transcript import is functional.
- [ ] K14. Manual claim capture is functional.
- [ ] K15. Creator Claims workspace is functional.
- [ ] K16. Evidence Alignment view is neutral and dimension-based.
- [ ] K17. Review Queue is interactive and audited.
- [ ] K18. Creator Watch shows only appropriate non-baseline events.
- [ ] K19. Source health shows quota, budget, compliance, retention, and policy state.
- [ ] K20. Honest empty/disabled/unavailable states work.
- [ ] K21. Demo mode remains separate and functional.
- [ ] K22. Accessibility coverage passes.
- [ ] K23. No trust/rank/engagement UI exists.

## L. Evaluation, security, and quality

- [ ] L1. Creator identity corpus has at least 48 cases.
- [ ] L2. Source/document corpus has at least 48 cases.
- [ ] L3. Creator claim corpus has at least 120 cases and required subsets.
- [ ] L4. Alignment-pair corpus has at least 72 cases.
- [ ] L5. Recurrence corpus has at least 24 groups.
- [ ] L6. Compliance/retention corpus has at least 40 cases.
- [ ] L7. Every deterministic gate in Section 26.7 passes.
- [ ] L8. No prohibited platform, scraping, media, or surveillance feature was added.
- [ ] L9. No personal-health or medical-recommendation feature was added.
- [ ] L10. No secret, raw live platform dump, transcript, or prohibited content is committed.
- [ ] L11. `pnpm lint` passes with zero warnings.
- [ ] L12. `pnpm typecheck` passes.
- [ ] L13. `pnpm test` passes.
- [ ] L14. `pnpm test:e2e` passes for desktop and mobile projects.
- [ ] L15. `pnpm build` passes.
- [ ] L16. `pnpm db:doctor` passes.
- [ ] L17. `pnpm intelligence:eval` passes.
- [ ] L18. `pnpm intelligence:doctor` passes.
- [ ] L19. `pnpm interventions:doctor` passes.
- [ ] L20. `pnpm regulatory:doctor` passes.
- [ ] L21. `pnpm safety:doctor` passes.
- [ ] L22. `pnpm dossiers:doctor` passes.
- [ ] L23. `pnpm creators:eval` passes.
- [ ] L24. `pnpm creators:doctor` passes.
- [ ] L25. `pnpm creator-claims:eval` passes.
- [ ] L26. `pnpm creator-claims:doctor` passes.
- [ ] L27. `pnpm creator-documents:doctor` passes.
- [ ] L28. `pnpm youtube:doctor` passes.
- [ ] L29. `pnpm x:doctor` passes.
- [ ] L30. `pnpm platform-policy:doctor` passes.
- [ ] L31. Documentation and ADRs match implementation.
- [ ] L32. M5 screenshots and completion report are committed.
- [ ] L33. Working branch is pushed and final hash reported.
- [ ] L34. No Milestone 6 work has begun.

---

# 35. Required completion report

Create and commit:

```text
docs/milestones/M5_COMPLETION_REPORT.md
```

It must contain:

1. Executive summary
2. Exact base commit, branch, feature-complete commit, and final HEAD
3. One-row-per-acceptance-criterion checklist
4. M4 closure-item results
5. Significant file-tree changes
6. Migration files and schema summary
7. Package-boundary changes
8. Creator identity/account model
9. Creator fairness and neutral-language policy
10. Platform compliance-aware storage design
11. YouTube connector implementation
12. YouTube policy/quota check date and references
13. X connector implementation
14. X pricing/policy/compliance check date and references
15. X budget-gating results
16. Document rights/import/deletion workflow
17. Creator-claim model and provenance
18. Evidence-alignment model
19. Human-review requirements
20. Correction/disclosure handling
21. Recurrence formula and limitations
22. Optional AI policy and tests
23. Evaluation-corpus composition
24. Exact deterministic evaluation results
25. YouTube retention/purge test
26. X deletion/compliance test
27. No-external-AI-X test
28. No-YouTube-metadata-claim test
29. Rights-ineligible document test
30. Evidence-update/stale-alignment test
31. Recurrence distinct-source test
32. Job/scheduler behavior
33. Query-plan/performance checks
34. API route summary
35. UI/page summary
36. Security/privacy/rights/platform-policy observations
37. Exact commands run and results
38. Lint result
39. Type-check result
40. Unit/integration test counts
41. E2E projects, passes, skips, failures
42. Build result
43. Every doctor/evaluation result
44. Optional live YouTube smoke test, if credentials were intentionally supplied
45. Optional live X smoke test and actual bounded estimated/charged resources, if credentials/budget were intentionally supplied
46. Screenshots:
    - Live no-monitored-creators state
    - Source Management
    - YouTube onboarding
    - Platform quota/budget/compliance status
    - Creator list
    - Creator detail
    - Transcript import/rights declaration
    - Manual claim capture
    - Creator Claims workspace
    - Evidence Alignment detail
    - Review Queue
    - Correction/disclosure
    - Claim Recurrence
    - Creator Watch
    - Source-unavailable/compliance state
    - Methodology
    - Demo regression
    - Mobile creator/claim/review views
47. Known issues and technical debt
48. Deviations from this brief and rationale
49. Genuine decisions required after M5
50. Explicit statement that Milestone 6 has not begun

Do not claim a live platform test occurred unless credentials and, for X, an explicit budget were intentionally supplied.

---

# 36. Consult the project manager early only when

- Exact base commit is unavailable or history materially differs.
- A migration would destroy or silently reinterpret M1–M4 data.
- Current YouTube or X policy prohibits the required local use.
- An official platform API materially changes or withdraws a required endpoint.
- Platform compliance cannot be implemented without retaining prohibited content.
- A paid X credential/budget becomes indispensable for platform-independent M5 completion.
- A source licence or user-document workflow creates a material legal/compliance conflict.
- A privacy, fairness, or security boundary would be weakened.
- Two acceptance criteria are genuinely incompatible.
- A required capability remains technically impossible after documented attempts.
- A proposed fix would start Milestone 6.

Do not consult for:

- Routine dependencies
- Internal names
- Migration organization
- UI layout
- Fixture wording
- Parser implementation
- Normal quota errors
- Missing optional platform credentials
- X budget exhaustion
- Refactors
- Performance tuning
- Documentation phrasing
- A monitored source returning no new content

---

# 37. Stop conditions

After all M5 acceptance criteria and quality gates pass:

1. Commit implementation, migrations, fixtures, evaluation corpora, docs, ADRs, screenshots, and completion report.
2. Push:

```text
milestone-5/creator-social-intelligence
```

3. Report:

```text
final HEAD
feature-complete commit if different
exact quality-gate results
completion-report path
live-platform tests actually performed
known deviations
genuine decisions needed after M5
```

4. Stop.

Do not:

- Merge to `main`
- Create a Milestone 6 branch
- Start personalisation, briefings, notifications, or hardening beyond M5 requirements
- Add authentication
- Add hosted deployment
- Add personal health tracking
- Add any new social platform
- Begin any Milestone 6+ work

Wait for the next project-manager brief.

---

# 38. AUTHORISED start message

> **AUTHORISED TO BEGIN:** Start Healthspan Dashboard Milestone 5 from exact commit `f809ffbbcb39a5d2fd50a9a2beb18a329f488233` and create `milestone-5/creator-social-intelligence`. Complete the bounded M4 hardening items, then implement the curated, provenance-first creator intelligence layer, compliant YouTube metadata monitoring, optional budget-capped X monitoring with deletion/compliance handling, user-supplied transcript/document workflow, atomic creator claims, evidence-alignment reviews, corrections/disclosures, Creator Watch, and monitored-claim recurrence defined in this brief. Assess claims rather than people; do not create trust, credibility, misinformation, influence, attention, engagement, or popularity scores; do not derive claims from YouTube API metadata; do not scrape captions or download media; never send X content to external AI; and preserve every M1–M4 scientific, regulatory, safety, privacy, no-dosing, no-vendor, and Live/Demo boundary. When every acceptance criterion and quality gate passes, push the branch, commit `docs/milestones/M5_COMPLETION_REPORT.md`, report the final commit hash and exact results, and stop before Milestone 6. Do not create or begin Milestone 6.
