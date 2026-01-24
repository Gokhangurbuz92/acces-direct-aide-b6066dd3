
import React, { useState, useEffect } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

export default function AdminStructureEdit() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        nom: '',
        type_structure: '',
        adresse: '',
        code_postal: '',
        ville: '',
        email: '',
        telephone: '',
        site_web: '',
        description_courte: '',
        statut: 'brouillon',
        updatedBy: '',
        quality_score: 50
    });

    const { data: structure, isLoading: isFetching } = useQuery({
        queryKey: ['structure', id],
        queryFn: async () => {
             const res = await client.entities.Structure.get(id);
             return res;
        },
        enabled: !!id
    });

    useEffect(() => {
        if (structure) {
            setFormData({
                ...formData,
                ...structure
            });
        }
    }, [structure]);

    const mutation = useMutation({
        mutationFn: (data) => {
            return id
                ? client.entities.Structure.update(id, data)
                : client.entities.Structure.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-structures'] });
            toast({ title: "Structure enregistrée" });
            navigate(createPageUrl('AdminStructures'));
        },
        onError: () => toast({ variant: "destructive", title: "Erreur lors de l'enregistrement" })
    });

    if (isFetching) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                <Link to={createPageUrl('AdminStructures')} className="flex items-center text-slate-600 mb-6 hover:text-blue-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la liste
                </Link>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {id ? 'Modifier la structure' : 'Nouvelle structure'}
                    </h1>
                    <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
                        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer
                    </Button>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identité</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Nom *</Label>
                                <Input
                                    value={formData.nom}
                                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Type</Label>
                                <Input
                                    value={formData.type_structure || ''}
                                    onChange={e => setFormData({ ...formData, type_structure: e.target.value })}
                                    placeholder="Ex: CCAS, Association..."
                                />
                            </div>
                            <div>
                                <Label>Description courte</Label>
                                <Textarea
                                    value={formData.description_courte || ''}
                                    onChange={e => setFormData({ ...formData, description_courte: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Coordonnées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Adresse</Label>
                                <Input
                                    value={formData.adresse || ''}
                                    onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Code Postal</Label>
                                    <Input
                                        value={formData.code_postal || ''}
                                        onChange={e => setFormData({ ...formData, code_postal: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Ville</Label>
                                    <Input
                                        value={formData.ville || ''}
                                        onChange={e => setFormData({ ...formData, ville: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Téléphone</Label>
                                <Input
                                    value={formData.telephone || ''}
                                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Site Web</Label>
                                <Input
                                    value={formData.site_web || ''}
                                    onChange={e => setFormData({ ...formData, site_web: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Statut & Métadonnées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Statut</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.statut}
                                    onChange={e => setFormData({ ...formData, statut: e.target.value })}
                                >
                                    <option value="brouillon">Brouillon</option>
                                    <option value="actif">Actif (Publié)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Modifié par</Label>
                                    <Input disabled value={formData.updatedBy || '-'} />
                                </div>
                                <div>
                                    <Label>Score Qualité</Label>
                                    <Input disabled value={formData.quality_score || 50} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
