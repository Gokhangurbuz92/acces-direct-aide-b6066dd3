import { SkeletonList } from '@/components/ui/skeleton';
import { useState } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle,
  Loader2,
  MessageSquare,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_LABELS = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-100 text-blue-800' },
  en_cours: { label: 'En cours', color: 'bg-orange-100 text-orange-800' },
  traite: { label: 'Traité', color: 'bg-green-100 text-green-800' }
};

const SUJET_LABELS = {
  question: 'Question',
  signalement_erreur: 'Signalement d\'erreur',
  suggestion: 'Suggestion',
  partenariat: 'Partenariat',
  autre: 'Autre'
};

export default function AdminMessages() {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => client.entities.Contact.list('-created_date'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, statut, reponse }) =>
      client.entities.Contact.update(id, { statut, reponse }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      setSelectedMessage(null);
    },
  });

  const countByStatus = {
    nouveau: messages.filter(m => m.statut === 'nouveau').length,
    en_cours: messages.filter(m => m.statut === 'en_cours').length,
    traite: messages.filter(m => m.statut === 'traite').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Boîte de réception
          </h1>
          <p className="text-slate-600">
            Gérez les messages des utilisateurs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Nouveaux</p>
              <p className="text-2xl font-bold text-blue-600">{countByStatus.nouveau}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">En cours</p>
              <p className="text-2xl font-bold text-orange-600">{countByStatus.en_cours}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Traités</p>
              <p className="text-2xl font-bold text-green-600">{countByStatus.traite}</p>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        {isLoading ? <div className="p-6"><SkeletonList count={3} variant="card" /></div> : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => {
              const statusInfo = STATUS_LABELS[message.statut] || STATUS_LABELS.nouveau;
              return (
                <Card
                  key={message.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedMessage(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline">
                            {SUJET_LABELS[message.sujet] || message.sujet}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {message.nom || 'Anonyme'} ({message.email})
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(message.created_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <MessageSquare className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun message</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog détail message */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détail du message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">De :</p>
                <p className="text-slate-900">
                  {selectedMessage.nom || 'Anonyme'} ({selectedMessage.email})
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Sujet :</p>
                <p className="text-slate-900">
                  {SUJET_LABELS[selectedMessage.sujet] || selectedMessage.sujet}
                </p>
              </div>
              {selectedMessage.page_concernee && (
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Page concernée :</p>
                  <p className="text-slate-900">{selectedMessage.page_concernee}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Message :</p>
                <p className="text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                  {selectedMessage.message}
                </p>
              </div>

              {selectedMessage.reponse && (
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Réponse :</p>
                  <p className="text-slate-900 whitespace-pre-wrap bg-green-50 p-4 rounded-lg">
                    {selectedMessage.reponse}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({
                    id: selectedMessage.id,
                    statut: 'en_cours',
                    reponse: selectedMessage.reponse
                  })}
                  disabled={selectedMessage.statut === 'en_cours' || updateStatusMutation.isPending}
                >
                  Marquer en cours
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate({
                    id: selectedMessage.id,
                    statut: 'traite',
                    reponse: selectedMessage.reponse || 'Traité'
                  })}
                  disabled={selectedMessage.statut === 'traite' || updateStatusMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marquer comme traité
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
