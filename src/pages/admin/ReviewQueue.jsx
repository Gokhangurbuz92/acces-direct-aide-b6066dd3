import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
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
const DEFAULT_FILTERS = {
  status: 'open',
  entityType: '',
  reason: '',
  severity: '',
  search: '',
};
const KNOWN_REASONS = [
  'MISSING_VERIFICATION',
  'STALE_VERIFICATION',
  'MISSING_SLUG',
  'INVALID_SLUG',
  'MISSING_REQUIRED_FIELD:documents_necessaires',
  'MISSING_SOURCE_DOCUMENT',
  'MISSING_SOURCE_URL',
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

/**
 * @param {unknown} details
 * @returns {string}
 */
function stringifyDetails(details) {
  if (!details || typeof details !== 'object') return '{}';
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return '{}';
  }
}

/**
 * @param {unknown} details
 * @returns {Array<{ label: string, value: string }>}
 */
function extractDetailHighlights(details) {
  if (!details || typeof details !== 'object') return [];
  const source = /** @type {Record<string, unknown>} */ (details);
  /** @type {Array<{ label: string, value: string }>} */
  const out = [];
  if (source.ageDays != null) out.push({ label: 'ageDays', value: String(source.ageDays) });
  if (source.staleDays != null) out.push({ label: 'staleDays', value: String(source.staleDays) });
  if (source.field != null) out.push({ label: 'field', value: String(source.field) });
  return out;
}

