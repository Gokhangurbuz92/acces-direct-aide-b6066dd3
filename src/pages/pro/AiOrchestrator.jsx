import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import {
    Cpu,
    BrainCircuit,
    MessageSquareCode,
    Settings2,
    ToggleLeft,
    ToggleRight,
    Loader2,
} from 'lucide-react';

/**
 * AiOrchestrator — AI agent control center
 *
 * Route: /pro/orchestrator
 *
 * Manage autonomous AI agents: toggle auto-mode,
 * view execution logs, monitor latency.
 */

const INITIAL_AGENTS = [
    { id: 'triage', name: 'Agent de Triage', task: 'Analyse d\'éligibilité', status: 'active', auto: true },
    { id: 'synth', name: 'Agent de Synthèse', task: 'Résumé de dossier', status: 'ready', auto: false },
    { id: 'notif', name: 'Agent de Rappel', task: 'Vérification RDV + SMS', status: 'active', auto: true },
];

const LOGS = [
    { t: '01:10:24', agent: 'Triage', msg: 'Analyse dossier #4492 terminée.', type: 'success' },
    { t: '01:10:25', agent: 'System', msg: 'Mise à jour éligibilités Prime d\'Activité.', type: 'info' },
    { t: '01:12:00', agent: 'Rappel', msg: 'SMS programmé pour usager #4492.', type: 'action' },
    { t: '01:14:12', agent: 'Triage', msg: 'Nouveau diagnostic reçu — analyse en cours.', type: 'info' },
    { t: '01:14:15', agent: 'Synthèse', msg: '3 points clés extraits (latence 840ms).', type: 'success' },
];

export default function AiOrchestrator() {
    const [agents, setAgents] = useState(INITIAL_AGENTS);

    const toggle = (id) => {
        setAgents((prev) =>
            prev.map((a) => (a.id === id ? { ...a, auto: !a.auto } : a))
        );
    };

    const activeCount = agents.filter((a) => a.auto).length;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <SEO title="Orchestration IA — AccesDirectAide" noindex />
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-3 text-white rounded-2xl"
                            style={{ backgroundColor: '#0f766e' }}
                        >
                            <Cpu size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Orchestration IA
                            </h1>
                            <p className="text-xs text-slate-500">
                                Automatisation souveraine des flux
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase border border-emerald-100">
                        {activeCount}/{agents.length} agents autonomes
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Agents */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Agents actifs
                        </p>
                        {agents.map((agent) => (
                            <Card
                                key={agent.id}
                                className="hover:shadow-md transition-shadow"
                            >
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`p-2 rounded-lg ${agent.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-slate-50 text-slate-400'
                                                }`}
                                        >
                                            <BrainCircuit size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                {agent.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {agent.task}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggle(agent.id)}
                                        className="transition-colors"
                                        style={{ color: agent.auto ? '#0f766e' : '#cbd5e1' }}
                                        aria-label={`Toggle ${agent.name}`}
                                    >
                                        {agent.auto ? (
                                            <ToggleRight size={28} />
                                        ) : (
                                            <ToggleLeft size={28} />
                                        )}
                                    </button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Log console */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
                                <MessageSquareCode
                                    size={12}
                                    className="text-amber-400"
                                />
                                Flux d&apos;exécution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-mono text-[10px] space-y-1.5 max-h-[280px] overflow-y-auto mb-4">
                                {LOGS.map((log, i) => (
                                    <p
                                        key={i}
                                        className={
                                            log.type === 'success'
                                                ? 'text-emerald-400'
                                                : log.type === 'action'
                                                    ? 'text-blue-400'
                                                    : 'text-slate-400'
                                        }
                                    >
                                        [{log.t}] {log.agent}: {log.msg}
                                    </p>
                                ))}
                                <p className="animate-pulse text-white">_</p>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">
                                    Latence IA : 840ms
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white text-[9px]"
                                >
                                    <Settings2 className="mr-1 h-3 w-3" />
                                    Config
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
