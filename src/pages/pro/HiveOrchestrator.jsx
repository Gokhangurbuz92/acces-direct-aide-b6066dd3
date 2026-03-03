import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import {
    Network,
    Search,
    Zap,
    Database,
    RefreshCw,
    BrainCircuit,
    ArrowUpRight,
    Eye,
    CheckCircle2,
    AlertCircle,
    Loader2,
    MessageSquareCode,
} from 'lucide-react';

/**
 * HiveOrchestrator — AI Hive control center
 *
 * Route: /pro/hive
 *
 * Connects to real endpoints:
 *   POST /api/pro/agent-discovery – triggers Gemini + Google Search scan
 *   GET  /api/admin/review-queue   – fetches pending discoveries
 */

const CATEGORIES = [
    { id: 'LOGEMENT', name: 'Logement & Énergie', emoji: '🏠' },
    { id: 'SANTE', name: 'Santé & Handicap', emoji: '🏥' },
    { id: 'EMPLOI', name: 'Emploi & Formation', emoji: '💼' },
    { id: 'FAMILLE', name: 'Famille & Jeunesse', emoji: '👨‍👩‍👧' },
];

function getAuthHeaders() {
    const token = localStorage.getItem('pro_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HiveOrchestrator() {
    const [scanning, setScanning] = useState(false);
    const [activeCategory, setActiveCategory] = useState('LOGEMENT');
    const [logs, setLogs] = useState([]);
    const [queueItems, setQueueItems] = useState([]);
    const [queueLoading, setQueueLoading] = useState(true);

    const addLog = useCallback((msg, type = 'info') => {
        const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setLogs((prev) => [{ id: Date.now(), time, msg, type }, ...prev].slice(0, 15));
    }, []);

    // Fetch pending review queue items on mount
    useEffect(() => {
        async function fetchQueue() {
            try {
                const res = await fetch('/api/admin/review-queue?status=OPEN&limit=10', {
                    headers: getAuthHeaders(),
                });
                if (res.ok) {
                    const data = await res.json();
                    setQueueItems(Array.isArray(data.items) ? data.items : []);
                }
            } catch {
                // silently fail — queue is optional
            } finally {
                setQueueLoading(false);
            }
        }
        fetchQueue();
    }, []);

    const runScan = async () => {
        setScanning(true);
        addLog(`Lancement du scan pour le pôle ${activeCategory}…`, 'info');

        try {
            const res = await fetch('/api/pro/agent-discovery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ category: activeCategory, submit: true }),
            });
            const data = await res.json();

            if (data.ok) {
                addLog(`${data.count} aides trouvées, ${data.submitted} envoyées en modération.`, 'success');
                // Show findings in logs
                if (Array.isArray(data.findings)) {
                    for (const f of data.findings) {
                        addLog(`📌 ${f.title || 'Sans titre'} — ${f.source || 'source inconnue'}`, 'discovery');
                    }
                }
            } else {
                addLog(`Erreur : ${data.error || 'Réponse inattendue'}`, 'error');
            }
        } catch (e) {
            addLog('Erreur réseau : impossible de contacter la Ruche.', 'error');
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Ruche IA — AccesDirectAide" noindex />
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 text-white rounded-2xl" style={{ backgroundColor: '#0f766e' }}>
                            <Network size={22} className={scanning ? 'animate-spin' : ''} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">La Ruche IA</h1>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <RefreshCw size={10} className="text-teal-600" />
                                Enrichissement autonome du contenu
                            </p>
                        </div>
                    </div>
                    <Button onClick={runScan} disabled={scanning}>
                        {scanning ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Zap className="mr-1.5 h-4 w-4" />}
                        {scanning ? 'Scan en cours…' : 'Lancer Scan National'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Main column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Category selector */}
                        <Card>
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold flex items-center gap-2">
                                    <BrainCircuit size={12} className="text-teal-600" />
                                    Agents de Catégorie
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${activeCategory === cat.id
                                                    ? 'border-teal-500 bg-teal-50'
                                                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-lg">{cat.emoji}</span>
                                                {activeCategory === cat.id && (
                                                    <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-700 text-[9px] font-bold uppercase">
                                                        Sélectionné
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live logs */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                                    <MessageSquareCode size={12} className="text-amber-400" />
                                    Journal d&apos;Orchestration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[300px] overflow-y-auto font-mono text-[11px] space-y-1.5">
                                {logs.length === 0 && (
                                    <p className="text-slate-500 text-center py-6">
                                        Lancez un scan pour voir les résultats ici.
                                    </p>
                                )}
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-3 p-1.5 rounded hover:bg-white/5">
                                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                                        <span
                                            className={
                                                log.type === 'discovery'
                                                    ? 'text-teal-400 font-bold'
                                                    : log.type === 'error'
                                                        ? 'text-red-400'
                                                        : log.type === 'success'
                                                            ? 'text-emerald-400'
                                                            : 'text-slate-300'
                                            }
                                        >
                                            {log.msg}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Pending review */}
                        <Card>
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold flex items-center gap-2">
                                    <Eye size={12} className="text-teal-600" />
                                    File de validation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {queueLoading && (
                                    <div className="w-full p-4"><SkeletonList count={3} variant="card" /></div>
                                )}
                                {!queueLoading && queueItems.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-4">
                                        Aucune découverte en attente
                                    </p>
                                )}
                                {queueItems.slice(0, 5).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-100"
                                    >
                                        <Search size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {item.title || item.entityId}
                                            </p>
                                            <p className="text-[9px] text-slate-400">
                                                {item.reason} · {item.severity}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {queueItems.length > 5 && (
                                    <a
                                        href="/admin/review-queue"
                                        className="flex items-center justify-center gap-1.5 p-2 text-[10px] font-bold text-teal-600 hover:underline"
                                    >
                                        Voir tout ({queueItems.length})
                                        <ArrowUpRight size={10} />
                                    </a>
                                )}
                            </CardContent>
                        </Card>

                        {/* Info card */}
                        <Card className="border-amber-100 bg-amber-50">
                            <CardContent className="p-4 text-center">
                                <AlertCircle size={20} className="text-amber-500 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-900 mb-1">Validation Humaine</p>
                                <p className="text-[10px] text-slate-500">
                                    Chaque découverte IA doit être validée par un agent avant publication sur le portail.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

