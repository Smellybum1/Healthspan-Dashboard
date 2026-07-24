import { describe, expect, it } from 'vitest';
import { assertM4CorporaMinima, runInterventionsEval, runRegulatoryEval } from './index.js';

describe('m4 residual corpora', () => {
  it('meets official minima', () => {
    const c = assertM4CorporaMinima();
    expect(c.ok).toBe(true);
    expect(c.identity).toBeGreaterThanOrEqual(120);
    expect(c.regulatory).toBeGreaterThanOrEqual(72);
    expect(c.safety).toBeGreaterThanOrEqual(48);
    expect(c.multiClaim).toBeGreaterThanOrEqual(32);
  });

  it('runs interventions and regulatory evals', () => {
    expect(runInterventionsEval().ok).toBe(true);
    expect(runRegulatoryEval().ok).toBe(true);
  });
});
