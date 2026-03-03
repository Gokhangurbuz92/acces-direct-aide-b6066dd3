import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import {
    Activity,
    Database,
    Zap,
    Globe,
    ShieldCheck,
    RefreshCw,
    Clock,
    HardDrive,
    Lock,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

/**
 * SystemHealth — Infrastructure monitoring dashboard
 *
 * Route: /pro/health
 * Data: GET /api/pro/health-check (real metrics)
 */

const ICON_MAP = {
    db: Database,
    ai: Zap,
    storage: HardDrive,
    siao: Globe,
};

const STATUS_STYLES = {
    operational: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Opérationnel', Icon: CheckCircle2 },
    degraded: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Dégradé', Icon: AlertTriangle },
    down: { color: 'text-red-600', bg: 'bg-red-50', label: 'Hors service', Icon: XCircle },
    not_configured: { color: 'text-slate-400', bg: 'bg-slate-50', label: 'Non configuré', Icon: AlertTriangle },
};

export default function SystemHealth() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [latencyHistory, setLatencyHistory] = useState([]);

    const fetchHealth = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pro/health-check', { credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                // Append to latency history for chart (max 12 points)
                setLatencyHistory((prev) => {
                    const next = [
                        ...prev,
                        {
                            t: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            db: json.metrics?.dbLatencyMs || 0,
                        },
                    ];
                    return next.slice(-12);
                });
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHealth();
    }, [fetchHealth]);

    if (loading && !data) {
        return (
            <div className="w-full p-4"><SkeletonList count={3} variant="card" /></div>
        );
    }

    const services = data?.services || [];
    const metrics = data?.metrics || {};
    const allOperational = services.every((s) => s.status === 'operational');

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Santé Système — ADA" noindex />
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                            <Activity size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Santé du Système
                            </h1>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${allOperational ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {allOperational ? 'Tous les services opérationnels' : 'Certains services nécessitent attention'}
                                {data?.timestamp && ` · ${new Date(data.timestamp).toLocaleTimeString('fr-FR')}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchHealth}
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </Button>
                </div>

                {/* Services grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {services.map((s) => (
                        <ServiceCard key={s.id} service={s} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Latency chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-bold flex items-center gap-2">
                                <Clock size={12} className="text-indigo-500" />
                                Latence Base de Données (temps réel)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[220px] w-full mt-2">
                                {latencyHistory.length > 1 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={latencyHistory}>
                                            <XAxis
                                                dataKey="t"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                unit="ms"
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,.08)',
                                                    fontSize: '11px',
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="db"
                                                stroke="#10b981"
                                                strokeWidth={2.5}
                                                dot={false}
                                                name="Database"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-sm text-slate-400">
                                        <p>DB latence : <strong className="text-slate-700">{metrics.dbLatencyMs || '—'}ms</strong>. Cliquez Actualiser pour voir la tendance.</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 mt-2 text-[9px] font-bold text-slate-400 uppercase">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Database
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security + Metrics */}
                    <div className="space-y-4">
                        <Card className="bg-slate-900 text-white border-slate-800">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold flex items-center gap-2 text-white">
                                    <Lock size={12} className="text-emerald-400" />
                                    Métriques
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <MetricRow label="Aides" value={metrics.aidesCount ?? '—'} />
                                <MetricRow label="Démarches" value={metrics.demarchesCount ?? '—'} />
                                <MetricRow label="Structures" value={metrics.structuresCount ?? '—'} />
                                <MetricRow label="RDV ce mois" value={metrics.appointmentsThisMonth ?? '—'} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold flex items-center gap-2">
                                    <Zap size={12} className="text-amber-500" />
                                    Ingestion & Modération
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Dernière ingestion</span>
                                    <span className="font-medium text-slate-700">
                                        {metrics.lastIngestAt
                                            ? new Date(metrics.lastIngestAt).toLocaleDateString('fr-FR')
                                            : 'Aucune'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Source</span>
                                    <span className="font-medium text-slate-700">{metrics.lastIngestSource || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Items en modération</span>
                                    <span className="font-bold text-amber-600">{metrics.pendingModeration ?? '—'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Resilience banner */}
                <Card className="bg-indigo-50 border-indigo-100">
                    <CardContent className="p-5 flex items-start gap-3">
                        <ShieldCheck
                            size={16}
                            className="text-indigo-600 shrink-0 mt-0.5"
                        />
                        <div>
                            <p className="text-xs font-bold text-slate-900 mb-0.5">
                                Infrastructure Haute Disponibilité
                            </p>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                {data?.env || 'development'} · Node {data?.nodeVersion || '—'} · Modules isolés et monitorés.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ServiceCard({ service }) {
    const Icon = ICON_MAP[service.id] || Database;
    const statusInfo = STATUS_STYLES[service.status] || STATUS_STYLES.not_configured;
    const StatusIcon = statusInfo.Icon;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3.5 flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Icon size={16} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-900 truncate">
                        {service.label}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">{service.sub}</p>
                    <p className={`text-[9px] font-bold flex items-center gap-1 mt-0.5 ${statusInfo.color}`}>
                        <StatusIcon size={8} />
                        {statusInfo.label}
                        {service.latencyMs != null && ` (${service.latencyMs}ms)`}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function MetricRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-white/10 last:border-0">
            <span className="text-[10px] text-slate-400">{label}</span>
            <span className="text-[10px] font-bold text-emerald-400">{value}</span>
        </div>
    );
}
