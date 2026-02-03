import React, { useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import NotFound from "./NotFound";
import { createPageUrl } from '@/utils';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
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
  CheckCircle2,
  ChevronRight,
  Loader2,
  Flag,
  Euro,
  Lightbulb
} from 'lucide-react';
import { generateBreadcrumbSchema, generateDemarcheSchema } from '@/utils/schema';
import SourceTraceability from '@/components/SourceTraceability';
import FalcSummary from '@/components/FalcSummary';

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
  vieillissement: 'Autonomie',
};

export default function DemarcheDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const identifier = slug || id;

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['demarche', identifier],
    queryFn: () => client.entities.Demarche.filter(slug ? { slug } : { id }),
    enabled: !!identifier
  });

  // Safe unwrap: The API filter might return an array or { items: [] } depending on the implementation
  const demarche = Array.isArray(queryData)
    ? queryData[0]
    : (queryData?.items ? queryData?.items[0] : queryData);

  // Canonical Redirect: If accessed via ID but slug exists, redirect to slug URL
  useEffect(() => {
    if (demarche && !slug && demarche.slug) {
      navigate(`/demarches/${demarche.slug}`, { replace: true });
    }
  }, [demarche, slug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!demarche) {
    return <NotFound />;
  }

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: 'Démarches', url: '/demarches' },
    { name: demarche.titre, url: `/demarches/${demarche.slug}` }
  ];

  const schema = [
    generateBreadcrumbSchema(breadcrumbs),
    generateDemarcheSchema(demarche)
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={demarche.titre}
        description={demarche.description_courte}
        path={`/demarches/${demarche.slug}`}
        schema={schema}
      />
      {/* Fil d'Ariane */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={createPageUrl('Demarches')} className="hover:text-blue-600">Démarches</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900">{demarche.titre}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Retour */}
        <Link
          to={createPageUrl('Demarches')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux démarches
        </Link>

        {/* En-tête */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <Badge className="bg-blue-100 text-blue-800 mb-4">
              {CATEGORIE_LABELS[demarche.categorie] || demarche.categorie}
            </Badge>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              {demarche.titre}
            </h1>

            <p className="text-lg text-slate-600 mb-6">
              {demarche.description_courte}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {demarche.delai && (
                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4" />
                  {demarche.delai}
                </span>
              )}
              {demarche.cout && (
                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                  <Euro className="h-4 w-4" />
                  {demarche.cout}
                </span>
              )}
              {demarche.date_verification && (
                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                  <Calendar className="h-4 w-4" />
                  Vérifié le {new Date(demarche.date_verification).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* FALC Summary */}
            <FalcSummary text={demarche?.summary_falc || demarche?.description_falc || demarche?.resume_falc} />

            {/* Pour qui */}
            {demarche.pour_qui && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Pour qui ?</h2>
                  <p className="text-slate-700">{demarche.pour_qui}</p>
                </CardContent>
              </Card>
            )}

            {/* Documents nécessaires */}
            {demarche.documents_necessaires?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documents à préparer
                  </h2>
                  <ul className="space-y-3">
                    {demarche.documents_necessaires.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-slate-700">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Étapes */}
            {demarche.etapes?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">
                    Les étapes à suivre
                  </h2>
                  <div className="space-y-6">
                    {demarche.etapes.map((etape, idx) => (
                      <div key={idx} className="relative">
                        {idx < demarche.etapes.length - 1 && (
                          <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 z-10">
                            {etape.numero || idx + 1}
                          </div>
                          <div className="flex-1 pb-6">
                            <h3 className="font-semibold text-slate-900 text-lg mb-2">
                              {etape.titre}
                            </h3>
                            <p className="text-slate-600 mb-3">
                              {etape.description}
                            </p>
                            {etape.conseils && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">{etape.conseils}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Où faire */}
            {demarche.ou_faire && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Où faire cette démarche ?</h2>
                  <p className="text-slate-700 mb-4">{demarche.ou_faire}</p>
                  {demarche.lien_officiel && (
                    <Button asChild>
                      <a href={demarche.lien_officiel} target="_blank" rel="noopener noreferrer">
                        Accéder au service en ligne
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {demarche.sources?.length > 0 && (
              <Card className="bg-slate-50">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Sources</h2>
                  <ul className="space-y-2">
                    {demarche.sources.map((source, idx) => (
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
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Source Traceability */}
            <SourceTraceability 
              source_url={demarche.source_url || demarche.source_url_exact}
              retrieved_at={demarche.retrieved_at}
              last_checked_at={demarche.last_checked_at}
              source_last_modified={demarche.source_last_modified}
            />

            {/* Actions */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {demarche.lien_officiel && (
                  <Button className="w-full" asChild>
                    <a href={demarche.lien_officiel} target="_blank" rel="noopener noreferrer">
                      Commencer la démarche
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" />
                  Imprimer la fiche / PDF
                </Button>
                <Link to={createPageUrl('Contact') + `?page=${encodeURIComponent(window.location.href)}&sujet=signalement_erreur`}>
                  <Button variant="ghost" className="w-full text-slate-600">
                    <Flag className="mr-2 h-4 w-4" />
                    Signaler une erreur
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Résumé */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-3">En résumé</h3>
                <div className="space-y-3 text-sm">
                  {demarche.etapes?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <span>{demarche.etapes.length} étapes</span>
                    </div>
                  )}
                  {demarche.documents_necessaires?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>{demarche.documents_necessaires.length} documents à préparer</span>
                    </div>
                  )}
                  {demarche.delai && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{demarche.delai}</span>
                    </div>
                  )}
                  {demarche.cout && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-blue-600" />
                      <span>{demarche.cout}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}