import { useQuery } from '@tanstack/react-query';
import { adminClient as client } from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Shield,
    Info,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
} from 'lucide-react';

/**
 * AdminFeatures
 *
 * Page de visualisation des feature flags du système ADA.
 * Données live depuis GET /api/admin/features.
 *
 * Les flags sont en lecture seule (pilotés par variables d'environnement).
 */
export default function AdminFeatures() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-features'],
        queryFn: () => client.get('/api/admin/features').then(r => r.data),
        refetchInterval: 10_000,
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
                        <p className="text-slate-600">Erreur de chargement des feature flags</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const flags = data?.flags || [];
    const enabledCount = flags.filter(f => f.enabled).length;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Shield className="text-indigo-600" size={28} />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Pilotage des Fonctionnalités
                            </h1>
                            <p className="text-slate-500 text-sm">
                                {enabledCount}/{flags.length} fonctionnalités actives
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Flags List */}
                <Card>
                    <CardContent className="p-0 divide-y divide-slate-100">
                        {flags.map((flag) => (
                            <div
                                key={flag.id}
                                className="p-5 flex items-center justify-between hover:bg-slate-50 transition"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">{flag.label}</span>
                                        <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                            {flag.id}
                                        </code>
                                    </div>
                                    <p className="text-sm text-slate-500 max-w-md">{flag.description}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {flag.enabled ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Actif
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-slate-100 text-slate-500 border-0 gap-1">
                                            <XCircle className="h-3 w-3" />
                                            Inactif
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Info Note */}
                <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Note :</strong> Les feature flags sont pilotés par les variables
                        d&apos;environnement de production. Pour modifier un flag de manière persistante,
                        mettez à jour le fichier <code className="bg-amber-100 px-1 rounded">.env.production</code> et
                        redémarrez l&apos;API.
                    </p>
                </div>

                {/* Env var reference */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-bold text-slate-800 mb-3">Variables d&apos;environnement</h3>
                        <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-slate-300 space-y-1">
                            {flags.map((flag) => (
                                <div key={flag.id}>
                                    <span className="text-slate-500"># {flag.label}</span>
                                    <br />
                                    <span className="text-emerald-400">ENABLE_{flag.id}</span>
                                    <span className="text-slate-500">=</span>
                                    <span className={flag.enabled ? 'text-emerald-300' : 'text-red-300'}>
                                        {flag.enabled ? 'true' : 'false'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
