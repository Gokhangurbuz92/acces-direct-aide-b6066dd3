import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
    Calculator,
    RefreshCcw,
    Euro,
    Users,
    MapPin,
    Briefcase,
    AlertCircle,
    Loader2,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Calendar,
    Home,
    FileDown,
    Share2,
    Check,
    Link as LinkIcon,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { useSituation } from '@/hooks/useSituation';

const HOUSING_OPTIONS = [
    { key: 'tenant', label: 'Locataire' },
    { key: 'tenant_hlm', label: 'Locataire HLM' },
    { key: 'owner', label: 'Propriétaire' },
    { key: 'free', label: 'Hébergé(e) gratuitement' },
    { key: 'homeless', label: 'Sans domicile fixe' },
];

const EMPLOYMENT_OPTIONS = [
    { key: 'salarié', label: 'Salarié' },
    { key: 'sans_emploi', label: 'Sans emploi / Recherche' },
    { key: 'indépendant', label: 'Indépendant' },
    { key: 'retraité', label: 'Retraité' },
    { key: 'étudiant', label: 'Étudiant' },
];

const DEFAULT_SITUATION = {
    birthDate: '',
    salary: '',
    unemployment: '',
    rent: '',
    charges: '',
    housingStatus: '',
    householdSize: 1,
    zipCode: '',
    employmentStatus: 'salarié',
};

/**
 * DiagnosticPage
 * Page standalone de simulation des droits sociaux via OpenFisca.
 * Fonctionne sans aucune dépendance IA — moteur de calcul uniquement.
 */
