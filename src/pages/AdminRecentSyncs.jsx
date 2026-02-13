import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { adminClient as client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminRecentSyncs() {
  const { data: recentAides = [], isLoading } = useQuery({
    queryKey: ['recent-synced-aides'],
    queryFn: () => client.entities.Aide.filter(
      { sync_status: { $in: ['Fetched', 'Processed'] } },
      '-last_seen_at',
      50
    ),
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Fiches synchronisées récemment
          </h1>
          <p className="text-slate-600">
            Dernières fiches créées ou mises à jour par la synchronisation automatique
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {recentAides.length} fiches
              </span>
              <Link to={createPageUrl('AdminAides')}>
                <Button variant="outline" size="sm">
                  Gérer toutes les fiches
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : recentAides.length > 0 ? (
              <div className="space-y-3">
                {recentAides.map((aide) => (
                  <div
                    key={aide.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-slate-900">{aide.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {aide.summary_falc}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline">
                          {aide.category}
                        </Badge>

                        <Badge className={
                          aide.status === 'published' ? 'bg-green-100 text-green-800' :
                            aide.status === 'NeedsReview' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-slate-100 text-slate-800'
                        }>
                          {aide.status}
                        </Badge>

                        {aide.source_name && (
                          <Badge variant="outline" className="text-blue-600">
                            {aide.source_name}
                          </Badge>
                        )}

                        {aide.contains_unverified_numbers && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Chiffres non vérifiés
                          </Badge>
                        )}

                        {aide.sync_status && (
                          <Badge variant="outline" className="text-xs">
                            {aide.sync_status}
                          </Badge>
                        )}

                        {aide.last_seen_at && (
                          <span className="text-xs text-slate-500">
                            Vu: {format(new Date(aide.last_seen_at), 'dd/MM à HH:mm', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={createPageUrl('AideDetail') + `?id=${aide.id}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={createPageUrl('AdminAideEdit', { id: aide.id })}>
                        <Button variant="outline" size="sm">
                          Éditer
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-12">
                Aucune fiche synchronisée récemment
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
