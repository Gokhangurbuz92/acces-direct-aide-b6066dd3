
import React, { useState } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Edit,
  Trash2,
  Loader2,
  FileText,
  Upload,
  Download,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  publie: { label: 'Publié', color: 'bg-green-100 text-green-800' }
};

export default function AdminActualites() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-actualites'],
    queryFn: () => client.entities.Actualite.list('-updatedAt'),
  });

  const actualites = response || []; // Actualite handler currently returns array directly, verify?

  const deleteMutation = useMutation({
    mutationFn: (id) => client.entities.Actualite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-actualites'] });
      toast({ title: "Actualité supprimée" });
    },
  });

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity', 'actualite');

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
        queryClient.invalidateQueries({ queryKey: ['admin-actualites'] });
    } catch (err) {
        toast({ variant: "destructive", title: "Erreur import", description: err.message });
    }
  };

  const handleExport = async () => {
     try {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch('/api/admin/export?entity=actualite', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `actualites-export-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
     } catch (err) {
        toast({ variant: "destructive", title: "Erreur export", description: err.message });
     }
  };

  const filteredActualites = Array.isArray(actualites) ? actualites.filter(actu => {
    const matchesSearch = !searchQuery ||
      actu.titre?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || actu.statut === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Gestion des Actualités</h1>
                <p className="text-slate-600">Gérez les actualités et informations.</p>
            </div>
             <div className="flex gap-2">
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".csv"
                    />
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Import
                    </Button>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Link to={createPageUrl('AdminActualiteEdit')}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Créer
                    </Button>
                </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredActualites.length > 0 ? (
          <div className="space-y-3">
            {filteredActualites.map((actu) => {
              const statusInfo = STATUS_LABELS[actu.statut] || STATUS_LABELS.brouillon;
              return (
                <Card key={actu.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {actu.titre}
                          </h3>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {actu.contenu}
                        </p>
                        <div className="text-xs text-slate-500">
                           {new Date(actu.date_publication).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={createPageUrl('AdminActualiteEdit') + '?id=' + actu.id}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                                if (window.confirm('Supprimer cette actualité ?')) deleteMutation.mutate(actu.id);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
              <p className="text-slate-600">Aucune actualité trouvée</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
