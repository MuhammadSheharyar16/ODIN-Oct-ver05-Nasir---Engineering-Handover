/**
 * Your adapters: one per ported screen, returning the ODIN spec built from YOUR data.
 * Example (V04 Outcome Distribution):
 *   V04: async () => buildOutcomeDistribution(await api.getOutcomeTotals()),
 */
export const adapters: Record<string, () => unknown | Promise<unknown>> = {};

/**
 * E12 response composer. Register your LLM classifier (transcript → Query JSON,
 * see 03-effects/E12-response-composer/LLM-PROMPT.md) and your port of plan().
 * Leave null until ported; odin.composer.test.ts skips while either is null.
 *   classify = (question, previous) => llm.classifyOdinQuery(question, previous)
 *   planner  = (query, last) => plan(query, { last })
 */
export type OdinPlan = { view: string; depth: 'glance' | 'context' | 'explore'; spotlight?: { component?: string; item?: string }; intent?: { type?: string; items?: string[] } };
export const classify: ((question: string, previous: unknown | null) => Promise<unknown>) | null = null;
export const planner: ((query: unknown, last: unknown | undefined) => OdinPlan) | null = null;
