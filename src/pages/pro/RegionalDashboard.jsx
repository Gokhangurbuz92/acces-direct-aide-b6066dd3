import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import {
    Globe,
    TrendingUp,
    Users,
    Building2,
    ChevronRight,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    Activity,
    Loader2,
    Calendar,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

/**
 * RegionalDashboard — Multi-structure observatory
 *
 * Route: /pro/regional
 *
 * Shows anonymized aggregate stats across all structures
 * for territorial decision-makers.
 */
export default function RegionalDashboard() {
    const [search, setSearch] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Simulated trend data (production: from /api/pro/regional-stats?trend=7d)
    const trendData = useMemo(
        () => [
            { day: 'Lun', rdv: 42, diag: 38 },
            { day: 'Mar', rdv: 65, diag: 58 },
            { day: 'Mer', rdv: 51, diag: 48 },
            { day: 'Jeu', rdv: 78, diag: 72 },
            { day: 'Ven', rdv: 93, diag: 88 },
        ],
        []
    );

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/pro/regional-stats', { credentials: 'include' });
            if (res.ok) setData(await res.json());
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const stats = data?.stats || {};
    const cities = stats.cities || [];
    const filtered = useMemo(
        () =>
            cities.filter(
                (c) =>
                    c.name.toLowerCase().includes(search.toLowerCase()) ||
                    (c.city || '').toLowerCase().includes(search.toLowerCase())
            ),
        [cities, search]
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={28} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Observatoire Régional — ADA" noindex />
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl">
                            <Globe size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Observatoire Régional ADA
                            </h1>
                            <p className="text-xs text-slate-500">
                                Collectivité Européenne d&apos;Alsace · Pilotage souverain
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard
                        label="Citoyens aidés"
                        value={stats.totalCitizensHelped ?? 0}
                        icon={<Users size={14} className="text-indigo-500" />}
                    />
                    <KpiCard
                        label="Structures"
                        value={stats.activeStructures ?? 0}
                        icon={<Building2 size={14} className="text-emerald-500" />}
                    />
                    <KpiCard
                        label="Agents"
                        value={stats.totalAgents ?? 0}
                        icon={<ShieldCheck size={14} className="text-amber-500" />}
                    />
                    <KpiCard
                        label="RDV ce mois"
                        value={stats.appointmentsThisMonth ?? 0}
                        icon={<Calendar size={14} className="text-blue-500" />}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Structures list */}
                    <div className="lg:col-span-2 space-y-3">
                        <div className="relative">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                placeholder="Rechercher une structure..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Rechercher une structure"
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center text-sm text-slate-400">
                                    Aucune structure trouvée
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filtered.map((city) => (
                                    <StructureCard key={city.id} city={city} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Trend chart */}
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-bold flex items-center gap-2">
                                <Activity size={12} className="text-indigo-500" />
                                Activité 5 derniers jours
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[180px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="rdvGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,.08)',
                                                fontSize: '11px',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="rdv"
                                            stroke="#4f46e5"
                                            fill="url(#rdvGrad)"
                                            strokeWidth={2}
                                            name="RDV"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="diag"
                                            stroke="#10b981"
                                            fill="none"
                                            strokeWidth={1.5}
                                            strokeDasharray="4 4"
                                            name="Diagnostics"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-2">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> RDV
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Diagnostics
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sovereignty banner */}
                <Card className="bg-slate-900 text-white border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider mb-1">
                                    Interopérabilité Territoriale
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Données agrégées et anonymisées. Aucun accès aux dossiers
                                    nominatifs. Secret professionnel garanti par construction.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold uppercase">
                                    Isolation 100%
                                </span>
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold uppercase">
                                    Zero-Knowledge
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KpiCard({ label, value, icon }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-1">{icon}
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {label}
                    </span>
                </div>
                <p className="text-xl font-bold text-slate-900">
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                </p>
            </CardContent>
        </Card>
    );
}

function StructureCard({ city }) {
    const isActive = city.status === 'optimal';
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-bold">
                            {(city.name || '??').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">{city.name}</p>
                            {city.city && (
                                <p className="text-[10px] text-slate-400">{city.city}</p>
                            )}
                        </div>
                    </div>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${isActive
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                    >
                        {isActive ? 'actif' : 'inactif'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Agents</p>
                        <p className="text-sm font-bold text-slate-900">{city.agents}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">RDV</p>
                        <p className="text-sm font-bold text-slate-900">{city.rdv}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
