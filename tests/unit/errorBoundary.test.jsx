import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ErrorBoundary from '../../src/components/ErrorBoundary.jsx';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

describe('ErrorBoundary', () => {
  it('should be a React component', () => {
    expect(ErrorBoundary).toBeDefined();
    expect(typeof ErrorBoundary).toBe('function');
  });

  it('should have getDerivedStateFromError static method', () => {
    expect(ErrorBoundary.getDerivedStateFromError).toBeDefined();
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
  });

  it('should return error state from getDerivedStateFromError', () => {
    const error = new Error('Test error');
    const state = ErrorBoundary.getDerivedStateFromError(error);
    
    expect(state).toEqual({
      hasError: true,
      error: error
    });
  });

  it('should have componentDidCatch method', () => {
    const instance = new ErrorBoundary({});
    expect(instance.componentDidCatch).toBeDefined();
    expect(typeof instance.componentDidCatch).toBe('function');
  });

  it('should have resetError method', () => {
    const instance = new ErrorBoundary({});
    expect(instance.resetError).toBeDefined();
    expect(typeof instance.resetError).toBe('function');
  });

  it('should call setState when resetError is called', () => {
    const instance = new ErrorBoundary({});
    instance.setState = vi.fn();
    
    instance.resetError();
    
    expect(instance.setState).toHaveBeenCalledWith({
      hasError: false,
      error: null
    });
  });
});
