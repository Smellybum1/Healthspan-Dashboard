import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createSeedRepository } from '@healthspan/db';

const repo = createSeedRepository();

export function createApp() {
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    }),
  );

  app.get('/health', (c) =>
    c.json({
      ok: true,
      service: 'healthspan-dashboard-api',
      persistence: repo.mode,
      asOf: new Date().toISOString(),
    }),
  );

  app.get('/api/dashboard', (c) => c.json(repo.getDashboardPayload()));

  app.get('/api/items', (c) => {
    const q = c.req.query('q') ?? undefined;
    const type = c.req.query('type') ?? undefined;
    const peerReviewStatus = c.req.query('peerReviewStatus') ?? undefined;
    const trialStatus = c.req.query('trialStatus') ?? undefined;
    const jurisdiction = c.req.query('jurisdiction') ?? undefined;
    const items = repo.filterItems({ q, type, peerReviewStatus, trialStatus, jurisdiction });
    return c.json({ count: items.length, items });
  });

  app.get('/api/items/:id', (c) => {
    const found = repo.getItemById(c.req.param('id'));
    if (!found) return c.json({ error: 'Not found' }, 404);
    return c.json(found);
  });

  app.get('/api/search', (c) => {
    const q = c.req.query('q') ?? '';
    const items = repo.searchItems(q);
    return c.json({ query: q, count: items.length, items });
  });

  app.get('/api/meta/seed', (c) => {
    const seed = repo.getSeedBundle();
    return c.json({
      demoNotice: seed.demoNotice,
      generatedAt: seed.generatedAt,
      counts: {
        papers: seed.papers.length,
        trials: seed.trials.length,
        interventions: seed.interventions.length,
        peptides: seed.peptides.length,
        creators: seed.creators.length,
        claims: seed.claims.length,
        regulatoryEvents: seed.regulatoryEvents.length,
        organisations: seed.organisations.length,
        watchlists: seed.watchlists.length,
        changeEvents: seed.changeEvents.length,
        reviewTasks: seed.reviewTasks.length,
      },
    });
  });

  return app;
}

export type AppType = ReturnType<typeof createApp>;
