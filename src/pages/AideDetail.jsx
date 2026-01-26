import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import NotFound from "./NotFound";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Flag
} from 'lucide-react';

const CATEGORIE_LABELS = {
  logement: 'Logement',
  sante: 'Santé',
  handicap: 'Handicap',
  emploi: 'Emploi',
  famille: 'Famille',
  budget: 'Budget',
  mobilite: 'Mobilité',
  justice: 'Justice',
  numerique: 'Numérique',
  etrangers: 'Nouveaux arrivants',
  isolement: 'Isolement',
  lgbtqia: 'LGBTQIA+',
  vieillissement: 'Autonomie',
};

export default function AideDetail() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const aideId = urlParams.get('id');

  const { data: aide, isLoading, error } = useQuery({
    queryKey: ['aide', slug || aideId],
    queryFn: () => client.entities.Aide.filter(slug ? { slug } : { id: aideId }),
    enabled: !!slug || !!aideId
  });

  const { data: structuresData } = useQuery({
    queryKey: ['structures-aide', aide?.categorie],
    queryFn: () => client.entities.Structure.filter({
      statut: 'actif'
    }, '-created_date', 5),
    enabled: !!aide?.categorie
  });

  const structures = structuresData?.items || [];

  const filteredStructures = structures.filter(s =>
    s.categories_aidees?.includes(aide?.categorie)
  ).slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!aide) {
    return <NotFound />;
  }

  const getTerritoireLabel = () => {
    if (!aide.territoires?.length) return 'Non précisé';
    if (aide.territoires.includes('national')) return 'France entière';
    return aide.territoires.map(t => {
      if (t === '67') return 'Bas-Rhin (67)';
      if (t === '68') return 'Haut-Rhin (68)';
      return t;
    }).join(', ');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={aide.titre}
        description={aide.summary_falc || aide.cest_quoi?.substring(0, 150)}
        url={`https://www.accesdirectaide.fr/aide/${aide.slug}`}
      />
      {/* Fil d'Ariane */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={createPageUrl('Aides')} className="hover:text-blue-600">Aides</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900">{aide.titre}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Retour */}
        <Link
          to={createPageUrl('Aides')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux aides
        </Link>

        {/* En-tête */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-blue-100 text-blue-800">
              {CATEGORIE_LABELS[aide.categorie] || aide.categorie}
            </Badge>
            {aide.est_urgent && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Urgence
              </Badge>
            )}
            {aide.sources?.some(s => s.type === 'officielle') && (
              <Badge variant="outline" className="text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Source officielle
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            {aide.titre}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {getTerritoireLabel()}
            </span>
            {aide.date_verification && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Vérifié le {new Date(aide.date_verification).toLocaleDateString('fr-FR')}
              </span>
            )}
            {aide.delai_indicatif && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {aide.delai_indicatif}
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* C'est quoi ? */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">C'est quoi ?</h2>
                <p className="text-slate-700 leading-relaxed">{aide.cest_quoi}</p>
              </CardContent>
            </Card>

            {/* Pour qui ? */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Pour qui ?</h2>
                <p className="text-slate-700 leading-relaxed">{aide.pour_qui}</p>
              </CardContent>
            </Card>

            {/* Ce que ça aide */}
            {aide.ce_que_ca_aide && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Ce que ça peut aider</h2>
                  <p className="text-slate-700 leading-relaxed">{aide.ce_que_ca_aide}</p>
                </CardContent>
              </Card>
            )}

            {/* Documents nécessaires */}
            {aide.documents_necessaires?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">
                    <FileText className="inline h-5 w-5 mr-2" />
                    Documents à préparer
                  </h2>
                  <ul className="space-y-2">
                    {aide.documents_necessaires.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Étapes */}
            {aide.etapes?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Étapes de la demande</h2>
                  <div className="space-y-4">
                    {aide.etapes.map((etape, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                          {etape.numero || idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{etape.titre}</h3>
                          <p className="text-slate-600 text-sm mt-1">{etape.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Où faire la demande */}
            {aide.ou_demander && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Où faire la demande ?</h2>
                  <p className="text-slate-700 mb-4">{aide.ou_demander}</p>
                  {aide.lien_demande && (
                    <Button asChild>
                      <a href={aide.lien_demande} target="_blank" rel="noopener noreferrer">
                        Faire ma demande
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {aide.sources?.length > 0 && (
              <Card className="bg-slate-50">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Sources</h2>
                  <ul className="space-y-2">
                    {aide.sources.map((source, idx) => (
                      <li key={idx}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {source.nom}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="text-xs text-slate-500 ml-2">
                          ({source.type === 'officielle' ? 'Source officielle' : 'Explication'})
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {aide.lien_demande && (
                  <Button className="w-full" asChild>
                    <a href={aide.lien_demande} target="_blank" rel="noopener noreferrer">
                      Faire ma demande
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger en PDF (ou imprimer)
                </Button>
                <Link to={createPageUrl('Contact') + `?page=${encodeURIComponent(window.location.href)}&sujet=signalement_erreur`}>
                  <Button variant="ghost" className="w-full text-slate-600">
                    <Flag className="mr-2 h-4 w-4" />
                    Signaler une erreur
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Structures locales */}
            {filteredStructures.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 mb-4">
                    Structures qui peuvent vous aider
                  </h3>
                  <div className="space-y-3">
                    {filteredStructures.map((struct) => (
                      <Link
                        key={struct.id}
                        to={struct.slug ? `/structures/${struct.slug}` : `/structures/view?id=${struct.id}`}
                        className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <p className="font-medium text-slate-900">{struct.nom}</p>
                        <p className="text-sm text-slate-600">{struct.ville}</p>
                      </Link>
                    ))}
                  </div>
                  <Link to="/structures">
                    <Button variant="link" className="mt-4 p-0">
                      Voir toutes les structures
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}