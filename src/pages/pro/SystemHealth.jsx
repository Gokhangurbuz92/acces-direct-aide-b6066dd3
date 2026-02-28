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
 *
 * Shows service status, latency chart, security checks,
 * and AI token usage. All data is simulated for now;
 * production would call /api/pro/health-check.
 */

const SERVICES = [
    { id: 'db', label: 'Base de Données', sub: 'PostgreSQL Neon', icon: Database },
    { id: 'ai', label: 'Moteur IA', sub: 'Gemini 2.0 Flash', icon: Zap },
    { id: 'storage', label: 'Stockage E2EE', sub: 'Coffre-fort', icon: HardDrive },
    { id: 'siao', label: 'Passerelle SIAO', sub: 'Interop National', icon: Globe },
];

const LATENCY = [
    { t: '00h', api: 45, db: 12 },
    { t: '04h', api: 42, db: 10 },
    { t: '08h', api: 120, db: 45 },
    { t: '12h', api: 150, db: 60 },
    { t: '16h', api: 90, db: 30 },
    { t: '20h', api: 55, db: 15 },
];

export default function SystemHealth() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 800);
        return () => clearTimeout(t);
    }, []);

    if (!ready) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={28} />
            </div>
        );
    }

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
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Tous les services opérationnels · Uptime 99.98%
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setReady(false);
                            setTimeout(() => setReady(true), 600);
                        }}
                    >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Actualiser
                    </Button>
                </div>

                {/* Services grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SERVICES.map((s) => (
                        <ServiceCard key={s.id} service={s} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Latency chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-bold flex items-center gap-2">
                                <Clock size={12} className="text-indigo-500" />
                                Temps de réponse (24h)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[220px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={LATENCY}>
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
                                            dataKey="api"
                                            stroke="#4f46e5"
                                            strokeWidth={2.5}
                                            dot={false}
                                            name="API"
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
                            </div>
                            <div className="flex gap-4 mt-2 text-[9px] font-bold text-slate-400 uppercase">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> API
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />{' '}
                                    Database
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security + AI quotas */}
                    <div className="space-y-4">
                        <Card className="bg-slate-900 text-white border-slate-800">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold flex items-center gap-2 text-white">
                                    <Lock size={12} className="text-emerald-400" />
                                    Sécurité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <SecurityRow label="SSL" value="Valide (320j)" />
                                <SecurityRow label="E2EE" value="Clés rotées 2h" />
                                <SecurityRow label="Audit" value="Synchronisé" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold flex items-center gap-2">
                                    <Zap size={12} className="text-amber-500" />
                                    Quota IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                                        Tokens Gemini / mois
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">42%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: '42%' }}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1.5">
                                    ~580k / 1.4M tokens utilisés
                                </p>
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
                                Modules isolés et monitorés. En cas de défaillance d&apos;une
                                API tierce, bascule automatique en mode dégradé souverain.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ServiceCard({ service }) {
    const Icon = service.icon;
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
                    <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={8} /> Opérationnel
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function SecurityRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-white/10 last:border-0">
            <span className="text-[10px] text-slate-400">{label}</span>
            <span className="text-[10px] font-bold text-emerald-400">{value}</span>
        </div>
    );
}
