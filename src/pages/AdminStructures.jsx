import { SkeletonList } from '@/components/ui/skeleton';

import { useState } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Loader2, Edit, Plus, Trash2, MapPin, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

export default function AdminStructures() {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: structures = [], isLoading } = useQuery({
        queryKey: ['admin-structures'],
        queryFn: () => client.entities.Structure.list('-updated_date'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => client.entities.Structure.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-structures'] });
            toast({ title: "Structure supprimée" });
        },
        onError: () => toast({ variant: "destructive", title: "Erreur lors de la suppression" })
    });

    const filteredStructures = structures.filter(s =>
        !searchQuery || s.nom?.toLowerCase().includes(searchQuery.toLowerCase()) || s.ville?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="p-6"><SkeletonList count={4} variant="table-row" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Gestion des Structures</h1>
                        <p className="text-slate-600">Gérez les organismes et professionnels référencés.</p>
                    </div>
                    <Button disabled>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une structure
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Rechercher par nom ou ville..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredStructures.length === 0 ? (
                            <p className="text-center py-8 text-slate-500">Aucune structure trouvée.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Localisation</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStructures.map((structure) => (
                                        <TableRow key={structure.id}>
                                            <TableCell className="font-medium">{structure.nom}</TableCell>
                                            <TableCell>{structure.type_structure}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <MapPin className="h-3 w-3" />
                                                    {structure.ville} ({structure.departement})
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={structure.statut === 'actif' ? 'default' : 'secondary'}>
                                                    {structure.statut || 'Inconnu'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link to={createPageUrl('StructureDetail') + `?id=${structure.id}`} target="_blank">
                                                        <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" disabled><Edit className="h-4 w-4" /></Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            if (window.confirm('Supprimer cette structure ?')) deleteMutation.mutate(structure.id);
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
