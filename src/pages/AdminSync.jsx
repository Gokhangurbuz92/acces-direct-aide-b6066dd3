import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Database,
  Loader2,
  Calendar,
  FileText,
  List
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  success: { label: 'Succès', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  partial: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  failed: { label: 'Échec', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function AdminSync() {
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();

  // Récupérer les derniers logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['update-logs'],
    queryFn: () => client.entities.UpdateLog.list('-ran_at', 10),
  });

  // Récupérer les sources actives
  const { data: sources = [] } = useQuery({
    queryKey: ['sources-active'],
    queryFn: () => client.entities.Source.filter({ status: 'actif' }),
  });

  // Mutation pour lancer la sync manuellement
  const syncMutation = useMutation({
    mutationFn: async ({ dryRun = false }) => {
      // FIX: Envoyer les deux formats pour être sûr (compatible avec les anciens paramètres)
      // + Ajout de logs debug.
      console.log('Invoking daily_sync_official_sources with:', { dryRun, dry_run: dryRun });
      const result = await client.functions.invoke('daily_sync_official_sources', {
        dryRun,
        dry_run: dryRun // Compatibility fix
      });
      console.log('Sync result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-logs'] });
      queryClient.invalidateQueries({ queryKey: ['aides'] });
    },
  });

  const handleManualSync = async (dryRun = false) => {
    const message = dryRun
      ? 'Lancer une simulation (dry run) ? Aucune fiche ne sera créée.'
      : 'Lancer la synchronisation maintenant ? Cela peut prendre plusieurs minutes.';

    if (window.confirm(message)) {
      setIsRunning(true);
      try {
        await syncMutation.mutateAsync({ dryRun });
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
        // Ensure error is visible to user via alert or toast if console is missed
        alert('Erreur: ' + (error.message || 'Unknown error'));
      } finally {
        setIsRunning(false);
      }
    }
  };

  const latestLog = logs[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Synchronisation des sources
          </h1>
          <p className="text-slate-600">
            Gestion de la mise à jour automatique des fiches depuis les sources officielles
          </p>
        </div>

        {/* Actions et dernière sync */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Action manuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Synchronisation manuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Lancer une synchronisation immédiate des sources officielles.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => handleManualSync(false)}
                  disabled={isRunning || syncMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {(isRunning || syncMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Synchronisation en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Lancer maintenant
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleManualSync(true)}
                  disabled={isRunning || syncMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  Mode Test (Dry Run)
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Prochaine synchronisation automatique : tous les jours à 5h00
              </p>
            </CardContent>
          </Card>

          {/* Dernière synchronisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Dernière synchronisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestLog ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Statut</span>
                    <Badge className={STATUS_CONFIG[latestLog.status]?.color}>
                      {STATUS_CONFIG[latestLog.status]?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Date</span>
                    <span className="font-medium">
                      {format(new Date(latestLog.ran_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                  {latestLog.duration_ms && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Durée</span>
                      <span className="font-medium">
                        {(latestLog.duration_ms / 1000).toFixed(1)}s
                        {latestLog.duration_ms > 120000 && (
                          <span className="text-orange-600 ml-1">⚠️</span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Items récupérés</span>
                    <span className="font-medium">{latestLog.items_fetched_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Fiches créées</span>
                    <span className="font-medium text-green-600">{latestLog.items_created_count}</span>
                  </div>
                  {latestLog.items_updated_count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Mises à jour</span>
                      <span className="font-medium text-blue-600">{latestLog.items_updated_count}</span>
                    </div>
                  )}
                  {latestLog.items_skipped_count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Ignorés</span>
                      <span className="font-medium text-slate-500">{latestLog.items_skipped_count}</span>
                    </div>
                  )}
                  {latestLog.is_dry_run && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Mode Test
                    </Badge>
                  )}
                  {latestLog.errors?.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="text-red-600 text-sm">
                        {latestLog.errors.length} erreur(s)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500">Aucune synchronisation effectuée</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sources actives */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sources actives ({sources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {sources.map((source) => (
                <div key={source.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{source.name}</h4>
                    <p className="text-sm text-slate-600">{source.type}</p>
                    {source.last_sync && (
                      <p className="text-xs text-slate-500 mt-1">
                        Dernière sync: {format(new Date(source.last_sync), 'dd/MM à HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    {source.trust_level}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dernières fiches créées */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Dernières fiches synchronisées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={createPageUrl('AdminRecentSyncs')}>
              <Button className="w-full">
                Voir toutes les fiches synchronisées
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Historique des logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique des synchronisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => {
                  const StatusIcon = STATUS_CONFIG[log.status]?.icon || Clock;
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${STATUS_CONFIG[log.status]?.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-900">{log.source_name}</span>
                          <span className="text-sm text-slate-500">
                            {format(new Date(log.ran_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{log.items_fetched_count} récupérés</span>
                          <span className="text-green-600">{log.items_created_count} créés</span>
                          {log.items_updated_count > 0 && (
                            <span className="text-blue-600">{log.items_updated_count} mis à jour</span>
                          )}
                          {log.errors?.length > 0 && (
                            <span className="text-red-600">{log.errors.length} erreurs</span>
                          )}
                        </div>
                        {log.errors?.length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-red-600 cursor-pointer">
                              Voir les erreurs
                            </summary>
                            <ul className="mt-2 space-y-1">
                              {log.errors.map((error, idx) => (
                                <li key={idx} className="text-xs text-red-600 pl-4">
                                  • {error}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">
                Aucun historique de synchronisation
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}