export default function DiagnosticPage() {
    const { situation, updateField, resetSituation } = useSituation(DEFAULT_SITUATION);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const canCalculate = situation.birthDate && situation.housingStatus;

    /**
     * Appelle POST /api/diagnostic avec l'état courant,
     * en respectant le contrat attendu par le handler existant.
     */
    const handleCalculate = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/diagnostic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: {
                        birthDate: situation.birthDate,
                        income: {
                            salary: Number(situation.salary) || 0,
                            unemployment: Number(situation.unemployment) || 0,
                        },
                        housing: {
                            rent: Number(situation.rent) || 0,
                            charges: Number(situation.charges) || 0,
                            status: situation.housingStatus,
                        },
                    },
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Erreur ${response.status}`);
            }

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err.message || 'Le service de diagnostic est temporairement indisponible.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        resetSituation();
        setResults(null);
        setError(null);
    };

    return (
        <>
            <Helmet>
                <title>Simulateur de Droits Sociaux | Accès Direct Aide</title>
                <meta
                    name="description"
                    content="Estimez vos droits aux aides sociales (RSA, APL, Prime d'activité…) grâce au moteur de calcul OpenFisca. Données anonymes traitées localement."
                />
            </Helmet>

            <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
                {/* Header */}
                <header className="mb-10 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
                        <Calculator className="h-3.5 w-3.5" />
                        Moteur OpenFisca — Calcul souverain
                    </div>
                    <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        Simulateur de Droits Sociaux
                    </h1>
                    <p className="mx-auto max-w-xl text-sm text-slate-500 md:text-base">
                        Obtenez une estimation de vos aides sociales en toute confidentialité.
                        Vos données restent stockées localement sur votre navigateur.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* ─── Formulaire ─── */}
                    <div className="lg:col-span-5">
                        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <Calculator className="h-4 w-4" /> Ma situation
                            </h2>

                            {/* Date de naissance */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="diag-birthdate" className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Date de naissance <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="diag-birthdate"
                                    type="date"
                                    value={situation.birthDate}
                                    onChange={(e) => updateField('birthDate', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                />
                            </div>

                            {/* Revenus */}
                            <fieldset className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                <legend className="px-2 text-xs font-bold text-slate-600">
                                    <Euro className="mr-1 inline h-3.5 w-3.5" /> Revenus mensuels nets
                                </legend>
                                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="diag-salary" className="mb-1 block text-xs text-slate-500">Salaire net (€/mois)</label>
                                        <input
                                            id="diag-salary"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={situation.salary}
                                            onChange={(e) => updateField('salary', e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="diag-unemployment" className="mb-1 block text-xs text-slate-500">Allocations chômage (€/mois)</label>
                                        <input
                                            id="diag-unemployment"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={situation.unemployment}
                                            onChange={(e) => updateField('unemployment', e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            {/* Logement */}
                            <fieldset className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                <legend className="px-2 text-xs font-bold text-slate-600">
                                    <Home className="mr-1 inline h-3.5 w-3.5" /> Logement
                                </legend>

                                <div className="mb-3 mt-2">
                                    <span className="mb-2 block text-xs text-slate-500" id="housing-status-label">
                                        Statut d&apos;occupation <span className="text-red-500">*</span>
                                    </span>
                                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="housing-status-label">
                                        {HOUSING_OPTIONS.map(({ key, label }) => (
                                            <button
                                                key={key}
                                                type="button"
                                                role="radio"
                                                aria-checked={situation.housingStatus === key}
                                                onClick={() => updateField('housingStatus', key)}
                                                className={`min-h-[2.75rem] rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${situation.housingStatus === key
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="diag-rent" className="mb-1 block text-xs text-slate-500">Loyer mensuel (€)</label>
                                        <input
                                            id="diag-rent"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={situation.rent}
                                            onChange={(e) => updateField('rent', e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="diag-charges" className="mb-1 block text-xs text-slate-500">Charges locatives (€)</label>
                                        <input
                                            id="diag-charges"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={situation.charges}
                                            onChange={(e) => updateField('charges', e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            {/* Foyer & Statut pro */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="diag-household" className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <Users className="h-3.5 w-3.5" /> Foyer
                                    </label>
                                    <select
                                        id="diag-household"
                                        value={situation.householdSize}
                                        onChange={(e) => updateField('householdSize', Number(e.target.value))}
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                    >
                                        <option value={1}>Personne seule</option>
                                        <option value={2}>Couple</option>
                                        <option value={3}>3 personnes</option>
                                        <option value={4}>4 personnes et plus</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="diag-employment" className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <Briefcase className="h-3.5 w-3.5" /> Statut pro
                                    </label>
                                    <select
                                        id="diag-employment"
                                        value={situation.employmentStatus}
                                        onChange={(e) => updateField('employmentStatus', e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                    >
                                        {EMPLOYMENT_OPTIONS.map(({ key, label }) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="diag-zip" className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <MapPin className="h-3.5 w-3.5" /> Code postal
                                </label>
                                <input
                                    id="diag-zip"
                                    type="text"
                                    maxLength="5"
                                    value={situation.zipCode}
                                    onChange={(e) => updateField('zipCode', e.target.value)}
                                    placeholder="75001"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
                                <Button
                                    type="button"
                                    onClick={handleCalculate}
                                    disabled={loading || !canCalculate}
                                    className="gap-2 py-6 text-base font-bold"
                                    id="diag-calculate-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Calcul en cours…
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="h-5 w-5" />
                                            Calculer mes droits
                                        </>
                                    )}
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
                                >
                                    <RefreshCcw className="h-3.5 w-3.5" /> Réinitialiser tout
                                </button>
                            </div>
                        </div>

                        {/* Info box */}
                        <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-100 px-4 py-3 text-slate-500">
                            <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <p className="text-[11px] font-medium leading-tight">
                                Ce simulateur utilise les algorithmes d&apos;OpenFisca, la référence open-source du système socio-fiscal français.
                            </p>
                        </div>
                    </div>

                    {/* ─── Résultats ─── */}
                    <div className="lg:col-span-7">
                        {error && (
                            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5">
                                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                    <Button type="button" size="sm" variant="outline" className="mt-3 gap-2" onClick={handleCalculate}>
                                        <RefreshCcw className="h-3.5 w-3.5" /> Réessayer
                                    </Button>
                                </div>
                            </div>
                        )}

                        {results ? (
                            <ResultsDisplay results={results} situation={situation} />
                        ) : (
                            <div className="flex h-full min-h-[450px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-300 shadow-sm">
                                    <Calculator className="h-10 w-10" />
                                </div>
                                <h3 className="mb-2 text-lg font-bold text-slate-700">Lancez le diagnostic</h3>
                                <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                                    Complétez les informations à gauche pour découvrir vos éligibilités au RSA, APL, et autres aides sociales.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ─── Sous-composant : Affichage des résultats ─── */

function ResultsDisplay({ results, situation }) {
    const { rights = [], period, meta } = results;
    const eligibleRights = rights.filter((r) => r.eligible);
    const nonEligibleRights = rights.filter((r) => !r.eligible);
    const totalMonthly = eligibleRights.reduce((sum, r) => sum + (r.amount || 0), 0);

    const handleDownloadPDF = async () => {
        try {
            const { generateSocialPassport } = await import('@/lib/pdf-generator');
            generateSocialPassport(situation || {}, results);
        } catch (err) {
            if (import.meta.env.DEV) console.error('[PDF] Generation failed:', err);
        }
    };

    const [shareState, setShareState] = useState({ loading: false, url: null, copied: false });

    const handleShare = async () => {
        setShareState({ loading: true, url: null, copied: false });
        try {
            const res = await fetch('/api/share/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ situation: situation || {}, results }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Erreur');

            const fullUrl = `${window.location.origin}${json.shareUrl}`;
            await navigator.clipboard.writeText(fullUrl);
            setShareState({ loading: false, url: fullUrl, copied: true });

            setTimeout(() => setShareState((s) => ({ ...s, copied: false })), 4000);
        } catch (err) {
            if (import.meta.env.DEV) console.error('[Share] Error:', err);
            setShareState({ loading: false, url: null, copied: false });
        }
    };

    return (
        <div className="space-y-6">
            {/* Banner total */}
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

            {/* Droits éligibles */}
            {eligibleRights.length > 0 && (
                <div className="space-y-3">
                    <h3 className="px-1 text-sm font-semibold text-emerald-700">
                        ✅ Droits auxquels vous pourriez prétendre ({eligibleRights.length})
                    </h3>
                    {eligibleRights.map((right) => (
                        <RightCard key={right.code} right={right} />
                    ))}
                </div>
            )}

            {/* Droits non-éligibles */}
            {nonEligibleRights.length > 0 && (
                <div className="space-y-3">
                    <h3 className="px-1 text-sm font-medium text-slate-500">
                        Droits probablement non applicables ({nonEligibleRights.length})
                    </h3>
                    {nonEligibleRights.map((right) => (
                        <RightCard key={right.code} right={right} />
                    ))}
                </div>
            )}

            {/* Disclaimer */}
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="text-[11px] italic leading-relaxed text-amber-800">
                    Ces montants sont des estimations basées sur les règles de calcul officielles.
                    Ils ne constituent pas une décision d&#39;attribution. Vous devrez effectuer une
                    demande officielle auprès de la CAF ou de la MSA.
                </p>
            </div>

            {/* Passeport Social CTA */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center justify-center gap-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-5 py-4 text-sm font-bold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100 hover:shadow-md active:scale-[0.98]"
                >
                    <FileDown className="h-5 w-5" />
                    Télécharger PDF
                </button>
                <button
                    type="button"
                    onClick={handleShare}
                    disabled={shareState.loading}
                    className={`flex items-center justify-center gap-3 rounded-2xl border-2 px-5 py-4 text-sm font-bold transition-all active:scale-[0.98] ${shareState.copied
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md'
                        }`}
                >
                    {shareState.loading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Création…</>
                    ) : shareState.copied ? (
                        <><Check className="h-5 w-5" /> Lien copié !</>
                    ) : (
                        <><Share2 className="h-5 w-5" /> Partager le dossier</>
                    )}
                </button>
            </div>

            {/* Share URL Display */}
            {shareState.url && (
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                        <code className="flex-1 truncate text-xs text-slate-600">{shareState.url}</code>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(shareState.url);
                                setShareState((s) => ({ ...s, copied: true }));
                                setTimeout(() => setShareState((s) => ({ ...s, copied: false })), 3000);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                        >
                            Copier
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-3 pt-2">
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-700">Continuité diagnostic</p>
                            <p className="text-xs text-slate-500">Scannez ce QR Code pour reprendre sur votre mobile</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                            <QRCode value={shareState.url} size={160} level="M" fgColor="#312e81" />
                        </div>
                    </div>
                </div>
            )}

            {/* Méta */}
            {meta && (
                <p className="text-center text-[10px] text-slate-400">
                    ID : {meta.requestId} • Durée : {meta.duration_ms}ms • Période : {period}
                </p>
            )}
        </div>
    );
}

function RightCard({ right }) {
    return (
        <div
            className={`flex items-center justify-between rounded-xl border-2 bg-white p-4 transition-colors ${right.eligible
                ? 'border-emerald-100 hover:border-emerald-200'
                : 'border-slate-100 opacity-60'
                }`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${right.eligible
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                        }`}
                >
                    {right.eligible ? <Euro className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">{right.label}</h4>
                    <p className="text-[10px] font-medium uppercase text-slate-400">
                        Moteur OpenFisca
                    </p>
                </div>
            </div>
            <div className="text-right">
                <span
                    className={`text-lg font-black ${right.eligible ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                >
                    {right.eligible && right.amount > 0
                        ? `+${right.amount.toLocaleString('fr-FR')} €`
                        : '0 €'}
                </span>
                <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Par mois
                </span>
            </div>
        </div>
    );
}
