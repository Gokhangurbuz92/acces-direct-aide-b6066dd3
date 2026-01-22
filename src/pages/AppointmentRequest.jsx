
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminClient as client } from '@/api/base44Client'; // Using adminClient for write access if public is read-only? 
// Actually, for public submission, we might need a public write endpoint or Edge Function if Base44 public client is read-only.
// Assuming publicClient has restricted write access or we use a specific function.
// For MVP 1.1, if we don't have auth, we might need to use a server-side action or a public collection.
// Let's assume publicClient.entities.AppointmentRequest.create works if permissions allow.
import { publicClient } from '@/api/base44Client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Calendar, Video, MapPin } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const MOTIFS_FALC = [
    "Je ne comprends pas un courrier",
    "Je veux faire une demande d'aide (RSA, APL...)",
    "J'ai un problème de logement",
    "J'ai un problème de santé",
    "Autre chose"
];

export default function AppointmentRequest() {
    const [searchParams] = useSearchParams();
    const structureId = searchParams.get('structure_id');
    const navigate = useNavigate();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        motif_falc: '',
        motif_detail: '',
        mode_preference: 'presentiel',
        creneaux: ['', '', ''],
        consentement: false
    });

    // Fetch structure details
    const { data: structure, isLoading: isLoadingStructure } = useQuery({
        queryKey: ['structure', structureId],
        queryFn: () => publicClient.entities.Structure.filter({ id: structureId }).then(res => res[0]),
        enabled: !!structureId
    });

    const mutation = useMutation({
        mutationFn: (data) => publicClient.entities.AppointmentRequest.create(data),
        onSuccess: () => {
            toast({
                title: "Demande envoyée",
                description: "La structure a reçu votre demande. Vous recevrez un email de confirmation.",
            });
            navigate(createPageUrl('Home')); // Or a success page
        },
        onError: (error) => {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible d'envoyer la demande. Veuillez réessayer.",
            });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!structureId) return;

        mutation.mutate({
            structure_id: structureId,
            structure_nom: structure.nom, // Denormalization for easier email handling
            usager_email: formData.email,
            usager_data: {
                nom: formData.nom,
                prenom: formData.prenom,
                telephone: formData.telephone
            },
            motif: formData.motif_falc === 'Autre chose' ? formData.motif_detail : formData.motif_falc,
            preference_mode: formData.mode_preference,
            creneaux_souhaites: formData.creneaux.filter(c => c),
            statut: 'nouveau',
            confirm_read: false
        });
    };

    if (isLoadingStructure) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    if (!structure) return <div className="p-12 text-center">Structure introuvable.</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <Link to={createPageUrl('StructureDetail') + `?id=${structureId}`} className="flex items-center text-slate-600 mb-6 hover:text-blue-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la page de la structure
                </Link>

                <Card>
                    <CardHeader className="bg-blue-600 text-white rounded-t-xl">
                        <CardTitle>Prendre rendez-vous avec {structure.nom}</CardTitle>
                        <p className="text-blue-100 mt-2">
                            Remplissez ce formulaire. La structure vous répondra par email ou téléphone.
                        </p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Motif */}
                            <div className="space-y-3">
                                <Label className="text-lg font-semibold">1. Pourquoi voulez-vous un rendez-vous ?</Label>
                                <RadioGroup
                                    value={formData.motif_falc}
                                    onValueChange={(v) => setFormData({ ...formData, motif_falc: v })}
                                    className="space-y-2"
                                >
                                    {MOTIFS_FALC.map((m) => (
                                        <div key={m} className="flex items-center space-x-2">
                                            <RadioGroupItem value={m} id={m} />
                                            <Label htmlFor={m} className="font-normal cursor-pointer">{m}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {formData.motif_falc === 'Autre chose' && (
                                    <Textarea
                                        placeholder="Expliquez brièvement votre besoin..."
                                        value={formData.motif_detail}
                                        onChange={(e) => setFormData({ ...formData, motif_detail: e.target.value })}
                                        required
                                    />
                                )}
                            </div>

                            {/* Préférence */}
                            <div className="space-y-3">
                                <Label className="text-lg font-semibold">2. Comment préférez-vous faire le rendez-vous ?</Label>
                                <RadioGroup
                                    value={formData.mode_preference}
                                    onValueChange={(v) => setFormData({ ...formData, mode_preference: v })}
                                    className="flex space-x-6"
                                >
                                    <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <RadioGroupItem value="presentiel" id="pres" />
                                        <Label htmlFor="pres" className="flex items-center cursor-pointer">
                                            <MapPin className="mr-2 h-4 w-4" /> Sur place
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <RadioGroupItem value="visio" id="visio" />
                                        <Label htmlFor="visio" className="flex items-center cursor-pointer">
                                            <Video className="mr-2 h-4 w-4" /> En vidéo (Visio)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {/* Créneaux */}
                            <div className="space-y-3">
                                <Label className="text-lg font-semibold">3. Quand êtes-vous disponible ? (Optionnel)</Label>
                                <p className="text-sm text-slate-500">Proposez jusqu'à 3 moments (Date et Heure approximative).</p>
                                {formData.creneaux.map((c, i) => (
                                    <Input
                                        key={i}
                                        placeholder={`Choix ${i + 1} (ex: Lundi matin, ou le 12/02 à 14h)`}
                                        value={c}
                                        onChange={(e) => {
                                            const newC = [...formData.creneaux];
                                            newC[i] = e.target.value;
                                            setFormData({ ...formData, creneaux: newC });
                                        }}
                                        className="mb-2"
                                    />
                                ))}
                            </div>

                            {/* Contact */}
                            <div className="space-y-4">
                                <Label className="text-lg font-semibold">4. Vos coordonnées</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Prénom *</Label>
                                        <Input
                                            required
                                            value={formData.prenom}
                                            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Nom *</Label>
                                        <Input
                                            required
                                            value={formData.nom}
                                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Email * (pour recevoir la confirmation)</Label>
                                    <Input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Téléphone (recommandé)</Label>
                                    <Input
                                        type="tel"
                                        value={formData.telephone}
                                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Consentement */}
                            <div className="flex items-start space-x-2 p-4 bg-slate-100 rounded-lg">
                                <Checkbox
                                    id="consent"
                                    checked={formData.consentement}
                                    onCheckedChange={(c) => setFormData({ ...formData, consentement: c })}
                                    required
                                />
                                <Label htmlFor="consent" className="text-sm leading-relaxed">
                                    J'accepte que mes informations soient envoyées à la structure {structure.nom} pour traiter ma demande de rendez-vous.
                                    Ces données ne seront pas utilisées à d'autres fins.
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full text-lg py-6"
                                disabled={!formData.consentement || mutation.isPending}
                            >
                                {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Envoyer la demande"}
                            </Button>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
