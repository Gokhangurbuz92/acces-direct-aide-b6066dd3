import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import OrganizationCard from '@/components/cards/OrganizationCard';
import { Search, MapPin, Filter as FilterIcon, Loader2, X } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';

const TYPE_ORGANIZATIONS = {
  service_public: 'Service public',
  association: 'Association',
  etablissement_sante: 'Établissement de santé',
  reseau: 'Réseau',
};

const DEPARTEMENTS = {
  '67': 'Bas-Rhin (67)',
  '68': 'Haut-Rhin (68)',
};

export default function Annuaire() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const city = searchParams.get('city') || '';
  const department = searchParams.get('department') || '';
  const page = searchParams.get('page') || '1';

  const { data, isLoading } = useQuery({
    queryKey: ['organizations', { q, type, city, department, page }],
    queryFn: () => client.entities.Organization.filter({
      q,
      type,
      city,
      department,
      page,
      pageSize: 12
    }),
  });

  const organizations = data?.items || [];
  const pagination = data?.pagination || {};

  const handleParamChange = (key, value) => {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Annuaire des organisations" description="Trouvez des associations et services publics." path="/annuaire" />

      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Annuaire des organisations</h1>
          <p className="text-slate-600 mb-8 font-medium">Trouvez les organisations et leurs établissements près de chez vous</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Rechercher une organisation..."
                defaultValue={q}
                onBlur={(e) => handleParamChange('q', e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <Select value={type} onValueChange={(v) => handleParamChange('type', v)}>
              <SelectTrigger className="h-11 bg-white">
                <FilterIcon className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Type d'organisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tous les types</SelectItem>
                {Object.entries(TYPE_ORGANIZATIONS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={(v) => handleParamChange('department', v)}>
              <SelectTrigger className="h-11 bg-white">
                <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tous les départements</SelectItem>
                {Object.entries(DEPARTEMENTS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(q || type || department) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {q && <Badge variant="secondary">Cherche : {q} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('q', '')} /></Badge>}
              {type && <Badge variant="secondary">Type : {TYPE_ORGANIZATIONS[type] || type} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('type', '')} /></Badge>}
              {department && <Badge variant="secondary">Département : {DEPARTEMENTS[department] || department} <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => handleParamChange('department', '')} /></Badge>}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-blue-600">Réinitialiser</Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500">Chargement de l'annuaire...</p>
          </div>
        ) : organizations.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <OrganizationCard key={org.id} organization={org} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <Button variant="outline" disabled={pagination.page <= 1} onClick={() => handleParamChange('page', pagination.page - 1)}> Précédent </Button>
                <span className="flex items-center px-4 text-sm font-medium"> Page {pagination.page} / {pagination.totalPages} </span>
                <Button variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => handleParamChange('page', pagination.page + 1)}> Suivant </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Aucune organisation trouvée"
            message="Nous n'avons trouvé aucune organisation correspondant à vos critères."
            actionLabel="Voir toutes les organisations"
            onAction={clearFilters}
            type="search"
          />
        )}
      </div>
    </div>
  );
}