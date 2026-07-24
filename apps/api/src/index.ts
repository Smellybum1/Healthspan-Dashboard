import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app.js';

const host = process.env.API_HOST ?? '127.0.0.1';
const port = Number(process.env.API_PORT ?? 8787);
const serveWeb = process.env.HEALTHSPAN_SERVE_WEB === '1' || process.argv.includes('--serve-web');

const app = createApp();

if (serveWeb) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const webDist = process.env.HEALTHSPAN_WEB_DIST
    ? path.resolve(process.env.HEALTHSPAN_WEB_DIST)
    : path.resolve(here, '../../web/dist');
  if (!fs.existsSync(path.join(webDist, 'index.html'))) {
    console.error(
      'Web build missing. Run `pnpm build` first (expected index.html under apps/web/dist).',
    );
    process.exit(1);
  }
  app.use('/assets/*', serveStatic({ root: webDist }));
  app.get('*', async (c, next) => {
    if (c.req.path.startsWith('/api') || c.req.path === '/health') return next();
    const index = fs.readFileSync(path.join(webDist, 'index.html'), 'utf8');
    c.header('Cache-Control', 'no-cache');
    return c.html(index);
  });
  console.log(`Serving built web app from ${webDist.replace(/\\/g, '/')}`);
}

serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(`Healthspan Dashboard listening on http://${info.address}:${info.port}`);
});
