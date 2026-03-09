import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import SecureChat from '@/components/Messaging/SecureChat';
import FileVault from '@/components/FileVault';
import ExpertTools from '@/components/ExpertTools';
import {
    FileText,
    User,
    ShieldCheck,
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    ClipboardList,
    Download,
    Loader2,
    Lock,
    Eye,
    TrendingUp,
} from 'lucide-react';

/**
 * SharedDossier — Vue Pro d'un diagnostic partagé
 *
 * Route: /pro/dossier/:shareId
 *
 * - Récupère le diagnostic via /api/pro/dossier?shareId=...
 * - Affiche situation + résultats en lecture seule
 * - Permet de changer le statut de suivi (PATCH)
 * - Intègre le SecureChat E2EE existant pour communiquer avec l'usager
 */
export default function SharedDossier() {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const { user } = useOutletContext();

    const [dossier, setDossier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [followUp, setFollowUp] = useState('À traiter');
    const [updating, setUpdating] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;

    const fetchDossier = useCallback(async () => {
        if (!shareId) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(
                `/api/pro/dossier?shareId=${encodeURIComponent(shareId)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || data.message || 'Dossier introuvable.');
                return;
            }

            setDossier(data.dossier);
            const savedStatus = data.dossier?.results?._followUp?.status;
            if (savedStatus) setFollowUp(savedStatus);
        } catch {
            setError('Impossible de charger le dossier.');
        } finally {
            setLoading(false);
        }
    }, [shareId, token]);

    useEffect(() => {
        fetchDossier();
    }, [fetchDossier]);

    const handleStatusUpdate = async () => {
        setUpdating(true);
        setUpdateSuccess(false);
        try {
            const res = await fetch(
                `/api/pro/dossier?shareId=${encodeURIComponent(shareId)}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: followUp }),
                }
            );
            if (res.ok) {
                setUpdateSuccess(true);
                setTimeout(() => setUpdateSuccess(false), 3000);
            }
        } catch {
            // Silently handle
        } finally {
            setUpdating(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <SkeletonList count={3} variant="card" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Chargement sécurisé...
                </p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="max-w-lg mx-auto py-20">
                <Card className="border-red-200">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="text-red-400 mx-auto mb-4" size={36} />
                        <h2 className="text-lg font-bold text-slate-900 mb-2">
                            Dossier inaccessible
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">{error}</p>
                        <Button variant="outline" onClick={() => navigate('/pro/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const situation = dossier?.situation || {};
    const results = dossier?.results || {};
    const rights = results.rights || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={18} className="text-indigo-600" />
                            Dossier #{shareId?.slice(0, 8)}
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={10} /> Canal souverain — RGPD audité
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Eye size={12} />
                    {dossier?.viewCount || 0} consultation(s)
                    <span className="mx-1">•</span>
                    <Clock size={12} />
                    Expire le{' '}
                    {dossier?.expiresAt
                        ? new Date(dossier.expiresAt).toLocaleDateString('fr-FR')
                        : '--'}
                </div>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main: Situation + Results */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Situation */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <User size={14} className="text-indigo-500" />
                                Situation de l&apos;usager
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InfoField
                                    label="Localisation"
                                    value={situation.zipCode || situation.commune || '--'}
                                />
                                <InfoField
                                    label="Logement"
                                    value={situation.housingStatus || situation.statut_logement || '--'}
                                />
                                <InfoField
                                    label="Revenus mensuels"
                                    value={
                                        situation.salary || situation.revenu_mensuel
                                            ? `${situation.salary || situation.revenu_mensuel} €`
                                            : '--'
                                    }
                                />
                                <InfoField
                                    label="Composition"
                                    value={situation.familyStatus || situation.composition || '--'}
                                />
                                <InfoField
                                    label="Statut professionnel"
                                    value={situation.employmentStatus || situation.statut_emploi || '--'}
                                />
                                <InfoField
                                    label="Date diagnostic"
                                    value={
                                        dossier?.createdAt
                                            ? new Date(dossier.createdAt).toLocaleDateString('fr-FR')
                                            : '--'
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Results */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <ClipboardList size={14} className="text-indigo-500" />
                                Résultats du diagnostic IA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {rights.length === 0 ? (
                                <p className="text-sm text-slate-400 py-4 text-center">
                                    Aucun résultat de diagnostic disponible.
                                </p>
                            ) : (
                                rights.map((right, i) => (
                                    <div
                                        key={i}
                                        className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-sm text-slate-900">
                                                {right.name || right.label || `Aide #${i + 1}`}
                                            </p>
                                            {right.eligible !== false && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    Éligible
                                                </span>
                                            )}
                                        </div>
                                        {right.description && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                {right.description}
                                            </p>
                                        )}
                                        {right.amount && (
                                            <p className="text-xs font-semibold text-indigo-600 mt-1">
                                                Estimé : {right.amount} €/mois
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Status + Chat */}
                <div className="space-y-6">
                    {/* Follow-up status */}
                    <Card className="bg-slate-900 text-white border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <TrendingUp size={14} />
                                Suivi administratif
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label
                                    htmlFor="dossier-status"
                                    className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block"
                                >
                                    État actuel
                                </label>
                                <Select value={followUp} onValueChange={setFollowUp}>
                                    <SelectTrigger
                                        id="dossier-status"
                                        className="bg-slate-800 border-slate-700 text-white"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="À traiter">À traiter</SelectItem>
                                        <SelectItem value="En cours d'instruction">
                                            En cours d&apos;instruction
                                        </SelectItem>
                                        <SelectItem value="Besoin de pièces">
                                            Besoin de pièces
                                        </SelectItem>
                                        <SelectItem value="Dossier validé">
                                            Dossier validé
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleStatusUpdate}
                                disabled={updating}
                                className="w-full bg-indigo-600 hover:bg-indigo-500"
                            >
                                {updating ? (
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                )}
                                Mettre à jour
                            </Button>

                            {updateSuccess && (
                                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Statut mis à jour
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Secure chat */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Lock size={14} className="text-emerald-600" />
                                Messagerie E2EE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[350px]">
                                <SecureChat
                                    shareId={shareId}
                                    senderId={user?.id || 'pro'}
                                    receiverId="citizen"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* File vault */}
                    <FileVault shareId={shareId} onUploadSuccess={fetchDossier} />

                    {/* Expert Tools: AI Synthesis + PDF Signature */}
                    <ExpertTools shareId={shareId} />

                    {/* Security badge */}
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-1.5">
                            <ShieldCheck className="text-emerald-600" size={14} />
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                Audit RGPD
                            </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                            Chaque accès à ce dossier est enregistré. Les messages sont
                            chiffrés de bout en bout — le serveur ne stocke que des blobs
                            opaques.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoField({ label, value }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {label}
            </p>
            <p className="text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}
