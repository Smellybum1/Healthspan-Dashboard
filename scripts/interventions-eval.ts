import { runInterventionsEval } from '@healthspan/interventions';

const report = runInterventionsEval();
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
