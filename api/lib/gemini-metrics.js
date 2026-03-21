/**
 * Gemini AI Metrics — in-memory token tracking & cost estimation.
 *
 * Stores last 1000 requests with token counts, latency, and errors.
 * Pricing based on Gemini 2.0 Flash (March 2026):
 *   Input  : $0.10 / 1M tokens
 *   Output : $0.40 / 1M tokens
 */

const MAX_ENTRIES = 1000;

// Pricing per token (USD)
const PRICING = {
  inputPerToken: 0.10 / 1_000_000,
  outputPerToken: 0.40 / 1_000_000,
};

/** @type {Array<import('./gemini-metrics-types').MetricEntry>} */
const metrics = [];

/**
 * @typedef {{
 *   type: string,
 *   model?: string,
 *   promptTokens?: number,
 *   completionTokens?: number,
 *   totalTokens?: number,
 *   latencyMs?: number,
 *   success?: boolean,
 *   circuitBreakerOpen?: boolean,
 * }} MetricInput
 */

/**
 * Record a Gemini API call metric.
 * @param {MetricInput} data
 */
export function recordMetric(data) {
  const entry = {
    timestamp: new Date().toISOString(),
    type: data.type || 'unknown',
    model: data.model || 'gemini-2.0-flash',
    promptTokens: data.promptTokens || 0,
    completionTokens: data.completionTokens || 0,
    totalTokens: data.totalTokens || 0,
    latencyMs: data.latencyMs || 0,
    success: data.success !== false,
    circuitBreakerOpen: data.circuitBreakerOpen === true,
  };

  metrics.push(entry);

  // Keep only last MAX_ENTRIES
  if (metrics.length > MAX_ENTRIES) {
    metrics.splice(0, metrics.length - MAX_ENTRIES);
  }
}

/**
 * Get aggregated metrics summary.
 */
export function getMetrics() {
  const now = Date.now();
  const h24Ago = now - 24 * 60 * 60 * 1000;

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalLatency = 0;
  let errorCount = 0;
  let cbTrips = 0;

  let last24hRequests = 0;
  let last24hTokens = 0;

  /** @type {Record<string, { requests: number, tokens: number, errors: number }>} */
  const byType = {};

  for (const entry of metrics) {
    totalPromptTokens += entry.promptTokens;
    totalCompletionTokens += entry.completionTokens;
    totalTokens += entry.totalTokens;
    totalLatency += entry.latencyMs;

    if (!entry.success) errorCount++;
    if (entry.circuitBreakerOpen) cbTrips++;

    // By type
    if (!byType[entry.type]) {
      byType[entry.type] = { requests: 0, tokens: 0, errors: 0 };
    }
    byType[entry.type].requests++;
    byType[entry.type].tokens += entry.totalTokens;
    if (!entry.success) byType[entry.type].errors++;

    // Last 24h
    const ts = new Date(entry.timestamp).getTime();
    if (ts >= h24Ago) {
      last24hRequests++;
      last24hTokens += entry.totalTokens;
    }
  }

  const totalRequests = metrics.length;
  const estimatedCostUsd =
    totalPromptTokens * PRICING.inputPerToken +
    totalCompletionTokens * PRICING.outputPerToken;

  return {
    total_requests: totalRequests,
    total_prompt_tokens: totalPromptTokens,
    total_completion_tokens: totalCompletionTokens,
    total_tokens: totalTokens,
    estimated_cost_usd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
    avg_latency_ms: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
    error_rate_pct: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 10000) / 100 : 0,
    by_type: byType,
    last_24h: { requests: last24hRequests, tokens: last24hTokens },
    circuit_breaker_trips: cbTrips,
    buffer_size: totalRequests,
    buffer_max: MAX_ENTRIES,
  };
}

/**
 * Reset metrics (for testing).
 */
export function resetMetrics() {
  metrics.length = 0;
}
