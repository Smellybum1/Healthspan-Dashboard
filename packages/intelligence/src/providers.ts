import { z } from 'zod';

export const IntelligenceProviderIdSchema = z.enum(['disabled', 'fixture', 'openai']);
export type IntelligenceProviderId = z.infer<typeof IntelligenceProviderIdSchema>;

export type IntelligenceProviderRequest = {
  contentItemId: string;
  segments: Array<{ kind: string; fieldPath: string; text: string }>;
  deterministicSummary: Record<string, unknown>;
};

export type IntelligenceProviderResult = {
  providerId: IntelligenceProviderId;
  model: string | null;
  used: boolean;
  suggestions: Record<string, unknown> | null;
  warnings: string[];
};

export interface IntelligenceProvider {
  readonly id: IntelligenceProviderId;
  analyze(request: IntelligenceProviderRequest): Promise<IntelligenceProviderResult>;
}

export function createDisabledIntelligenceProvider(): IntelligenceProvider {
  return {
    id: 'disabled',
    async analyze() {
      return {
        providerId: 'disabled',
        model: null,
        used: false,
        suggestions: null,
        warnings: [],
      };
    },
  };
}

export function createFixtureIntelligenceProvider(): IntelligenceProvider {
  return {
    id: 'fixture',
    async analyze(request) {
      return {
        providerId: 'fixture',
        model: 'fixture-m3',
        used: true,
        suggestions: {
          note: 'Fixture provider only — no network call.',
          contentItemId: request.contentItemId,
        },
        warnings: ['fixture_provider_active'],
      };
    },
  };
}

/** OpenAI adapter is wired but inert unless explicitly enabled and keyed. */
export function createOpenAIResponsesIntelligenceProvider(opts: {
  apiKey?: string;
  enabled?: boolean;
  model?: string;
} = {}): IntelligenceProvider {
  return {
    id: 'openai',
    async analyze(request) {
      if (!opts.enabled || !opts.apiKey) {
        return {
          providerId: 'openai',
          model: null,
          used: false,
          suggestions: null,
          warnings: ['openai_disabled_or_missing_key'],
        };
      }
      // Network path is intentionally not exercised in default tests.
      void request;
      return {
        providerId: 'openai',
        model: opts.model ?? 'gpt-4.1-mini',
        used: false,
        suggestions: null,
        warnings: ['openai_network_path_reserved'],
      };
    },
  };
}

export function resolveIntelligenceProvider(): IntelligenceProvider {
  const enabled = process.env.HEALTHSPAN_AI_ENABLED === 'true';
  const provider = (process.env.HEALTHSPAN_AI_PROVIDER ?? 'disabled').toLowerCase();
  const base =
    !enabled || provider === 'disabled'
      ? createDisabledIntelligenceProvider()
      : provider === 'fixture'
        ? createFixtureIntelligenceProvider()
        : provider === 'openai'
          ? createOpenAIResponsesIntelligenceProvider({
              enabled: true,
              apiKey: process.env.OPENAI_API_KEY,
              model: process.env.HEALTHSPAN_OPENAI_MODEL,
            })
          : createDisabledIntelligenceProvider();
  return withAiCaps(base);
}

/** Soft local caps — AI remains optional and cannot write persistence itself. */
function withAiCaps(inner: IntelligenceProvider): IntelligenceProvider {
  const dailyCap = Number(process.env.HEALTHSPAN_AI_DAILY_CAP ?? 50);
  const concurrencyCap = Number(process.env.HEALTHSPAN_AI_CONCURRENCY_CAP ?? 1);
  let dayKey = '';
  let dayCount = 0;
  let inFlight = 0;
  return {
    id: inner.id,
    async analyze(request) {
      const today = new Date().toISOString().slice(0, 10);
      if (dayKey !== today) {
        dayKey = today;
        dayCount = 0;
      }
      if (inner.id !== 'disabled' && dayCount >= dailyCap) {
        return {
          providerId: inner.id,
          model: null,
          used: false,
          suggestions: null,
          warnings: ['ai_daily_cap_reached'],
        };
      }
      if (inFlight >= concurrencyCap) {
        return {
          providerId: inner.id,
          model: null,
          used: false,
          suggestions: null,
          warnings: ['ai_concurrency_cap_reached'],
        };
      }
      inFlight += 1;
      try {
        const result = await inner.analyze(request);
        if (result.used) dayCount += 1;
        return result;
      } finally {
        inFlight -= 1;
      }
    },
  };
}