export default function AdminReviewQueue() {
  const [items, setItems] = useState(/** @type {any[]} */ ([]));
  const [pagination, setPagination] = useState({ nextCursor: null, limit: DEFAULT_LIMIT });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [bulkSaving, setBulkSaving] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(/** @type {any} */ (null));
  const [requestId, setRequestId] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [expandedDetailsIds, setExpandedDetailsIds] = useState(/** @type {string[]} */ ([]));
  const [selectedIds, setSelectedIds] = useState(/** @type {string[]} */ ([]));

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });

  const reasonOptions = useMemo(() => {
    const dynamic = Array.from(new Set(items.map((item) => item.reason).filter(Boolean)));
    return Array.from(new Set([...KNOWN_REASONS, ...dynamic]));
  }, [items]);

  const loadItems = useCallback(async (cursor = null) => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.admin.getReviewQueueItems({
        status: filters.status,
        entityType: filters.entityType,
        reason: filters.reason,
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
  }, [filters.status, filters.entityType, filters.reason]);

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

  const handleStatusChange = useCallback(
    /**
     * @param {string} id
     * @param {'resolved' | 'ignored'} status
     */
    async (id, status) => {
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
    },
    [loadItems],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = String(filters.search || '').trim().toLowerCase();
    return items.filter((item) => {
      if (filters.severity && item.severity !== filters.severity) return false;
      if (!normalizedSearch) return true;
      const haystack = [
        item.title,
        item.entitySlug,
        item.entityId,
        item.reason,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(' ');
      return haystack.includes(normalizedSearch);
    });
  }, [items, filters.severity, filters.search]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const expandedSet = useMemo(() => new Set(expandedDetailsIds), [expandedDetailsIds]);
  const visibleIds = useMemo(() => filteredItems.map((item) => item.id), [filteredItems]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
  const hasSelection = selectedIds.length > 0;

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const current = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) current.delete(id);
      } else {
        for (const id of visibleIds) current.add(id);
      }
      return Array.from(current);
    });
  }, [allVisibleSelected, visibleIds]);

  const toggleSelected = useCallback(
    /** @param {string} id */
    (id) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((candidate) => candidate !== id);
        return [...prev, id];
      });
    },
    [],
  );

  const toggleDetails = useCallback(
    /** @param {string} id */
    (id) => {
      setExpandedDetailsIds((prev) => {
        if (prev.includes(id)) return prev.filter((candidate) => candidate !== id);
        return [...prev, id];
      });
    },
    [],
  );

  const handleBulkAction = useCallback(
    /** @param {'resolved' | 'ignored'} nextStatus */
    async (nextStatus) => {
      if (selectedIds.length === 0) return;
      setBulkSaving(nextStatus);
      setError('');

      try {
        const response = await apiClient.admin.bulkUpdateReviewQueue(selectedIds, nextStatus);
        const result = response?.result || {};
        setLiveMessage(
          `Action de masse terminée (${result.updated || 0} mis a jour, ${result.skipped || 0} ignores, ${result.notFound || 0} introuvables)`,
        );
        setSelectedIds([]);
        await loadItems();
      } catch {
        setError("Impossible d'executer l'action de masse.");
      } finally {
        setBulkSaving('');
      }
    },
    [selectedIds, loadItems],
  );

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setSelectedIds([]);
    setExpandedDetailsIds([]);
    setLiveMessage('Filtres reinitialises');
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const visibleSet = new Set(visibleIds);
    setSelectedIds((prev) => prev.filter((id) => visibleSet.has(id)));
    setExpandedDetailsIds((prev) => prev.filter((id) => visibleSet.has(id)));
  }, [visibleIds]);

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
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-6">
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

          <label className="text-sm">
            <span className="mb-1 block text-slate-700">Severity</span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={filters.severity}
              onChange={(event) => setFilters((prev) => ({ ...prev, severity: event.target.value }))}
            >
              <option value="">all</option>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
            </select>
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-700">Search</span>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="title, slug, id, reason"
              data-testid="rq-search-input"
            />
          </label>

          <div className="md:col-span-3">
            <Button className="w-full" onClick={() => loadItems()} disabled={loading}>Apply</Button>
          </div>
          <div className="md:col-span-3">
            <Button className="w-full" variant="outline" onClick={resetFilters} disabled={loading}>
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSelection && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 py-4">
            <span className="text-sm text-slate-700">
              {selectedIds.length} item(s) sélectionné(s)
            </span>
            <Button
              size="sm"
              onClick={() => handleBulkAction('resolved')}
              disabled={bulkSaving !== '' || loading}
              data-testid="rq-bulk-resolve"
            >
              Resolve selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('ignored')}
              disabled={bulkSaving !== '' || loading}
              data-testid="rq-bulk-ignore"
            >
              Ignore selected
            </Button>
          </CardContent>
        </Card>
      )}

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
          <CardTitle>Items ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    aria-label="Select all visible items"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    disabled={filteredItems.length === 0}
                    data-testid="rq-select-all"
                  />
                </TableHead>
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
                  <TableCell colSpan={9} className="text-sm text-slate-600">Chargement...</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-sm text-slate-600">Aucun item.</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const publicLink = buildPublicLink(item);
                  const detailsOpen = expandedSet.has(item.id);
                  const detailsHighlights = extractDetailHighlights(item.details);

                  return (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell>
                          <input
                            type="checkbox"
                            aria-label={`Select review item ${item.id}`}
                            checked={selectedSet.has(item.id)}
                            onChange={() => toggleSelected(item.id)}
                            data-testid={`rq-select-${item.id}`}
                          />
                        </TableCell>
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
                          <div className="flex flex-wrap items-center gap-2">
                            {item.status === 'open' && (
                              <>
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
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleDetails(item.id)}
                              data-testid={`rq-details-toggle-${item.id}`}
                            >
                              {detailsOpen ? 'Hide details' : 'Details'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {detailsOpen && (
                        <TableRow data-testid={`rq-details-${item.id}`}>
                          <TableCell colSpan={9}>
                            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                              {detailsHighlights.length > 0 && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {detailsHighlights.map((entry) => (
                                    <Badge key={`${item.id}-${entry.label}`} variant="outline">
                                      {entry.label}: {entry.value}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-900 p-3 text-xs text-slate-100">
                                {stringifyDetails(item.details)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
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
