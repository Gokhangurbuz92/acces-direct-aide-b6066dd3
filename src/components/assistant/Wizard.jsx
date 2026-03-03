import { useState, useCallback, useEffect, useRef } from 'react';
import { storage } from '@/lib/storage';
import { postRecommendations, sendMessage, AssistantError } from '@/lib/assistant/client';
import StepNeed from './StepNeed';
import StepTerritory from './StepTerritory';
import StepProfile from './StepProfile';
import StepUrgency from './StepUrgency';
import StepDiagnostic from './StepDiagnostic';
import ResultPanel from './ResultPanel';
import DiagnosticResults from './DiagnosticResults';

const NEED_LABELS = {
    logement: 'logement',
    sante: 'santé',
    travail: 'travail emploi',
    papiers: 'papiers droits administratifs',
    urgence: 'aide urgente hébergement alimentaire',
};

const TOTAL_STEPS = 5;

export default function Wizard() {
    // Restore persisted wizard state (step + data) from localStorage
    const savedWizard = useRef(storage.loadWizard());
    const [step, setStep] = useState(savedWizard.current?.step ?? 0);
    const [data, setData] = useState(savedWizard.current?.data ?? {});
    const [phase, setPhase] = useState('wizard'); // wizard | loading | results | error | diagnostic-loading | diagnostic-results | diagnostic-error
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const [diagnosticData, setDiagnosticData] = useState(null);
    const abortRef = useRef(null);

    // Persist wizard progress on every step/data change
    useEffect(() => {
        if (phase === 'wizard') {
            storage.saveWizard({ step, data });
        }
    }, [step, data, phase]);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const fetchResults = useCallback(async (wizardData) => {
        setPhase('loading');
        setError(null);
        setSummary(null);
        setItems([]);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const needStr = NEED_LABELS[wizardData.need] || wizardData.need;

        try {
            // 1. Get recommendations
            const recos = await postRecommendations(
                {
                    need: needStr,
                    territory: wizardData.territory,
                    limit: 6,
                    types: ['aide', 'demarche', 'structure'],
                },
                { signal: controller.signal },
            );

            setItems(recos.items || []);
            setPhase('results');

            // 2. Get AI summary (non-blocking — we show cards first)
            if (recos.items && recos.items.length > 0) {
                try {
                    const itemSummaries = recos.items
                        .filter((it) => it.title)
                        .map((it) => `- [${it.type}] ${it.title}`)
                        .join('\n');

                    const aiResponse = await sendMessage(
                        `Rédige un plan d'action court basé uniquement sur ces recommandations. Utilise un format : Aujourd'hui / Cette semaine / Ensuite.\n\nRecommandations :\n${itemSummaries}`,
                        { wizard: wizardData },
                        { signal: controller.signal },
                    );

                    setSummary(aiResponse.answer);
                } catch {
                    // AI summary is optional — don't fail if it doesn't work
                }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setPhase('error');
            setError(
                err instanceof AssistantError
                    ? err.userMessage
                    : 'Une erreur est survenue. Veuillez réessayer.',
            );
        }
    }, []);

    const fetchDiagnostic = useCallback(async (wizardData) => {
        setPhase('diagnostic-loading');
        setError(null);
        setDiagnosticData(null);

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch('/api/diagnostic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: wizardData }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Erreur ${res.status}`);
            }

            const result = await res.json();
            setDiagnosticData(result);
            setPhase('diagnostic-results');
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setPhase('diagnostic-error');
            setError(err.message || 'Le service de calcul est temporairement indisponible.');
        }
    }, []);

    const handleNext = useCallback(
        (stepData) => {
            const merged = { ...data, ...stepData };
            setData(merged);

            if (step < TOTAL_STEPS - 1) {
                setStep(step + 1);
            } else {
                // Last step (StepDiagnostic) → call OpenFisca
                fetchDiagnostic(merged);
            }
        },
        [step, data, fetchDiagnostic],
    );

    const handleBack = useCallback(() => {
        if (step > 0) setStep(step - 1);
    }, [step]);

    const handleRestart = useCallback(() => {
        abortRef.current?.abort();
        storage.clearWizard();
        setStep(0);
        setData({});
        setPhase('wizard');
        setItems([]);
        setSummary(null);
        setError(null);
        setDiagnosticData(null);
    }, []);

    const handleRetry = useCallback(() => {
        if (phase === 'diagnostic-error') {
            fetchDiagnostic(data);
        } else {
            fetchResults(data);
        }
    }, [data, fetchResults, fetchDiagnostic, phase]);

    const progress = phase === 'wizard' ? ((step + 1) / TOTAL_STEPS) * 100 : 100;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* RGAA: Live announcement of step changes for screen readers */}
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {phase === 'wizard'
                    ? `Étape ${step + 1} sur ${TOTAL_STEPS}`
                    : phase === 'loading' || phase === 'diagnostic-loading'
                        ? 'Calcul en cours, veuillez patienter.'
                        : phase === 'results' || phase === 'diagnostic-results'
                            ? 'Résultats disponibles.'
                            : phase === 'error' || phase === 'diagnostic-error'
                                ? 'Une erreur est survenue.'
                                : ''}
            </p>
            {/* Progress bar */}
            {phase === 'wizard' && (
                <div className="px-6 pt-5">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>Étape {step + 1} sur {TOTAL_STEPS}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`Étape ${step + 1} sur ${TOTAL_STEPS}`} aria-label="Progression du diagnostic">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {phase === 'wizard' && step === 0 && <StepNeed onNext={handleNext} />}
                {phase === 'wizard' && step === 1 && <StepTerritory onNext={handleNext} onBack={handleBack} />}
                {phase === 'wizard' && step === 2 && <StepProfile onNext={handleNext} onBack={handleBack} />}
                {phase === 'wizard' && step === 3 && <StepUrgency onNext={handleNext} onBack={handleBack} />}
                {phase === 'wizard' && step === 4 && <StepDiagnostic onNext={handleNext} onBack={handleBack} />}
                {(phase === 'diagnostic-loading' || phase === 'diagnostic-results' || phase === 'diagnostic-error') && (
                    <DiagnosticResults
                        rights={diagnosticData?.rights}
                        period={diagnosticData?.period}
                        meta={diagnosticData?.meta}
                        isLoading={phase === 'diagnostic-loading'}
                        error={phase === 'diagnostic-error' ? error : null}
                        onRetry={handleRetry}
                        onRestart={handleRestart}
                        answers={data}
                        isPro={false}
                    />
                )}
                {(phase === 'loading' || phase === 'results' || phase === 'error') && (
                    <ResultPanel
                        items={items}
                        summary={summary}
                        isLoading={phase === 'loading'}
                        error={phase === 'error' ? error : null}
                        onRetry={handleRetry}
                        onRestart={handleRestart}
                    />
                )}
            </div>
        </div>
    );
}
