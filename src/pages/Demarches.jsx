import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  loader2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

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
  vieillissement: 'Autonomie',
};

const CATEGORIE_COLORS = {
  logement: 'bg-orange-100 text-orange-800',
  sante: 'bg-green-100 text-green-800',
  handicap: 'bg-purple-100 text-purple-800',
  emploi: 'bg-blue-100 text-blue-800',
  famille: 'bg-pink-100 text-pink-800',
  budget: 'bg-yellow-100 text-yellow-800',
  mobilite: 'bg-cyan-100 text-cyan-800',
  justice: 'bg-red-100 text-red-800',
  numerique: 'bg-indigo-100 text-indigo-800',
  etrangers: 'bg-teal-100 text-teal-800',
  vieillissement: 'bg-amber-100 text-amber-800',
};

export default function Demarches() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: demarches = [], isLoading } = useQuery({
    queryKey: ['demarches'],
    queryFn: () => client.entities.Demarche.filter({ statut: 'publie' }, '-created_date'),
  });

  const filteredDemarches = demarches.filter(demarche => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = demarche.titre?.toLowerCase().includes(query);
      const matchesDesc = demarche.description_courte?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDesc) return false;
    }
    if (selectedCategory && demarche.categorie !== selectedCategory) return false;
    return true;
  });

  // Grouper par catégorie si pas de filtre
  const groupedDemarches = selectedCategory ?
    { [selectedCategory]: filteredDemarches } :
    filteredDemarches.reduce((acc, demarche) => {
      const cat = demarche.categorie || 'autre';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(demarche);
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title={selectedCategory && CATEGORIES[selectedCategory] ? `Démarches - ${CATEGORIES[selectedCategory]}` : 'Démarches administratives'}
        description="Guides pas à pas pour vos démarches."
        path="/demarches"
      />
      {/* En-tête */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Démarches administratives
          </h1>
          <p className="text-slate-600 mb-6">
            Des guides pas à pas pour vous aider dans vos démarches
          </p>

          {/* Recherche */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher une démarche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtres catégories */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              Toutes
            </Button>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : Object.keys(groupedDemarches).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedDemarches).map(([category, items]) => (
              <section key={category}>
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${CATEGORIE_COLORS[category]?.split(' ')[0] || 'bg-slate-400'}`}></span>
                  {CATEGORIES[category] || 'Autre'}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {items.map((demarche) => (
                    <Card key={demarche.id} className="hover:shadow-lg transition-shadow group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Badge className={CATEGORIE_COLORS[demarche.categorie] || 'bg-slate-100 text-slate-800'}>
                              {CATEGORIES[demarche.categorie] || demarche.categorie}
                            </Badge>
                            <h3 className="text-lg font-semibold text-slate-900 mt-3 mb-2 group-hover:text-blue-700 transition-colors">
                              {demarche.titre}
                            </h3>
                            <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                              {demarche.description_courte}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                              {demarche.etapes?.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {demarche.etapes.length} étapes
                                </span>
                              )}
                              {demarche.delai && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {demarche.delai}
                                </span>
                              )}
                              {demarche.cout && (
                                <span className="flex items-center gap-1">
                                  {demarche.cout}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <Link
                          to={createPageUrl('DemarcheDetail') + `?id=${demarche.id}`}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm mt-4 group/link"
                        >
                          Voir les étapes
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucune démarche trouvée"
            message="Nous n'avons pas encore de guide pour cette recherche. Essayez d'autres mots-clés ou consultez les catégories."
            actionLabel="Voir toutes les démarches"
            onAction={() => { setSearchQuery(''); setSelectedCategory(''); }}
            type="search"
          />
        )}
      </div>
    </div>
  );
}