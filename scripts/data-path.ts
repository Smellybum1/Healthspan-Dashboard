import { resolveDataPaths } from '@healthspan/db';

const paths = resolveDataPaths({
  allowRelativeOverride: process.env.HEALTHSPAN_ALLOW_RELATIVE_DATA_DIR === '1',
});
console.log(JSON.stringify(paths, null, 2));
