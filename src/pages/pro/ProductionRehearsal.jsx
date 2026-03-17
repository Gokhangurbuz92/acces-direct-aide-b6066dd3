import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { getCsrfHeaders } from '@/lib/csrf';
import {
    ShieldCheck,
    Mail,
    Zap,
    Video,
    Play,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Lock,
    Database,
    ChevronRight,
} from 'lucide-react';

/**
 * ProductionRehearsal — Smoke test dashboard
 *
 * Route: /pro/rehearsal
 *
 * Tests real endpoints:
 *   1. Auth: GET /api/pro/me
 *   2. DB:   GET /api/health/deep
 *   3. IA:   POST /api/pro/agent-discovery (submit: false)
 *   4. Visio: dynamic Jitsi script load check
 */

function getAuthHeaders() {
    const token = localStorage.getItem('pro_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const TEST_DEFS = [
    {
        key: 'auth',
        title: 'Authentification Pro',
        icon: Lock,
        run: async () => {
            const res = await fetch('/api/pro/me', { headers: getAuthHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Non authentifié');
            const name = data.user?.name || data.user?.email || data.user?.role || 'Pro';
            return `Connecté : ${name}`;
        },
    },
    {
        key: 'db',
        title: 'Base de Données (Prisma)',
        icon: Database,
        run: async () => {
            const res = await fetch('/api/health/deep');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Health check échoué');
            return `DB connectée (${data.db?.latencyMs || '?'}ms)`;
        },
    },
    {
        key: 'hive',
        title: 'Ruche IA (Gemini + Search)',
        icon: Zap,
        run: async () => {
            const res = await fetch('/api/pro/agent-discovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...getCsrfHeaders() },
                body: JSON.stringify({ category: 'LOGEMENT', submit: false }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || 'IA indisponible');
            return `${data.count} aides trouvées par l'IA`;
        },
    },
    {
        key: 'visio',
        title: 'Visioconférence Jitsi',
        icon: Video,
        run: async () => {
            // If already loaded, succeed immediately
            if (window.JitsiMeetExternalAPI) {
                return 'Bibliothèque Jitsi déjà chargée';
            }
            // Otherwise try to load it
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://meet.jit.si/external_api.js';
                script.async = true;
                script.onload = () => resolve('Script Jitsi chargé avec succès');
                script.onerror = () => reject(new Error('Script Jitsi bloqué (vérifiez adblocker)'));
                document.body.appendChild(script);
                // Timeout after 8s
                setTimeout(() => reject(new Error('Timeout chargement Jitsi')), 8000);
            });
        },
    },
];

export default function ProductionRehearsal() {
    const [results, setResults] = useState(
        Object.fromEntries(TEST_DEFS.map((t) => [t.key, { status: 'idle', msg: '' }]))
    );
    const [runningAll, setRunningAll] = useState(false);

    const runTest = async (key) => {
        const def = TEST_DEFS.find((t) => t.key === key);
        if (!def) return;

        setResults((prev) => ({ ...prev, [key]: { status: 'loading', msg: 'Exécution…' } }));
        try {
            const msg = await def.run();
            setResults((prev) => ({ ...prev, [key]: { status: 'success', msg } }));
        } catch (err) {
            setResults((prev) => ({ ...prev, [key]: { status: 'error', msg: err.message } }));
        }
    };

    const runAll = async () => {
        setRunningAll(true);
        for (const def of TEST_DEFS) {
            await runTest(def.key);
        }
        setRunningAll(false);
    };

    const passedCount = Object.values(results).filter((r) => r.status === 'success').length;
    const failedCount = Object.values(results).filter((r) => r.status === 'error').length;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Répétition Générale — AccesDirectAide" noindex />
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">Répétition Générale <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-purple-100 text-purple-700 rounded-full">Beta</span></h1>
                            <p className="text-xs text-slate-500 italic">
                                Validation des intégrations de production
                            </p>
                        </div>
                    </div>
                    <Button onClick={runAll} disabled={runningAll}>
                        {runningAll ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="mr-1.5 h-4 w-4" />
                        )}
                        {runningAll ? 'Tests en cours…' : 'Lancer tout'}
                    </Button>
                </div>

                {/* Test cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {TEST_DEFS.map((def) => {
                        const r = results[def.key];
                        const Icon = def.icon;
                        const isSuccess = r.status === 'success';
                        const isError = r.status === 'error';
                        const isLoading = r.status === 'loading';

                        return (
                            <Card
                                key={def.key}
                                className={
                                    isSuccess
                                        ? 'border-emerald-200 bg-emerald-50/50'
                                        : isError
                                            ? 'border-red-200 bg-red-50/50'
                                            : ''
                                }
                            >
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div
                                            className={`p-2.5 rounded-xl ${isSuccess
                                                    ? 'bg-emerald-600 text-white'
                                                    : isError
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                <Icon size={18} />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => runTest(def.key)}
                                            disabled={isLoading}
                                            className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 transition-all disabled:opacity-50"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">{def.title}</h4>
                                    <p
                                        className={`text-[10px] font-bold uppercase tracking-wider ${isSuccess
                                                ? 'text-emerald-600'
                                                : isError
                                                    ? 'text-red-600'
                                                    : 'text-slate-400'
                                            }`}
                                    >
                                        {r.status === 'idle' ? 'En attente' : r.msg}
                                    </p>
                                    {isSuccess && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase">
                                            <CheckCircle2 size={10} /> Réussi
                                        </div>
                                    )}
                                    {isError && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-red-500 uppercase">
                                            <AlertCircle size={10} /> Échec
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Summary */}
                {(passedCount > 0 || failedCount > 0) && (
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-xs font-bold text-slate-900">
                                {passedCount}/{TEST_DEFS.length} tests réussis
                                {failedCount > 0 && (
                                    <span className="text-red-500 ml-2">· {failedCount} échoué(s)</span>
                                )}
                            </p>
                            {passedCount === TEST_DEFS.length && (
                                <p className="mt-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                    ✅ Infrastructure 100% opérationnelle
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
