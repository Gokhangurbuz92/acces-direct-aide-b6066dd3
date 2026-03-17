import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import SmsToggle from '@/components/SmsToggle';
import { getCsrfHeaders } from '@/lib/csrf';
import {
    ShieldCheck,
    Calendar,
    FileText,
    Trash2,
    Download,
    Clock,
    CheckCircle2,
    AlertTriangle,
    User,
    Lock,
    Video,
    MapPin,
    ArrowLeft,
    File,
} from 'lucide-react';

/**
 * UserPassport — Espace souverain du citoyen
 *
 * Route: /passport/:shareId
 *
 * No account needed — the shareId (from the diagnostic link)
 * acts as identity. The citizen can:
 * - View upcoming appointments
 * - See consent & file status
 * - Revoke all access (RGPD right to be forgotten)
 */
export default function UserPassport() {
    const { shareId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revokeStep, setRevokeStep] = useState('idle'); // idle | confirm | revoking | done

    const fetchPassport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/public/passport?shareId=${encodeURIComponent(shareId)}`
            );
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setError(d.error || 'Dossier introuvable.');
                return;
            }
            setData(await res.json());
        } catch {
            setError('Impossible de charger votre passeport.');
        } finally {
            setLoading(false);
        }
    }, [shareId]);

    useEffect(() => {
        fetchPassport();
    }, [fetchPassport]);

    const handleRevoke = async () => {
        setRevokeStep('revoking');
        try {
            const res = await fetch('/api/public/dossier-revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({ shareId }),
            });
            if (res.ok) {
                setRevokeStep('done');
            } else {
                setRevokeStep('idle');
            }
        } catch {
            setRevokeStep('idle');
        }
    };

    // Revoked state
    if (revokeStep === 'done') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <SEO title="Accès révoqué — ADA" noindex />
                <Card className="max-w-sm w-full text-center">
                    <CardContent className="p-8">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Accès révoqué
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">
                            Conformément à vos droits RGPD, l&apos;accès à votre dossier a
                            été supprimé. Les données chiffrées sont désormais inaccessibles.
                        </p>
                        <Button asChild className="w-full">
                            <Link to="/">Retour à l&apos;accueil</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Loading
    if (loading) {
        return (
            <div className="w-full p-4"><SkeletonList count={3} variant="card" /></div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-sm w-full text-center">
                    <CardContent className="p-8">
                        <AlertTriangle className="text-amber-500 mx-auto mb-4" size={28} />
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Dossier inaccessible
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">{error}</p>
                        <Button variant="outline" asChild>
                            <Link to="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Accueil
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const passport = data?.passport || {};
    const appointments = passport.appointments || [];

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Mon Passeport — ADA" noindex />
            <div className="max-w-xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                        <User size={18} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">
                            Mon Passeport ADA
                        </h1>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={9} /> Sécurisé E2EE
                        </p>
                    </div>
                </div>

                {/* Status cards */}
                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Statut
                            </p>
                            <p className="text-sm font-bold flex items-center gap-1.5">
                                {passport.isExpired ? (
                                    <><Clock size={12} className="text-red-500" /> Expiré</>
                                ) : (
                                    <><CheckCircle2 size={12} className="text-emerald-500" /> Actif</>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Expire le
                            </p>
                            <p className="text-sm font-bold text-slate-900">
                                {passport.expiresAt
                                    ? new Date(passport.expiresAt).toLocaleDateString('fr-FR')
                                    : '--'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Consentement
                            </p>
                            <p className="text-sm font-bold flex items-center gap-1.5">
                                {passport.hasConsent ? (
                                    <><CheckCircle2 size={12} className="text-emerald-500" /> Signé</>
                                ) : (
                                    <><Clock size={12} className="text-amber-500" /> En attente</>
                                )}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Justificatifs
                            </p>
                            <p className="text-sm font-bold flex items-center gap-1.5">
                                <File size={12} className="text-indigo-500" />
                                {passport.filesCount || 0} fichier(s)
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Appointments */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-500" />
                            Vos rendez-vous
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {appointments.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">
                                Aucun rendez-vous à venir
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3"
                                    >
                                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-indigo-600 border border-slate-100">
                                            {apt.mode === 'visio' ? (
                                                <Video size={14} />
                                            ) : (
                                                <MapPin size={14} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {apt.service}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(apt.date).toLocaleDateString('fr-FR', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}{' '}
                                                · {apt.professional}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* SMS Reminder — shown for each upcoming appointment */}
                {appointments.length > 0 && (
                    <SmsToggle appointmentId={appointments[0].id} />
                )}

                {/* Data control */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Lock size={14} className="text-amber-500" />
                            Contrôle de vos données
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full" disabled>
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Télécharger mon attestation
                        </Button>

                        {revokeStep === 'idle' && (
                            <Button
                                variant="outline"
                                className="w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setRevokeStep('confirm')}
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Révoquer tous les accès
                            </Button>
                        )}

                        {revokeStep === 'confirm' && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
                                <p className="text-xs font-semibold text-red-700 text-center flex items-center justify-center gap-1.5">
                                    <AlertTriangle size={12} />
                                    L&apos;agent ne pourra plus accéder à votre dossier.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setRevokeStep('idle')}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-red-600 hover:bg-red-700"
                                        onClick={handleRevoke}
                                    >
                                        Confirmer
                                    </Button>
                                </div>
                            </div>
                        )}

                        {revokeStep === 'revoking' && (
                            <div className="w-full p-4"><SkeletonList count={3} variant="card" /></div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-[10px] text-slate-400 py-2">
                    Architecture Zero-Knowledge — Aucune donnée en clair sur nos serveurs.
                </p>
            </div>
        </div>
    );
}
