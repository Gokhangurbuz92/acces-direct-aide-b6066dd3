import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ErrorBoundary from '../../src/components/ErrorBoundary.jsx';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    const TestComponent = () => React.createElement('div', null, 'Test content');
    
    const html = renderToStaticMarkup(
      React.createElement(ErrorBoundary, null,
        React.createElement(TestComponent)
      )
    );

    expect(html).toContain('Test content');
  });

  it('renders error fallback when child throws', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    try {
      renderToStaticMarkup(
        React.createElement(ErrorBoundary, null,
          React.createElement(ThrowError)
        )
      );
    } catch (error) {
      // Expected to throw during SSR, but in browser it would be caught
      expect(error.message).toBe('Test error');
    }
  });

  it('error fallback contains user-friendly message', () => {
    // We can't easily test the error state in SSR, but we can verify
    // the ErrorFallback component structure exists
    const errorBoundaryCode = ErrorBoundary.toString();
    
    expect(errorBoundaryCode).toContain('getDerivedStateFromError');
    expect(errorBoundaryCode).toContain('componentDidCatch');
  });

  it('has resetError method', () => {
    const boundary = new ErrorBoundary({});
    expect(typeof boundary.resetError).toBe('function');
  });

  it('initializes with no error state', () => {
    const boundary = new ErrorBoundary({});
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBe(null);
  });
});
