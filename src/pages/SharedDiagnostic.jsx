import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    ShieldCheck,
    Users,
    Euro,
    MapPin,
    Briefcase,
    AlertCircle,
    FileText,
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    Calendar,
    Home,
    FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const HOUSING_LABELS = {
    tenant: 'Locataire',
    tenant_hlm: 'Locataire HLM',
    owner: 'Propriétaire',
    free: 'Hébergé(e) gratuitement',
    homeless: 'Sans domicile fixe',
};

const EMPLOYMENT_LABELS = {
    'salarié': 'Salarié',
    'sans_emploi': 'Sans emploi / Recherche',
    'indépendant': 'Indépendant',
    'retraité': 'Retraité',
    'étudiant': 'Étudiant',
};

/**
 * SharedDiagnostic
 *
 * Public read-only page displaying a shared diagnostic.
 * Fetches data from GET /api/share/get?id=...
 * Includes a "Download PDF" button for the viewer.
 */
export default function SharedDiagnostic() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) {
            setError('Aucun identifiant de partage fourni.');
            setLoading(false);
            return;
        }

        fetch(`/api/share/get?id=${encodeURIComponent(id)}`)
            .then(async (res) => {
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message || 'Dossier introuvable ou expiré.');
                }
                return res.json();
            })
            .then((json) => setData(json.data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDownloadPDF = async () => {
        try {
            const { generateSocialPassport } = await import('@/lib/pdf-generator');
            generateSocialPassport(data.situation || {}, data.results || {});
        } catch (err) {
            console.error('[PDF] Generation failed:', err);
        }
    };

    // --- Loading ---
    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
                    Accès sécurisé au dossier…
                </p>
            </div>
        );
    }

    // --- Error ---
    if (error) {
        return (
            <>
                <Helmet>
                    <title>Dossier introuvable | Accès Direct Aide</title>
                </Helmet>
                <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
                    <div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <h2 className="mb-2 text-xl font-black text-slate-800">Dossier introuvable</h2>
                        <p className="mb-6 text-sm text-slate-500">{error}</p>
                        <Link to="/">
                            <Button className="gap-2">
                                <Home className="h-4 w-4" /> Retour à l&#39;accueil
                            </Button>
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    // --- Data ---
    const situation = data?.situation || {};
    const results = data?.results || {};
    const rights = results.rights || [];
    const eligibleRights = rights.filter((r) => r.eligible && r.amount > 0);
    const nonEligibleRights = rights.filter((r) => !r.eligible);
    const totalMonthly = eligibleRights.reduce((sum, r) => sum + (r.amount || 0), 0);
    const createdDate = new Date(data.createdAt).toLocaleDateString('fr-FR');
    const expiresDate = new Date(data.expiresAt).toLocaleDateString('fr-FR');

    return (
        <>
            <Helmet>
                <title>Passeport Social Partagé | Accès Direct Aide</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="min-h-screen bg-slate-50 p-4 md:p-12">
                <div className="mx-auto max-w-4xl space-y-8">
                    {/* Header */}
                    <header className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:p-8">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black italic leading-none tracking-tight">
                                    PASSEPORT{' '}
                                    <span className="text-indigo-600">PARTAGÉ</span>
                                </h1>
                                <p className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <Clock className="h-3 w-3 text-indigo-400" />
                                    Généré le {createdDate} • Expire le {expiresDate}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Certifié OpenFisca
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                        {/* Situation Panel */}
                        <aside className="space-y-4 md:col-span-4">
                            <h2 className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                <FileText className="h-3.5 w-3.5" /> Profil Déclaré
                            </h2>
                            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <InfoItem
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Naissance"
                                    value={situation.birthDate || 'Non précisée'}
                                />
                                <InfoItem
                                    icon={<Euro className="h-4 w-4" />}
                                    label="Salaire net"
                                    value={`${Number(situation.salary) || 0} €`}
                                />
                                <InfoItem
                                    icon={<Home className="h-4 w-4" />}
                                    label="Logement"
                                    value={HOUSING_LABELS[situation.housingStatus] || 'Non précisé'}
                                />
                                <InfoItem
                                    icon={<Euro className="h-4 w-4" />}
                                    label="Loyer"
                                    value={`${Number(situation.rent) || 0} €`}
                                />
                                <InfoItem
                                    icon={<Users className="h-4 w-4" />}
                                    label="Foyer"
                                    value={`${situation.householdSize || 1} pers.`}
                                />
                                <InfoItem
                                    icon={<MapPin className="h-4 w-4" />}
                                    label="Code Postal"
                                    value={situation.zipCode || 'Non précisé'}
                                />
                                <InfoItem
                                    icon={<Briefcase className="h-4 w-4" />}
                                    label="Statut pro"
                                    value={EMPLOYMENT_LABELS[situation.employmentStatus] || 'Non précisé'}
                                />
                            </div>
                        </aside>

                        {/* Rights Panel */}
                        <main className="space-y-4 md:col-span-8">
                            <h2 className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                <ShieldCheck className="h-3.5 w-3.5" /> Éligibilités Estimées
                            </h2>

                            {/* Total Banner */}
                            {eligibleRights.length > 0 && (
                                <div className="relative overflow-hidden rounded-2xl bg-emerald-600 p-6 text-white shadow-lg">
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">
                                                Estimation totale potentielle
                                            </p>
                                            <p className="mt-1 text-3xl font-black md:text-4xl">
                                                {totalMonthly.toLocaleString('fr-FR')} €
                                                <span className="ml-1 text-base font-normal text-emerald-200">/ mois</span>
                                            </p>
                                        </div>
                                        <div className="hidden rounded-2xl bg-white/20 p-3 sm:block">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                </div>
                            )}

                            {/* Eligible Rights */}
                            {eligibleRights.length > 0 ? (
                                <div className="space-y-3">
                                    {eligibleRights.map((right) => (
                                        <div
                                            key={right.code || right.label}
                                            className="group flex items-center justify-between rounded-2xl border-2 border-emerald-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                                    <Euro className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="block text-base font-bold text-slate-800">{right.label}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                                        Moteur OpenFisca
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-black text-emerald-600">
                                                    +{right.amount.toLocaleString('fr-FR')} €
                                                </span>
                                                <span className="mt-0.5 block text-[10px] font-bold uppercase text-slate-400">/ mois</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-slate-200" />
                                    <p className="text-sm font-medium italic text-slate-400">
                                        Aucune aide financière majeure détectée.
                                    </p>
                                </div>
                            )}

                            {/* Non-eligible */}
                            {nonEligibleRights.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="px-1 text-xs font-medium text-slate-400">
                                        Droits probablement non applicables ({nonEligibleRights.length})
                                    </h3>
                                    {nonEligibleRights.map((right) => (
                                        <div
                                            key={right.code || right.label}
                                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 opacity-60"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-slate-100 p-2 text-slate-400">
                                                    <XCircle className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-600">{right.label}</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-400">0 €</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Download PDF */}
                            <button
                                type="button"
                                onClick={handleDownloadPDF}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-6 py-4 text-sm font-bold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100 hover:shadow-md active:scale-[0.98]"
                            >
                                <FileDown className="h-5 w-5" />
                                Télécharger ce Passeport Social (PDF)
                            </button>
                        </main>
                    </div>

                    {/* Disclaimer Footer */}
                    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                        <p className="text-[11px] italic leading-relaxed text-amber-800">
                            Ce document est une simulation basée sur les règles de calcul officielles OpenFisca.
                            Il ne constitue pas une décision d&#39;attribution. Une demande officielle doit être
                            effectuée auprès de la CAF, MSA ou CPAM.
                        </p>
                    </div>

                    {/* Footer */}
                    <footer className="rounded-3xl bg-white/50 border-t border-slate-200/60 p-8 text-center">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                            Réf : {id}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            {data.viewCount} consultation{data.viewCount > 1 ? 's' : ''} de ce dossier
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <div className="group flex items-center gap-4">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-500 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                {icon}
            </div>
            <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase leading-none text-slate-400">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}
