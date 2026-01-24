
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

export default function AdminActualiteEdit() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        titre: '',
        contenu: '',
        date_publication: new Date().toISOString().split('T')[0],
        image_url: '',
        lien_url: '',
        source: '',
        statut: 'brouillon',
        updatedBy: '',
        quality_score: 0
    });

    const { data: actu, isLoading: isFetching } = useQuery({
        queryKey: ['actualite', id],
        queryFn: async () => {
             const res = await client.entities.Actualite.get(id);
             return res;
        },
        enabled: !!id
    });

    useEffect(() => {
        if (actu) {
            setFormData({
                ...formData,
                ...actu,
                date_publication: actu.date_publication ? actu.date_publication.split('T')[0] : ''
            });
        }
    }, [actu]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const payload = { ...data, date_publication: new Date(data.date_publication).toISOString() };
            return id
                ? client.entities.Actualite.update(id, payload)
                : client.entities.Actualite.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-actualites'] });
            toast({ title: "Actualité enregistrée" });
            navigate(createPageUrl('AdminActualites'));
        },
        onError: () => toast({ variant: "destructive", title: "Erreur lors de l'enregistrement" })
    });

    if (isFetching) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                <Link to={createPageUrl('AdminActualites')} className="flex items-center text-slate-600 mb-6 hover:text-blue-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la liste
                </Link>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {id ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
                    </h1>
                    <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
                        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer
                    </Button>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contenu</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Titre *</Label>
                                <Input
                                    value={formData.titre}
                                    onChange={e => setFormData({ ...formData, titre: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Contenu</Label>
                                <Textarea
                                    rows={6}
                                    value={formData.contenu || ''}
                                    onChange={e => setFormData({ ...formData, contenu: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Métadonnées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Date de publication</Label>
                                <Input
                                    type="date"
                                    value={formData.date_publication}
                                    onChange={e => setFormData({ ...formData, date_publication: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Source</Label>
                                <Input
                                    value={formData.source || ''}
                                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Lien URL</Label>
                                <Input
                                    value={formData.lien_url || ''}
                                    onChange={e => setFormData({ ...formData, lien_url: e.target.value })}
                                />
                            </div>
                             <div>
                                <Label>Image URL</Label>
                                <Input
                                    value={formData.image_url || ''}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Statut</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.statut}
                                    onChange={e => setFormData({ ...formData, statut: e.target.value })}
                                >
                                    <option value="brouillon">Brouillon</option>
                                    <option value="publie">Publié</option>
                                </select>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Modifié par</Label>
                                    <Input disabled value={formData.updatedBy || '-'} />
                                </div>
                                <div>
                                    <Label>Score Qualité</Label>
                                    <Input disabled value={formData.quality_score || 0} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
