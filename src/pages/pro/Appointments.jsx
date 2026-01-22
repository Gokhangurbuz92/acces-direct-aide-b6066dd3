
import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Loader2, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProAppointments() {
    const { user } = useOutletContext();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('pro_token');
        fetch('/api/pro/appointments', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setAppointments(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader2 className="animate-spin h-8 w-8 mx-auto" />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Mes Rendez-vous</h1>

            <div className="grid gap-4">
                {appointments.length === 0 && <p className="text-slate-500">Aucun rendez-vous planifié.</p>}
                {appointments.map(app => (
                    <div key={app.id} className="bg-white p-4 rounded-lg shadow border border-slate-200 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span className="font-semibold text-slate-900">
                                    {format(new Date(app.start_at), 'PPP à HH:mm', { locale: fr })}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${app.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {app.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <User className="h-4 w-4" />
                                <span>{app.beneficiary.firstName || 'Bénéficiaire'} ({app.beneficiary.contactMasked})</span>
                                <span className="text-slate-300">|</span>
                                <span>{app.serviceName}</span>
                            </div>
                        </div>
                        <Button asChild variant="outline">
                            <Link to={`/pro/appointments/${app.id}`}>Détails</Link>
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
