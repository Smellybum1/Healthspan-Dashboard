import { DemoBanner } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { PageHeader } from '../components/Common';

const SECTIONS = [
  {
    title: 'Evidence maturity',
    body: 'We keep maturity on its own axis — from social/anecdotal claims through cell, animal, observational human, early interventional, controlled trials, replicated synthesis, and regulatory/guideline-supported use for a specified indication. These are never collapsed into a single “truth score”.',
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
    body: 'Spontaneous adverse-event systems (and demo stand-ins) are hypothesis-generating. They are not incidence rates and must not be presented as validated clinical conclusions.',
  },
  {
    title: 'AI-generated fields and provenance',
    body: 'Live intelligence is deterministic-first. Optional AI providers are disabled by default, must be schema-constrained, cannot write directly to the database, and cannot invent uncited claims. AI-assisted fields store provider/model/prompt/version and remain unreviewed until human confirmation.',
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
