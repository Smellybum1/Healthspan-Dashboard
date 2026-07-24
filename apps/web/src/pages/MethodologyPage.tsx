import { DemoBanner } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { PageHeader } from '../components/Common';

const SECTIONS = [
  {
    title: 'Evidence maturity',
    body: 'Live V2 keeps scientific evidence maturity on its own axis — social/anecdotal through cell, animal, observational human, early interventional, controlled trials, and replicated synthesis. Regulatory authorization, listing, licensing, or guideline status is never treated as an evidence-maturity stage; it lives in the separate Regulation & Safety workspace. Dimensions are never collapsed into a single “truth score”.',
  },
  {
    title: 'Evidence availability vs design',
    body: 'A registered randomised trial without results can establish that a controlled design exists, but it cannot produce an efficacy finding. Protocol/plan claims stay labelled separately from reported findings and registry-posted results.',
  },
  {
    title: 'Classification confidence',
    body: 'Live extraction confidence (high/medium/low/insufficient) is separate from scientific confidence. Low-confidence outputs route to the Review Queue and are never silently promoted.',
  },
  {
    title: 'Confidence factors',
    body: 'Confidence is explained with human-readable rationale covering design, sample size, comparator quality, randomisation/blinding, preregistration, endpoint relevance, hard vs surrogate outcomes, uncertainty, attrition, multiplicity, peer review, replication, consistency, funding/conflicts, and corrections or retractions.',
  },
  {
    title: 'Translation gaps',
    body: 'Cell→organism, animal→human, disease treatment→longevity, biomarker→health outcome, short-term→durable, association→causation, protocol→results, and selected sample→population gaps are labelled explicitly so mechanistic excitement is not mistaken for clinical readiness.',
  },
  {
    title: 'Attention versus evidence',
    body: 'Signal Radar plots evidence maturity against research-activity (Live) or attention momentum (Demo). High activity/attention does not upgrade evidence. Low activity does not downgrade strong results. Creator claims are scored as claims, not personalities.',
  },
  {
    title: 'Preprints',
    body: 'Preprints are labelled as preprints. They can be important early signals but are not interchangeable with peer-reviewed controlled evidence.',
  },
  {
    title: 'Trial-registry limitations',
    body: 'Registry records can lag, omit results, or change status without full context. Status timelines and “results posted” flags are shown separately from publication quality.',
  },
  {
    title: 'Adverse-event-report limitations',
    body: 'Spontaneous adverse-event systems (and demo stand-ins) are hypothesis-generating. They are not incidence rates and must not be presented as validated clinical conclusions. FDA AEMS “potential signals” are regulator-identified potential signals / new safety information — never proven causality.',
  },
  {
    title: 'Intervention identity and aliases',
    body: 'Canonical entities preserve salts, formulations, analogues, fragments, and combinations as distinct when warranted. Exact trusted identifiers or unique exact aliases may auto-map; ambiguous names go to the Entity Resolution queue. Presence in RxNorm/PubChem/GSRS is vocabulary identity only — not approval.',
  },
  {
    title: 'Regulatory scope',
    body: 'ARTG, Drugs@FDA, and Purple Book facts are product-, formulation-, route-, jurisdiction-, and indication-scoped when known. Register inclusion is not longevity evidence. A search miss is no_exact_match_found / not_checked — never silently “unapproved”.',
  },
  {
    title: 'Peptide identity limits',
    body: 'Peptide dossiers never invent amino-acid sequences from marketing names. Sequence is stored only when a recognized identity source supplies it. The product does not provide dosing, reconstitution, vendors, stacking, or treatment advice.',
  },
  {
    title: 'Comparison without ranking',
    body: 'Users may compare 2–4 interventions side-by-side across independent dimensions. There is no winner styling, recommendation, stacking suggestion, or safety ranking from spontaneous-report counts. Incomparable type/variant cells are flagged explicitly.',
  },
  {
    title: 'Creator claims, not creator worth',
    body: 'YouTube Data API metadata is operational context only and is never claim evidence. Claims come from user-supplied or authorised transcripts/documents with an explicit rights basis — never unofficial caption scrape, media download, or speech-to-text. X monitoring is optional, budget-capped, acknowledgement-gated, with no automatic recharge; X content is never sent to external AI. Alignment is multi-dimensional and claim-scoped. Monitored-claim recurrence uses formula m5.recurrence.1 over reviewed active claims and distinct monitored sources — never labelled popularity, influence, attention, or truth. The product never computes trust, credibility, misinformation, influence, attention, engagement, or popularity scores for people or organisations.',
  },
  {
    title: 'AI-generated fields and provenance',
    body: 'Live intelligence is deterministic-first. Optional creator AI assist is reserved and disabled by default (HEALTHSPAN_CREATOR_AI_ENABLED). Only rights-eligible user-supplied segments may reach external AI; YouTube API metadata and X content are hard-blocked. AI candidates never auto-publish adverse findings, cannot rank creators or infer sponsorship, and no model training/fine-tuning is performed. Completion does not require paid AI.',
  },
  {
    title: 'Informational, not medical advice',
    body: 'Healthspan Dashboard is a research-intelligence product. It is not a medical-advice engine, dosage guide, marketplace, peptide sourcing tool, or personal lifespan predictor. Decisions about care belong with qualified clinicians and the individual.',
  },
];

export function MethodologyPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Methodology"
        description="How Healthspan Dashboard separates evidence, attention, safety, and regulation — and why the product stays informational."
      />
      <DemoBanner notice={DEMO_SNAPSHOT_NOTICE} />
      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-base font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
