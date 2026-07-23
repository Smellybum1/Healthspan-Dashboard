import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'connectors', 'fixtures');
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(
  path.join(dir, 'pubmed-esearch.json'),
  JSON.stringify({ esearchresult: { idlist: ['12345678', '23456789'] } }),
);

fs.writeFileSync(
  path.join(dir, 'clinicaltrials-studies.json'),
  JSON.stringify({
    studies: [
      {
        protocolSection: {
          identificationModule: { nctId: 'NCT01234567', briefTitle: 'Example aging trial' },
          statusModule: {
            overallStatus: 'RECRUITING',
            lastUpdatePostDateStruct: { date: '2026-01-01' },
          },
          conditionsModule: { conditions: ['Aging'] },
          armsInterventionsModule: { interventions: [{ name: 'Metformin' }] },
          outcomesModule: { primaryOutcomes: [{ measure: 'Change in gait speed' }] },
          contactsLocationsModule: { locations: [{ country: 'Australia', city: 'Sydney' }] },
          sponsorCollaboratorsModule: { leadSponsor: { name: 'Example Org' } },
          designModule: { studyType: 'INTERVENTIONAL', phases: ['PHASE2'] },
        },
        hasResults: false,
      },
    ],
  }),
);

fs.writeFileSync(
  path.join(dir, 'crossref-work.json'),
  JSON.stringify({
    message: {
      title: ['Example Crossref Work'],
      DOI: '10.1234/example.doi',
      'container-title': ['Aging Cell'],
      abstract: '<jats:p>Abstract</jats:p>',
      author: [{ given: 'Ada', family: 'Lovelace' }],
      'published-print': { 'date-parts': [[2024, 1, 15]] },
      URL: 'https://doi.org/10.1234/example.doi',
    },
  }),
);

fs.writeFileSync(
  path.join(dir, 'pubmed-efetch.xml'),
  `<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>12345678</PMID>
      <Article>
        <Journal><Title>Aging Cell</Title></Journal>
        <ArticleTitle>Example longevity paper</ArticleTitle>
        <Abstract><AbstractText>Abstract text.</AbstractText></Abstract>
      </Article>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="doi">10.1234/example.doi</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>
`,
);

fs.writeFileSync(
  path.join(dir, 'tga-feed.xml'),
  `<?xml version="1.0"?>
<rss version="2.0"><channel><title>TGA Safety Alerts</title>
<item><title>Example safety alert about metformin</title><link>https://www.tga.gov.au/example</link><guid>tga-example-1</guid><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate><description>Alert mentioning longevity and aging research context.</description></item>
<item><title>Unrelated veterinary notice</title><link>https://www.tga.gov.au/other</link><guid>tga-example-2</guid><pubDate>Mon, 02 Jan 2024 00:00:00 GMT</pubDate><description>No match terms.</description></item>
</channel></rss>
`,
);

console.log('fixtures rewritten', dir);
