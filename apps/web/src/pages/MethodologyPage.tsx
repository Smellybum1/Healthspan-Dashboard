import { DemoBanner } from '@healthspan/ui';
import { DEMO_SNAPSHOT_NOTICE } from '@healthspan/core';
import { PageHeader } from '../components/Common';

const SECTIONS = [
  {
    title: 'Evidence maturity',
    body: 'We keep maturity on its own axis — from social/anecdotal claims through cell, animal, observational human, early interventional, controlled trials, replicated synthesis, and regulatory/guideline-supported use for a specified indication. These are never collapsed into a single “truth score”.',
  },
  {
    title: 'Confidence factors',
    body: 'Confidence is explained with human-readable rationale covering design, sample size, comparator quality, randomisation/blinding, preregistration, endpoint relevance, hard vs surrogate outcomes, uncertainty, attrition, multiplicity, peer review, replication, consistency, funding/conflicts, and corrections or retractions.',
  },
  {
    title: 'Translation gaps',
    body: 'Cell→organism, animal→human, disease treatment→longevity, biomarker→health outcome, short-term→durable, association→causation, and selected sample→population gaps are labelled explicitly so mechanistic excitement is not mistaken for clinical readiness.',
  },
  {
    title: 'Attention versus evidence',
    body: 'Signal Radar plots evidence maturity against attention momentum. High attention does not upgrade evidence. Low attention does not downgrade strong results. Creator claims are scored as claims, not personalities.',
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
    body: 'Milestone 1 uses rule-based labels and seeded rationale only — no live AI calls. Future AI-assisted fields must store model/provider, prompt/version, generation time, confidence, and source IDs. AI is an assistant, not the source of truth.',
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
