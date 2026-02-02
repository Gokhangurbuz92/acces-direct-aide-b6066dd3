import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  Flag,
  Building2,
  Info
} from 'lucide-react';
import { generateBreadcrumbSchema, generateAideSchema } from '@/utils/schema';

const THEME_LABELS = {
  EMPLOI: 'Emploi et Formation',
  LOGEMENT: 'Logement',
  SANTE: 'Santé',
  FAMILLE: 'Famille et Enfance',
  SOCIAL: 'Solidarité et Inclusion',
  MOBILITE: 'Mobilité et Transport',
  CULTURE: 'Culture et Loisirs',
  SENIORS: 'Seniors',
  JEUNESSE: 'Jeunesse',
  HANDICAP: 'Handicap',
};

export default function AideDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['aide-detail', slug],
    queryFn: async () => {
      const response = await fetch(`/api/aides/${slug}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Aide non trouvée');
        throw new Error('Erreur lors du chargement de l\'aide');
      }
      return response.json();
    },
    enabled: !!slug,
    retry: 1,
  });

  const aide = data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !aide) {
    return <NotFound />;
  }

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: 'Aides', url: '/aides' },
    { name: aide.titre, url: `/aides/${aide.slug}` }
  ];

  const schema = [
    generateBreadcrumbSchema(breadcrumbs),
    generateAideSchema(aide)
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={aide.titre}
        description={aide.summary_falc || aide.description?.substring(0, 150)}
        path={`/aides/${aide.slug}`}
        schema={schema}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600" aria-label="Fil d'Ariane">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link to={createPageUrl('Aides')} className="hover:text-blue-600">Aides</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-slate-900">{aide.titre}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          to={createPageUrl('Aides')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux aides
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {aide.theme && (
              <Badge className="bg-blue-100 text-blue-800">
                {THEME_LABELS[aide.theme] || aide.theme}
              </Badge>
            )}
            {aide.sous_theme && (
              <Badge variant="outline">
                {aide.sous_theme}
              </Badge>
            )}
            {aide.urgent && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
            {aide.source_url && (
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
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {aide.territoire_label || 'Non précisé'}
            </span>
            {aide.providerName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {aide.providerName}
              </span>
            )}
            {aide.fetched_at && (
              <span className="flex items-center gap-1" title="Date de dernière collecte">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Actualisé le {new Date(aide.fetched_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          {aide.summary_falc && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Résumé Facile À Lire et à Comprendre (FALC)
              </p>
              <p className="text-blue-800">{aide.summary_falc}</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {aide.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Description</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aide.description}</p>
                </CardContent>
              </Card>
            )}

            {/* À qui s'adresse cette aide ? */}
            {(aide.public?.length > 0 || aide.conditions) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">À qui s'adresse cette aide ?</h2>
                  {aide.public?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-600 mb-2">Public concerné :</p>
                      <div className="flex flex-wrap gap-2">
                        {aide.public.map((pub, idx) => (
                          <Badge key={idx} variant="secondary">{pub}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {aide.conditions && (
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Conditions d'éligibilité :</p>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aide.conditions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Ce que ça apporte */}
            {aide.montant_avantage && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Ce que ça apporte</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aide.montant_avantage}</p>
                </CardContent>
              </Card>
            )}

            {/* Étapes / Comment faire */}
            {aide.steps && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Comment faire ?</h2>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aide.steps}</p>
                  </div>
                  {aide.falc_steps && (
                    <div className="mt-4 p-4 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-2">Étapes simplifiées (FALC)</p>
                      <p className="text-blue-800 whitespace-pre-line">{aide.falc_steps}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pièces à fournir */}
            {aide.pieces_a_fournir && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                    Pièces à fournir
                  </h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aide.pieces_a_fournir}</p>
                </CardContent>
              </Card>
            )}

            {/* Contacts */}
            {aide.contacts && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Contact</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aide.contacts}</p>
                </CardContent>
              </Card>
            )}

            {/* Source officielle */}
            {aide.source_url && (
              <Card className="bg-slate-50 border-slate-300">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Source officielle</h2>
                  <a
                    href={aide.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2 break-all"
                  >
                    {aide.source_url}
                    <ExternalLink className="h-4 w-4 flex-shrink-0" aria-label="Ouvre dans un nouvel onglet" />
                  </a>
                  {aide.source_last_modified && (
                    <p className="text-xs text-slate-500 mt-2">
                      Dernière modification de la source : {new Date(aide.source_last_modified).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {aide.apply_url && aide.apply_url !== aide.source_url && (
                  <Button className="w-full" asChild>
                    <a href={aide.apply_url} target="_blank" rel="noopener noreferrer">
                      Faire la demande
                      <ExternalLink className="ml-2 h-4 w-4" aria-label="Ouvre dans un nouvel onglet" />
                    </a>
                  </Button>
                )}
                {aide.source_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={aide.source_url} target="_blank" rel="noopener noreferrer">
                      Consulter la source
                      <ExternalLink className="ml-2 h-4 w-4" aria-label="Ouvre dans un nouvel onglet" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Imprimer / PDF
                </Button>
                <Button variant="ghost" className="w-full text-slate-600" asChild>
                  <Link to={createPageUrl('Contact') + `?page=${encodeURIComponent(window.location.href)}&sujet=signalement_erreur`}>
                    <Flag className="mr-2 h-4 w-4" aria-hidden="true" />
                    Signaler une erreur
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="bg-slate-50">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-3">Informations</h3>
                <dl className="space-y-2 text-sm">
                  {aide.providerName && (
                    <>
                      <dt className="text-slate-600 font-medium">Organisme</dt>
                      <dd className="text-slate-900 mb-2">{aide.providerName}</dd>
                    </>
                  )}
                  {aide.territoire_label && (
                    <>
                      <dt className="text-slate-600 font-medium">Territoire</dt>
                      <dd className="text-slate-900 mb-2">{aide.territoire_label}</dd>
                    </>
                  )}
                  {aide.tags?.length > 0 && (
                    <>
                      <dt className="text-slate-600 font-medium">Tags</dt>
                      <dd className="flex flex-wrap gap-1 mb-2">
                        {aide.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </dd>
                    </>
                  )}
                  {aide.fetched_at && (
                    <>
                      <dt className="text-slate-600 font-medium">Dernière collecte</dt>
                      <dd className="text-slate-900">{new Date(aide.fetched_at).toLocaleDateString('fr-FR')}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
