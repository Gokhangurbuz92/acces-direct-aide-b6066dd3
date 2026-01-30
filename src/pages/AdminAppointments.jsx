
import React, { useState } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Check, X, Calendar, Clock, Video, MapPin, Mail, Phone, MessageSquare } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const STATUS_VARIANTS = {
    nouveau: 'bg-blue-100 text-blue-800',
    accepte: 'bg-green-100 text-green-800',
    refuse: 'bg-red-100 text-red-800',
    planifie: 'bg-indigo-100 text-indigo-800',
    annule: 'bg-slate-100 text-slate-800',
};

export default function AdminAppointments() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [actionType, setActionType] = useState(null); // 'accept', 'refuse', 'reschedule'

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['admin-appointments'],
        queryFn: () => client.entities.AppointmentRequest.list('-created_date'), // Sorting not yet std in mock, assume list returns all
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => client.entities.AppointmentRequest.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
            toast({ title: "Mise à jour effectuée" });
            setSelectedRequest(null);
            setResponseMessage('');
            setActionType(null);
        },
        onError: () => {
            toast({ variant: "destructive", title: "Erreur lors de la mise à jour" });
        }
    });

    const handleAction = () => {
        if (!selectedRequest || !actionType) return;

        let newStatus = 'nouveau';
        if (actionType === 'accept') newStatus = 'accepte';
        if (actionType === 'refuse') newStatus = 'refuse';
        // Logic could be more complex here (sending email via backend etc)

        updateMutation.mutate({
            id: selectedRequest.id,
            updates: {
                statut: newStatus,
                admin_response: responseMessage,
                processed_at: new Date().toISOString()
            }
        });
    };

    const openActionDialog = (req, type) => {
        setSelectedRequest(req);
        setActionType(type);
        setResponseMessage(
            type === 'accept' ? `Bonjour ${req.usager_data?.prenom || ''},\n\nNous confirmons votre demande de rendez-vous pour le ${req.creneaux_souhaites?.[0] || '...'}.\n\nCordialement,` :
                type === 'refuse' ? `Bonjour ${req.usager_data?.prenom || ''},\n\nMalheureusement nous ne pouvons pas répondre favorablement à votre demande car...\n\nCordialement,` : ''
        );
    };

    if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-900">Demandes de Rendez-vous</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Boîte de réception</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">Aucune demande pour le moment.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Structure</TableHead>
                                        <TableHead>Usager</TableHead>
                                        <TableHead>Motif</TableHead>
                                        <TableHead>Préférence</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="text-slate-600">
                                                {req.created_date ? new Date(req.created_date).toLocaleDateString('fr-FR') : '-'}
                                            </TableCell>
                                            <TableCell className="font-medium">{req.structure_nom}</TableCell>
                                            <TableCell>
                                                <div>{req.usager_data?.prenom} {req.usager_data?.nom}</div>
                                                <div className="text-xs text-slate-500">{req.usager_email}</div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={req.motif}>
                                                {req.motif}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {req.preference_mode === 'visio' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                                    <span className="capitalize">{req.preference_mode}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={STATUS_VARIANTS[req.statut] || 'bg-gray-100'}>
                                                    {req.statut}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {req.statut === 'nouveau' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openActionDialog(req, 'accept')}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openActionDialog(req, 'refuse')}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                                {req.statut !== 'nouveau' && (
                                                    <Button size="sm" variant="ghost" disabled>
                                                        Traité
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'accept' ? 'Accepter le rendez-vous' : 'Refuser la demande'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                            <p><strong>De:</strong> {selectedRequest?.usager_data?.prenom} {selectedRequest?.usager_data?.nom}</p>
                            <p><strong>Motif:</strong> {selectedRequest?.motif}</p>
                            <p><strong>Créneaux souhaités:</strong> {selectedRequest?.creneaux_souhaites?.join(', ')}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Réponse par email :</label>
                            <Textarea
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRequest(null)}>Annuler</Button>
                        <Button
                            className={actionType === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            onClick={handleAction}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {actionType === 'accept' ? 'Confirmer le RDV' : 'Envoyer le refus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
