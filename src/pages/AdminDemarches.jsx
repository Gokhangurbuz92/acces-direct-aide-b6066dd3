
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
import { Search, Loader2, Edit, Plus, Trash2, FileText, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

export default function AdminDemarches() {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: demarches = [], isLoading } = useQuery({
        queryKey: ['admin-demarches'],
        queryFn: () => client.entities.Demarche.list('-updated_date'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => client.entities.Demarche.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-demarches'] });
            toast({ title: "Démarche supprimée" });
        },
        onError: () => toast({ variant: "destructive", title: "Erreur lors de la suppression" })
    });

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
                    <Link to={createPageUrl('AdminDemarcheEdit')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Créer une démarche
                        </Button>
                    </Link>
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
