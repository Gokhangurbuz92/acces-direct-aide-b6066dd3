import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import {
    Cpu,
    Play,
    BrainCircuit,
    Loader2,
    ChevronRight,
    Database,
    Newspaper,
    BookOpen,
    LayoutGrid,
    ShieldCheck,
    MessageSquareCode,
    Zap,
} from 'lucide-react';

/**
 * ContentFactory — Autonomous content orchestration center
 *
 * Route: /pro/content-factory
 *
 * 4 national poles (Aides, Démarches, Actualités, Annuaire)
 * each with category-level specialist agents.
 * Grand Chef console shows the 3-tier validation pipeline.
 */

const POLES = [
    { key: 'aides', label: 'Aides Financières', icon: Database, count: '2.4k' },
    { key: 'demarches', label: 'Démarches Guidées', icon: BookOpen, count: '480' },
    { key: 'actualites', label: 'Actualités & Lois', icon: Newspaper, count: '1.2k' },
    { key: 'annuaire', label: 'Annuaire National', icon: LayoutGrid, count: '18k' },
];

const CATEGORIES = {
    aides: [
        { id: 'logement', name: 'Logement', status: 'scanning', finds: 12 },
        { id: 'sante', name: 'Santé', status: 'idle', finds: 4 },
        { id: 'famille', name: 'Famille', status: 'idle', finds: 23 },
        { id: 'emploi', name: 'Emploi', status: 'idle', finds: 7 },
    ],
    demarches: [
        { id: 'identite', name: 'Identité', status: 'idle', finds: 2 },
        { id: 'fiscalite', name: 'Fiscalité', status: 'scanning', finds: 9 },
    ],
    actualites: [
        { id: 'reforme', name: 'Réformes', status: 'analyzing', finds: 5 },
        { id: 'alsace', name: 'Local (Alsace)', status: 'idle', finds: 14 },
    ],
    annuaire: [
        { id: 'mairies', name: 'Mairies', status: 'idle', finds: 156 },
        { id: 'caf', name: 'CAF & MSA', status: 'scanning', finds: 42 },
    ],
};

const LOGS = [
    { agent: 'Sub-Agent-Logement', msg: 'Changement plafond APL détecté (Décret 2026-12).', type: 'discovery' },
    { agent: 'Superior-Aides', msg: 'Fiche "Aide Logement" mise à jour prête.', type: 'analysis' },
    { agent: 'Grand-Chef', msg: 'Validation nationale OK. Déploiement en cours...', type: 'validation' },
    { agent: 'Sub-Agent-Alsace', msg: 'Aide chauffage Collectivité d\'Alsace détectée.', type: 'discovery' },
];

const STATUS_CLASS = {
    scanning: 'bg-teal-50 text-teal-700',
    analyzing: 'bg-amber-50 text-amber-700',
    idle: 'bg-slate-100 text-slate-500',
};

export default function ContentFactory() {
    const [running, setRunning] = useState(false);
    const [tab, setTab] = useState('aides');

    const run = () => {
        setRunning(true);
        setTimeout(() => setRunning(false), 3000);
    };

    const cats = CATEGORIES[tab] || [];

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Usine à Contenu — AccesDirectAide" noindex />
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 text-white rounded-2xl" style={{ backgroundColor: '#0f766e' }}>
                            <Cpu size={22} className={running ? 'animate-spin' : ''} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">L&apos;Usine à Contenu</h1>
                            <p className="text-xs text-slate-500 italic">Orchestration autonome des agents IA</p>
                        </div>
                    </div>
                    <Button onClick={run} disabled={running}>
                        {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
                        {running ? 'Orchestration...' : 'Lancer l\'Orchestration'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                    {/* Pole navigation */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pôles Nationaux</p>
                        {POLES.map((p) => {
                            const Icon = p.icon;
                            const active = tab === p.key;
                            return (
                                <button
                                    key={p.key}
                                    onClick={() => setTab(p.key)}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-colors ${active ? 'text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                    style={active ? { backgroundColor: '#0f766e' } : undefined}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icon size={14} />
                                        <span className="text-[10px] font-bold uppercase">{p.label}</span>
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
                                        {p.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Category agents + Grand Chef */}
                    <div className="lg:col-span-3 space-y-5">
                        {/* Category grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cats.map((c) => (
                                <Card key={c.id} className="hover:shadow-md transition-shadow group">
                                    <CardContent className="p-4">
                                        {c.status === 'scanning' && (
                                            <div className="h-0.5 bg-gradient-to-r from-teal-500 to-amber-500 animate-pulse rounded mb-3 -mt-1" />
                                        )}
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <BrainCircuit size={14} className={c.status === 'scanning' ? 'text-teal-600' : 'text-slate-400'} />
                                                <span className="text-sm font-bold text-slate-900">{c.name}</span>
                                            </div>
                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_CLASS[c.status] || ''} ${c.status === 'analyzing' ? 'animate-pulse' : ''}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[9px] text-slate-400">Mises à jour</p>
                                                <p className="text-lg font-bold" style={{ color: '#0f766e' }}>{c.finds}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Grand Chef console */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                                    <MessageSquareCode size={12} className="text-amber-400" />
                                    Grand Chef Agent IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto mb-4">
                                    {LOGS.map((log, i) => (
                                        <div key={i} className="flex gap-3 p-2 bg-white/5 rounded-lg text-[10px]">
                                            <span className={`font-bold shrink-0 w-28 ${log.type === 'discovery' ? 'text-blue-400' : log.type === 'analysis' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {log.agent}
                                            </span>
                                            <span className="text-slate-300">{log.msg}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                        <Zap size={10} className="text-amber-400" />
                                        124 aides mises à jour (24h)
                                    </span>
                                    <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] text-teal-400 font-bold">
                                        <ShieldCheck size={8} className="inline mr-1" />
                                        Auto-Validation : ON
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
