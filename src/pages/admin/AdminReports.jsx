import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  Loader2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

const STATUS_CONFIG = {
  NEW: {
    label: 'Nouveau',
    variant: 'destructive',
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: 'En cours',
    variant: 'default',
    icon: Clock,
  },
  FIXED: {
    label: 'Corrigé',
    variant: 'success',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejeté',
    variant: 'secondary',
    icon: XCircle,
  },
};

const REASON_LABELS = {
  LIEN_MORT: 'Lien mort',
  HORAIRES_FAUX: 'Horaires incorrects',
  INFO_FAUSSE: 'Information fausse',
  INFO_OBSOLETE: 'Information obsolète',
  AUTRE: 'Autre',
};

const CONTENT_TYPE_LABELS = {
  AIDE: 'Aide',
  DEMARCHE: 'Démarche',
  STRUCTURE: 'Structure',
  ACTUALITE: 'Actualité',
};

const CONTENT_TYPE_ROUTES = {
  AIDE: '/aides',
  DEMARCHE: '/demarches',
  STRUCTURE: '/structures',
  ACTUALITE: '/actualites',
};

export default function AdminReports() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('NEW');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch reports
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', statusFilter, contentTypeFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (contentTypeFilter !== 'all') params.append('contentType', contentTypeFilter);

      const response = await apiClient.auth.getUser();
      if (!response) throw new Error('Not authenticated');

      const result = await fetch(`/api/reports?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
        },
      });

      if (!result.ok) throw new Error('Failed to fetch reports');
      return result.json();
    },
  });

  // Update report status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, newStatus }) => {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update report');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur', {
        description: error.message,
      });
    },
  });

  const handleStatusChange = (reportId, newStatus) => {
    updateStatusMutation.mutate({ reportId, newStatus });
  };

  const getContentLink = (report) => {
    const baseRoute = CONTENT_TYPE_ROUTES[report.contentType];
    if (!baseRoute) return null;
    return `${baseRoute}/view?id=${report.contentId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-center text-red-600">
              Erreur lors du chargement des signalements
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reports = data?.reports || [];
  const pagination = data?.pagination || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            <Flag className="inline h-8 w-8 mr-2" />
            Signalements
          </h1>
          <p className="text-slate-600 mt-1">
            Gérer les signalements d'erreurs des utilisateurs
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Statut
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="NEW">Nouveaux</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="FIXED">Corrigés</SelectItem>
                  <SelectItem value="REJECTED">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type de contenu
              </label>
              <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="AIDE">Aides</SelectItem>
                  <SelectItem value="DEMARCHE">Démarches</SelectItem>
                  <SelectItem value="STRUCTURE">Structures</SelectItem>
                  <SelectItem value="ACTUALITE">Actualités</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination.total || 0} signalement(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun signalement trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const StatusIcon = STATUS_CONFIG[report.status]?.icon || AlertCircle;
                    const contentLink = getContentLink(report);

                    return (
                      <TableRow key={report.id}>
                        <TableCell className="text-sm text-slate-600">
                          {format(new Date(report.createdAt), 'dd MMM yyyy HH:mm', {
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONTENT_TYPE_LABELS[report.contentType]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {REASON_LABELS[report.reason]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-slate-600 truncate">
                              {report.message || '-'}
                            </p>
                            {report.reporterEmail && (
                              <p className="text-xs text-slate-500 mt-1">
                                {report.reporterEmail}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={report.status}
                            onValueChange={(value) =>
                              handleStatusChange(report.id, value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <div className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <config.icon className="h-4 w-4" />
                                    {config.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {contentLink && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link to={contentLink} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {report.pageUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={report.pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-slate-600">
                Page {pagination.page} sur {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={currentPage === pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
