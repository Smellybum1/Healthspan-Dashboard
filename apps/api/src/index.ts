import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const host = process.env.API_HOST ?? '127.0.0.1';
const port = Number(process.env.API_PORT ?? 8787);

const app = createApp();

serve({ fetch: app.fetch, hostname: host, port }, (info) => {
  console.log(`Healthspan Dashboard API listening on http://${info.address}:${info.port}`);
});
