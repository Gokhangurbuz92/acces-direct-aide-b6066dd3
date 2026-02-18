import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, RefreshCw } from 'lucide-react';

import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** @param {unknown} value */
function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
}

/**
 * @param {string} path
 * @returns {Promise<{ status: number, payload: any }>}
 */
async function fetchMonitor(path) {
  const response = await fetch(path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return {
    status: response.status,
    payload,
  };
}

/** @param {number | null} status */
function statusText(status) {
  if (status === 200) return 'OK';
  if (status === 503) return 'KO';
  if (status == null) return 'KO';
  return `HTTP ${status}`;
}

/** @param {number | null} status */
function statusClass(status) {
  if (status === 200) return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  return 'border-rose-200 bg-rose-50 text-rose-900';
}

export default function Status() {
  const [loading, setLoading] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState(/** @type {Date | null} */ (null));
  const [liveMessage, setLiveMessage] = useState('');
  const [dataQuality, setDataQuality] = useState(/** @type {{ status: number | null, payload: any }} */ ({ status: null, payload: null }));
  const [ingestionFreshness, setIngestionFreshness] = useState(/** @type {{ status: number | null, payload: any }} */ ({ status: null, payload: null }));

  const load = useCallback(async () => {
    setLoading(true);

    const [dq, ingest] = await Promise.allSettled([
      fetchMonitor('/api/monitor/data-quality'),
      fetchMonitor('/api/monitor/ingestion-freshness'),
    ]);

    if (dq.status === 'fulfilled') {
      setDataQuality(dq.value);
    } else {
      setDataQuality({ status: null, payload: null });
    }

    if (ingest.status === 'fulfilled') {
      setIngestionFreshness(ingest.value);
    } else {
      setIngestionFreshness({ status: null, payload: null });
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
