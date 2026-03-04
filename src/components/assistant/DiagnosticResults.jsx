import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Eye, RefreshCw, RotateCcw } from 'lucide-react';
import DiagnosticTraceModal from './DiagnosticTraceModal';

/**
 * Displays OpenFisca diagnostic results as cards with FALC toggle and CTA.
 */
export default function DiagnosticResults({
    rights,
    period,
    meta,
    isLoading,
    error,
    onRetry,
    onRestart,
    answers,
    isPro,
}) {
    const [falcToggles, setFalcToggles] = useState({});
    const [showTrace, setShowTrace] = useState(false);

    const toggleFalc = (code) => {
        setFalcToggles((prev) => ({ ...prev, [code]: !prev[code] }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" role="status" aria-label="Calcul en cours" />
                <p className="text-sm text-slate-600">Calcul de vos droits en cours…</p>
                <p className="text-xs text-slate-400">Moteur législatif OpenFisca</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
                <p className="mb-3 text-sm font-medium text-red-800">{error}</p>
                <div className="flex justify-center gap-3">
                    <Button type="button" size="sm" onClick={onRetry} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Réessayer
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={onRestart} className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Recommencer
                    </Button>
                </div>
            </div>
        );
    }

    if (!rights || rights.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm text-slate-600">Aucun droit calculé. Veuillez réessayer.</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRestart}>
                    Recommencer
                </Button>
            </div>
        );
    }

    const eligibleRights = rights.filter((r) => r.eligible);
    const nonEligibleRights = rights.filter((r) => !r.eligible);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Vos droits estimés</h2>
                    <p className="text-xs text-slate-600">Période : {period} • Source : OpenFisca</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={onRestart} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Recommencer
                </Button>
            </div>

            {/* Eligible rights */}
            {eligibleRights.length > 0 && (
                <div className="mb-4 space-y-3">
                    <h3 className="text-sm font-medium text-green-700">
                        ✅ Droits auxquels vous pourriez prétendre ({eligibleRights.length})
                    </h3>
                    {eligibleRights.map((right) => (
                        <RightCard
                            key={right.code}
                            right={right}
                            showFalc={!!falcToggles[right.code]}
                            onToggleFalc={() => toggleFalc(right.code)}
                        />
                    ))}
                </div>
            )}

            {/* Non-eligible rights */}
            {nonEligibleRights.length > 0 && (
                <div className="mb-4 space-y-3">
                    <h3 className="text-sm font-medium text-slate-600">
                        Droits probablement non applicables ({nonEligibleRights.length})
                    </h3>
                    {nonEligibleRights.map((right) => (
                        <RightCard
                            key={right.code}
                            right={right}
                            showFalc={!!falcToggles[right.code]}
                            onToggleFalc={() => toggleFalc(right.code)}
                            collapsed
                        />
                    ))}
                </div>
            )}

            {/* Pro mode: trace button */}
            {isPro && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTrace(true)}
                        className="gap-2"
                    >
                        <Eye className="h-4 w-4" />
                        Voir le détail du calcul (mode pro)
                    </Button>
                </div>
            )}

            {showTrace && (
                <DiagnosticTraceModal
                    answers={answers}
                    onClose={() => setShowTrace(false)}
                />
            )}

            {/* Meta info */}
            {meta && (
                <p className="mt-4 text-xs text-slate-400">
                    ID : {meta.requestId} • Durée : {meta.duration_ms}ms
                </p>
            )}
        </div>
    );
}

function RightCard({ right, showFalc, onToggleFalc, collapsed = false }) {
    const [isExpanded, setIsExpanded] = useState(!collapsed);

    return (
        <div
            className={`rounded-xl border p-4 transition-colors ${right.eligible
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-slate-100 bg-white'
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    {right.eligible ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" aria-hidden="true" />
                    ) : (
                        <XCircle className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
                    )}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">{right.label}</h4>
                        {right.eligible && right.amount > 0 && (
                            <p className="text-lg font-bold text-green-700">
                                {right.amount.toLocaleString('fr-FR')} €/mois
                            </p>
                        )}
                    </div>
                </div>
                {collapsed && (
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-slate-600 hover:text-slate-700"
                        aria-expanded={isExpanded}
                    >
                        {isExpanded ? 'Masquer' : 'Détails'}
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="mt-3 space-y-2">
                    <p className="text-sm text-slate-600">
                        {showFalc ? right.explain_falc : right.explain}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={onToggleFalc}
                            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                            aria-pressed={showFalc}
                        >
                            {showFalc ? '📖 Texte standard' : '📖 Explication FALC'}
                        </button>

                        {right.next_steps?.map((step) => (
                            <Link
                                key={`${step.type}-${step.slug}`}
                                to={`/${step.type === 'aide' ? 'aides' : 'demarches'}/${step.slug}`}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                {step.type === 'aide' ? '📋 Fiche aide' : '📝 Démarche'}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
