import { useQuery } from '@tanstack/react-query';
import { adminClient as client } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkeletonList } from '@/components/ui/skeleton';
import {
    Cpu, Zap, Clock, AlertTriangle, DollarSign,
    Activity, RefreshCw, AlertCircle,
} from 'lucide-react';

/**
 * AdminAiMetrics
 *
 * Displays Gemini AI usage metrics: tokens, costs, latency, error rate.
 * Data from GET /api/admin/ai-metrics (gemini-metrics.js).
 */
export default function AdminAiMetrics() {
    const { data: rawData, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-ai-metrics'],
        queryFn: () => client.get('/api/admin/ai-metrics').then(r => r.data),
        refetchInterval: 30_000,
    });

    if (isLoading) {
        return (
            <div className="w-full p-4"><SkeletonList count={3} variant="card" /></div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                        <p className="text-slate-600">Erreur de chargement des métriques IA</p>
                        <p className="text-sm text-slate-400 mt-1">{error.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // API may return data directly or wrapped in { data: ... }
    const m = rawData?.data || rawData || {};
    const byType = m.by_type || {};
    const last24h = m.last_24h || {};

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-1">
                                Métriques IA — Gemini
                            </h1>
                            <p className="text-slate-500 text-sm">
                                Utilisation, coûts et performance du moteur IA
                            </p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Actualiser
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        icon={<Zap className="text-amber-600" />}
                        label="Requêtes totales"
                        value={m.total_requests ?? 0}
                    />
                    <MetricCard
                        icon={<Cpu className="text-indigo-600" />}
                        label="Tokens consommés"
                        value={formatNumber(m.total_tokens ?? 0)}
                    />
                    <MetricCard
                        icon={<DollarSign className="text-emerald-600" />}
                        label="Coût estimé (USD)"
                        value={`$${(m.estimated_cost_usd ?? 0).toFixed(4)}`}
                    />
                    <MetricCard
                        icon={<Clock className="text-blue-600" />}
                        label="Latence moyenne"
                        value={`${m.avg_latency_ms ?? 0} ms`}
                    />
                </div>

                {/* Error & Circuit Breaker Row */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-semibold text-slate-700">Taux d&apos;erreur</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {m.error_rate_pct ?? 0}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-semibold text-slate-700">Circuit Breaker Trips</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">
                                {m.circuit_breaker_trips ?? 0}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold text-slate-700">Dernières 24h</span>
                            </div>
                            <p className="text-lg font-bold text-slate-900">
                                {last24h.requests ?? 0} req · {formatNumber(last24h.tokens ?? 0)} tokens
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* By Type Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-slate-400" />
                                Détail par type d&apos;agent
                            </h3>
                        </div>
                        {Object.keys(byType).length === 0 ? (
                            <p className="p-4 text-sm text-slate-400">
                                Aucune métrique enregistrée
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-left">
                                            <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Requêtes</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Tokens</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Erreurs</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Taux erreur</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(byType).map(([type, data]) => {
                                            const errorRate = data.requests > 0
                                                ? ((data.errors / data.requests) * 100).toFixed(1)
                                                : '0.0';
                                            return (
                                                <tr key={type} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {type}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">{data.requests}</td>
                                                    <td className="px-4 py-3 text-right">{formatNumber(data.tokens)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={data.errors > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>
                                                            {data.errors}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{errorRate}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Storage Info */}
                <p className="text-xs text-slate-400 text-right">
                    Source : {m.storage || 'unknown'}
                    {m.buffer_size != null && ` · Buffer: ${m.buffer_size}/${m.buffer_max}`}
                </p>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg">{icon}</div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
            </CardContent>
        </Card>
    );
}

function formatNumber(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}
