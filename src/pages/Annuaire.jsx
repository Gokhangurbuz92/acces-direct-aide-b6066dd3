import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import SEO from '@/components/SEO';
import { client } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';
import StructureCard from '@/components/cards/StructureCard';
import { generateBreadcrumbSchema } from '@/utils/schema';

const DEFAULT_LIMIT = 12;
const LIMIT_OPTIONS = [12, 24, 48];

const TYPE_STRUCTURES = [
  { value: '', label: 'Tous les types' },
  { value: 'association', label: 'Association' },
  { value: 'service_public', label: 'Service public' },
  { value: 'etablissement_sante', label: 'Établissement de santé' },
  { value: 'mairie', label: 'Mairie' },
  { value: 'caf', label: 'CAF' },
  { value: 'mdph', label: 'MDPH' },
  { value: 'france_travail', label: 'France Travail' },
  { value: 'cpam', label: 'CPAM' },
  { value: 'ccas', label: 'CCAS' },
  { value: 'ehpad', label: 'EHPAD' },
  { value: 'france_services', label: 'France Services' },
  { value: 'carsat', label: 'CARSAT' },
  { value: 'mission_locale', label: 'Mission Locale' },
  { value: 'pmi', label: 'PMI' },
];

/** @param {unknown} value */
function parsePage(value) {
  const parsed = Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

/** @param {unknown} value */
function parseLimit(value) {
  const parsed = Number.parseInt(String(value ?? DEFAULT_LIMIT), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  if (parsed < 1) return 1;
  if (parsed > 50) return 50;
  return parsed;
}

export default function Annuaire() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const q = (searchParams.get('q') || '').trim();
  const type = (searchParams.get('type') || '').trim();
  const city = (searchParams.get('city') || '').trim();
  const departement = (searchParams.get('departement') || searchParams.get('territory') || searchParams.get('geo') || '').trim();
  const pmrRaw = (searchParams.get('pmr') || '').trim();
  const pmrEnabled = pmrRaw === '1' || pmrRaw === 'true';
  const page = parsePage(searchParams.get('page'));
  const limit = parseLimit(searchParams.get('limit') || searchParams.get('pageSize'));
  const sort = (searchParams.get('sort') || (q ? 'relevance' : 'quality')).trim();

  const [queryInput, setQueryInput] = useState(q);

  useEffect(() => {
    setQueryInput(q);
  }, [q]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['structures', { q, type, city, departement, pmr: pmrEnabled, sort, page, limit }],
    queryFn: () => client.entities.Structure.filter({
      q: q || undefined,
      type: type || undefined,
      city: city || undefined,
      departement: departement || undefined,
      pmr: pmrEnabled ? '1' : undefined,
      sort,
      page,
      limit,
    }),
  });

  const structures = data?.items || [];
  const pagination = data?.pagination || {};

  const liveMessage = useMemo(() => {
    if (isLoading || isFetching) return "Chargement de l'annuaire...";
    if (error) return "Erreur lors du chargement de l'annuaire.";
    if (!structures.length) return 'Aucune structure trouvée.';
    const total = typeof pagination.total === 'number' ? pagination.total : structures.length;
    return `${total} structure${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}.`;
  }, [isLoading, isFetching, error, structures.length, pagination.total]);

  /**
   * @param {string} key
   * @param {string} value
   */
  const handleParamChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') {
      params.set('page', '1');
    }
    setSearchParams(params);
  };

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    handleParamChange('q', queryInput.trim());
  };

  const clearFilters = () => {
    setSearchParams({});
    setIsFiltersOpen(false);
  };

  const handlePageChange = (nextPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  };

  const schema = useMemo(() => {
    return [
      generateBreadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Annuaire', url: '/annuaire' },
      ]),
    ].filter(Boolean);
  }, []);

  const hasNext = Boolean(pagination.hasNext);
  const totalPages = pagination.totalPages || 1;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <SEO
        title="Annuaire"
        description="Trouvez des structures (associations, services publics) et leurs coordonnées."
        path="/annuaire"
        schema={schema}
      />

      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Annuaire</h1>
              <p className="text-slate-600 text-sm">
                Recherchez une structure et filtrez par type ou localisation.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setIsFiltersOpen((open) => !open)}
              aria-expanded={isFiltersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filtres
            </Button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Rechercher une structure (ex: médiation numérique, CCAS...)"
                aria-label="Rechercher une structure"
                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                data-testid="structures-search-input"
              />
            </div>
            <Button type="submit" className="h-11" data-testid="structures-search-submit">
              Rechercher
            </Button>
          </form>

          {/* Filters */}
          {isFiltersOpen && (
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label htmlFor="structures-type" className="block text-sm font-semibold text-slate-900 mb-1">
                      Type
                    </label>
                    <select
                      id="structures-type"
                      className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={type}
                      onChange={(e) => handleParamChange('type', e.target.value)}
                    >
                      {TYPE_STRUCTURES.map((opt) => (
                        <option key={opt.value || 'all'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="structures-city" className="block text-sm font-semibold text-slate-900 mb-1">
                      Ville
                    </label>
                    <Input
                      id="structures-city"
                      value={city}
                      onChange={(e) => handleParamChange('city', e.target.value)}
                      placeholder="Ex: Strasbourg"
                      className="h-10 bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="structures-departement" className="block text-sm font-semibold text-slate-900 mb-1">
                      Département
                    </label>
                    <Input
                      id="structures-departement"
                      value={departement}
                      onChange={(e) => handleParamChange('departement', e.target.value)}
                      placeholder="Ex: 67"
                      className="h-10 bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="structures-sort" className="block text-sm font-semibold text-slate-900 mb-1">
                      Trier
                    </label>
                    <select
                      id="structures-sort"
                      className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={sort}
                      onChange={(e) => handleParamChange('sort', e.target.value)}
                    >
                      <option value="quality">Qualité</option>
                      <option value="recent">Récents</option>
                      <option value="alpha">A-Z</option>
                      <option value="relevance" disabled={!q}>
                        Pertinence {q ? '' : '(nécessite une recherche)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="structures-limit" className="block text-sm font-semibold text-slate-900 mb-1">
                      Par page
                    </label>
                    <select
                      id="structures-limit"
                      className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={String(limit)}
                      onChange={(e) => handleParamChange('limit', e.target.value)}
                    >
                      {LIMIT_OPTIONS.map((opt) => (
                        <option key={opt} value={String(opt)}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      checked={pmrEnabled}
                      onChange={(e) => handleParamChange('pmr', e.target.checked ? '1' : '')}
                    />
                    Accessible PMR uniquement
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={clearFilters}>
                      Réinitialiser
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsFiltersOpen(false)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Chargement des résultats">
            {Array.from({ length: Math.min(limit, 12) }).map((_, idx) => (
              <Card key={idx} className="border-slate-200">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Impossible de charger l'annuaire"
            description="Vérifiez votre connexion puis réessayez."
            actions={
              <Button type="button" onClick={() => refetch()}>
                Réessayer
              </Button>
            }
            role="alert"
          />
        ) : structures.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="structures-results-list">
              {structures.map((s) => (
                <StructureCard key={s.id} structure={s} />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center mt-10 gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Précédent
              </Button>
              <span className="flex items-center px-4 text-sm font-medium text-slate-700">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!hasNext}
                onClick={() => handlePageChange(page + 1)}
              >
                Suivant
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="Aucune structure trouvée"
            message="Nous n'avons trouvé aucune structure correspondant à vos critères."
            actionLabel="Voir toutes les structures"
            onAction={clearFilters}
            type="search"
          />
        )}
      </div>
    </div>
  );
}
