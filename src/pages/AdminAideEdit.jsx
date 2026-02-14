import { useState, useEffect } from 'react';
import { adminClient as client } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EntityHistory from '@/components/admin/EntityHistory';

const CATEGORIES = [
  'logement', 'sante', 'handicap', 'emploi', 'famille',
  'budget', 'mobilite', 'justice', 'numerique', 'etrangers',
  'isolement', 'lgbtqia', 'vieillissement', 'autre'
];

export default function AdminAideEdit() {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const aideId = routeId && routeId !== 'new' ? routeId : queryId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    departments: ['67', '68'],
    summary_falc: '',
    content_falc: {
      cest_quoi: '',
      pour_qui: '',
      ce_que_ca_aide: ''
    },
    documents_needed: [],
    steps: [],
    how_to_apply: { texte: '', liens: [] },
    delai_indicatif: '',
    source_urls: [],
    verified_at: new Date().toISOString().split('T')[0],
    status: 'NeedsReview'
  });

  const { data: aide, isLoading } = useQuery({
    queryKey: ['aide', aideId],
    queryFn: () => client.entities.Aide.filter({ id: aideId }),
    enabled: !!aideId,
  });

  useEffect(() => {
    if (aide && aide.length > 0) {
      setFormData(aide[0]);
    }
  }, [aide]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (aideId) {
        return client.entities.Aide.update(aideId, data);
      } else {
        return client.entities.Aide.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-aides'] });
      navigate(createPageUrl('AdminAides'));
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl('AdminAides'))} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {aideId ? 'Modifier l\'aide' : 'Nouvelle aide'}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Informations de base */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="summary">Résumé court (FALC) *</Label>
              <Textarea
                id="summary"
                rows={2}
                value={formData.summary_falc}
                onChange={(e) => setFormData({ ...formData, summary_falc: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contenu FALC */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Contenu FALC</h3>
            <div>
              <Label>C'est quoi ?</Label>
              <Textarea
                rows={3}
                value={formData.content_falc?.cest_quoi || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_falc: { ...formData.content_falc, cest_quoi: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>Pour qui ?</Label>
              <Textarea
                rows={3}
                value={formData.content_falc?.pour_qui || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_falc: { ...formData.content_falc, pour_qui: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>Ce que ça aide</Label>
              <Textarea
                rows={3}
                value={formData.content_falc?.ce_que_ca_aide || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  content_falc: { ...formData.content_falc, ce_que_ca_aide: e.target.value }
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Démarches */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Où faire la demande</h3>
            <div>
              <Label>Texte explicatif</Label>
              <Textarea
                rows={2}
                value={formData.how_to_apply?.texte || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  how_to_apply: { ...formData.how_to_apply, texte: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>Délai indicatif</Label>
              <Input
                value={formData.delai_indicatif || ''}
                onChange={(e) => setFormData({ ...formData, delai_indicatif: e.target.value })}
                placeholder="Ex: 2 à 3 mois"
              />
            </div>
          </CardContent>
        </Card>

        {/* Métadonnées */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Métadonnées</h3>
            <div>
              <Label>Date de vérification</Label>
              <Input
                type="date"
                value={formData.verified_at || ''}
                onChange={(e) => setFormData({ ...formData, verified_at: e.target.value })}
              />
            </div>
            <div>
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="NeedsReview">À vérifier</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate(createPageUrl('AdminAides'))}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>

        {/* Historique (uniquement en édition) */}
        {aideId && (
          <Card>
            <CardContent className="p-6">
              <EntityHistory
                entityType="Aide"
                entityId={aideId}
                onRestored={() => queryClient.invalidateQueries({ queryKey: ['aide', aideId] })}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
