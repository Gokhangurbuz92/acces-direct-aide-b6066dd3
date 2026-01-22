import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Clock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EntityHistory({ entityType, entityId, onRestored }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restoring, setRestoring] = useState(null);

    useEffect(() => {
        fetchVersions();
    }, [entityType, entityId]);

    const fetchVersions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/versions?entity_type=${entityType}&entity_id=${entityId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Note found or unauthorized');
            const data = await res.json();
            setVersions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionId) => {
        if (!window.confirm("Voulez-vous vraiment restaurer cette version ? L'état actuel sera sauvegardé avant la restauration.")) return;

        try {
            setRestoring(versionId);
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/versions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ versionId })
            });

            if (!res.ok) throw new Error('Restoration failed');

            alert('Version restaurée avec succès !');
            if (onRestored) onRestored();
            fetchVersions();
        } catch (err) {
            alert(err.message);
        } finally {
            setRestoring(null);
        }
    };

    if (loading) return <div className="p-4 text-slate-500">Chargement de l'historique...</div>;
    if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-slate-500" />
                <h3 className="text-lg font-semibold">Historique des modifications</h3>
            </div>

            {versions.length === 0 ? (
                <p className="text-slate-500 italic">Aucune version précédente trouvée.</p>
            ) : (
                <div className="divide-y border rounded-lg bg-white overflow-hidden">
                    {versions.map((v) => (
                        <div key={v.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    {format(new Date(v.createdAt), 'Pp', { locale: fr })}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <User className="h-3 w-3" />
                                    {v.actor_email || 'Système'}
                                    {v.reason && <span className="text-slate-300">•</span>}
                                    {v.reason && <span>{v.reason}</span>}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleRestore(v.id)}
                                disabled={restoring === v.id}
                            >
                                <RotateCcw className={`h-4 w-4 ${restoring === v.id ? 'animate-spin' : ''}`} />
                                Restaurer
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
