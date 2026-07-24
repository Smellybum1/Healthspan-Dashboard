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

const OpenAiSuggestionSchema = z.object({
  notes: z.array(z.string()).max(8).optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
});

/**
 * OpenAI Responses API adapter — optional, disabled by default.
 * Strict structured output, storage disabled where supported, no tools,
 * minimal public-source segments only, deterministic fallback on failure.
 */
export function createOpenAIResponsesIntelligenceProvider(opts: {
  apiKey?: string;
  enabled?: boolean;
  model?: string;
  fetchImpl?: typeof fetch;
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

      const model = opts.model ?? 'gpt-4.1-mini';
      const segments = request.segments
        .slice(0, 6)
        .map((s) => ({ fieldPath: s.fieldPath, text: s.text.slice(0, 1200) }));

      try {
        const fetchFn = opts.fetchImpl ?? fetch;
        const res = await fetchFn('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${opts.apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            store: false,
            tools: [],
            input: [
              {
                role: 'system',
                content:
                  'Return JSON suggestions only. Never invent citations. Never request or accept local paths, secrets, preferences, or personal-health data.',
              },
              {
                role: 'user',
                content: JSON.stringify({
                  contentItemId: request.contentItemId,
                  segments,
                  deterministicSummary: request.deterministicSummary,
                  schema: { notes: ['string'], confidence: 'low|medium|high' },
                }),
              },
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'intelligence_suggestions',
                strict: true,
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    notes: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
                  },
                  required: ['notes', 'confidence'],
                },
              },
            },
          }),
        });

        if (!res.ok) {
          return {
            providerId: 'openai',
            model,
            used: false,
            suggestions: null,
            warnings: [`openai_http_${res.status}`, 'deterministic_fallback'],
          };
        }

        const json = (await res.json()) as {
          output_text?: string;
          output?: Array<{ content?: Array<{ text?: string }> }>;
        };
        const text =
          json.output_text ??
          json.output?.flatMap((o) => o.content ?? []).map((c) => c.text ?? '').join('') ??
          '';
        const parsed = OpenAiSuggestionSchema.safeParse(JSON.parse(text || '{}'));
        if (!parsed.success) {
          return {
            providerId: 'openai',
            model,
            used: false,
            suggestions: null,
            warnings: ['openai_schema_validation_failed', 'deterministic_fallback'],
          };
        }
        return {
          providerId: 'openai',
          model,
          used: true,
          suggestions: parsed.data,
          warnings: [],
        };
      } catch (err) {
        return {
          providerId: 'openai',
          model,
          used: false,
          suggestions: null,
          warnings: [
            err instanceof Error ? err.message : 'openai_request_failed',
            'deterministic_fallback',
          ],
        };
      }
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
