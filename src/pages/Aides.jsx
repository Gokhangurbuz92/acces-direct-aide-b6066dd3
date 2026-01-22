import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/search/SearchBar';
import AideCard from '@/components/cards/AideCard';
import SEO from '@/components/SEO';
import { Loader2, Filter, X } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Aides() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for UI toggles
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Parse filters from URL
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || (window.location.pathname.startsWith('/categories/') ? slug : '');
  const situation = searchParams.get('situation') || (window.location.pathname.startsWith('/situations/') ? slug : '');
  const geo = searchParams.get('geo') || '';
  const page = searchParams.get('page') || '1';

  // Fetch Taxonomy for filters
  const { data: taxonomy } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: () => client.taxonomy.get(),
  });

  // Fetch Aides (Server-side)
  const { data, isLoading } = useQuery({
    queryKey: ['aides', { query, category, situation, geo, page }],
    queryFn: () => client.entities.Aide.filter({
      q: query,
      category,
      situation,
      geo,
      page,
      pageSize: 12
    }),
  });

  const aides = data?.items || [];
  const pagination = data?.pagination || {};

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const getTitle = () => {
    if (category && taxonomy) {
      const cat = taxonomy.categories.find(c => c.slug === category);
      if (cat) return `Aides - ${cat.label}`;
    }
    if (situation && taxonomy) {
      const sit = taxonomy.situations.find(s => s.slug === situation);
      if (sit) return `Aides pour : ${sit.label}`;
    }
    return 'Catalogue des aides';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title={getTitle()} description="Parcourez les aides et dispositifs disponibles." path="/aides" />

      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap hidden lg:block">
            {getTitle()}
          </h1>
          <div className="flex-1">
            <SearchBar
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
              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Catégories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${!category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Toutes les catégories
                  </button>
                  {taxonomy?.categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleFilterChange('category', cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${category === cat.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-xs text-slate-400">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Situation Filter */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Situations</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange('situation', '')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${!situation ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Toutes les situations
                  </button>
                  {taxonomy?.situations.map((sit) => (
                    <button
                      key={sit.slug}
                      onClick={() => handleFilterChange('situation', sit.slug)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${situation === sit.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>{sit.label}</span>
                      <span className="text-xs text-slate-400">{sit.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Active Filters Bar */}
            {(category || situation || query) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-slate-500 mr-2">Filtres actifs :</span>
                {category && <Badge variant="secondary" className="pl-3 pr-2 py-1">Catégorie : {category} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('category', '')} /></Badge>}
                {situation && <Badge variant="secondary" className="pl-3 pr-2 py-1">Situation : {situation} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('situation', '')} /></Badge>}
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
                message="Essayez de modifier vos filtres ou d'élargir votre recherche."
                actionLabel="Réinitialiser les filtres"
                onAction={clearFilters}
                type="search"
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}