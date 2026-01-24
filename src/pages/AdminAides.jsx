import React, { useState } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText,
  Upload,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  publie: { label: 'Publié', color: 'bg-green-100 text-green-800' },
  archive: { label: 'Archivé', color: 'bg-red-100 text-red-800' }
};

export default function AdminAides() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-aides'],
    queryFn: () => client.entities.Aide.list('-updatedAt'),
  });

  const aides = response?.items || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, statut }) => client.entities.Aide.update(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-aides'] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity', 'aide');

    try {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch('/api/admin/import', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const report = await res.json();
        toast({
            title: "Import terminé",
            description: `Créés: ${report.created}, Mis à jour: ${report.updated}, Erreurs: ${report.errors.length}`
        });
        queryClient.invalidateQueries({ queryKey: ['admin-aides'] });
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur import", description: err.message });
    }
  };

  const handleExport = async () => {
     try {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch('/api/admin/export?entity=aide', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aides-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
     } catch (err) {
        toast({ variant: "destructive", title: "Erreur export", description: err.message });
     }
  };

  const filteredAides = aides.filter(aide => {
    const matchesSearch = !searchQuery ||
      aide.titre?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || aide.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countByStatus = {
    all: aides.length,
    brouillon: aides.filter(a => a.statut === 'brouillon').length,
    publie: aides.filter(a => a.statut === 'publie').length,
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

        {/* Actions Bar */}
        <div className="flex justify-end gap-2 mb-4">
            <div className="relative">
                <input
                    type="file"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".csv"
                />
                <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Link to={createPageUrl('AdminAideEdit')}>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Créer
                </Button>
            </Link>
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
                  <SelectItem value="brouillon">Brouillons</SelectItem>
                  <SelectItem value="publie">Publiés</SelectItem>
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
              const statusInfo = STATUS_LABELS[aide.statut] || STATUS_LABELS.brouillon;
              return (
                <Card key={aide.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {aide.titre}
                          </h3>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {aide.summary_falc || aide.cest_quoi || aide.ce_que_ca_aide}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>Catégorie: {aide.categorie}</span>
                          {aide.date_verification && (
                            <span>• Vérifié: {new Date(aide.date_verification).toLocaleDateString('fr-FR')}</span>
                          )}
                          {aide.departements?.length > 0 && (
                            <span>• {aide.departements.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={createPageUrl('AideDetail') + '?id=' + aide.id} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={createPageUrl('AdminAideEdit') + '?id=' + aide.id}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {aide.statut === 'brouillon' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateStatusMutation.mutate({ id: aide.id, statut: 'publie' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Publier
                          </Button>
                        )}
                        {aide.statut === 'publie' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: aide.id, statut: 'brouillon' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Dépublier
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