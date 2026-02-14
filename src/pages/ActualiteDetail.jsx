import React from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import { generateActualiteSchema, generateBreadcrumbSchema } from '@/utils/schema';
import SourceTraceability from '@/components/SourceTraceability';
import FalcSummary from '@/components/FalcSummary';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Star,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';

const TYPE_ICONS = {
  nouveaute: Star,
  modification: RefreshCw,
  alerte: AlertTriangle,
  info: Info,
};

const TYPE_COLORS = {
  nouveaute: 'bg-green-100 text-green-800',
  modification: 'bg-blue-100 text-blue-800',
  alerte: 'bg-red-100 text-red-800',
  info: 'bg-slate-100 text-slate-800',
};

const CATEGORIES = {
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
  general: 'Général',
};

export default function ActualiteDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const identifier = slug || id;

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['actualite', identifier],
    queryFn: () => client.entities.Actualite.filter(slug ? { slug } : { id }),
    enabled: !!identifier
  });

  const actu = Array.isArray(queryData)
    ? queryData[0]
    : (queryData?.items ? queryData?.items[0] : queryData);

  // Canonical Redirect: If accessed via ID but slug exists, redirect to slug URL
  React.useEffect(() => {
    if (actu && !slug && actu.slug) {
      navigate(`/actualites/${actu.slug}`, { replace: true });
    }
  }, [actu, slug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!actu) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Cette actualité n'existe pas ou a été supprimée.</p>
          <Link to={createPageUrl('Actualites')}>
            <Button>Retour aux actualités</Button>
          </Link>
        </div>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[actu.type_actu] || Info;

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: 'Actualités', url: '/actualites' },
    { name: actu.titre, url: `/actualites/${actu.slug}` }
  ];

  const schema = [
    generateBreadcrumbSchema(breadcrumbs),
    generateActualiteSchema(actu)
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={actu.titre}
        description={actu.summary_falc || actu.contenu?.substring(0, 150)}
        path={`/actualites/${actu.slug}`}
        schema={schema}
      />

      {/* Fil d'Ariane */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <Link to={createPageUrl('Home')} className="hover:text-blue-600">Accueil</Link>
            <span className="text-slate-400">/</span>
            <Link to={createPageUrl('Actualites')} className="hover:text-blue-600">Actualités</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 line-clamp-1">{actu.titre}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to={createPageUrl('Actualites')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux actualités
        </Link>

        <Card className={`mb-6 ${actu.est_important ? 'border-l-4 border-l-blue-500' : ''}`}>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={TYPE_COLORS[actu.type_actu] || 'bg-slate-100 text-slate-800'}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {actu.type_actu === 'nouveaute' ? 'Nouveauté' :
                  actu.type_actu === 'modification' ? 'Modification' :
                    actu.type_actu === 'alerte' ? 'Alerte' : 'Information'}
              </Badge>
              {actu.categorie && (
                <Badge variant="outline">
                  {CATEGORIES[actu.categorie] || actu.categorie}
                </Badge>
              )}
              {actu.est_important && (
                <Badge className="bg-amber-100 text-amber-800">
                  Important
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
              {actu.titre}
            </h1>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-4 border-b border-slate-100">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(actu.date_publication).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              {actu.source_nom && (
                <span>Source : {actu.source_nom}</span>
              )}
            </div>

            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
              {actu.contenu}
            </div>
          </CardContent>
        </Card>

        {/* FALC Summary */}
        <FalcSummary text={actu?.summary_falc} />

        {/* Traçabilité de la source */}
        <SourceTraceability
          source_url={actu.source_url}
          retrieved_at={actu.retrieved_at || actu.fetched_at}
          last_checked_at={actu.last_checked_at}
          source_last_modified={actu.source_last_modified}
        />
      </div>
    </div>
  );
}
