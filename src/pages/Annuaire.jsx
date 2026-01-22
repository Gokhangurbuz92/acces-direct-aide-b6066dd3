import React, { useState } from 'react';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SEO from '@/components/SEO';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StructureCard from '@/components/cards/StructureCard';
import { Search, MapPin, Filter, Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const TYPE_STRUCTURES = {
  association: 'Association',
  service_public: 'Service public',
  etablissement_sante: 'Établissement de santé',
  mairie: 'Mairie',
  caf: 'CAF',
  mdph: 'MDPH',
  france_travail: 'France Travail',
  cpam: 'CPAM',
};

const DEPARTEMENTS = {
  '67': 'Bas-Rhin (67)',
  '68': 'Haut-Rhin (68)',
};

export default function Annuaire() {
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState(urlParams.get('q') || '');
  const [filters, setFilters] = useState({
    departement: urlParams.get('departement') || '',
    type: urlParams.get('type') || '',
    ville: urlParams.get('ville') || ''
  });

  const { data: structures = [], isLoading } = useQuery({
    queryKey: ['structures'],
    queryFn: async () => {
      const allStructures = await client.entities.Structure.list('nom');
      // Filtrer uniquement les structures actives (exclut draft, a_verifier, inactif)
      return allStructures.filter(s => s.statut === 'actif');
    },
  });

  const filteredStructures = structures.filter(structure => {
    // Recherche texte
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesNom = structure.nom?.toLowerCase().includes(query);
      const matchesVille = structure.ville?.toLowerCase().includes(query);
      const matchesServices = structure.services?.some(s => s.toLowerCase().includes(query));
      if (!matchesNom && !matchesVille && !matchesServices) return false;
    }

    // Département
    if (filters.departement && structure.departement !== filters.departement) return false;

    // Type
    if (filters.type && structure.type_structure !== filters.type) return false;

    // Ville
    if (filters.ville && !structure.ville?.toLowerCase().includes(filters.ville.toLowerCase())) return false;

    return true;
  });

  // Grouper par ville si pas de recherche
  const groupedByVille = filteredStructures.reduce((acc, structure) => {
    const ville = structure.ville || 'Autre';
    if (!acc[ville]) acc[ville] = [];
    acc[ville].push(structure);
    return acc;
  }, {});

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ departement: '', type: '', ville: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Annuaire des structures"
        description="Trouvez des associations et services publics près de chez vous."
        path="/annuaire"
      />
      {/* En-tête */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Annuaire des structures
          </h1>
          <p className="text-slate-600 mb-6">
            Trouvez les associations, services publics et lieux d'accueil près de chez vous
          </p>

          {/* Recherche et filtres */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, ville ou service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button className="h-12 px-8" onClick={() => { }}>
                <Search className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Rechercher</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Select
                value={filters.departement}
                onValueChange={(value) => setFilters(prev => ({ ...prev, departement: value }))}
              >
                <SelectTrigger className="w-auto min-w-[160px] bg-white">
                  <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Tous</SelectItem>
                  {Object.entries(DEPARTEMENTS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="w-auto min-w-[180px] bg-white">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Type de structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Tous les types</SelectItem>
                  {Object.entries(TYPE_STRUCTURES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="text"
                placeholder="Ville..."
                value={filters.ville}
                onChange={(e) => setFilters(prev => ({ ...prev, ville: e.target.value }))}
                className="w-auto min-w-[150px] bg-white"
              />

              {(searchQuery || filters.departement || filters.type || filters.ville) && (
                <Button variant="ghost" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredStructures.length > 0 ? (
          <>
            <p className="text-slate-600 mb-6">
              {filteredStructures.length} structure{filteredStructures.length > 1 ? 's' : ''} trouvée{filteredStructures.length > 1 ? 's' : ''}
            </p>

            {Object.keys(groupedByVille).length > 3 ? (
              // Affichage en grille si beaucoup de structures
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStructures.map((structure) => (
                  <StructureCard key={structure.id} structure={structure} />
                ))}
              </div>
            ) : (
              // Affichage groupé par ville
              <div className="space-y-10">
                {Object.entries(groupedByVille).sort().map(([ville, structures]) => (
                  <section key={ville}>
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      {ville}
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {structures.map((structure) => (
                        <StructureCard key={structure.id} structure={structure} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Aucune structure trouvée"
            message="Il n'y a pas de structure correspondant à vos critères dans cette zone."
            actionLabel="Réinitialiser les filtres"
            onAction={clearFilters}
            type="search"
          />
        )}
      </div>
    </div>
  );
}