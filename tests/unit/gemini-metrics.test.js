import { describe, it, expect, beforeEach } from 'vitest';
import { recordMetric, getMetrics, resetMetrics } from '../../api/lib/gemini-metrics.js';

describe('gemini-metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('should record a metric entry', () => {
    recordMetric({ type: 'chat', promptTokens: 100, completionTokens: 50, totalTokens: 150, latencyMs: 200 });
    const stats = getMetrics();
    expect(stats.total_requests).toBe(1);
    expect(stats.total_tokens).toBe(150);
    expect(stats.total_prompt_tokens).toBe(100);
    expect(stats.total_completion_tokens).toBe(50);
  });

  it('should aggregate by type', () => {
    recordMetric({ type: 'chat', totalTokens: 100 });
    recordMetric({ type: 'chat', totalTokens: 200 });
    recordMetric({ type: 'falc', totalTokens: 300 });

    const stats = getMetrics();
    expect(stats.by_type.chat.requests).toBe(2);
    expect(stats.by_type.chat.tokens).toBe(300);
    expect(stats.by_type.falc.requests).toBe(1);
    expect(stats.by_type.falc.tokens).toBe(300);
  });

  it('should calculate estimated cost correctly', () => {
    // 1M input tokens = $0.10, 1M output tokens = $0.40
    recordMetric({ type: 'chat', promptTokens: 1_000_000, completionTokens: 1_000_000, totalTokens: 2_000_000 });
    const stats = getMetrics();
    expect(stats.estimated_cost_usd).toBeCloseTo(0.50, 2);
  });

  it('should calculate average latency', () => {
    recordMetric({ type: 'chat', latencyMs: 100 });
    recordMetric({ type: 'chat', latencyMs: 300 });
    const stats = getMetrics();
    expect(stats.avg_latency_ms).toBe(200);
  });

  it('should calculate error rate', () => {
    recordMetric({ type: 'chat', success: true });
    recordMetric({ type: 'chat', success: false });
    recordMetric({ type: 'chat', success: true });
    recordMetric({ type: 'chat', success: false });
    const stats = getMetrics();
    expect(stats.error_rate_pct).toBe(50);
  });

  it('should count circuit breaker trips', () => {
    recordMetric({ type: 'chat', circuitBreakerOpen: true, success: false });
    recordMetric({ type: 'chat', circuitBreakerOpen: false, success: true });
    recordMetric({ type: 'chat', circuitBreakerOpen: true, success: false });
    const stats = getMetrics();
    expect(stats.circuit_breaker_trips).toBe(2);
  });

  it('should enforce max 1000 entries', () => {
    for (let i = 0; i < 1100; i++) {
      recordMetric({ type: 'chat', totalTokens: 1 });
    }
    const stats = getMetrics();
    expect(stats.buffer_size).toBe(1000);
    expect(stats.buffer_max).toBe(1000);
    expect(stats.total_tokens).toBe(1000);
  });

  it('should track last 24h metrics', () => {
    recordMetric({ type: 'chat', totalTokens: 500 });
    const stats = getMetrics();
    expect(stats.last_24h.requests).toBe(1);
    expect(stats.last_24h.tokens).toBe(500);
  });

  it('should return zero stats when empty', () => {
    const stats = getMetrics();
    expect(stats.total_requests).toBe(0);
    expect(stats.total_tokens).toBe(0);
    expect(stats.estimated_cost_usd).toBe(0);
    expect(stats.avg_latency_ms).toBe(0);
    expect(stats.error_rate_pct).toBe(0);
    expect(stats.circuit_breaker_trips).toBe(0);
  });
});
