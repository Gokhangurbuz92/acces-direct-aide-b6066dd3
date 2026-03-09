import React, { useState, useEffect, useRef } from 'react';
import {
    BrainCircuit,
    Search,
    Database,
    Zap,
    ShieldCheck,
    RefreshCw,
    Globe,
    AlertCircle,
    CheckCircle2,
    Terminal,
    Cpu,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

/**
 * ADA PRO MAX - NATIONAL SCAN CONSOLE
 * Interface de pilotage pour le premier scan national souverain.
 */
const App = () => {
    const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, finalizing, completed
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ aids: 0, sources: 0, falc: 0 });
    const logEndRef = useRef(null);

    const sources = [
        { id: 'at', name: 'Aides-Territoires', status: 'online', count: 1240, color: '#6366f1' },
        { id: 'drees', name: 'DREES Social', status: 'online', count: 450, color: '#818cf8' },
        { id: 'sp', name: 'Service-Public.fr', status: 'online', count: 890, color: '#4f46e5' },
        { id: 'agefiph', name: 'Agefiph (Handicap)', status: 'checking', count: 0, color: '#6366f1' }
    ];

    const addLog = (msg, type = 'info', agent = 'CHEF') => {
        const time = new Date().toLocaleTimeString('fr-FR');
        setLogs(prev => [...prev, { time, msg, type, agent }]);
    };

    const startScan = async () => {
        setScanStatus('scanning');
        setProgress(0);
        setLogs([]);
        setStats({ aids: 0, sources: 0, falc: 0 });

        addLog("Initialisation du protocole Pro Max...", "system");
        await sleep(1000);
        addLog("Agent Chef : Établissement de la connexion aux flux nationaux.", "info");

        // Simulation de l'ingestion par étapes
        const steps = [
            { msg: "La Ruche : Connexion Aides-Territoires établie. Ingestion en cours...", aids: 250, falc: 45 },
            { msg: "Agent Chef : Délégation vers Agent FALC pour normalisation sémantique.", aids: 580, falc: 120 },
            { msg: "La Ruche : Flux DREES détecté. Extraction des critères d'éligibilité.", aids: 840, falc: 210 },
            { msg: "Agent Chef : Analyse des doublons territoriaux (Dédoublonnage actif).", aids: 1100, falc: 340 },
            { msg: "La Ruche : Finalisation du scan Service-Public.fr.", aids: 1560, falc: 580 }
        ];

        for (let i = 0; i < steps.length; i++) {
            await sleep(1500);
            setProgress((i + 1) * 20);
            addLog(steps[i].msg, i % 2 === 0 ? "info" : "process", i % 2 === 0 ? "RUCHE" : "FALC");
            setStats({
                aids: steps[i].aids,
                sources: i + 1,
                falc: steps[i].falc
            });
        }

        setScanStatus('finalizing');
        addLog("Agent Chef : Validation de l'intégrité de la base nationale.", "system");
        await sleep(2000);
        setScanStatus('completed');
        addLog("Scan National Terminé. 1560 aides indexées, 580 versions FALC générées.", "success");
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-10 font-sans selection:bg-indigo-500/30">
            {/* HUD HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-slate-800 pb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                            <Globe className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">
                                Scan <span className="text-indigo-500">National</span> <span className="text-slate-500 text-xl not-italic font-medium">Souverain</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Protocole Pro Max 100% Actif</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Dernière Sync</div>
                        <div className="text-sm font-bold text-slate-300">Aujourd'hui, 22:45</div>
                    </div>
                    <button
                        onClick={startScan}
                        disabled={scanStatus === 'scanning' || scanStatus === 'finalizing'}
                        className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] active:scale-95"
                    >
                        <RefreshCw size={18} className={scanStatus === 'scanning' ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                        {scanStatus === 'idle' ? "Lancer le Scan" : scanStatus === 'completed' ? "Relancer" : "Scan en cours..."}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* STATS RAPIDES */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Aides Indexées', value: stats.aids, icon: Database, color: 'text-indigo-400' },
                        { label: 'Sources Connectées', value: stats.sources, icon: Globe, color: 'text-blue-400' },
                        { label: 'Traductions FALC', value: stats.falc, icon: Sparkles, color: 'text-emerald-400' },
                        { label: 'Santé Système', value: '99.8%', icon: Zap, color: 'text-amber-400' }
                    ].map((s, i) => (
                        <div key={i} className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl flex items-center gap-5 group hover:border-indigo-500/30 transition-all">
                            <div className={`p-4 bg-slate-950 rounded-2xl border border-slate-800 ${s.color}`}>
                                <s.icon size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{s.label}</div>
                                <div className="text-2xl font-black text-white">{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* LOGS TERMINAL */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Terminal size={18} className="text-indigo-500" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Flux d'Ingestion National</h2>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>
                        <div className="p-8 h-[450px] overflow-y-auto font-mono text-[11px] space-y-3 custom-scrollbar">
                            {logs.length === 0 && (
                                <div className="text-slate-600 italic">En attente d'initialisation du protocole...</div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                    <span className={`font-bold shrink-0 w-16 ${log.type === 'success' ? 'text-emerald-500' :
                                            log.type === 'process' ? 'text-indigo-400' :
                                                log.type === 'system' ? 'text-blue-400' : 'text-slate-500'
                                        }`}>{log.agent}</span>
                                    <span className={log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'}>{log.msg}</span>
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>

                    {/* BARRE DE PROGRESSION */}
                    {scanStatus !== 'idle' && (
                        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem]">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase text-slate-500">Progression Globale</span>
                                <span className="text-lg font-black text-indigo-400">{progress}%</span>
                            </div>
                            <div className="h-4 w-full bg-slate-950 rounded-full p-1 overflow-hidden border border-slate-800">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-400 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* SOURCES STATUS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem]">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 flex items-center gap-2">
                            <Cpu size={16} /> État des Flux
                        </h2>
                        <div className="space-y-6">
                            {sources.map(source => (
                                <div key={source.id} className="group cursor-help">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black uppercase text-slate-300 group-hover:text-white transition-colors">{source.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${source.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-600 animate-pulse'}`} />
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{source.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1 bg-slate-950 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 opacity-50 transition-all duration-1000"
                                                style={{ width: scanStatus === 'completed' ? '100%' : '0%' }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600">{scanStatus === 'completed' ? source.count : 0} items</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl">
                            <div className="flex items-center gap-3 mb-3">
                                <BrainCircuit className="text-indigo-400" size={18} />
                                <span className="text-[10px] font-black uppercase text-indigo-400">Recommandation Agent Chef</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed italic">
                                "Le flux Agefiph nécessite une vérification manuelle du schéma. L'Agent Ingestion a mis le connecteur en file d'attente."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
