/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database, GitCommit, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminHealth() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/health');
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || res.statusText);
                setHealth(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading && !health) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (error && !health) {
        return (
            <div className="p-8 text-red-600 flex items-center gap-2">
                <XCircle />
                Failed to load health status: {error}
            </div>
        );
    }

    const isHealthy = health?.status === 'ok';

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Système Health Dashboard</h1>
                <Badge variant={isHealthy ? "default" : "destructive"} className="text-lg px-4 py-1">
                    {isHealthy ? "OPERATIONAL" : "DEGRADED"}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard
                    title="API Status"
                    value={health.status.toUpperCase()}
                    icon={isHealthy ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                />
                <StatusCard
                    title="Database"
                    value={health.database.toUpperCase()}
                    icon={<Database className={health.database === 'connected' ? "text-green-500" : "text-red-500"} />}
                />
                <StatusCard
                    title="Version"
                    value={health.version}
                    subValue={health.commitSha?.substring(0, 7)}
                    icon={<GitCommit />}
                />
                 <StatusCard
                    title="Last Check"
                    value={format(new Date(health.timestamp), 'HH:mm:ss')}
                    subValue={format(new Date(health.timestamp), 'dd MMM yyyy', { locale: fr })}
                    icon={<Clock />}
                />
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Raw Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-slate-100 p-4 rounded-md overflow-auto text-xs">
                        {JSON.stringify(health, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusCard({ title, value, subValue, icon }) {
    return (
        <Card>
            <CardContent className="flex items-center p-6 space-x-4">
                <div className="p-2 bg-slate-100 rounded-full">{icon}</div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                    {subValue && <p className="text-xs text-slate-400 font-mono">{subValue}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
