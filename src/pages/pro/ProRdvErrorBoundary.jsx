/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { sentryRef } from '@/observability/sentryRef';

/**
 * @param {{ reset: () => void }} props
 */
function ProRdvFallback(props) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-2">
          <p className="font-medium">Une erreur est survenue dans le module RDV.</p>
          <p>Veuillez reessayer. Si le probleme persiste, contactez le support.</p>
          <button
            type="button"
            className="rounded-md border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-800 hover:bg-rose-100"
            onClick={props.reset}
          >
            Reessayer
          </button>
        </div>
      </div>
    </div>
  );
}

export default class ProRdvErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const Sentry = sentryRef.current;
    if (!Sentry || typeof Sentry.captureException !== 'function') return;

    try {
      if (typeof Sentry.withScope === 'function') {
        Sentry.withScope((scope) => {
          if (scope && typeof scope.setTag === 'function') {
            scope.setTag('module', 'rdv');
            scope.setTag('surface', 'pro-ui');
            scope.setTag('boundary', 'pro-rdv-route');
          }
          Sentry.captureException(error);
        });
      } else {
        Sentry.captureException(error);
      }
    } catch {
      // best-effort
    }
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ProRdvFallback reset={this.reset} />;
    }

    return this.props.children;
  }
}
