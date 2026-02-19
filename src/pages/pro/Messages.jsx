// @ts-nocheck
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { rdvMessagingClient, messagingErrorText } from '@/api/rdv-messaging-client';

function formatDate(value) {
  const date = new Date(String(value || ''));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  });
}

export default function ProMessages() {
  const conversationsQuery = useQuery({
    queryKey: ['pro-messages-conversations'],
    queryFn: () => rdvMessagingClient.pro.listConversations(),
  });

  const items = Array.isArray(conversationsQuery.data?.items) ? conversationsQuery.data.items : [];

  return (
    <div className="space-y-4" data-testid="pro-messages-page">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Messages RDV
          </CardTitle>
          <CardDescription>
            Conversations avec les usagers pour votre structure.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {conversationsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des conversations...
            </div>
          ) : null}

          {conversationsQuery.error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {messagingErrorText(conversationsQuery.error, 'Impossible de charger les conversations.')}
            </p>
          ) : null}

          {!conversationsQuery.isLoading && !conversationsQuery.error && items.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
              Aucune conversation pour le moment.
            </p>
          ) : null}

          {items.length > 0 ? (
            <ul className="space-y-3" aria-label="Conversations structure">
              {items.map((item) => (
                <li key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.appointment?.serviceName || 'Service'} - {formatDate(item.appointment?.startsAt)}
                      </p>
                      <p className="text-sm text-slate-700">{item.lastMessagePreview || 'Aucun message'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Dernier message: {formatDate(item.lastMessageAt)}</p>
                      <Link
                        to={`/pro/messages/${encodeURIComponent(item.id)}`}
                        className="mt-2 inline-flex rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
                      >
                        Ouvrir
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
