
import { useState, useEffect } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Plus, X } from 'lucide-react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = [
    'logement', 'sante', 'handicap', 'emploi', 'famille',
    'budget', 'mobilite', 'justice', 'numerique', 'etrangers',
    'vieillissement', 'autre'
];

export default function AdminDemarcheEdit() {
    const { id: routeId } = useParams();
    const [searchParams] = useSearchParams();
    const queryId = searchParams.get('id');
    const id = routeId && routeId !== 'new' ? routeId : queryId;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        titre: '',
        categorie: 'autre',
        description_courte: '',
        pour_qui: '',
        ou_faire: '',
        lien_officiel: '',
        documents_necessaires: [''],
    });

    const { data: demarche, isLoading: isFetching } = useQuery({
        queryKey: ['demarche', id],
        queryFn: () => client.entities.Demarche.filter({ id }).then(res => res[0]),
        enabled: !!id
    });

    useEffect(() => {
        if (demarche) {
            setFormData({
                ...demarche,
                documents_necessaires: demarche.documents_necessaires?.length ? demarche.documents_necessaires : ['']
            });
        }
    }, [demarche]);

    const mutation = useMutation({
        mutationFn: (data) => {
            const cleanData = {
                ...data,
                documents_necessaires: data.documents_necessaires.filter(d => d.trim())
            };
            return id
                ? client.entities.Demarche.update(id, cleanData)
                : client.entities.Demarche.create(cleanData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-demarches'] });
            toast({ title: "Démarche enregistrée" });
            navigate(createPageUrl('AdminDemarches'));
        },
        onError: () => toast({ variant: "destructive", title: "Erreur lors de l'enregistrement" })
    });

    const updateDoc = (index, value) => {
        const newDocs = [...formData.documents_necessaires];
        newDocs[index] = value;
        setFormData({ ...formData, documents_necessaires: newDocs });
    };

    const addDoc = () => {
        setFormData({ ...formData, documents_necessaires: [...formData.documents_necessaires, ''] });
    };

    const removeDoc = (index) => {
        const newDocs = formData.documents_necessaires.filter((_, i) => i !== index);
        setFormData({ ...formData, documents_necessaires: newDocs });
    };

    if (isFetching) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                <Link to={createPageUrl('AdminDemarches')} className="flex items-center text-slate-600 mb-6 hover:text-blue-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la liste
                </Link>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {id ? 'Modifier la démarche' : 'Créer une démarche'}
                    </h1>
                    <Button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
                        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer
                    </Button>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Titre</Label>
                                <Input
                                    value={formData.titre}
                                    onChange={e => setFormData({ ...formData, titre: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Catégorie</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.categorie}
                                    onChange={e => setFormData({ ...formData, categorie: e.target.value })}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Description courte (FALC)</Label>
                                <Textarea
                                    value={formData.description_courte}
                                    onChange={e => setFormData({ ...formData, description_courte: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Checklist Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-500 mb-2">Listez les documents nécessaires pour cette démarche.</p>
                            {formData.documents_necessaires.map((doc, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={doc}
                                        onChange={e => updateDoc(idx, e.target.value)}
                                        placeholder="Ex: Pièce d'identité"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removeDoc(idx)}>
                                        <X className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addDoc}>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter un document
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Détails</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Pour qui ? (Critères)</Label>
                                <Textarea
                                    value={formData.pour_qui}
                                    onChange={e => setFormData({ ...formData, pour_qui: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Où faire la demande ?</Label>
                                <Textarea
                                    value={formData.ou_faire}
                                    onChange={e => setFormData({ ...formData, ou_faire: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Lien officiel</Label>
                                <Input
                                    value={formData.lien_officiel}
                                    onChange={e => setFormData({ ...formData, lien_officiel: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
