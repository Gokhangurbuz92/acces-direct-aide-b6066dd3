import React, { useState } from 'react';
import {
    BrainCircuit,
    Activity,
    Zap,
    Database,
    Cpu,
    RefreshCw
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import SEO from '@/components/SEO';

/**
 * ADA PRO MAX - AI ORCHESTRATOR DASHBOARD
 * Monitoring en temps réel de l'activité des agents et de l'Agent Chef.
 */
const AiOrchestrator = () => {
    const [agents] = useState([
        { id: 'chef', name: 'Agent Chef', status: 'active', load: 45, latency: '120ms', task: 'Routage Ingestion National' },
        { id: 'hive', name: 'La Ruche', status: 'active', load: 88, latency: '450ms', task: 'Scan DREES en cours' },
        { id: 'triage', name: 'Agent Triage', status: 'idle', load: 0, latency: '80ms', task: 'En attente' },
        { id: 'falc', name: 'Synthèse FALC', status: 'active', load: 72, latency: '1.2s', task: 'Simplification Décret 2024-12' }
    ]);

    const stats = [
        { name: '08:00', requests: 400, efficiency: 95 },
        { name: '10:00', requests: 800, efficiency: 98 },
        { name: '12:00', requests: 600, efficiency: 94 },
        { name: '14:00', requests: 1200, efficiency: 99 },
        { name: '16:00', requests: 900, efficiency: 97 }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <SEO title="Orchestration IA Pro Max" noindex />

            {/* Header Pro Max */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                            <BrainCircuit size={24} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                            AI <span className="text-indigo-500">Orchestrator</span> Pro Max
                        </h1>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Système d'Intelligence Souveraine ADA — v4.0.0
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                        <Activity className="text-emerald-500 animate-pulse" size={18} />
                        <div>
                            <div className="text-[10px] font-black uppercase text-slate-500">Système</div>
                            <div className="text-xs font-bold">100% OPÉRATIONNEL</div>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                        Relancer la Ruche
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonne de Gauche : Status des Agents */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Cpu size={16} /> Status des Agents
                    </h2>
                    {agents.map(agent => (
                        <div key={agent.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-indigo-500/50 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-black uppercase italic text-lg">{agent.name}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{agent.task}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                                    }`}>
                                    {agent.status}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase">
                                    <span className="text-slate-500">Charge CPU</span>
                                    <span>{agent.load}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-1000"
                                        style={{ width: `${agent.load}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                    <span>Latence</span>
                                    <span className="text-slate-300">{agent.latency}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Colonne Centrale & Droite : Metrics & Data */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Chart de Performance */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem]">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                            <Zap size={16} /> Efficacité de l'Agent Chef
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats}>
                                    <defs>
                                        <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Logs d'Orchestration */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Database size={16} /> Journal d'Orchestration
                            </h2>
                            <RefreshCw size={14} className="text-slate-500 animate-spin-slow" />
                        </div>
                        <div className="p-6 space-y-4 max-h-[280px] overflow-y-auto">
                            {[
                                { time: '12:45:01', type: 'INFO', msg: 'Agent Chef : Routage vers La Ruche pour scan territorial 67.' },
                                { time: '12:44:58', type: 'SUCCESS', msg: 'Synthèse FALC terminée sur le document #9842.' },
                                { time: '12:44:12', type: 'WARN', msg: 'Latence accrue sur le connecteur Aides-Territoires (1.2s).' },
                                { time: '12:43:05', type: 'SYSTEM', msg: 'KV Lock cron:actualites:lock purgé avec succès.' }
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 text-[10px] font-mono border-b border-slate-800/50 pb-3">
                                    <span className="text-slate-500">[{log.time}]</span>
                                    <span className={`font-bold ${log.type === 'SUCCESS' ? 'text-emerald-500' :
                                            log.type === 'WARN' ? 'text-amber-500' : 'text-indigo-400'
                                        }`}>{log.type}</span>
                                    <span className="text-slate-300">{log.msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiOrchestrator;
