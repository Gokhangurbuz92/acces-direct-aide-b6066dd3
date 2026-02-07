import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/search/SearchBar';
import AideCard from '@/components/cards/AideCard';
import SEO from '@/components/SEO';
import { Loader2, Filter, X } from 'lucide-react';
import EmptyState from '@/components/feedback/EmptyState';
import { trackBusinessEvent } from '@/utils/analytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Aides() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for UI toggles
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Parse filters from URL
  const query = searchParams.get('q') || '';
  // Support 'theme', 'category' (legacy), and 'categorie' (fr)
  const theme = searchParams.get('theme') || searchParams.get('category') || searchParams.get('categorie') || (window.location.pathname.startsWith('/categories/') ? slug : '');
  const situation = searchParams.get('situation') || (window.location.pathname.startsWith('/situations/') ? slug : '');
  const geo = searchParams.get('territoire') || searchParams.get('geo') || '';
  const audience = searchParams.get('public') || '';
  const provider = searchParams.get('organisme') || '';
  const urgent = searchParams.get('urgent') || '';
  const page = searchParams.get('page') || '1';

  // Fetch Taxonomy for filters (Static base)
  const { data: taxonomy } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: () => client.taxonomy.get(),
  });

  // Fetch Aides (Server-side)
  const { data, isLoading } = useQuery({
    queryKey: ['aides', { query, theme, situation, geo, audience, provider, urgent, page }],
    queryFn: () => client.entities.Aide.filter({
      q: query,
      theme,
      situation,
      territoire: geo,
      public: audience,
      organisme: provider,
      urgent,
      page,
      pageSize: 12
    }),
  });

  // Tracking: Zero Results
  useEffect(() => {
    if (!isLoading && data && data.items && data.items.length === 0) {
      trackBusinessEvent('SEARCH_ZERO_RESULTS', {
        query,
        theme,
        situation,
        geo
      });
    }
  }, [isLoading, data, query, theme, situation, geo]);

  const aides = data?.items || [];
  const pagination = data?.pagination || {};
  const facets = data?.facets || {};

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const getTitle = () => {
    if (theme && taxonomy) {
      const cat = taxonomy.categories.find(c => c.slug === theme);
      if (cat) return `Aides - ${cat.label}`;
    }
    return 'Catalogue des aides';
  };

  const getDescription = () => {
    return 'Parcourez le catalogue complet des aides sociales et dispositifs d\'accompagnement disponibles.';
  };

  const currentPath = theme ? `/categories/${theme}` : '/aides';

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title={getTitle()} description={getDescription()} path={currentPath} />

      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap hidden lg:block">
            {getTitle()}
          </h1>
          <div className="flex-1">
            <SearchBar
              key={query} // Force remount when query changes from URL
              onSearch={(p) => handleFilterChange('q', p.query)}
              initialValue={query}
              compact
            />
          </div>
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`
            fixed inset-0 z-20 bg-white p-6 md:relative md:bg-transparent md:p-0 md:block w-72 shrink-0
            ${isFilterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            transition-transform duration-200 ease-in-out
          `}>
            <div className="flex items-center justify-between mb-6 md:hidden">
              <h2 className="text-xl font-bold">Filtres</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-8">
              {/* Thèmes (Facets or Taxonomy) */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Thèmes</h3>
                <div className="space-y-1">
                  <button onClick={() => handleFilterChange('theme', '')} className={`w-full text-left text-sm px-2 py-1.5 rounded ${!theme ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}>Tous</button>
                  {(Object.keys(facets.themes || {}).length > 0 ? Object.entries(facets.themes || {}) : (taxonomy?.categories || []).map(c => [c.slug, c.count])).map(([slug, count]) => (
                     <button
                       key={slug}
                       onClick={() => handleFilterChange('theme', slug)}
                       className={`w-full text-left text-sm px-2 py-1.5 rounded flex justify-between ${theme === slug ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                     >
                       <span className="truncate">{slug}</span> {/* TODO: Map slug to Label using taxonomy */}
                       <span className="text-xs text-slate-400 ml-2">{count}</span>
                     </button>
                  ))}
                </div>
              </div>

              {/* Territoires */}
              {facets.territoires && Object.keys(facets.territoires).length > 0 && (
                <div>
                   <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Territoires</h3>
                   <div className="space-y-1">
                      {Object.entries(facets.territoires).map(([t, count]) => (
                        <button
                          key={t}
                          onClick={() => handleFilterChange('territoire', t)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded flex justify-between ${geo === t ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="truncate">{t}</span>
                          <span className="text-xs text-slate-400 ml-2">{count}</span>
                        </button>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Active Filters Bar */}
            {(theme || geo || query) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-slate-500 mr-2">Filtres actifs :</span>
                {theme && <Badge variant="secondary" className="pl-3 pr-2 py-1">Thème : {theme} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('theme', '')} /></Badge>}
                {geo && <Badge variant="secondary" className="pl-3 pr-2 py-1">Territoire : {geo} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('territoire', '')} /></Badge>}
                {query && <Badge variant="secondary" className="pl-3 pr-2 py-1">Recherche : {query} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('q', '')} /></Badge>}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-blue-600">Tout effacer</Button>
              </div>
            )}

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm border border-slate-100" />
                ))}
              </div>
            ) : aides.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aides.map((aide) => (
                    <AideCard key={aide.id} aide={aide} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    <Button
                      variant="outline"
                      disabled={pagination.page <= 1}
                      onClick={() => handleFilterChange('page', pagination.page - 1)}
                    > Précédent </Button>
                    <span className="flex items-center px-4 text-sm text-slate-600">
                      Page {pagination.page} sur {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handleFilterChange('page', pagination.page + 1)}
                    > Suivant </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="Aucune aide trouvée"
                message="Essayez de modifier vos filtres ou d'élargir votre recherche. Vous pouvez aussi consulter l'annuaire des structures."
                actionLabel="Réinitialiser les filtres"
                onAction={clearFilters}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}