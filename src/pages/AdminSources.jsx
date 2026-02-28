import { useState } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminSources() {
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'RSS',
    url: '',
    trust_level: 'officiel',
    status: 'actif',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['sources-admin'],
    queryFn: () => client.entities.Source.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => client.entities.Source.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources-admin'] });
      setShowAdd(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.Source.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources-admin'] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.entities.Source.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources-admin'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'RSS',
      url: '',
      trust_level: 'officiel',
      status: 'actif',
      notes: ''
    });
  };

  const handleEdit = (source) => {
    setEditingId(source.id);
    setFormData({
      name: source.name || '',
      type: source.type || 'RSS',
      url: source.url || '',
      trust_level: source.trust_level || 'officiel',
      status: source.status || 'actif',
      notes: source.notes || ''
    });
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette source ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Gestion des sources
            </h1>
            <p className="text-slate-600">
              Sources officielles pour la synchronisation automatique
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une source
          </Button>
        </div>

        {/* Formulaire ajout/édition */}
        {(showAdd || editingId) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Modifier' : 'Ajouter'} une source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminsourc-f1">Nom</Label>
                <Input id="adminsourc-f1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Service-Public.fr RSS"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminsourc-f2">Type</Label>
                  <Select id="adminsourc-f2"
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RSS">RSS</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="Site officiel">Site officiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="adminsourc-f3">Niveau de confiance</Label>
                  <Select id="adminsourc-f3"
                    value={formData.trust_level}
                    onValueChange={(value) => setFormData({ ...formData, trust_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="officiel">Officiel</SelectItem>
                      <SelectItem value="vérifié">Vérifié</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="adminsourc-f4">URL</Label>
                <Input id="adminsourc-f4"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="adminsourc-f5">Statut</Label>
                <Select id="adminsourc-f5"
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="adminsourc-f6">Notes</Label>
                <Textarea id="adminsourc-f6"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                  resetForm();
                }}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {sources.length} sources configurées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : sources.length > 0 ? (
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${source.status === 'actif' ? 'bg-green-100' : 'bg-slate-100'
                      }`}>
                      {source.status === 'actif' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{source.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{source.url}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline">{source.type}</Badge>
                        <Badge className={
                          source.trust_level === 'officiel'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }>
                          {source.trust_level}
                        </Badge>
                        {source.last_sync && (
                          <span className="text-xs text-slate-500">
                            Sync: {format(new Date(source.last_sync), 'dd/MM à HH:mm', { locale: fr })}
                          </span>
                        )}
                      </div>
                      {source.notes && (
                        <p className="text-xs text-slate-500 mt-2">{source.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(source)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(source.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">
                Aucune source configurée
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}