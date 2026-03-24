import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';

// Mock @/ dependencies used by Status.jsx
vi.mock('@/components/SEO', () => ({
  default: () => null,
}));
vi.mock('@/components/ui/button', () => ({
  Button: (props) => React.createElement('button', props, props.children),
}));
vi.mock('@/components/ui/card', () => ({
  Card: (props) => React.createElement('div', props, props.children),
  CardContent: (props) => React.createElement('div', props, props.children),
  CardHeader: (props) => React.createElement('div', props, props.children),
  CardTitle: (props) => React.createElement('div', props, props.children),
}));
vi.mock('@/components/ui/badge', () => ({
  Badge: (props) => React.createElement('span', props, props.children),
}));

import Status from '../../src/pages/Status.jsx';

describe('Status page', () => {
  it('renders the two monitor sections', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        HelmetProvider,
        null,
        React.createElement(Status, null),
      ),
    );

    expect(html).toContain('Data Quality');
    expect(html).toContain('Ingestion Freshness');
  });
});
