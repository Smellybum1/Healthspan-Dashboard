import { runRegulatoryEval } from '@healthspan/interventions';

const report = runRegulatoryEval();
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
