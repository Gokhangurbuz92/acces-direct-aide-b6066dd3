import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, RefreshCw } from 'lucide-react';

import SEO from '@/components/SEO';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const DEFAULT_LIMIT = 50;
const KNOWN_REASONS = [
  'MISSING_VERIFICATION',
  'STALE_VERIFICATION',
  'MISSING_SLUG',
  'INVALID_SLUG',
  'MISSING_REQUIRED_FIELD:documents_necessaires',
];

/** @param {unknown} value */
function formatDate(value) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
}

/** @param {string} severity */
function severityClass(severity) {
  if (severity === 'P0') return 'border-rose-200 bg-rose-50 text-rose-900';
  if (severity === 'P1') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

/** @param {string} status */
function statusClass(status) {
  if (status === 'open') return 'border-amber-200 bg-amber-50 text-amber-900';
  if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'ignored') return 'border-slate-200 bg-slate-100 text-slate-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

/**
 * @param {{ entityType?: string, entitySlug?: string | null }} item
 */
function buildPublicLink(item) {
  if (!item?.entitySlug) return null;
  if (item.entityType === 'aide') return `/aides/${item.entitySlug}`;
  if (item.entityType === 'demarche') return `/demarches/${item.entitySlug}`;
  if (item.entityType === 'structure') return `/structures/${item.entitySlug}`;
  if (item.entityType === 'actualite') return `/actualites/${item.entitySlug}`;
  return null;
}

export default function AdminReviewQueue() {
  const [items, setItems] = useState(/** @type {any[]} */ ([]));
  const [pagination, setPagination] = useState({ nextCursor: null, limit: DEFAULT_LIMIT });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(/** @type {any} */ (null));
  const [requestId, setRequestId] = useState('');
  const [liveMessage, setLiveMessage] = useState('');

  const [filters, setFilters] = useState({
    status: 'open',
    entityType: '',
    reason: '',
  });

  const reasonOptions = useMemo(() => {
    const dynamic = Array.from(new Set(items.map((item) => item.reason).filter(Boolean)));
    return Array.from(new Set([...KNOWN_REASONS, ...dynamic]));
  }, [items]);

  const loadItems = useCallback(async (cursor = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.admin.getReviewQueueItems({
        ...filters,
        limit: DEFAULT_LIMIT,
        cursor: cursor || undefined,
      });

      const nextItems = Array.isArray(response?.items) ? response.items : [];
      setItems(nextItems);
      setPagination(response?.pagination || { nextCursor: null, limit: DEFAULT_LIMIT });
      setRequestId(response?.requestId || '');
      setLiveMessage('Review queue mise a jour');
    } catch {
      setError('Impossible de charger la review queue.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError('');

    try {
      const scanResult = await apiClient.admin.scanReviewQueue();
      setSummary(scanResult || null);
      setLiveMessage('Scan data quality termine');
      await loadItems();
    } catch {
      setError('Le scan data quality a echoue.');
    } finally {
      setScanning(false);
    }
  }, [loadItems]);

  const handleStatusChange = useCallback(async (id, status) => {
    setSavingId(id);
    setError('');

    try {
      await apiClient.admin.updateReviewQueueStatus(id, status);
      setLiveMessage('Statut mis a jour');
      await loadItems();
    } catch {
      setError('Impossible de mettre a jour le statut.');
    } finally {
      setSavingId('');
    }
  }, [loadItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <div className="container mx-auto space-y-6 py-8">
      <SEO title="Admin Review Queue" description="Gestion de la file de revue data quality." noindex={true} />

      <p className="sr-only" aria-live="polite">{liveMessage}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => loadItems()} disabled={loading} className="gap-2" variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={handleScan} disabled={scanning} className="gap-2">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Scan now
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Status</span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="open">open</option>
              <option value="resolved">resolved</option>
              <option value="ignored">ignored</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Entity type</span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={filters.entityType}
              onChange={(event) => setFilters((prev) => ({ ...prev, entityType: event.target.value }))}
            >
              <option value="">all</option>
              <option value="aide">aide</option>
              <option value="demarche">demarche</option>
              <option value="structure">structure</option>
              <option value="actualite">actualite</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Reason</span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={filters.reason}
              onChange={(event) => setFilters((prev) => ({ ...prev, reason: event.target.value }))}
            >
              <option value="">all</option>
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button className="w-full" onClick={() => loadItems()} disabled={loading}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Dernier scan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-xl font-semibold">{summary.created || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Updated</p>
                <p className="text-xl font-semibold">{summary.updated || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Open total</p>
                <p className="text-xl font-semibold">{summary.openTotal || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Limit/type</p>
                <p className="text-xl font-semibold">{summary.limitPerType || '-'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Scanned: aides={summary?.scanned?.aides || 0}, demarches={summary?.scanned?.demarches || 0}, structures={summary?.scanned?.structures || 0}, actualites={summary?.scanned?.actualites || 0}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm text-slate-600">Chargement...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-sm text-slate-600">Aucun item.</TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const publicLink = buildPublicLink(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{item.entityType}</TableCell>
                      <TableCell className="max-w-[260px] truncate text-sm" title={item.title || ''}>{item.title || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.reason}</TableCell>
                      <TableCell>
                        <Badge className={severityClass(item.severity)}>{item.severity || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClass(item.status)}>{item.status || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        {publicLink ? (
                          <Link className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline" to={publicLink} target="_blank" rel="noreferrer">
                            Ouvrir
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.status === 'open' ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === item.id}
                              onClick={() => handleStatusChange(item.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={savingId === item.id}
                              onClick={() => handleStatusChange(item.id, 'ignored')}
                            >
                              Ignore
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {pagination?.nextCursor && !loading && (
            <div className="mt-4">
              <Button variant="outline" onClick={() => loadItems(pagination.nextCursor)}>Next page</Button>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">requestId: {requestId || '-'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
