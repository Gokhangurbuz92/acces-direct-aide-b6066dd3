import { useCallback, useEffect, useState } from 'react';
import SEO from '@/components/SEO';
import { apiClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/** @param {unknown} value */
function formatOk(value) {
  if (value === true) return 'OK';
  if (value === false) return 'KO';
  if (value === 'skipped') return 'SKIPPED';
  return '-';
}

/** @param {unknown} value */
function badgeClassForOk(value) {
  if (value === true) return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (value === false) return 'border-rose-200 bg-rose-50 text-rose-900';
  if (value === 'skipped') return 'border-slate-200 bg-slate-50 text-slate-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

/** @param {unknown} value */
function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
}

/** @param {unknown} state */
function freshnessBadgeClass(state) {
  if (state === 'fresh') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (state === 'stale') return 'border-amber-200 bg-amber-50 text-amber-900';
  if (state === 'error') return 'border-rose-200 bg-rose-50 text-rose-900';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export default function AdminObservability() {
  const [cronRuns, setCronRuns] = useState(/** @type {any[]} */ ([]));
  const [healthPublic, setHealthPublic] = useState(/** @type {any} */ (null));
  const [healthDeep, setHealthDeep] = useState(/** @type {any} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveMessage, setLiveMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let nextError = '';

    const [publicRes, deepRes, runsRes] = await Promise.allSettled([
      apiClient.health.check(),
      apiClient.health.deep(),
      apiClient.admin.getCronRuns('actualites', 20),
    ]);

    if (publicRes.status === 'fulfilled') {
      setHealthPublic(publicRes.value);
    } else {
      nextError = nextError || 'Impossible de charger /api/health';
    }

    if (deepRes.status === 'fulfilled') {
      setHealthDeep(deepRes.value);
    } else {
      nextError = nextError || 'Impossible de charger /api/health/deep';
    }

    if (runsRes.status === 'fulfilled') {
      setCronRuns(runsRes.value?.items || []);
    } else {
      nextError = nextError || 'Impossible de charger /api/admin/cron-runs';
    }

    setError(nextError);
    setLiveMessage('Données mises à jour à ' + format(new Date(), 'HH:mm:ss', { locale: fr }));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const db = healthDeep?.deps?.db;
  const kv = healthDeep?.deps?.kv;
  const storage = healthDeep?.deps?.storage;
  const sentry = healthDeep?.deps?.sentry;
  const cronFreshness = healthDeep?.deps?.cron?.actualites;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <SEO title="Admin Observability" description="Dashboard admin: health, cron runs, et dependances." noindex={true} />

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Observabilite</h1>
        <Button onClick={load} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Health (public)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>OK</span>
              <Badge className={badgeClassForOk(Boolean(healthPublic?.ok))}>{healthPublic?.ok ? 'OK' : 'KO'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Env</span>
              <span className="font-mono">{healthPublic?.vercelEnv || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Release</span>
              <span className="font-mono">{healthPublic?.release ? String(healthPublic.release).slice(0, 8) : '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>RequestId</span>
              <span className="font-mono">{healthPublic?.requestId || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health (deep)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Overall</span>
              <Badge className={badgeClassForOk(Boolean(healthDeep?.ok))}>{healthDeep?.ok ? 'OK' : 'KO'}</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>DB</span>
                <div className="flex items-center gap-2">
                  <Badge className={badgeClassForOk(db?.ok)}>{formatOk(db?.ok)}</Badge>
                  <span className="font-mono text-xs text-slate-500">{typeof db?.durationMs === 'number' ? `${db.durationMs}ms` : ''}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>KV</span>
                <div className="flex items-center gap-2">
                  <Badge className={badgeClassForOk(kv?.ok)}>{formatOk(kv?.ok)}</Badge>
                  <span className="font-mono text-xs text-slate-500">{typeof kv?.durationMs === 'number' ? `${kv.durationMs}ms` : ''}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage</span>
                <div className="flex items-center gap-2">
                  <Badge className={badgeClassForOk(storage?.ok)}>{formatOk(storage?.ok)}</Badge>
                  <span className="font-mono text-xs text-slate-500">{typeof storage?.durationMs === 'number' ? `${storage.durationMs}ms` : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>RequestId</span>
              <span className="font-mono">{healthDeep?.requestId || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentry (server)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>DSN present</span>
              <Badge className={badgeClassForOk(Boolean(sentry?.dsnPresent))}>{sentry?.dsnPresent ? 'YES' : 'NO'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Env</span>
              <span className="font-mono">{sentry?.environment || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Release</span>
              <span className="font-mono">{sentry?.release ? String(sentry.release).slice(0, 8) : '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gemini key</span>
              <Badge className={badgeClassForOk(Boolean(healthDeep?.deps?.geminiKeyPresent))}>
                {healthDeep?.deps?.geminiKeyPresent ? 'PRESENT' : 'MISSING'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Freshness Cron actualites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Etat</span>
            <Badge className={freshnessBadgeClass(cronFreshness?.state)}>
              {cronFreshness?.state || 'missing'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Last success</span>
            <span className="font-mono text-xs">{formatDateTime(cronFreshness?.lastSuccessAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last run</span>
            <span className="font-mono text-xs">{formatDateTime(cronFreshness?.lastRunAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Age (minutes)</span>
            <span className="font-mono text-xs">
              {typeof cronFreshness?.ageMinutes === 'number' ? cronFreshness.ageMinutes : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Seuils stale/fail</span>
            <span className="font-mono text-xs">
              {typeof cronFreshness?.thresholds?.staleMinutes === 'number'
                ? `${cronFreshness.thresholds.staleMinutes}/${cronFreshness.thresholds.failMinutes}`
                : '-'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cron actualites</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Duree</TableHead>
                <TableHead>Metrics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-sm text-slate-600">
                    Aucun run.
                  </TableCell>
                </TableRow>
              ) : (
                cronRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">
                      {run.startedAt ? format(new Date(run.startedAt), 'dd/MM HH:mm:ss', { locale: fr }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          run.status === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : run.status === 'skipped'
                              ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : run.status === 'running'
                              ? 'border-slate-200 bg-slate-50 text-slate-700'
                              : 'border-rose-200 bg-rose-50 text-rose-900'
                        }
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{run.trigger || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{run.skipReason || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{typeof run.durationMs === 'number' ? `${run.durationMs}ms` : '-'}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {run.metrics ? JSON.stringify(run.metrics) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
