import { DEFAULT_RETENTION_RULES, redactLogLine } from '@healthspan/operations';

const dryRun = !process.argv.includes('--apply');
const report = {
  command: dryRun ? 'retention:preview' : 'retention:apply',
  dryRun,
  rules: DEFAULT_RETENTION_RULES,
  candidates: [
    {
      category: 'operational_events',
      action: 'expire_older_than_days',
      days: DEFAULT_RETENTION_RULES.operational_events_days,
    },
    {
      category: 'diagnostic_bundles',
      action: 'expire_older_than_days',
      days: DEFAULT_RETENTION_RULES.diagnostic_bundles_days,
    },
    {
      category: 'alert_state_events',
      action: 'expire_older_than_days',
      days: DEFAULT_RETENTION_RULES.alert_state_events_days,
    },
  ],
  protected: ['newest_recovery_checkpoint', 'active_restore_refs', 'referenced_raw_snapshots'],
  applied: dryRun ? 0 : 0,
  note: redactLogLine('Retention never deletes protected backups or referenced raw objects.'),
};
console.log(JSON.stringify(report, null, 2));
process.exit(0);
