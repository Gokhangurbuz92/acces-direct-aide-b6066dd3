import { useState, cloneElement } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import {
    ShieldCheck,
    CheckCircle2,
    Sparkles,
    FileText,
    Search,
    Lock,
    MessageSquare,
    Loader2,
    FileSignature,
    ChevronRight,
    RotateCcw,
} from 'lucide-react';

/**
 * FullSimulation — End-to-end journey demo
 *
 * Route: /pro/simulation
 *
 * 5 interactive steps validating the complete AccesDirectAide flow:
 * Diagnostic → Passport → Pro alert → AI synthesis → Attestation
 */

const SHARE_ID = 'ADA-STR-2026-X99';

export default function FullSimulation() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const next = () => {
        setLoading(true);
        setTimeout(() => {
            setStep((s) => s + 1);
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Simulation — AccesDirectAide" noindex />
            <div className="max-w-3xl mx-auto">
                {/* Progress */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 mb-8">
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-8 rounded-full transition-all ${i <= step ? 'bg-[#0f766e]' : 'bg-slate-100'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                        <ShieldCheck size={10} className="text-[#0f766e]" />
                        Beta · Simulation
                    </span>
                </div>

                {/* Steps */}
                {step === 1 && (
                    <StepCard title="Diagnostic Citoyen" icon={<Search />}>
                        <p className="text-sm text-slate-500 mb-6">
                            L&apos;usager remplit son questionnaire anonyme. L&apos;IA
                            identifie ses droits.
                        </p>
                        <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                            <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
                        </div>
                        <NextBtn onClick={next} loading={loading}>
                            Terminer le Diagnostic
                        </NextBtn>
                    </StepCard>
                )}

                {step === 2 && (
                    <StepCard title="Création du Passeport" icon={<Lock />}>
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center mb-6">
                            <CheckCircle2
                                className="text-emerald-600 mx-auto mb-2"
                                size={32}
                            />
                            <p className="text-sm font-bold text-emerald-900">
                                Diagnostic Réussi
                            </p>
                            <p className="text-[10px] text-emerald-600 font-mono mt-1">
                                {SHARE_ID}
                            </p>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            L&apos;usager partage son dossier chiffré avec l&apos;association.
                        </p>
                        <NextBtn onClick={next} loading={loading}>
                            Signer et Partager
                        </NextBtn>
                    </StepCard>
                )}

                {step === 3 && (
                    <StepCard title="Alerte Professionnelle" icon={<MessageSquare />}>
                        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6">
                            <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                <FileText size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-900">
                                    Nouveau Dossier Partagé
                                </p>
                                <p className="text-[10px] text-indigo-600">
                                    Usager {SHARE_ID.slice(0, 8)} attend votre aide.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Le bénévole reçoit une notification temps-réel.
                        </p>
                        <NextBtn onClick={next} loading={loading}>
                            Ouvrir le Dossier
                        </NextBtn>
                    </StepCard>
                )}

                {step === 4 && (
                    <StepCard title="Expertise Augmentée" icon={<Sparkles />}>
                        <div className="space-y-2 mb-6">
                            {[
                                'Urgence logement détectée (67000)',
                                'Éligibilité Prime d\'Activité confirmée',
                                'Orientation CMU-C recommandée',
                            ].map((pt, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-lg"
                                >
                                    <span
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                        style={{ backgroundColor: '#0f766e' }}
                                    >
                                        {i + 1}
                                    </span>
                                    <span className="text-xs font-medium text-slate-700">
                                        {pt}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <NextBtn onClick={next} loading={loading}>
                            Signer l&apos;Attestation
                        </NextBtn>
                    </StepCard>
                )}

                {step === 5 && (
                    <StepCard title="Délivrance Souveraine" icon={<FileSignature />}>
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center mb-6">
                            <FileText className="text-slate-300 mx-auto mb-2" size={40} />
                            <p className="text-xs font-bold text-slate-900 uppercase">
                                Attestation ADA Officielle
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1">
                                Scellée numériquement · SHA-256
                            </p>
                        </div>
                        <div
                            className="p-4 rounded-xl flex items-center justify-between text-white"
                            style={{ backgroundColor: '#0f766e' }}
                        >
                            <div>
                                <p className="text-[9px] font-bold uppercase opacity-70">
                                    Statut
                                </p>
                                <p className="text-sm font-bold">Parcours Complet ✓</p>
                            </div>
                            <CheckCircle2 size={20} />
                        </div>
                        <Button
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => setStep(1)}
                        >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Recommencer
                        </Button>
                    </StepCard>
                )}

                {/* Footer */}
                <p className="mt-8 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    AccesDirectAide · 58 rue Himmerich, Strasbourg · Loi 1908
                </p>
            </div>
        </div>
    );
}

function StepCard({ title, icon, children }) {
    return (
        <Card>
            <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-50 rounded-lg text-[#0f766e]">
                        {cloneElement(icon, { size: 20 })}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                </div>
                {children}
            </CardContent>
        </Card>
    );
}

function NextBtn({ onClick, loading, children }) {
    return (
        <Button
            className="w-full"
            size="lg"
            onClick={onClick}
            disabled={loading}
            style={{ backgroundColor: loading ? undefined : '#0f766e' }}
        >
            {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
                <ChevronRight className="mr-1.5 h-4 w-4" />
            )}
            {loading ? 'Traitement souverain...' : children}
        </Button>
    );
}
