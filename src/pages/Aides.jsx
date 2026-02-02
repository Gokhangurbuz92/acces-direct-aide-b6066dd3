import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/search/SearchBar';
import AideCard from '@/components/cards/AideCard';
import SEO from '@/components/SEO';
import { Loader2, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import EmptyState from '@/components/feedback/EmptyState';
import { trackBusinessEvent } from '@/utils/analytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Theme categories based on taxonomy
const THEMES = {
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

const PUBLICS = [
  'Tous publics',
  'Personnes en situation de handicap',
  'Seniors',
  'Jeunes (16-25 ans)',
  'Familles',
  'Demandeurs d\'emploi',
  'Créateurs d\'entreprise',
  'Salariés',
  'Étudiants',
  'Retraités',
  'Personnes en précarité',
  'Aidants',
];

const TERRITOIRES = [
  { value: 'national', label: 'National' },
  { value: 'region', label: 'Grand Est' },
  { value: 'departement-67', label: 'Bas-Rhin' },
  { value: 'departement-68', label: 'Haut-Rhin' },
];

export default function Aides() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for UI toggles
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    theme: true,
    public: false,
    territoire: false,
    organisme: false,
  });

  // Parse filters from URL
  const query = searchParams.get('q') || '';
  const theme = searchParams.get('theme') || '';
  const sousTheme = searchParams.get('sousTheme') || '';
  const publicFilter = searchParams.get('public') || '';
  const territoire = searchParams.get('territoire') || '';
  const organisme = searchParams.get('organisme') || '';
  const urgent = searchParams.get('urgent') === 'true';
  const statut = searchParams.get('statut') || 'publie';
  const sort = searchParams.get('sort') || 'pertinence';
  const page = searchParams.get('page') || '1';

  // Fetch Aides (using new API contract)
  const { data, isLoading, error } = useQuery({
    queryKey: ['aides', { query, theme, sousTheme, publicFilter, territoire, organisme, urgent, statut, sort, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (theme) params.set('theme', theme);
      if (sousTheme) params.set('sousTheme', sousTheme);
      if (publicFilter) params.set('public', publicFilter);
      if (territoire) params.set('territoire', territoire);
      if (organisme) params.set('organisme', organisme);
      if (urgent) params.set('urgent', 'true');
      params.set('statut', statut);
      params.set('sort', sort);
      params.set('page', page);
      params.set('limit', '12');

      const response = await fetch(`/api/aides?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des aides');
      }
      return response.json();
    },
    retry: 1,
  });

  // Tracking: Zero Results
  useEffect(() => {
    if (!isLoading && data && data.items && data.items.length === 0) {
      trackBusinessEvent('SEARCH_ZERO_RESULTS', {
        query,
        theme,
        publicFilter,
        territoire,
      });
    }
  }, [isLoading, data, query, theme, publicFilter, territoire]);

  const aides = data?.items || [];
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getTitle = () => {
    if (theme) {
      return `Aides - ${THEMES[theme] || theme}`;
    }
    return 'Catalogue des aides';
  };

  const getDescription = () => {
    if (theme) {
      return `Découvrez toutes les aides sociales et dispositifs pour ${THEMES[theme] || theme}.`;
    }
    return 'Parcourez le catalogue complet des aides sociales et dispositifs d\'accompagnement disponibles.';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title={getTitle()} description={getDescription()} path="/aides" />

      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap hidden lg:block">
            {getTitle()}
          </h1>
          <div className="flex-1">
            <SearchBar
              key={query}
              onSearch={(p) => handleFilterChange('q', p.query)}
              initialValue={query}
              placeholder="Rechercher une aide..."
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

      {/* Theme Facets Block (above content) */}
      {!theme && !query && (
        <div className="bg-white border-b border-slate-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Parcourir par thème</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(THEMES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange('theme', key)}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 text-center">
                    {label}
                  </span>
                  {facets?.themes?.[key] && (
                    <span className="text-xs text-slate-400 mt-1">{facets.themes[key]} aides</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`
            fixed inset-0 z-20 bg-white p-6 md:relative md:bg-transparent md:p-0 md:block w-80 shrink-0
            ${isFilterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            transition-transform duration-200 ease-in-out overflow-y-auto
          `}>
            <div className="flex items-center justify-between mb-6 md:hidden">
              <h2 className="text-xl font-bold">Filtres</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Theme Filter */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleSection('theme')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3"
                >
                  <span>Thème</span>
                  {expandedSections.theme ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSections.theme && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleFilterChange('theme', '')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!theme ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Tous les thèmes
                    </button>
                    {Object.entries(THEMES).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleFilterChange('theme', key)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${theme === key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Public Filter */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleSection('public')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3"
                >
                  <span>Public</span>
                  {expandedSections.public ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSections.public && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleFilterChange('public', '')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!publicFilter ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Tous publics
                    </button>
                    {PUBLICS.map((pub) => (
                      <button
                        key={pub}
                        onClick={() => handleFilterChange('public', pub)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${publicFilter === pub ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {pub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Territoire Filter */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleSection('territoire')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3"
                >
                  <span>Territoire</span>
                  {expandedSections.territoire ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSections.territoire && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleFilterChange('territoire', '')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!territoire ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Tous territoires
                    </button>
                    {TERRITOIRES.map((terr) => (
                      <button
                        key={terr.value}
                        onClick={() => handleFilterChange('territoire', terr.value)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${territoire === terr.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {terr.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Organisme Filter */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleSection('organisme')}
                  className="w-full flex items-center justify-between text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3"
                >
                  <span>Organisme</span>
                  {expandedSections.organisme ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSections.organisme && facets?.organismes && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleFilterChange('organisme', '')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!organisme ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Tous organismes
                    </button>
                    {facets.organismes.map((org) => (
                      <button
                        key={org}
                        onClick={() => handleFilterChange('organisme', org)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${organisme === org ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {org}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Urgent Filter */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={urgent}
                    onChange={(e) => handleFilterChange('urgent', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Aides urgentes uniquement</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Active Filters Bar */}
            {(theme || publicFilter || territoire || organisme || query || urgent) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-slate-500 mr-2">Filtres actifs :</span>
                {theme && <Badge variant="secondary" className="pl-3 pr-2 py-1">Thème : {THEMES[theme]} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('theme', '')} /></Badge>}
                {publicFilter && <Badge variant="secondary" className="pl-3 pr-2 py-1">Public : {publicFilter} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('public', '')} /></Badge>}
                {territoire && <Badge variant="secondary" className="pl-3 pr-2 py-1">Territoire : {TERRITOIRES.find(t => t.value === territoire)?.label} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('territoire', '')} /></Badge>}
                {organisme && <Badge variant="secondary" className="pl-3 pr-2 py-1">Organisme : {organisme} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('organisme', '')} /></Badge>}
                {query && <Badge variant="secondary" className="pl-3 pr-2 py-1">Recherche : {query} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('q', '')} /></Badge>}
                {urgent && <Badge variant="destructive" className="pl-3 pr-2 py-1">Urgent <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleFilterChange('urgent', '')} /></Badge>}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-blue-600">Tout effacer</Button>
              </div>
            )}

            {/* Results count */}
            {data && !isLoading && (
              <div className="text-sm text-slate-600 mb-4">
                {data.total} aide{data.total > 1 ? 's' : ''} trouvée{data.total > 1 ? 's' : ''}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 font-medium">Une erreur est survenue</p>
                <p className="text-sm text-red-600 mt-1">{error.message}</p>
                <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                  Réessayer
                </Button>
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
                {data.totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    <Button
                      variant="outline"
                      disabled={data.page <= 1}
                      onClick={() => handleFilterChange('page', String(data.page - 1))}
                    > Précédent </Button>
                    <span className="flex items-center px-4 text-sm text-slate-600">
                      Page {data.page} sur {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={data.page >= data.totalPages}
                      onClick={() => handleFilterChange('page', String(data.page + 1))}
                    > Suivant </Button>
                  </div>
                )}
              </>
            ) : !error ? (
              <EmptyState
                title="Aucune aide trouvée"
                message="Essayez de modifier vos filtres ou d'élargir votre recherche."
                actionLabel="Réinitialiser les filtres"
                onAction={clearFilters}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
