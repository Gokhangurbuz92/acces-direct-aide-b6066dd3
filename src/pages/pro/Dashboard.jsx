import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Users,
    Building2,
    MessageCircle,
    Video,
    Clock,
    ChevronRight,
    ShieldCheck,
    Plus,
    ExternalLink,
    CheckCircle2,
    Loader2,
} from 'lucide-react';

/**
 * ProDashboard — Hub central de l'Espace Professionnel
 *
 * Affiche :
 * - Prochains RDV avec lancement visio
 * - Équipe en ligne (aperçu)
 * - Badge E2EE Zero-Knowledge
 * - Bouton synchronisation Outlook
 */
export default function ProDashboard() {
    const { user } = useOutletContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [appointments, setAppointments] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [outlookConnected, setOutlookConnected] = useState(false);

    // Check if we just came back from Outlook auth
    useEffect(() => {
        if (searchParams.get('outlook') === 'connected') {
            setOutlookConnected(true);
        }
    }, [searchParams]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('pro_token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            // Fetch upcoming appointments
            const [apptRes, teamRes] = await Promise.allSettled([
                fetch('/api/pro/appointments?limit=5&status=booked', { headers }),
                fetch('/api/pro/team', { headers }),
            ]);

            if (apptRes.status === 'fulfilled' && apptRes.value.ok) {
                const data = await apptRes.value.json();
                setAppointments(data.items || data.appointments || []);
            }

            if (teamRes.status === 'fulfilled' && teamRes.value.ok) {
                const data = await teamRes.value.json();
                setTeamMembers(data.users || []);
            }
        } catch (e) {
            console.error('[ProDashboard] Erreur:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleOutlookSync = () => {
        const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
        if (!clientId) {
            alert('Configuration Outlook non disponible. Contactez l\'administrateur.');
            return;
        }
        const redirectUri = encodeURIComponent(
            `${window.location.origin}/api/auth/callback/outlook`
        );
        const scope = encodeURIComponent('Calendars.Read');
        const state = encodeURIComponent(user?.id || '');
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
        window.location.href = authUrl;
    };

    const handleLaunchVisio = (appointmentId) => {
        navigate(`/pro/visio/${appointmentId}`);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Tableau de Bord
                    </h1>
                    <p className="text-sm text-slate-500">
                        Bienvenue, {user?.email}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/pro/rdv/new')}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Créneau
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleOutlookSync}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        {outlookConnected ? 'Outlook Connecté ✓' : 'Synchro Outlook'}
                    </Button>
                </div>
            </div>

            {/* Outlook success banner */}
            {outlookConnected && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                    <CheckCircle2 size={20} />
                    <p className="text-sm font-medium">
                        Votre agenda Outlook a été synchronisé avec succès !
                    </p>
                </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments.length}</div>
                        <p className="text-xs text-muted-foreground">À venir</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Équipe</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teamMembers.length || '--'}</div>
                        <p className="text-xs text-muted-foreground">Membres actifs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Structure</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">Actif</div>
                        <p className="text-xs text-muted-foreground">Module Pro activé</p>
                    </CardContent>
                </Card>
                <Card className="border-indigo-200 bg-indigo-50/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700">
                            Visioconférence
                        </CardTitle>
                        <Video className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <Button
                            size="sm"
                            variant="outline"
                            className="mt-1 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                            onClick={() => navigate('/pro/visio')}
                        >
                            <Video className="mr-2 h-3 w-3" /> Lancer une visio
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Upcoming Appointments */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                            <Clock className="text-indigo-500" size={16} />
                            Prochaines Consultations
                        </h2>
                        <Link
                            to="/pro/rdv/agenda"
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                        >
                            Voir tout <ExternalLink size={12} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-slate-400" size={24} />
                        </div>
                    ) : appointments.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="text-slate-300 mb-4" size={40} />
                                <p className="text-sm font-medium text-slate-500">
                                    Aucun rendez-vous à venir
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Créez un créneau ou synchronisez votre agenda Outlook
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => navigate('/pro/rdv/new')}
                                >
                                    <Plus className="mr-2 h-3 w-3" /> Créer un créneau
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {appointments.slice(0, 5).map((rdv) => (
                                <Card
                                    key={rdv.id}
                                    className="hover:border-indigo-200 transition-colors"
                                >
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm border border-slate-200">
                                                {(rdv.beneficiaryName || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">
                                                    {rdv.beneficiaryName || 'Bénéficiaire'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {rdv.startAt
                                                        ? new Date(rdv.startAt).toLocaleDateString('fr-FR', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })
                                                        : '--'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => handleLaunchVisio(rdv.id)}
                                                title="Lancer la visio"
                                            >
                                                <Video size={16} />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    navigate(`/pro/appointments/${rdv.id}`)
                                                }
                                            >
                                                Dossier <ChevronRight className="ml-1" size={14} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar widgets */}
                <div className="space-y-6">
                    {/* Team preview */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Users className="text-indigo-500" size={14} />
                                    Équipe
                                </CardTitle>
                                <Link
                                    to="/pro/team"
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Gérer
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {teamMembers.length === 0 ? (
                                <p className="text-xs text-slate-400">
                                    Aucun membre trouvé
                                </p>
                            ) : (
                                teamMembers.slice(0, 4).map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                                                {(m.email || '?')[0].toUpperCase()}
                                                {m.status === 'active' && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-800 truncate max-w-[140px]">
                                                    {m.email}
                                                </p>
                                                <p className="text-[10px] text-slate-400">{m.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Messages shortcut */}
                    <Card className="cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => navigate('/pro/messages')}>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <MessageCircle className="text-indigo-600" size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">
                                    Messagerie sécurisée
                                </p>
                                <p className="text-xs text-slate-400">
                                    Conversations chiffrées E2EE
                                </p>
                            </div>
                            <ChevronRight className="ml-auto text-slate-300" size={16} />
                        </CardContent>
                    </Card>

                    {/* E2EE indicator */}
                    <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="text-emerald-600" size={18} />
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                Chiffrement E2EE
                            </h4>
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                            Vos données et messages sont protégés par des clés souveraines.
                            Aucun stockage en clair n&apos;est effectué conformément au RGPD.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
