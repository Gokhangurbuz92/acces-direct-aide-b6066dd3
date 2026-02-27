import { useQuery } from '@tanstack/react-query';
import { adminClient as client } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Database,
    Users,
    FileText,
    Activity,
    Zap,
    Cpu,
    CheckCircle,
    AlertCircle,
    Loader2,
    Clock,
    Shield,
} from 'lucide-react';

/**
 * AdminDashboard
 *
 * Vue d'ensemble du système ADA : compteurs réels, état des feature flags,
 * activité récente (cron runs, imports), et info cache.
 *
 * Données live depuis GET /api/admin/stats.
 */
export default function AdminDashboard() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => client.get('/api/admin/stats').then(r => r.data),
        refetchInterval: 30_000, // Refresh every 30s
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                        <p className="text-slate-600">Erreur de chargement des statistiques</p>
                        <p className="text-sm text-slate-400 mt-1">{error.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const stats = data?.counts || {};
    const features = data?.features || {};
    const infra = data?.infrastructure || {};
    const activity = data?.activity || {};
    const rag = data?.rag || { total: 0, indexed: 0, missing: 0 };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-1">
                                Tableau de Bord IA & Système
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Observabilité en temps réel du moteur agentique et de l&apos;infrastructure
                            </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                            <Zap className="h-3 w-3" />
                            Système en ligne
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard icon={<FileText className="text-indigo-600" />} label="Aides" value={stats.aides} />
                    <StatCard icon={<FileText className="text-purple-600" />} label="Démarches" value={stats.demarches} />
                    <StatCard icon={<Shield className="text-blue-600" />} label="Admins" value={stats.admins} />
                    <StatCard icon={<Users className="text-emerald-600" />} label="Citoyens" value={stats.citizens} />
                    <StatCard icon={<Activity className="text-orange-600" />} label="Cron Runs" value={stats.cronRuns} />
                </div>

                {/* RAG Health Card */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-indigo-500" />
                                Santé Vectorielle (RAG 3072d)
                            </h3>
                            <Badge className={rag.missing === 0 ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-amber-100 text-amber-700 border-0'}>
                                {rag.missing === 0 ? 'Complet' : `${rag.missing} manquant${rag.missing > 1 ? 's' : ''}`}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">{rag.indexed} / {rag.total} aides indexées</span>
                                    <span className="font-bold text-slate-800">
                                        {rag.total > 0 ? Math.round((rag.indexed / rag.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${rag.missing === 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${rag.total > 0 ? (rag.indexed / rag.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Cron Runs */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        Derniers Cron Runs
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {(activity.recentCrons || []).length === 0 ? (
                                        <p className="p-4 text-sm text-slate-400">Aucun cron run récent</p>
                                    ) : (
                                        (activity.recentCrons || []).map((cron) => (
                                            <div key={cron.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    {cron.status === 'completed' ? (
                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{cron.jobName}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {cron.itemsProcessed != null && `${cron.itemsProcessed} items • `}
                                                            {cron.durationMs != null && `${(cron.durationMs / 1000).toFixed(1)}s`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400">
                                                    {cron.startedAt ? new Date(cron.startedAt).toLocaleString('fr-FR') : '—'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Import Logs */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Database className="h-4 w-4 text-slate-400" />
                                        Dernières Ingestions
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {(activity.recentImports || []).length === 0 ? (
                                        <p className="p-4 text-sm text-slate-400">Aucun import récent</p>
                                    ) : (
                                        (activity.recentImports || []).map((log) => (
                                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    {log.status === 'success' ? (
                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{log.sourceName}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {log.itemsCreated != null && `+${log.itemsCreated} créées`}
                                                            {log.itemsUpdated != null && ` / ${log.itemsUpdated} MAJ`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400">
                                                    {log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : '—'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar: Features + Infra */}
                    <div className="space-y-4">
                        {/* Feature Flags */}
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-slate-400" />
                                    Feature Flags
                                </h3>
                                <div className="space-y-3">
                                    <FlagRow label="Agent IA" code="AI_AGENT" enabled={features.AI_AGENT} />
                                    <FlagRow label="RAG" code="RAG" enabled={features.RAG} />
                                    <FlagRow label="OpenFisca" code="OPENFISCA" enabled={features.OPENFISCA} />
                                    <FlagRow label="Cache" code="CACHE" enabled={features.CACHE} />
                                    <FlagRow label="Maintenance" code="MAINTENANCE" enabled={features.MAINTENANCE} warning />
                                    <FlagRow label="Audit RGPD" code="AUDIT_LOG" enabled={features.AUDIT_LOG} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Infrastructure */}
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="font-bold text-slate-800 mb-4">Infrastructure</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Environnement</span>
                                        <Badge variant="outline">{infra.nodeEnv}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Cache backend</span>
                                        <Badge variant="outline">{infra.cache?.backend || '—'}</Badge>
                                    </div>
                                    {infra.cache?.memorySize != null && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Cache entries</span>
                                            <span className="text-slate-800 font-medium">{infra.cache.memorySize}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
                <p className="text-sm text-slate-500">{label}</p>
            </CardContent>
        </Card>
    );
}

function FlagRow({ label, code, enabled, warning = false }) {
    return (
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <code className="text-[10px] bg-slate-200 px-1 py-0.5 rounded text-slate-500">{code}</code>
            </div>
            <div className={`w-2 h-2 rounded-full ${enabled
                ? (warning ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]')
                : 'bg-slate-300'
                }`} />
        </div>
    );
}
