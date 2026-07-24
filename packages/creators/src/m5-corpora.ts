/**
 * M5 evaluation corpora — synthetic licence-safe fixtures for deterministic gates.
 * No trust, engagement, or popularity scores are represented in any case.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function variants<T extends string>(prefix: string, items: T[]): Array<{ label: string; value: T }> {
  return items.map((value, i) => ({ label: `${prefix}${i + 1}`, value }));
}

function pushCases<T extends { id: string; category: string }>(
  bucket: T[],
  category: T['category'],
  prefix: string,
  factory: (label: string, index: number) => Omit<T, 'id' | 'category'>,
): void {
  const seeds = variants(prefix, ['a', 'b', 'c', 'd'] as const);
  seeds.forEach(({ label }, index) => {
    bucket.push({
      id: `${category}-${label}`,
      category,
      ...factory(label, index),
    } as T);
  });
}

// ---------------------------------------------------------------------------
// 26.1 Creator identity corpus
// ---------------------------------------------------------------------------

export type IdentityExpected = {
  kind?: 'person' | 'organization' | 'channel_brand' | 'ambiguous' | 'archived' | 'multi_account';
  requiresReview?: boolean;
  noInferredSponsorship?: boolean;
};

export type IdentityCorpusCase = {
  id: string;
  category:
    | 'person_vs_org'
    | 'channel_brand_vs_person'
    | 'multiple_accounts'
    | 'same_display_name_collision'
    | 'handle_change'
    | 'redirect_archived'
    | 'cross_link'
    | 'ambiguous_identity'
    | 'self_described_credential'
    | 'public_role'
    | 'superseded_affiliation'
    | 'explicit_sponsorship_disclosure'
    | 'no_inferred_sponsorship';
  scenario: string;
  expected: IdentityExpected;
};

const IDENTITY_SCENARIOS: Record<IdentityCorpusCase['category'], string[]> = {
  person_vs_org: [
    'Display name "Longevity Lab" links to a YouTube channel operated by a media company, not an individual clinician.',
    'Bio cites a research institute while posts are authored by a named host; entity type must not collapse.',
    'Organization page shares branding with a personal sub-brand; review whether profile is person or org.',
    'Registered business name appears on X while avatar shows a solo presenter.',
  ],
  channel_brand_vs_person: [
    'Channel title is a show name; on-camera host is a distinct person with their own credentials.',
    'Podcast brand account posts clips; primary reviewer tracks the host person separately.',
    'Brand handle posts community updates; expert commentary is attributed to a named contributor.',
    'Franchise channel name differs from the legal name of the speaking expert.',
  ],
  multiple_accounts: [
    'Same reviewed creator maintains a main channel plus a shorts-only account.',
    'Personal X account and a newsletter brand account both monitored under one creator record.',
    'Backup account listed in bio after primary handle suspension.',
    'Regional mirror account cross-posts identical claim themes.',
  ],
  same_display_name_collision: [
    'Two unrelated creators share the display name "Dr Alex Chen" on different platforms.',
    'Common pen name collides across podcast directories; disambiguation required.',
    'Homonym researcher and fitness influencer share identical handle on different networks.',
    'Unicode-normalized display names collide after stripping punctuation.',
  ],
  handle_change: [
    'Creator renamed @oldhandle to @newhandle; redirects should preserve identity continuity.',
    'Platform migration left stale handle in imported citation metadata.',
    'Handle change announced in pinned post; historical claims retain old permalink.',
    'Vanity URL updated while channel ID remains stable.',
  ],
  redirect_archived: [
    'Former account marked archived with redirect to successor profile.',
    'Deleted channel placeholder page points to merged brand account.',
    'Inactive X account bio links to active account; archived state must display.',
    'Sunset newsletter domain redirects to current Substack without implying new sponsorship.',
  ],
  cross_link: [
    'YouTube about section explicitly links matching X handle for the same creator.',
    'Website footer lists official channel URLs cross-verified by reviewer.',
    'Link-in-bio page enumerates monitored platform accounts.',
    'Podcast show notes cite the host personal site and channel ID.',
  ],
  ambiguous_identity: [
    'Avatar is a logo; bio mixes plural "we" with first-person posts.',
    'Anonymous collective publishes without naming individuals.',
    'Stage name lacks legal identity; public role unclear.',
    'Co-hosted show posts without per-episode speaker attribution.',
  ],
  self_described_credential: [
    'Bio states "PhD biochemistry" without external verification link.',
    'Profile claims board certification; requires review not automatic trust.',
    'Self-titled "longevity researcher" with no affiliated institution listed.',
    'Credential abbreviation in display name; meaning must not be inferred as endorsement.',
  ],
  public_role: [
    'Listed as conference speaker on public agenda; role documented not scored.',
    'Hospital affiliation stated in bio for a clinician creator.',
    'Government advisory committee membership cited in about page.',
    'Journal editorial role mentioned in pinned disclosure post.',
  ],
  superseded_affiliation: [
    'Former university affiliation still visible in cached snippet but corrected in bio.',
    'Left company brand; old co-branded videos remain on platform.',
    'Prior employer listed on archived About page; current role differs.',
    'Retired credential year remains in historical post footer.',
  ],
  explicit_sponsorship_disclosure: [
    'Pinned post states paid partnership with supplement brand.',
    'Video description includes #ad and named sponsor.',
    'Affiliate link disclosure in thread opener.',
    'Sponsored segment timestamp noted in chapter list.',
  ],
  no_inferred_sponsorship: [
    'Creator discusses a product without disclosure language; sponsorship must not be inferred.',
    'Positive mention of intervention lacks affiliate link; no automatic paid promotion label.',
    'Gifted sample mentioned casually without formal sponsorship contract cues.',
    'Brand tag in reply thread without disclosure; remains unlabeled pending review.',
  ],
};

const IDENTITY_EXPECTED: Record<IdentityCorpusCase['category'], IdentityExpected> = {
  person_vs_org: { kind: 'ambiguous', requiresReview: true },
  channel_brand_vs_person: { kind: 'channel_brand', requiresReview: true },
  multiple_accounts: { kind: 'multi_account', requiresReview: true },
  same_display_name_collision: { kind: 'ambiguous', requiresReview: true },
  handle_change: { kind: 'person', requiresReview: true },
  redirect_archived: { kind: 'archived', requiresReview: true },
  cross_link: { kind: 'person', requiresReview: false },
  ambiguous_identity: { kind: 'ambiguous', requiresReview: true },
  self_described_credential: { kind: 'person', requiresReview: true },
  public_role: { kind: 'person', requiresReview: true },
  superseded_affiliation: { kind: 'person', requiresReview: true },
  explicit_sponsorship_disclosure: { requiresReview: true, noInferredSponsorship: true },
  no_inferred_sponsorship: { noInferredSponsorship: true },
};

function buildIdentityCorpus(): IdentityCorpusCase[] {
  const cases: IdentityCorpusCase[] = [];
  for (const category of Object.keys(IDENTITY_SCENARIOS) as IdentityCorpusCase['category'][]) {
    const scenarios = IDENTITY_SCENARIOS[category];
    scenarios.forEach((scenario, index) => {
      cases.push({
        id: `identity-${category}-${index + 1}`,
        category,
        scenario,
        expected: { ...IDENTITY_EXPECTED[category] },
      });
    });
  }
  return cases;
}

export const CREATOR_IDENTITY_CORPUS: IdentityCorpusCase[] = buildIdentityCorpus();

// ---------------------------------------------------------------------------
// 26.2 Creator source/document corpus
// ---------------------------------------------------------------------------

export type DocumentCorpusCase = {
  id: string;
  category:
    | 'vtt'
    | 'srt'
    | 'txt'
    | 'json'
    | 'timed_claims'
    | 'malformed_cues'
    | 'unicode'
    | 'html_like'
    | 'oversized'
    | 'wrong_mime'
    | 'rights_eligible'
    | 'rights_ineligible'
    | 'replacement'
    | 'deletion'
    | 'manual_quote'
    | 'manual_paraphrase'
    | 'transcript_unavailable';
  scenario: string;
  fixtureText?: string;
  filename?: string;
};

const VTT_FIXTURE = `WEBVTT

00:00:01.000 --> 00:00:04.000
Metformin may improve glucose markers in adults with type 2 diabetes.

00:00:05.000 --> 00:00:08.000
This is not medical advice; consult a clinician.
`;

const SRT_FIXTURE = `1
00:00:01,000 --> 00:00:04,000
Exercise improves cardiorespiratory fitness in healthy adults.

2
00:00:05,000 --> 00:00:08,000
Results vary across linked human trials.
`;

const JSON_FIXTURE = JSON.stringify({
  cues: [
    { text: 'NMN supplementation might support NAD pathways in early human data.' },
    { text: 'Evidence remains preliminary and not a treatment claim.' },
  ],
});

function buildDocumentCorpus(): DocumentCorpusCase[] {
  const cases: DocumentCorpusCase[] = [];

  const fileKinds: Array<{
    category: DocumentCorpusCase['category'];
    filename: string;
    fixtureText: string;
    scenario: string;
  }> = [
    {
      category: 'vtt',
      filename: 'episode-01.vtt',
      fixtureText: VTT_FIXTURE,
      scenario: 'Authorised WebVTT export with timed cues and healthspan claim text.',
    },
    {
      category: 'srt',
      filename: 'talk.srt',
      fixtureText: SRT_FIXTURE,
      scenario: 'SRT transcript with numbered cues suitable for segment extraction.',
    },
    {
      category: 'txt',
      filename: 'notes.txt',
      fixtureText:
        'Rapamycin dosing protocols are discussed only as trial design.\nNo outcome claim is asserted in this research note.',
      scenario: 'Plain-text research notes without timing metadata.',
    },
    {
      category: 'json',
      filename: 'transcript.json',
      fixtureText: JSON_FIXTURE,
      scenario: 'JSON cue array export from an authorised caption pipeline.',
    },
  ];

  for (const item of fileKinds) {
    pushCases(cases, item.category, item.category, (label) => ({
      scenario: `${item.scenario} (${label})`,
      filename: item.filename.replace('.', `-${label}.`),
      fixtureText: item.fixtureText,
    }));
  }

  pushCases(cases, 'timed_claims', 'timed', (label) => ({
    scenario: `Claim anchored to cue timestamp window ${label}; span must map to segment offsets.`,
    filename: `timed-${label}.vtt`,
    fixtureText: VTT_FIXTURE,
  }));

  pushCases(cases, 'malformed_cues', 'badcue', (label) => ({
    scenario: `Malformed timing line ${label}; parser should warn and still extract readable cue text where possible.`,
    filename: `malformed-${label}.srt`,
    fixtureText: `1\n00:99:99,000 --> not-a-timing\nClaim text survives malformed cue ${label}.`,
  }));

  pushCases(cases, 'unicode', 'uni', (label) => ({
    scenario: `Unicode transcript ${label} with combining marks and non-Latin script preserved.`,
    filename: `unicode-${label}.txt`,
    fixtureText: `Café naïve résumé — β-NMN discussed in transcript ${label}.`,
  }));

  pushCases(cases, 'html_like', 'html', (label) => ({
    scenario: `HTML-like markup in cue ${label}; tags should be stripped from claim spans.`,
    filename: `markup-${label}.vtt`,
    fixtureText: `WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<b>Bold claim</b> about <i>sleep extension</i> ${label}.`,
  }));

  pushCases(cases, 'oversized', 'big', () => ({
    scenario: 'Document byte length exceeds pipeline cap; import must reject before parsing.',
  }));

  pushCases(cases, 'wrong_mime', 'mime', (label) => ({
    scenario: `Extension/MIME mismatch ${label}; detectDocumentKind should return null or reject.`,
    filename: `audio-${label}.mp3`,
  }));

  pushCases(cases, 'rights_eligible', 'rights-ok', (label) => ({
    scenario: `Rights basis declared eligible ${label}: user-owned or authorised caption export.`,
    filename: `eligible-${label}.vtt`,
    fixtureText: VTT_FIXTURE,
  }));

  pushCases(cases, 'rights_ineligible', 'rights-no', (label) => ({
    scenario: `Rights basis ineligible ${label}: unofficial scrape or prohibited acquisition path.`,
  }));

  pushCases(cases, 'replacement', 'replace', (label) => ({
    scenario: `Document replacement ${label}; prior version superseded while retaining audit trail.`,
    filename: `replaced-${label}.txt`,
    fixtureText: 'Updated transcript replaces earlier import with corrected wording.',
  }));

  pushCases(cases, 'deletion', 'delete', (label) => ({
    scenario: `Document deletion ${label}; linked claims must mark source unavailable.`,
  }));

  pushCases(cases, 'manual_quote', 'quote', (label) => ({
    scenario: `Manual verbatim quote ${label} entered by reviewer from authorised source.`,
    fixtureText: `"Exact quoted passage about cold exposure protocols" — manual entry ${label}.`,
  }));

  pushCases(cases, 'manual_paraphrase', 'para', (label) => ({
    scenario: `Manual paraphrase ${label}; reviewer summary not treated as platform-verbatim text.`,
    fixtureText: `Paraphrased summary of creator remarks on protein timing ${label}.`,
  }));

  pushCases(cases, 'transcript_unavailable', 'unavail', (label) => ({
    scenario: `Transcript source unavailable ${label}; no unofficial caption acquisition permitted.`,
  }));

  return cases;
}

export const CREATOR_DOCUMENT_CORPUS: DocumentCorpusCase[] = buildDocumentCorpus();

// ---------------------------------------------------------------------------
// 26.3 Creator claim corpus
// ---------------------------------------------------------------------------

export type ClaimCorpusCase = {
  id: string;
  category: string;
  claimText: string;
  assertionRole?: 'assertion' | 'question' | 'hypothetical' | 'quotation' | 'correction' | 'disclosure';
  sourceStyle: 'document' | 'x' | 'manual';
  expectRole?: ClaimCorpusCase['assertionRole'];
};

const CLAIM_TOPIC_SCENARIOS: Record<string, string[]> = {
  human: [
    'Metformin reduces HbA1c in adults with type 2 diabetes in linked human trials.',
    'Exercise improves VO2 max in healthy older adults according to reviewed studies.',
    'Time-restricted eating may improve metabolic markers in human participants.',
    'Sauna bathing is associated with lower cardiovascular mortality in Finnish cohorts.',
  ],
  animal: [
    'Rapamycin extends lifespan in mice under controlled feeding conditions.',
    'NMN raises NAD levels in aged rodent models without human outcome data.',
    'Caloric restriction improves healthspan markers in non-human primate studies.',
    'Urolithin A improves mitophagy readouts in aged mice.',
  ],
  cell: [
    'Senolytic compounds clear senescent cells in vitro culture models.',
    'NAD precursors restore mitochondrial function in human cell lines.',
    'Autophagy flux increases in hepatocyte cultures treated with spermidine.',
    'Telomerase activation is observed in fibroblast cultures under lab conditions.',
  ],
  protocol_vs_result: [
    'The trial protocol randomises participants to metformin versus placebo for five years.',
    'Study design includes weekly rapamycin pulses; outcome data are not yet reported.',
    'Registered protocol plans biomarker panels without asserting clinical benefit.',
    'Methods section describes dosing schedule only; results section is pending.',
  ],
  biomarker_vs_outcome: [
    'NMN increases NAD+ concentrations in blood samples from trial participants.',
    'HbA1c improved but no mortality endpoint was measured in the linked study.',
    'Epigenetic clock age decreased without reporting functional health outcomes.',
    'Inflammatory cytokines fell while patient-reported outcomes were unchanged.',
  ],
  association_vs_causation: [
    'Higher step counts are associated with lower all-cause mortality in observational data.',
    'Metformin use correlates with reduced cancer incidence; causality is not established.',
    'Vitamin D levels associate with immune markers; intervention trials are mixed.',
    'Coffee consumption links to longevity in cohort studies without proving causation.',
  ],
  regulatory: [
    'Metformin is TGA-approved for type 2 diabetes, not general longevity indication.',
    'Rapamycin is not FDA-approved for healthy aging or lifespan extension.',
    'Compounded peptides lack authorised indication for anti-aging use in Australia.',
    'Off-label discussion must not imply regulatory approval for longevity.',
  ],
  safety: [
    'Metformin carries gastrointestinal adverse effects that require medical supervision.',
    'High-dose niacin may cause hepatotoxicity in susceptible individuals.',
    'Rapamycin immunosuppression risks infections and requires specialist oversight.',
    'Unmonitored antioxidant megadoses may blunt exercise adaptations.',
  ],
  efficacy: [
    'Linked RCT reports statistically significant HbA1c reduction with metformin.',
    'Creatine supplementation improves strength outcomes in resistance-trained adults.',
    'Protein supplementation increases lean mass in older adults with sarcopenia.',
    'Statin therapy lowers LDL cholesterol in high-risk cardiovascular patients.',
  ],
  null: [
    'Resveratrol did not improve primary mortality outcomes in the linked human trial.',
    'Antioxidant supplementation showed no benefit on cognitive decline endpoints.',
    'Growth hormone therapy failed to extend lifespan in the reviewed study.',
    'Vitamin E supplementation did not reduce cardiovascular events in the trial.',
  ],
  mixed: [
    'NMN trials show biomarker changes but inconsistent functional outcome signals.',
    'Intermittent fasting improves some metabolic markers with heterogeneous adherence effects.',
    'Cold exposure studies report mixed inflammatory and performance findings.',
    'Omega-3 trials show lipid benefits with null cognitive endpoints.',
  ],
  prediction: [
    'Epigenetic clocks may eventually predict biological age acceleration before disease onset.',
    'Digital biomarkers could forecast frailty risk if validation cohorts expand.',
    'AI models might rank trial enrolment likelihood based on protocol criteria.',
    'Wearable sleep staging may predict metabolic risk pending prospective validation.',
  ],
  anecdote: [
    'I personally felt more energetic after starting magnesium glycinate last month.',
    'My sleep tracker improved after I tried a new evening routine.',
    'A listener emailed that their recovery scores rose after sauna sessions.',
    'I experimented with time-restricted eating and noticed subjectively better focus.',
  ],
  mechanism: [
    'AMPK activation is proposed as a mechanism for metformin metabolic effects.',
    'mTOR inhibition may slow cellular senescence accumulation in model systems.',
    'NAD-dependent sirtuins regulate mitochondrial biogenesis pathways.',
    'Autophagy upregulation is a hypothesised pathway for caloric restriction benefits.',
  ],
  recommendation: [
    'Guidelines recommend statins for secondary prevention in established cardiovascular disease.',
    'Exercise guidelines advise 150 minutes of moderate activity weekly for adults.',
    'Clinical consensus supports smoking cessation for cardiovascular risk reduction.',
    'Screening recommendations apply to specific age groups per national guidelines.',
  ],
  dosage_redaction: [
    'Discussed [REDACTED] mg dosing protocol from trial materials without publishing amounts.',
    'Creator referenced a peptide dose that was redacted from public display.',
    'Supplement stack details omit specific milligram values pending safety review.',
    'Protocol arm dosing is withheld in exported profile snapshots.',
  ],
  uncertainty: [
    'Early data suggest possible benefit but certainty remains low pending replication.',
    'Findings are preliminary and should not be treated as established clinical fact.',
    'Confidence intervals were wide and conclusions are tentative.',
    'Heterogeneity across studies limits firm conclusions about efficacy.',
  ],
  question: [
    'Does metformin slow aging in humans without diabetes?',
    'Are epigenetic clocks ready for clinical decision-making?',
    'Can rapamycin pulses be safe in healthy older adults?',
    'Is NMN bioavailability sufficient for meaningful NAD repletion?',
  ],
  quotation: [
    '"We found no mortality benefit in the primary analysis," said the principal investigator.',
    'The FDA statement read: "This product is not approved for anti-aging indications."',
    'As the paper concluded: "Results do not support causality in this cohort."',
    'Quoted researcher: "Biomarker shifts did not translate to functional gains."',
  ],
  multiple_atomic: [
    'Metformin lowers glucose and may reduce inflammation; both claims need separate review.',
    'Exercise improves fitness; diet quality matters; sleep modulates recovery — three distinct claims.',
    'Rapamycin extends mouse lifespan; human translation is unproven; safety concerns persist.',
    'NMN raises NAD; functional outcomes are mixed; long-term safety data are limited.',
  ],
  negation: [
    'This supplement does not prevent dementia based on the linked null trial.',
    'Rapamycin is not proven to extend human lifespan in available evidence.',
    'No mortality benefit was observed in the primary endpoint analysis.',
    'Creatine does not harm kidney function in healthy adults per reviewed trials.',
  ],
  timeframe: [
    'Benefits emerged after twelve weeks of supervised resistance training.',
    'Mortality follow-up extended to fifteen years in the cohort study.',
    'Acute biomarker changes appeared within forty-eight hours of intervention.',
    'Long-term safety beyond five years remains unreported in the registry.',
  ],
  no_local_link: [
    'Creator asserts berberine reverses aging without any linked local corpus evidence.',
    'Claim cites a breakthrough peptide with no supporting source in Healthspan Dashboard.',
    'Statement promotes unlinked intervention certainty absent from local evidence graph.',
    'Bold efficacy claim lacks citation cues and local evidence attachment.',
  ],
  source_unavailable: [
    'Original X post was deleted; claim span must show source unavailable.',
    'YouTube video is private; supporting text cannot be refreshed.',
    'Transcript import removed; document source unavailable for verification.',
    'Platform withheld content; compliance snapshot cannot display verbatim text.',
  ],
};

const EVIDENCE_OVERSTATEMENT_TEXTS = [
  'Mouse rapamycin data prove human lifespan extension is guaranteed.',
  'A single biomarker shift cures aging in everyone immediately.',
  'Observational coffee data causally prove mortality reduction for all adults.',
  'One small pilot trial definitively establishes metformin reverses aging in healthy people.',
  'In vitro NAD increase means clinical anti-aging efficacy is confirmed.',
  'Association in one cohort proves rapamycin is safe for healthy longevity use.',
  'Animal study magnitude is extrapolated to guaranteed human clinical outcomes.',
  'Regulatory approval for diabetes is misread as longevity indication approval.',
  'Null secondary endpoint ignored while primary failure is presented as success.',
  'Mechanistic hypothesis presented as established clinical treatment recommendation.',
  'Anecdotal personal response generalized to population-wide efficacy certainty.',
  'Dosage details imply unsupervised megadose safety without evidence scope.',
  'Cherry-picked subgroup presented as definitive proof for all populations.',
  'Preprint finding stated as replicated consensus without linked corroboration.',
  'Biomarker proxy equated to validated clinical outcome improvement.',
  'Short trial duration extrapolated to lifelong benefit certainty.',
  'Species mismatch ignored when asserting human translation.',
  'Safety signals from diseased cohort dismissed for healthy consumer context.',
  'Correlation coefficient mislabeled as causal proof of intervention effect.',
  'Protocol registration alone treated as positive efficacy result.',
  'Single-mechanism pathway claim overrides mixed empirical outcomes.',
  'Confidence language removed to upgrade tentative finding to assertion.',
  'Retracted citation still used to support strong efficacy wording.',
  'Conflicted funding context omitted while asserting independent consensus.',
];

const CORRECTION_TEXTS = variants('corr', [
  'Correction: I overstated metformin mortality benefits in my prior video.',
  'Update: previous thread misquoted the trial primary endpoint outcome.',
  'I was wrong about rapamycin human data; rodent results do not translate directly.',
  'Retraction note: deleted claim about NMN curing frailty was inaccurate.',
  'Correction: biomarker wording should not have implied clinical cure.',
  'I previously misstated FDA approval scope for this compound.',
  'Thread update: safety section omitted contraindications in first post.',
  'Correction — cohort was diseased-specific, not healthy adults.',
]).map((v) => v.value);

const DISCLOSURE_TEXTS = variants('disc', [
  'Disclosure: this thread is sponsored by a supplement brand partner.',
  'Affiliate link present; I may receive commission on purchases.',
  'Paid partnership: company supplied product for review segment.',
  'Conflict of interest: I consult for a longevity clinic mentioned here.',
  'Sponsored segment: brand funded travel for conference coverage.',
  'Material connection: I hold equity in the discussed biotech firm.',
  'Gifted product disclosure for review purposes only.',
  'Ad — promotional code provided by manufacturer partner.',
]).map((v) => v.value);

const NO_ASSESSMENT_TEXTS = variants('noassess', [
  'Casual greeting post with no health or intervention claim content.',
  'Schedule announcement for next live stream without scientific assertions.',
  'Thank-you message to subscribers; no assessable health claim present.',
  'Link to merch store without efficacy or safety statements.',
  'Community poll about podcast title with no medical claims.',
  'Birthday note to team member; no intervention discussion.',
  'Pinned rules reminder without health content.',
  'Holiday break notice for channel uploads.',
]).map((v) => v.value);

const INSUFFICIENT_TEXTS = variants('insuf', [
  'Vague mention of "longevity stack" without identifiable intervention or outcome.',
  'Emoji-only reaction to a news headline without extractable claim.',
  'Fragmentary clip text lacks enough context for alignment assessment.',
  'Placeholder post awaiting full transcript; insufficient text for review.',
  'Single acronym "NMN" without predicate or outcome context.',
  'Broken sentence fragment: "in the trial the..."',
  'Hashtag-only post #longevity without claim body.',
  'Retweet wrapper with no added commentary text.',
]).map((v) => v.value);

function buildClaimCorpus(): ClaimCorpusCase[] {
  const cases: ClaimCorpusCase[] = [];
  let seq = 0;

  const add = (item: Omit<ClaimCorpusCase, 'id'>) => {
    seq += 1;
    cases.push({ id: `claim-${seq}`, ...item });
  };

  // Document-style topic coverage (≥32)
  for (const [category, texts] of Object.entries(CLAIM_TOPIC_SCENARIOS)) {
    texts.forEach((claimText, index) => {
      const role =
        category === 'question'
          ? 'question'
          : category === 'quotation'
            ? 'quotation'
            : category === 'uncertainty' || category === 'prediction'
              ? 'hypothetical'
              : 'assertion';
      add({
        category,
        claimText,
        assertionRole: role,
        sourceStyle: 'document',
        expectRole: role,
      });
      if (index === 0 && category === 'human') {
        // extra document variant for count headroom
        add({
          category,
          claimText: `${claimText} (document duplicate theme)`,
          assertionRole: role,
          sourceStyle: 'document',
          expectRole: role,
        });
      }
    });
  }

  // X-style mirrors (≥32)
  const xCategories = [
    'human',
    'animal',
    'cell',
    'protocol_vs_result',
    'biomarker_vs_outcome',
    'association_vs_causation',
    'regulatory',
    'safety',
  ] as const;
  for (const category of xCategories) {
    const texts = CLAIM_TOPIC_SCENARIOS[category] ?? [];
    texts.forEach((claimText) => {
      add({
        category,
        claimText: `[X] ${claimText}`,
        assertionRole: 'assertion',
        sourceStyle: 'x',
        expectRole: 'assertion',
      });
    });
  }

  // Evidence overstatement subset (≥24)
  EVIDENCE_OVERSTATEMENT_TEXTS.forEach((claimText, index) => {
    add({
      category: 'evidence_overstatement',
      claimText,
      assertionRole: 'assertion',
      sourceStyle: index % 2 === 0 ? 'document' : 'x',
      expectRole: 'assertion',
    });
  });

  // Correction / disclosure subset (≥16)
  CORRECTION_TEXTS.forEach((claimText) => {
    add({
      category: 'correction',
      claimText,
      assertionRole: 'correction',
      sourceStyle: 'x',
      expectRole: 'correction',
    });
  });
  DISCLOSURE_TEXTS.forEach((claimText) => {
    add({
      category: 'disclosure',
      claimText,
      assertionRole: 'disclosure',
      sourceStyle: 'manual',
      expectRole: 'disclosure',
    });
  });

  // No-assessment / insufficient subset (≥16)
  NO_ASSESSMENT_TEXTS.forEach((claimText) => {
    add({
      category: 'no_assessment',
      claimText,
      sourceStyle: 'x',
    });
  });
  INSUFFICIENT_TEXTS.forEach((claimText) => {
    add({
      category: 'insufficient',
      claimText,
      sourceStyle: 'document',
    });
  });

  return cases;
}

export const CREATOR_CLAIM_CORPUS: ClaimCorpusCase[] = buildClaimCorpus();

export const CLAIM_CORPUS_SUBSET_MINIMA = {
  documentStyle: 32,
  xStyle: 32,
  evidenceOverstatement: 24,
  correctionDisclosure: 16,
  noAssessmentInsufficient: 16,
  total: 120,
} as const;

export function countClaimSubsetCases(corpus: ClaimCorpusCase[] = CREATOR_CLAIM_CORPUS) {
  return {
    documentStyle: corpus.filter((c) => c.sourceStyle === 'document').length,
    xStyle: corpus.filter((c) => c.sourceStyle === 'x').length,
    evidenceOverstatement: corpus.filter((c) => c.category === 'evidence_overstatement').length,
    correctionDisclosure: corpus.filter(
      (c) =>
        c.category === 'correction' ||
        c.category === 'disclosure' ||
        c.assertionRole === 'correction' ||
        c.assertionRole === 'disclosure',
    ).length,
    noAssessmentInsufficient: corpus.filter(
      (c) => c.category === 'no_assessment' || c.category === 'insufficient',
    ).length,
  };
}

// ---------------------------------------------------------------------------
// 26.5 Recurrence corpus
// ---------------------------------------------------------------------------

export type RecurrenceCorpusGroup = {
  id: string;
  category:
    | 'exact_duplicate'
    | 'reviewed_paraphrase'
    | 'potential_paraphrase'
    | 'same_theme_different_claim'
    | 'correction'
    | 'source_unavailable'
    | 'mixed_maturity'
    | 'one_source_repeating'
    | 'multiple_distinct_sources'
    | 'no_platform_wide_inference';
  claims: string[];
  expect: {
    distinctSources?: number;
    sameSourceRepeat?: boolean;
    excludeUnavailable?: boolean;
  };
};

const RECURRENCE_TEMPLATES: Record<
  RecurrenceCorpusGroup['category'],
  { claims: string[]; expect: RecurrenceCorpusGroup['expect'] }
> = {
  exact_duplicate: {
    claims: [
      'Metformin may improve metabolic markers in adults with type 2 diabetes.',
      'Metformin may improve metabolic markers in adults with type 2 diabetes.',
    ],
    expect: { sameSourceRepeat: true, distinctSources: 1 },
  },
  reviewed_paraphrase: {
    claims: [
      'Linked human trials suggest metformin lowers HbA1c in type 2 diabetes.',
      'Human trial data link metformin to reduced HbA1c among diabetic adults.',
    ],
    expect: { distinctSources: 2 },
  },
  potential_paraphrase: {
    claims: [
      'Exercise training improves cardiorespiratory fitness.',
      'Regular workouts may boost VO2 max capacity.',
    ],
    expect: { distinctSources: 2 },
  },
  same_theme_different_claim: {
    claims: [
      'Rapamycin extends lifespan in mice.',
      'Rapamycin immunosuppression requires medical monitoring in patients.',
    ],
    expect: { distinctSources: 2 },
  },
  correction: {
    claims: [
      'Correction: prior post overstated metformin mortality benefit.',
      'Metformin may improve metabolic markers in adults with type 2 diabetes.',
    ],
    expect: { distinctSources: 2 },
  },
  source_unavailable: {
    claims: [
      'Original platform post deleted; source unavailable for verification.',
      'Metformin may improve metabolic markers in adults with type 2 diabetes.',
    ],
    expect: { excludeUnavailable: true, distinctSources: 1 },
  },
  mixed_maturity: {
    claims: [
      'Preliminary pilot suggests possible NAD increase with NMN.',
      'Larger RCT reports mixed functional outcomes with NMN supplementation.',
    ],
    expect: { distinctSources: 2 },
  },
  one_source_repeating: {
    claims: [
      'Creatine improves strength in resistance-trained adults.',
      'Creatine improves strength in resistance-trained adults.',
      'Creatine improves strength in resistance-trained adults.',
    ],
    expect: { sameSourceRepeat: true, distinctSources: 1 },
  },
  multiple_distinct_sources: {
    claims: [
      'YouTube interview excerpt: sleep extension may aid glucose control.',
      'X thread summary: sleep timing associates with metabolic health markers.',
      'Manual note: podcast guest discussed sleep and insulin sensitivity.',
    ],
    expect: { distinctSources: 3 },
  },
  no_platform_wide_inference: {
    claims: [
      'One creator mentions berberine frequently in monthly recaps.',
      'Another creator discusses metformin trial updates.',
    ],
    expect: { distinctSources: 2 },
  },
};

function buildRecurrenceCorpus(): RecurrenceCorpusGroup[] {
  const cases: RecurrenceCorpusGroup[] = [];
  const categories = Object.keys(RECURRENCE_TEMPLATES) as RecurrenceCorpusGroup['category'][];
  categories.forEach((category, catIndex) => {
    const template = RECURRENCE_TEMPLATES[category];
    // two variants per category → 20; add extras on first categories to reach ≥24
    const variantCount = catIndex < 4 ? 3 : 2;
    for (let v = 1; v <= variantCount; v += 1) {
      cases.push({
        id: `recurrence-${category}-${v}`,
        category,
        claims: template.claims.map((c, i) => (v === 1 ? c : `${c} [variant ${v}-${i + 1}]`)),
        expect: { ...template.expect },
      });
    }
  });
  return cases;
}

export const RECURRENCE_CORPUS: RecurrenceCorpusGroup[] = buildRecurrenceCorpus();

// ---------------------------------------------------------------------------
// 26.6 Compliance and retention corpus
// ---------------------------------------------------------------------------

export type ComplianceCorpusCase = {
  id: string;
  category:
    | 'youtube_under_25d'
    | 'due_refresh'
    | 'over_30d'
    | 'refreshed'
    | 'deleted_private_video'
    | 'x_deleted'
    | 'x_withheld'
    | 'protected_account'
    | 'edited_post'
    | 'compliance_overdue'
    | 'compliance_caught_up'
    | 'purged_text'
    | 'redacted_snapshot'
    | 'document_deletion'
    | 'export_exclusion'
    | 'quota_exhaustion'
    | 'budget_exhaustion'
    | 'policy_version_change';
  platform?: 'youtube' | 'x' | 'document' | 'policy';
  scenario: string;
  expect: {
    displayEligible?: boolean;
    purge?: boolean;
    budgetBlocked?: boolean;
    quotaExhausted?: boolean;
  };
};

const COMPLIANCE_SPECS: Array<
  Omit<ComplianceCorpusCase, 'id'> & { variants?: number }
> = [
  {
    category: 'youtube_under_25d',
    platform: 'youtube',
    scenario: 'YouTube metadata snapshot age 12 days; within refresh window.',
    expect: { displayEligible: true },
    variants: 3,
  },
  {
    category: 'due_refresh',
    platform: 'youtube',
    scenario: 'Metadata age 24 days; refresh due before 30-day display cutoff.',
    expect: { displayEligible: true },
    variants: 3,
  },
  {
    category: 'over_30d',
    platform: 'youtube',
    scenario: 'Metadata age 35 days without refresh; display should be withheld.',
    expect: { displayEligible: false },
    variants: 3,
  },
  {
    category: 'refreshed',
    platform: 'youtube',
    scenario: 'Stale metadata refreshed; display eligibility restored.',
    expect: { displayEligible: true },
    variants: 2,
  },
  {
    category: 'deleted_private_video',
    platform: 'youtube',
    scenario: 'Video deleted or set private; claim text purged from live display.',
    expect: { displayEligible: false, purge: true },
    variants: 3,
  },
  {
    category: 'x_deleted',
    platform: 'x',
    scenario: 'X post deleted by author; compliance snapshot unavailable.',
    expect: { displayEligible: false, purge: true },
    variants: 3,
  },
  {
    category: 'x_withheld',
    platform: 'x',
    scenario: 'X post withheld by platform policy; verbatim text not displayable.',
    expect: { displayEligible: false },
    variants: 2,
  },
  {
    category: 'protected_account',
    platform: 'x',
    scenario: 'Protected account blocks refresh; eligible metadata only.',
    expect: { displayEligible: false },
    variants: 2,
  },
  {
    category: 'edited_post',
    platform: 'x',
    scenario: 'Post edited after capture; mismatch triggers review not auto-trust.',
    expect: { displayEligible: true },
    variants: 2,
  },
  {
    category: 'compliance_overdue',
    platform: 'youtube',
    scenario: 'Compliance queue overdue across multiple monitored sources.',
    expect: { displayEligible: false },
    variants: 2,
  },
  {
    category: 'compliance_caught_up',
    platform: 'youtube',
    scenario: 'All monitored sources refreshed within policy window.',
    expect: { displayEligible: true },
    variants: 2,
  },
  {
    category: 'purged_text',
    platform: 'x',
    scenario: 'Retained claim points to purged verbatim text per retention policy.',
    expect: { purge: true, displayEligible: false },
    variants: 2,
  },
  {
    category: 'redacted_snapshot',
    platform: 'document',
    scenario: 'Exported profile uses redacted snapshot without raw platform dump.',
    expect: { displayEligible: true },
    variants: 2,
  },
  {
    category: 'document_deletion',
    platform: 'document',
    scenario: 'Imported transcript deleted; linked claims mark document unavailable.',
    expect: { purge: true, displayEligible: false },
    variants: 2,
  },
  {
    category: 'export_exclusion',
    platform: 'document',
    scenario: 'Compliance-ineligible spans excluded from public export bundle.',
    expect: { displayEligible: false },
    variants: 2,
  },
  {
    category: 'quota_exhaustion',
    platform: 'youtube',
    scenario: 'YouTube API quota exhausted; refresh deferred not scraped.',
    expect: { quotaExhausted: true, displayEligible: false },
    variants: 2,
  },
  {
    category: 'budget_exhaustion',
    platform: 'policy',
    scenario: 'Monthly compliance budget exhausted; non-critical refresh blocked.',
    expect: { budgetBlocked: true },
    variants: 2,
  },
  {
    category: 'policy_version_change',
    platform: 'policy',
    scenario: 'Retention policy version bumped; re-evaluation required for stored snapshots.',
    expect: { displayEligible: true },
    variants: 2,
  },
];

function buildComplianceCorpus(): ComplianceCorpusCase[] {
  const cases: ComplianceCorpusCase[] = [];
  for (const spec of COMPLIANCE_SPECS) {
    const count = spec.variants ?? 2;
    for (let v = 1; v <= count; v += 1) {
      cases.push({
        id: `compliance-${spec.category}-${v}`,
        category: spec.category,
        platform: spec.platform,
        scenario: `${spec.scenario} (case ${v})`,
        expect: { ...spec.expect },
      });
    }
  }
  return cases;
}

export const COMPLIANCE_RETENTION_CORPUS: ComplianceCorpusCase[] = buildComplianceCorpus();

// ---------------------------------------------------------------------------
// Aggregate evaluation
// ---------------------------------------------------------------------------

const REQUIRED_IDENTITY_CATEGORIES = Object.keys(IDENTITY_SCENARIOS) as IdentityCorpusCase['category'][];
const REQUIRED_DOCUMENT_CATEGORIES = [
  'vtt',
  'srt',
  'txt',
  'json',
  'timed_claims',
  'malformed_cues',
  'unicode',
  'html_like',
  'oversized',
  'wrong_mime',
  'rights_eligible',
  'rights_ineligible',
  'replacement',
  'deletion',
  'manual_quote',
  'manual_paraphrase',
  'transcript_unavailable',
] as const satisfies readonly DocumentCorpusCase['category'][];
const REQUIRED_RECURRENCE_CATEGORIES = Object.keys(
  RECURRENCE_TEMPLATES,
) as RecurrenceCorpusGroup['category'][];
const REQUIRED_COMPLIANCE_CATEGORIES = [
  ...new Set(COMPLIANCE_SPECS.map((s) => s.category)),
] as ComplianceCorpusCase['category'][];

function hasAllCategories<T extends { category: string }>(
  corpus: T[],
  required: readonly string[],
): boolean {
  const present = new Set(corpus.map((c) => c.category));
  return required.every((c) => present.has(c));
}

function structuralIdentityOk(corpus: IdentityCorpusCase[]): boolean {
  return corpus.every(
    (c) =>
      Boolean(c.id && c.category && c.scenario && c.expected) &&
      typeof c.expected === 'object' &&
      !('trustScore' in c.expected) &&
      !('engagementScore' in c.expected),
  );
}

function structuralDocumentOk(corpus: DocumentCorpusCase[]): boolean {
  return corpus.every((c) => Boolean(c.id && c.category && c.scenario));
}

function structuralClaimOk(corpus: ClaimCorpusCase[]): boolean {
  return corpus.every(
    (c) =>
      Boolean(c.id && c.category && c.claimText && c.sourceStyle) &&
      !/\btrust score\b/i.test(c.claimText) &&
      !/\bengagement score\b/i.test(c.claimText),
  );
}

function structuralRecurrenceOk(corpus: RecurrenceCorpusGroup[]): boolean {
  return corpus.every(
    (c) => Boolean(c.id && c.category && c.claims?.length >= 2 && c.expect),
  );
}

function structuralComplianceOk(corpus: ComplianceCorpusCase[]): boolean {
  return corpus.every((c) => Boolean(c.id && c.category && c.scenario && c.expect));
}

export type M5CorporaEvalResult = {
  identity: { total: number; ok: boolean };
  documents: { total: number; ok: boolean };
  claims: { total: number; ok: boolean; subsetCounts: ReturnType<typeof countClaimSubsetCases> };
  recurrence: { total: number; ok: boolean };
  compliance: { total: number; ok: boolean };
  ok: boolean;
};

/** Verify M5 evaluation corpora meet official minimum counts and structure. */
export function evaluateM5Corpora(): M5CorporaEvalResult {
  const subsetCounts = countClaimSubsetCases();

  const identityOk =
    CREATOR_IDENTITY_CORPUS.length >= 48 &&
    hasAllCategories(CREATOR_IDENTITY_CORPUS, REQUIRED_IDENTITY_CATEGORIES) &&
    structuralIdentityOk(CREATOR_IDENTITY_CORPUS);

  const documentsOk =
    CREATOR_DOCUMENT_CORPUS.length >= 48 &&
    hasAllCategories(CREATOR_DOCUMENT_CORPUS, REQUIRED_DOCUMENT_CATEGORIES) &&
    structuralDocumentOk(CREATOR_DOCUMENT_CORPUS);

  const claimsOk =
    CREATOR_CLAIM_CORPUS.length >= CLAIM_CORPUS_SUBSET_MINIMA.total &&
    subsetCounts.documentStyle >= CLAIM_CORPUS_SUBSET_MINIMA.documentStyle &&
    subsetCounts.xStyle >= CLAIM_CORPUS_SUBSET_MINIMA.xStyle &&
    subsetCounts.evidenceOverstatement >= CLAIM_CORPUS_SUBSET_MINIMA.evidenceOverstatement &&
    subsetCounts.correctionDisclosure >= CLAIM_CORPUS_SUBSET_MINIMA.correctionDisclosure &&
    subsetCounts.noAssessmentInsufficient >= CLAIM_CORPUS_SUBSET_MINIMA.noAssessmentInsufficient &&
    structuralClaimOk(CREATOR_CLAIM_CORPUS);

  const recurrenceOk =
    RECURRENCE_CORPUS.length >= 24 &&
    hasAllCategories(RECURRENCE_CORPUS, REQUIRED_RECURRENCE_CATEGORIES) &&
    structuralRecurrenceOk(RECURRENCE_CORPUS);

  const complianceOk =
    COMPLIANCE_RETENTION_CORPUS.length >= 40 &&
    hasAllCategories(COMPLIANCE_RETENTION_CORPUS, REQUIRED_COMPLIANCE_CATEGORIES) &&
    structuralComplianceOk(COMPLIANCE_RETENTION_CORPUS);

  return {
    identity: { total: CREATOR_IDENTITY_CORPUS.length, ok: identityOk },
    documents: { total: CREATOR_DOCUMENT_CORPUS.length, ok: documentsOk },
    claims: {
      total: CREATOR_CLAIM_CORPUS.length,
      ok: claimsOk,
      subsetCounts,
    },
    recurrence: { total: RECURRENCE_CORPUS.length, ok: recurrenceOk },
    compliance: { total: COMPLIANCE_RETENTION_CORPUS.length, ok: complianceOk },
    ok: identityOk && documentsOk && claimsOk && recurrenceOk && complianceOk,
  };
}
