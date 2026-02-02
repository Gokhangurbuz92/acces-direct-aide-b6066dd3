import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  ArrowRight,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  X,
  Filter
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import DemarcheCard from '@/components/cards/DemarcheCard';

export default function Demarches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const situation = searchParams.get('situation') || '';
  const organisme = searchParams.get('organisme') || '';
  const canal = searchParams.get('canal') || '';
  const territoire = searchParams.get('territoire') || '';
  const sort = searchParams.get('sort') || 'pertinence';
  const page = searchParams.get('page') || '1';

  // Fetch Taxonomy
  const { data: taxonomy } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: () => client.taxonomy.get(),
  });

  // Fetch Demarches (Server-side)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['demarches', { q, category, situation, organisme, canal, territoire, sort, page }],
    queryFn: () => client.entities.Demarche.filter({
      q,
      category,
      situation,
      organisme,
      canal,
      territoire_niveau: territoire,
      sort,
      page,
      pageSize: 12
    }),
  });

  const items = data?.items || [];
  const pagination = data?.pagination || {};
  const facets = data?.facets || { categories: [], situations: [], organismes: [], canaux: [], territoires: [] };

  const handleParamChange = (key, value) => {
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
      if (cat) return `Démarches - ${cat.label}`;
    }
    if (situation && taxonomy) {
      const sit = taxonomy.situations.find(s => s.slug === situation);
      if (sit) return `Démarches pour : ${sit.label}`;
    }
    return 'Démarches administratives';
  };

  const getDescription = () => {
    if (category && taxonomy) {
      const cat = taxonomy.categories.find(c => c.slug === category);
      if (cat) return `Toutes les démarches administratives et guides pas à pas pour la catégorie ${cat.label}.`;
    }
    if (situation && taxonomy) {
      const sit = taxonomy.situations.find(s => s.slug === situation);
      if (sit) return `Guides et démarches pour votre situation : ${sit.label}.`;
    }
    return 'Besoin d\'aide pour vos démarches ? Retrouvez nos guides pas à pas pour la CAF, le RSA, vos papiers d\'identité et plus encore.';
  };

  const currentPath = category ? `/demarches?category=${category}` : (situation ? `/demarches?situation=${situation}` : '/demarches');

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={getTitle()}
        description={getDescription()}
        path={currentPath}
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap hidden lg:block">
            Démarches
          </h1>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Rechercher une démarche (ex: passport, rsa...)"
              defaultValue={q}
              onBlur={(e) => handleParamChange('q', e.target.value)}
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
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
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Catégories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleParamChange('category', '')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${!category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Toutes les catégories
                  </button>
                  {facets.categories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleParamChange('category', cat.key)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex justify-between items-center ${category === cat.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-xs text-slate-400">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Situations</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleParamChange('situation', '')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${!situation ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Toutes les situations
                  </button>
                  {facets.situations.map((sit) => (
                    <button
                      key={sit.key}
                      onClick={() => handleParamChange('situation', sit.key)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex justify-between items-center ${situation === sit.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <span>{sit.label}</span>
                      <span className="text-xs text-slate-400">{sit.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {facets.organismes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Organismes</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleParamChange('organisme', '')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${!organisme ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Tous les organismes
                    </button>
                    {facets.organismes.map((org) => (
                      <button
                        key={org.key}
                        onClick={() => handleParamChange('organisme', org.key)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex justify-between items-center ${organisme === org.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <span>{org.label}</span>
                        <span className="text-xs text-slate-400">{org.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {facets.canaux.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Canal</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleParamChange('canal', '')}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${!canal ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Tous les canaux
                    </button>
                    {facets.canaux.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => handleParamChange('canal', c.key)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex justify-between items-center ${canal === c.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <span>{c.label === 'en_ligne' ? 'En ligne' : c.label === 'guichet' ? 'Guichet' : c.label === 'courrier' ? 'Courrier' : c.label === 'telephone' ? 'Téléphone' : c.label}</span>
                        <span className="text-xs text-slate-400">{c.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {(category || situation || q || organisme || canal || territoire) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-slate-500 mr-2">Filtres actifs :</span>
                {category && <Badge variant="secondary" className="pl-3 pr-2 py-1">Cat : {category} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('category', '')} /></Badge>}
                {situation && <Badge variant="secondary" className="pl-3 pr-2 py-1">Sit : {situation} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('situation', '')} /></Badge>}
                {organisme && <Badge variant="secondary" className="pl-3 pr-2 py-1">Org : {organisme} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('organisme', '')} /></Badge>}
                {canal && <Badge variant="secondary" className="pl-3 pr-2 py-1">Canal : {canal} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('canal', '')} /></Badge>}
                {territoire && <Badge variant="secondary" className="pl-3 pr-2 py-1">Territoire : {territoire} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('territoire', '')} /></Badge>}
                {q && <Badge variant="secondary" className="pl-3 pr-2 py-1">"{q}" <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('q', '')} /></Badge>}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-blue-600">Tout effacer</Button>
              </div>
            )}

            {isError ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-red-600 mb-4">Une erreur est survenue lors du chargement.</div>
                <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500">Chargement des démarches...</p>
              </div>
            ) : items.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {items.map((demarche) => (
                    <DemarcheCard key={demarche.id} demarche={demarche} />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => handleParamChange('page', pagination.page - 1)}> Précédent </Button>
                    <span className="flex items-center px-4 text-sm font-medium"> {pagination.page} / {pagination.totalPages} </span>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => handleParamChange('page', pagination.page + 1)}> Suivant </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="Aucun guide trouvé"
                message="Désolé, nous n'avons pas encore de guide pour cette recherche ou ce filtre."
                actionLabel="Voir toutes les démarches"
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