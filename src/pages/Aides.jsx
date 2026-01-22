import React, { useState, useEffect } from 'react';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/search/SearchBar';
import AideCard from '@/components/cards/AideCard';
import SEO from '@/components/SEO';
import { Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const CATEGORIES = {
  logement: 'Logement',
  sante: 'Santé',
  handicap: 'Handicap',
  emploi: 'Emploi / Formation',
  famille: 'Famille',
  budget: 'Budget / Dettes',
  mobilite: 'Mobilité',
  justice: 'Justice / Droits',
  numerique: 'Numérique',
  etrangers: 'Nouveaux arrivants',
  isolement: 'Isolement',
  lgbtqia: 'LGBTQIA+',
  vieillissement: 'Autonomie / Âge',
};

export default function Aides() {
  const urlParams = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({
    query: urlParams.get('q') || '',
    categorie: urlParams.get('categorie') || '',
    departement: urlParams.get('departement') || '',
    situation: urlParams.get('situation') || '',
    urgent: urlParams.get('urgent') === 'true'
  });

  const { data: aides = [], isLoading } = useQuery({
    queryKey: ['aides'],
    queryFn: () => client.entities.Aide.filter({ statut: 'publie' }, '-created_date'),
  });

  const filteredAides = aides.filter(aide => {
    // Recherche texte
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const matchesTitle = aide.titre?.toLowerCase().includes(query);
      const matchesDesc = aide.cest_quoi?.toLowerCase().includes(query);
      const matchesKeywords = aide.mots_cles?.some(k => k.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDesc && !matchesKeywords) return false;
    }

    // Catégorie
    if (filters.categorie && aide.categorie !== filters.categorie) return false;

    // Département
    if (filters.departement && filters.departement !== 'national') {
      const matchesTerritoire = aide.territoires?.includes(filters.departement) ||
        aide.territoires?.includes('national');
      if (!matchesTerritoire) return false;
    }

    // Situation
    if (filters.situation) {
      if (!aide.situations_vie?.includes(filters.situation)) return false;
    }

    // Urgence
    if (filters.urgent && !aide.est_urgent) return false;

    return true;
  });

  const handleSearch = (searchParams) => {
    setFilters(searchParams);
  };

  const getCategoryTitle = () => {
    if (filters.categorie && CATEGORIES[filters.categorie]) {
      return `Aides - ${CATEGORIES[filters.categorie]}`;
    }
    return 'Toutes les aides';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={getCategoryTitle()}
        description="Parcourez les aides disponibles."
        path="/aides"
      />
      {/* En-tête */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">
            {getCategoryTitle()}
          </h1>
          <SearchBar onSearch={handleSearch} compact />
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAides.length > 0 ? (
          <>
            <p className="text-slate-600 mb-6">
              {filteredAides.length} aide{filteredAides.length > 1 ? 's' : ''} trouvée{filteredAides.length > 1 ? 's' : ''}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAides.map((aide) => (
                <AideCard key={aide.id} aide={aide} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Aucune aide trouvée"
            message="Essayez de modifier vos filtres (catégorie, département ou situation) ou utilisez l'assistant pour plus de clarté."
            actionLabel="Réinitialiser les filtres"
            onAction={() => setFilters({ query: '', categorie: '', departement: '', situation: '', urgent: false })}
            type="search"
          />
        )}
      </div>
    </div>
  );
}