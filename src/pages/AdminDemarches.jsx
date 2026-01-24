
import React, { useState } from 'react';
import { adminClient as client } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Loader2, Edit, Plus, Trash2, FileText, Eye, Upload, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  publie: { label: 'Publié', color: 'bg-green-100 text-green-800' }
};

export default function AdminDemarches() {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-demarches'],
        queryFn: () => client.entities.Demarche.list('-updatedAt'),
    });

    const demarches = response?.items || [];

    const deleteMutation = useMutation({
        mutationFn: (id) => client.entities.Demarche.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-demarches'] });
            toast({ title: "Démarche supprimée" });
        },
        onError: () => toast({ variant: "destructive", title: "Erreur lors de la suppression" })
    });

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity', 'demarche');

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
            queryClient.invalidateQueries({ queryKey: ['admin-demarches'] });
        } catch (err) {
            toast({ variant: "destructive", title: "Erreur import", description: err.message });
        }
    };

    const handleExport = async () => {
         try {
            const token = sessionStorage.getItem('access_token');
            const res = await fetch('/api/admin/export?entity=demarche', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `demarches-export-${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
         } catch (err) {
            toast({ variant: "destructive", title: "Erreur export", description: err.message });
         }
    };

    const filteredDemarches = demarches.filter(d =>
        !searchQuery || d.titre?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gestion des Démarches</h1>
                        <p className="text-slate-600">Gérez les fiches démarches et checklists.</p>
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
                        <Link to={createPageUrl('AdminDemarcheEdit')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Créer
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher une démarche..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredDemarches.length === 0 ? (
                            <p className="text-center py-8 text-slate-500">Aucune démarche trouvée.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Titre</TableHead>
                                        <TableHead>Catégorie</TableHead>
                                        <TableHead>Checklist</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDemarches.map((demarche) => (
                                        <TableRow key={demarche.id}>
                                            <TableCell className="font-medium">{demarche.titre}</TableCell>
                                            <TableCell>{demarche.categorie}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <FileText className="h-3 w-3" />
                                                    {demarche.documents_necessaires?.length || 0} documents
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link to={createPageUrl('DemarcheDetail') + `?id=${demarche.id}`} target="_blank">
                                                        <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                                                    </Link>
                                                    <Link to={createPageUrl('AdminDemarcheEdit') + `?id=${demarche.id}`}>
                                                        <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            if (window.confirm('Supprimer cette démarche ?')) deleteMutation.mutate(demarche.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
