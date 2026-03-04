import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart3,
    TrendingUp,
    Download,
    Calendar,
    Users,
    MessageCircle,
    FileText,
    ShieldCheck,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    MessageSquare,
    Compass,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

/**
 * ImpactReports — Tableau de bord d'impact social
 *
 * Route: /pro/reports
 * Accessible uniquement aux STRUCTURE_ADMIN.
 *
 * Affiche les métriques agrégées de la structure pour justifier
 * les financements sans compromettre la vie privée.
 */
export default function ImpactReports() {
    useOutletContext();

    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pro/reports?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setData(await res.json());
            }
        } catch {
            // Handle silently
        } finally {
            setLoading(false);
        }
    }, [period, token]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleExportCSV = () => {
        if (!data) return;
        const rows = [
            'Date,RDV',
            ...(data.dailyActivity || []).map((d) => `${d.date},${d.count}`),
        ].join('\n');

        const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport-impact-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const kpis = data?.kpis || {};

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 size={22} className="text-indigo-600" />
                        Mesure d&apos;Impact Social
                    </h1>
                    <p className="text-sm text-slate-500">
                        Données anonymisées — Conformité Zero-Knowledge
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white border border-slate-200 rounded-lg flex">
                        {['month', 'quarter', 'year'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${period === p
                                    ? 'bg-slate-900 text-white rounded-lg'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {p === 'month' ? 'Mois' : p === 'quarter' ? 'Trimestre' : 'Année'}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                    </Button>
                </div>
            </div>

            {loading ? <div className="p-6"><SkeletonList count={3} variant="card" /></div> : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Citoyens accompagnés"
                            value={kpis.completedAppointments ?? 0}
                            icon={<Users size={16} className="text-indigo-600" />}
                            sub={`${kpis.completionRate ?? 0}% taux de réalisation`}
                        />
                        <KpiCard
                            label="Conversations"
                            value={kpis.conversations ?? 0}
                            icon={<MessageCircle size={16} className="text-emerald-600" />}
                            sub="Échanges E2EE"
                        />
                        <KpiCard
                            label="Diagnostics partagés"
                            value={kpis.diagnosticsShared ?? 0}
                            icon={<FileText size={16} className="text-amber-600" />}
                            sub="Dossiers transmis"
                        />
                        <KpiCard
                            label="Équipe active"
                            value={kpis.teamSize ?? 0}
                            icon={<Users size={16} className="text-purple-600" />}
                            sub={`${kpis.cancelledAppointments ?? 0} RDV annulés`}
                        />
                    </div>

                    {/* Phase 3 — SMS Impact + Boussole Sociale */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <KpiCard
                            label="Rappels SMS envoyés"
                            value={kpis.smsNotifications ?? 0}
                            icon={<MessageSquare size={16} className="text-teal-600" />}
                            sub={`${kpis.smsImpactRate ?? 0}% de couverture`}
                        />
                        <KpiCard
                            label="No-shows évités"
                            value={kpis.avoidedNoShows ?? 0}
                            icon={<TrendingUp size={16} className="text-teal-600" />}
                            sub="Estimation DITP (35%)"
                        />
                        <KpiCard
                            label="Boussole Sociale"
                            value={kpis.compassSessions ?? 0}
                            icon={<Compass size={16} className="text-indigo-600" />}
                            sub="Orientations IA"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Daily Activity Chart */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Calendar size={14} className="text-indigo-500" />
                                    Activité quotidienne
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(data?.dailyActivity || []).length === 0 ? (
                                    <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">
                                        Aucune donnée pour cette période
                                    </div>
                                ) : (
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.dailyActivity}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="date"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                    tickFormatter={(v) => {
                                                        const d = new Date(v);
                                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                                    }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                    allowDecimals={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                        fontSize: '12px',
                                                    }}
                                                    labelFormatter={(v) =>
                                                        new Date(v).toLocaleDateString('fr-FR', {
                                                            weekday: 'short',
                                                            day: 'numeric',
                                                            month: 'short',
                                                        })
                                                    }
                                                />
                                                <Bar dataKey="count" name="RDV" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Themes Pie Chart */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp size={14} className="text-indigo-500" />
                                    Répartition par service
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(data?.themes || []).length === 0 ? (
                                    <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">
                                        Aucune donnée pour cette période
                                    </div>
                                ) : (
                                    <div className="h-[250px] flex items-center">
                                        <div className="w-1/2 h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data.themes}
                                                        innerRadius={50}
                                                        outerRadius={85}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {data.themes.map((entry, i) => (
                                                            <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            fontSize: '12px',
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-1/2 space-y-3 pl-4">
                                            {data.themes.map((item, i) => {
                                                const total = data.themes.reduce((s, t) => s + t.value, 0);
                                                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                                return (
                                                    <div key={item.name} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div
                                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                            />
                                                            <span className="text-xs text-slate-600 truncate">
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-900 ml-2">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Status breakdown */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold">Répartition par statut</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                {(data?.byStatus || []).map((s) => (
                                    <div
                                        key={s.status}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100"
                                    >
                                        {s.status === 'cancelled' ? (
                                            <XCircle size={12} className="text-red-500" />
                                        ) : (
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                        )}
                                        <span className="text-xs font-medium text-slate-700 capitalize">
                                            {s.status}
                                        </span>
                                        <span className="text-xs font-bold text-slate-900">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Social Impact Certification */}
                    <Card>
                        <CardContent className="py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 shrink-0">
                                    <ShieldCheck size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-slate-900">Certification Impact Social</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Grâce aux rappels SMS et à la Boussole Sociale, votre structure
                                        améliore son taux de présence et d&apos;engagement citoyen.
                                    </p>
                                </div>
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase shrink-0">
                                    Excellente
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Zero-Knowledge notice */}
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <ShieldCheck className="text-emerald-600 shrink-0" size={16} />
                        <p className="text-xs text-emerald-700">
                            <strong>Anonymat garanti :</strong> ces statistiques agrègent uniquement
                            des compteurs. Aucun contenu privé (nom, diagnostic, message) n&apos;est
                            exposé dans ce rapport.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

function KpiCard({ label, value, icon, sub }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-slate-500">{label}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {sub && (
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <ArrowUpRight size={10} /> {sub}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
