
import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Loader2, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";

const STATUS_CONFIG = {
    requested: { label: 'À confirmer', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    confirmed: { label: 'Confirmé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
    locked: { label: 'Réservé', color: 'bg-blue-100 text-blue-800', icon: Clock }
};

export default function ProAppointments() {
    const { user } = useOutletContext();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchAppointments = () => {
        setLoading(true);
        const token = localStorage.getItem('pro_token');
        fetch('/api/pro/appointments?pageSize=50', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then(data => setAppointments(data.items || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleCancel = async (id) => {
        if(!confirm("Voulez-vous vraiment annuler ce rendez-vous ?")) return;

        const token = localStorage.getItem('pro_token');
        try {
            const res = await fetch('/api/pro/appointments/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ id })
            });

            if (!res.ok) throw new Error("Failed to cancel");

            toast({ title: "Rendez-vous annulé" });
            fetchAppointments(); // Refresh list
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'annuler ce rendez-vous." });
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Mes Rendez-vous</h1>
                <Button variant="outline" onClick={fetchAppointments}>Actualiser</Button>
            </div>

            <div className="grid gap-4">
                {appointments.length === 0 && (
                    <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600">Aucun rendez-vous planifié.</p>
                    </div>
                )}

                {appointments.map(app => {
                    const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.requested;
                    const StatusIcon = status.icon;

                    return (
                        <div key={app.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-indigo-50 p-3 rounded-lg hidden sm:block">
                                    <Calendar className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-lg text-slate-900">
                                            {format(parseISO(app.start_at), 'PPPP à HH:mm', { locale: fr })}
                                        </span>
                                        <Badge variant="secondary" className={`${status.color} border-0 flex items-center gap-1`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            {app.beneficiary?.contactMasked || 'Bénéficiaire'}
                                        </div>
                                        <span className="text-slate-300">|</span>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            1h
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="outline" className="flex-1 sm:flex-none">Détails</Button>
                                {app.status !== 'cancelled' && (
                                    <Button
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                                        onClick={() => handleCancel(app.id)}
                                    >
                                        Annuler
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
