import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import SEO from '@/components/SEO';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  ExternalLink,
  AlertTriangle,
  Info,
  RefreshCw,
  Star,
  Loader2,
  Newspaper,
  ArrowRight
} from 'lucide-react';
import NewsFallback from '@/components/news/NewsFallback';

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

const ITEMS_PER_PAGE = 10;

export default function Actualites() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedCategory = searchParams.get('categorie') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data: response = {}, isLoading } = useQuery({
    queryKey: ['actualites'],
    queryFn: () => client.entities.Actualite.filter({ statut: 'publie' }, '-date_publication'),
  });

  const actualites = Array.isArray(response) ? response : (response.items || []);

  // Client-side filtering and pagination
  const filteredActualites = selectedCategory
    ? actualites.filter(a => a.categorie === selectedCategory)
    : actualites;

  const totalPages = Math.ceil(filteredActualites.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedActualites = filteredActualites.slice(startIndex, endIndex);

  const handleCategoryChange = (category) => {
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set('categorie', category);
    } else {
      newParams.delete('categorie');
    }
    newParams.set('page', '1'); // Reset to page 1 when changing category
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Actualités"
        description="Les dernières informations sur les aides et les droits pour les personnes en situation de précarité."
        path="/actualites"
      />
      {/* En-tête */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Actualités
          </h1>
          <p className="text-slate-600 mb-6">
            Les dernières informations sur les aides et les droits
          </p>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('')}
            >
              Toutes
            </Button>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : paginatedActualites.length > 0 ? (
          <>
            <div className="space-y-6">
              {paginatedActualites.map((actu) => {
                const TypeIcon = TYPE_ICONS[actu.type_actu] || Info;
                const linkUrl = actu.slug
                  ? `/actualites/${actu.slug}`
                  : `/actualites/view?id=${actu.id}`;

                return (
                  <Card key={actu.id} className={`group hover:shadow-lg transition-all relative ${actu.est_important ? 'border-l-4 border-l-blue-500' : ''}`} data-testid="actualite-card">
                    {/* Overlay Link */}
                    <Link
                      to={linkUrl}
                      className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
                      aria-label={`Lire l'actualité ${actu.titre}`}
                    >
                      <span className="sr-only">Lire l'actualité {actu.titre}</span>
                    </Link>

                    <CardContent className="p-6">
                      <div className="flex flex-wrap gap-2 mb-3">
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

                      <div className="block mb-3">
                        <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors" data-testid="actualite-title">
                          {actu.titre}
                        </h2>
                      </div>

                      <p className="text-slate-600 mb-4 leading-relaxed line-clamp-3">
                        {actu.summary_falc || actu.contenu}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 relative z-20">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
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

                        <div className="flex items-center gap-4">
                          {actu.source_url && (
                            <a
                              href={actu.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Source
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <span className="text-blue-600 group-hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors">
                            Lire la suite
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Précédent
                </Button>
                <span className="flex items-center px-4 text-sm font-medium">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        ) : (
          <NewsFallback />
        )}
      </div>
    </div>
  );
}
