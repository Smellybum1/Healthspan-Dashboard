import {
  closeDatabase,
  openDatabase,
  regulatedProducts,
  regulatoryAssertions,
  regulatedProductIngredients,
  regulatoryStatusHistory,
  productLabelRecords,
} from '@healthspan/db';
import { assertM4CorporaMinima } from '@healthspan/interventions';

const { db, sqlite } = openDatabase({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
  migrateOnOpen: true,
});

const products = db.select().from(regulatedProducts).all();
const assertions = db.select().from(regulatoryAssertions).all();
const ingredients = db.select().from(regulatedProductIngredients).all();
const history = db.select().from(regulatoryStatusHistory).all();
const labels = db.select().from(productLabelRecords).all();
const bareApproved = assertions.filter((a) =>
  /^(approved|authorised|authorized)$/i.test(a.normalizedStanding),
);
const corpora = assertM4CorporaMinima();

const report = {
  suite: 'regulatory:doctor',
  productCount: products.length,
  assertionCount: assertions.length,
  ingredientCount: ingredients.length,
  statusHistoryCount: history.length,
  labelCount: labels.length,
  bareApprovedStandingCount: bareApproved.length,
  corpora,
  ok: bareApproved.length === 0 && corpora.ok,
  notes: [
    'Miss ≠ unapproved.',
    'Trial ≠ authorization.',
    'Label presence ≠ approval.',
    'AU/US jurisdictions remain separated.',
  ],
};

console.log(JSON.stringify(report, null, 2));
closeDatabase(sqlite);
process.exit(report.ok ? 0 : 1);
