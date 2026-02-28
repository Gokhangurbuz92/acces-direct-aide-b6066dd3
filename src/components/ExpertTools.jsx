import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    FileCheck,
    Loader2,
    CheckCircle2,
    PenTool,
    ShieldCheck,
    RefreshCw,
} from 'lucide-react';

/**
 * ExpertTools — AI Synthesis + PDF Signature
 *
 * Embedded in SharedDossier sidebar for pro agents.
 *
 * Props:
 * - shareId: string
 */
export default function ExpertTools({ shareId }) {
    // AI Synthesis state
    const [points, setPoints] = useState(null);
    const [synthLoading, setSynthLoading] = useState(false);
    const [synthError, setSynthError] = useState('');

    // PDF Signature state
    const [signStatus, setSignStatus] = useState('idle'); // idle | signing | done

    const generateSynthesis = async () => {
        setSynthLoading(true);
        setSynthError('');
        try {
            const res = await fetch('/api/pro/dossier-synthesis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ shareId }),
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || 'Erreur IA');
            }
            const data = await res.json();
            setPoints(data.points || []);
        } catch (err) {
            setSynthError(err.message || 'Échec de la synthèse.');
        } finally {
            setSynthLoading(false);
        }
    };

    const handleSign = () => {
        setSignStatus('signing');
        // Simulate PDF generation & signing (production: pdf-lib + audit)
        setTimeout(() => setSignStatus('done'), 2500);
    };

    return (
        <div className="space-y-4">
            {/* AI Synthesis */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Sparkles size={14} className="text-indigo-500" />
                        Synthèse IA
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!points ? (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500">
                                Extraction des 3 points clés du dossier par l&apos;IA.
                            </p>
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={generateSynthesis}
                                disabled={synthLoading}
                            >
                                {synthLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                        Analyse...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                                        Générer la synthèse
                                    </>
                                )}
                            </Button>
                            {synthError && (
                                <p className="text-[10px] text-red-500 font-medium">{synthError}</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {points.map((point, i) => (
                                <div
                                    key={i}
                                    className="flex gap-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg"
                                >
                                    <span className="shrink-0 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {i + 1}
                                    </span>
                                    <p className="text-xs font-medium text-indigo-900 leading-snug">
                                        {point}
                                    </p>
                                </div>
                            ))}
                            <button
                                onClick={() => setPoints(null)}
                                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 font-medium mt-1"
                                type="button"
                            >
                                <RefreshCw size={10} /> Réactualiser
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* PDF Signature */}
            <Card className="bg-slate-900 text-white border-slate-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                        <FileCheck size={14} className="text-emerald-400" />
                        Attestation PDF
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-slate-400 mb-3">
                        Générer et signer l&apos;attestation ADA.
                    </p>
                    <Button
                        size="sm"
                        className={`w-full ${signStatus === 'done'
                            ? 'bg-emerald-500 hover:bg-emerald-500'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                            }`}
                        onClick={handleSign}
                        disabled={signStatus === 'signing' || signStatus === 'done'}
                    >
                        {signStatus === 'signing' && (
                            <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Signature...
                            </>
                        )}
                        {signStatus === 'done' && (
                            <>
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                PDF signé
                            </>
                        )}
                        {signStatus === 'idle' && (
                            <>
                                <PenTool className="mr-2 h-3.5 w-3.5" />
                                Signer l&apos;attestation
                            </>
                        )}
                    </Button>
                    <p className="flex items-center gap-1 text-[9px] text-slate-500 mt-2">
                        <ShieldCheck size={8} className="text-emerald-500" />
                        Certificat souverain ADA
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
