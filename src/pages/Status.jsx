import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FETCH_TIMEOUT_MS = 5000;

/** @param {unknown} value */
function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
}

/**
 * Fetch with AbortController timeout — circuit breaker pattern.
 * @param {string} path
 * @returns {Promise<{ status: number | null, payload: any, error?: string }>}
 */
async function fetchMonitor(path) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return { status: response.status, payload };
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    return {
      status: null,
      payload: null,
      error: isTimeout ? 'timeout' : (err instanceof Error ? err.message : 'unknown'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** @param {number | null} status */
function statusText(status) {
  if (status === 200) return 'OK';
  if (status === 503) return 'Dégradé (KO)';
  if (status == null) return 'Indisponible (KO)';
  return `HTTP ${status}`;
}

/** @param {number | null} status */
function statusVariant(status) {
  if (status === 200) return 'ok';
  if (status === 503) return 'degraded';
  return 'error';
}

/** @param {number | null} status */
function statusClass(status) {
  const variant = statusVariant(status);
  if (variant === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (variant === 'degraded') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-rose-200 bg-rose-50 text-rose-900';
}

export default function Status() {
  const [loading, setLoading] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState(/** @type {Date | null} */ (null));
  const [liveMessage, setLiveMessage] = useState('');
  const [fetchError, setFetchError] = useState(/** @type {string | null} */ (null));
  const [dataQuality, setDataQuality] = useState(/** @type {{ status: number | null, payload: any }} */ ({ status: null, payload: null }));
  const [ingestionFreshness, setIngestionFreshness] = useState(/** @type {{ status: number | null, payload: any }} */ ({ status: null, payload: null }));

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const [dq, ingest] = await Promise.allSettled([
      fetchMonitor('/api/monitor/data-quality'),
      fetchMonitor('/api/monitor/ingestion-freshness'),
    ]);

    let allFailed = true;

    if (dq.status === 'fulfilled') {
      setDataQuality(dq.value);
      if (!dq.value.error) allFailed = false;
    } else {
      setDataQuality({ status: null, payload: null });
    }

    if (ingest.status === 'fulfilled') {
      setIngestionFreshness(ingest.value);
      if (!ingest.value.error) allFailed = false;
    } else {
      setIngestionFreshness({ status: null, payload: null });
    }

    if (allFailed) {
      setFetchError('Tous les services sont injoignables. Vérifiez votre connexion ou réessayez dans quelques instants.');
    }

    const now = new Date();
    setLastCheckedAt(now);
    setLiveMessage(`Status actualise a ${format(now, 'HH:mm:ss', { locale: fr })}`);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <SEO
        title="Status - Accès Direct Aide"
        description="Etat public de la plateforme: data quality et freshness ingestion."
        noindex={true}
      />

      <p className="sr-only" aria-live="polite">{liveMessage}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Status</h1>
        <Button onClick={load} disabled={loading} className="gap-2" variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <p className="text-sm text-slate-600" data-testid="status-last-checked">
        Last checked: {lastCheckedAt ? formatDateTime(lastCheckedAt.toISOString()) : '-'}
      </p>

      {fetchError && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert" data-testid="status-error-banner">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card data-testid="status-data-quality-card">
          <CardHeader>
            <CardTitle>Data Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge className={statusClass(dataQuality.status)}>
                {statusText(dataQuality.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Open total</span>
              <span className="font-mono">
                {typeof dataQuality.payload?.metrics?.openTotal === 'number'
                  ? dataQuality.payload.metrics.openTotal
                  : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Open P0</span>
              <span className="font-mono">
                {typeof dataQuality.payload?.metrics?.openP0 === 'number'
                  ? dataQuality.payload.metrics.openP0
                  : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Thresholds</span>
              <span className="font-mono text-xs">
                {typeof dataQuality.payload?.thresholds?.openTotalMax === 'number'
                  ? `${dataQuality.payload.thresholds.openTotalMax}/${dataQuality.payload.thresholds.openP0Max}`
                  : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="status-ingestion-card">
          <CardHeader>
            <CardTitle>Ingestion Freshness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge className={statusClass(ingestionFreshness.status)}>
                {statusText(ingestionFreshness.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Latest fetched</span>
              <span className="font-mono text-xs">
                {formatDateTime(ingestionFreshness.payload?.latestFetchedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Age (hours)</span>
              <span className="font-mono">
                {typeof ingestionFreshness.payload?.ageHours === 'number'
                  ? ingestionFreshness.payload.ageHours
                  : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Threshold</span>
              <span className="font-mono">
                {typeof ingestionFreshness.payload?.thresholdHours === 'number'
                  ? ingestionFreshness.payload.thresholdHours
                  : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
