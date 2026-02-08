import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '_all', label: 'Tous les statuts' },
  { value: 'NEW', label: 'Nouveau' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'FIXED', label: 'Corrigé' },
  { value: 'REJECTED', label: 'Rejeté' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: '_all', label: 'Tous les types' },
  { value: 'AIDE', label: 'Aide' },
  { value: 'DEMARCHE', label: 'Démarche' },
  { value: 'STRUCTURE', label: 'Structure' },
  { value: 'ACTUALITE', label: 'Actualité' },
];

const REASON_LABELS = {
  LIEN_MORT: 'Lien mort',
  HORAIRES_FAUX: 'Horaires faux',
  INFO_FAUSSE: 'Info fausse',
  INFO_OBSOLETE: 'Info obsolète',
  AUTRE: 'Autre',
};

const STATUS_BADGES = {
  NEW: { label: 'Nouveau', className: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
  FIXED: { label: 'Corrigé', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejeté', className: 'bg-slate-100 text-slate-600' },
};

const CONTENT_TYPE_ROUTES = {
  AIDE: '/aides',
  DEMARCHE: '/demarches',
  STRUCTURE: '/structures',
  ACTUALITE: '/actualites',
};

function fetchReports({ status, contentType, page }) {
  const params = new URLSearchParams();
  if (status && status !== '_all') params.append('status', status);
  if (contentType && contentType !== '_all') params.append('contentType', contentType);
  params.append('page', page);
  params.append('pageSize', '20');

  const token = sessionStorage.getItem('access_token');
  return fetch('/api/reports?' + params.toString(), {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  }).then(r => {
    if (!r.ok) throw new Error('Failed to fetch reports');
    return r.json();
  });
}

function updateReportStatus(reportId, data) {
  const token = sessionStorage.getItem('access_token');
  return fetch('/api/reports?id=' + reportId, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(r => {
    if (!r.ok) throw new Error('Failed to update report');
    return r.json();
  });
}

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState('NEW');
  const [typeFilter, setTypeFilter] = useState('_all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter, typeFilter, page],
    queryFn: () => fetchReports({ status: statusFilter, contentType: typeFilter, page }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateReportStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });

  const reports = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Signalements</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-sm text-slate-600 self-center">
          {pagination.total} signalement{pagination.total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            Aucun signalement trouvé.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const statusBadge = STATUS_BADGES[report.status] || STATUS_BADGES.NEW;
                  const contentRoute = CONTENT_TYPE_ROUTES[report.contentType] || '/aides';

                  return (
                    <TableRow key={report.id}>
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {report.contentType}
                          </Badge>
                          <Link
                            to={`${contentRoute}/view?id=${report.contentId}`}
                            className="text-blue-600 hover:underline"
                            title="Voir la fiche"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {REASON_LABELS[report.reason] || report.reason}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">
                        {report.message || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {report.status === 'NEW' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => mutation.mutate({ id: report.id, status: 'IN_PROGRESS' })}
                              disabled={mutation.isPending}
                            >
                              Traiter
                            </Button>
                          )}
                          {(report.status === 'NEW' || report.status === 'IN_PROGRESS') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-700"
                                onClick={() => mutation.mutate({ id: report.id, status: 'FIXED' })}
                                disabled={mutation.isPending}
                              >
                                Corrigé
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-500"
                                onClick={() => mutation.mutate({ id: report.id, status: 'REJECTED' })}
                                disabled={mutation.isPending}
                              >
                                Rejeter
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
