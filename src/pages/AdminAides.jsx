import { useState } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STATUS_LABELS = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  NeedsReview: { label: 'À vérifier', color: 'bg-orange-100 text-orange-800' },
  published: { label: 'Publié', color: 'bg-green-100 text-green-800' }
};

export default function AdminAides() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: aides = [], isLoading } = useQuery({
    queryKey: ['admin-aides'],
    queryFn: () => client.entities.Aide.list('-updated_date'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => client.entities.Aide.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-aides'] });
    },
  });

  const filteredAides = aides.filter(aide => {
    const matchesSearch = !searchQuery ||
      aide.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || aide.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countByStatus = {
    all: aides.length,
    draft: aides.filter(a => a.status === 'draft').length,
    NeedsReview: aides.filter(a => a.status === 'NeedsReview').length,
    published: aides.filter(a => a.status === 'published').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Gestion des Aides
          </h1>
          <p className="text-slate-600">
            Gérez les fiches d'aides et démarches
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-900">{countByStatus.all}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900">{countByStatus.draft}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">À vérifier</p>
              <p className="text-2xl font-bold text-orange-600">{countByStatus.NeedsReview}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Publiés</p>
              <p className="text-2xl font-bold text-green-600">{countByStatus.published}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une aide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                  <SelectItem value="NeedsReview">À vérifier</SelectItem>
                  <SelectItem value="published">Publiés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAides.length > 0 ? (
          <div className="space-y-3">
            {filteredAides.map((aide) => {
              const statusInfo = STATUS_LABELS[aide.status] || STATUS_LABELS.draft;
              return (
                <Card key={aide.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {aide.title}
                          </h3>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {aide.summary_falc || aide.content_falc?.cest_quoi}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>Catégorie: {aide.category}</span>
                          {aide.verified_at && (
                            <span>• Vérifié: {new Date(aide.verified_at).toLocaleDateString('fr-FR')}</span>
                          )}
                          {aide.departments?.length > 0 && (
                            <span>• {aide.departments.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={createPageUrl('AideDetail') + '?id=' + aide.id} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={createPageUrl('AdminAideEdit', { id: aide.id })}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {aide.status === 'NeedsReview' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateStatusMutation.mutate({ id: aide.id, status: 'published' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Publier
                          </Button>
                        )}
                        {aide.status === 'published' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: aide.id, status: 'NeedsReview' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Revoir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucune aide trouvée</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
