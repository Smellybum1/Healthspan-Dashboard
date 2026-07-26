/**
 * Sites entrypoint.
 *
 * A fetch-style default export, which is the whole difference from `apps/api/src/index.ts`:
 * that file calls `serve()` from `@hono/node-server` and owns a listening socket, a
 * scheduler, and a job worker. This one owns nothing. It is handed a request and an
 * environment, and returns a response.
 *
 * The app is constructed once at module scope; per-request state comes from `env`,
 * which is where the `DB` and `FILES` bindings and the hosted configuration arrive.
 *
 * `pnpm sites:bundle:doctor` treats this file as a root and walks everything it can
 * reach. Nothing added below may pull in a Node builtin, the native driver,
 * `@healthspan/db`, `@healthspan/operations`, or a connector.
 */
import { createSitesApp } from './app.js';

const app = createSitesApp();

export default {
  fetch: app.fetch,
};

export { createSitesApp };
