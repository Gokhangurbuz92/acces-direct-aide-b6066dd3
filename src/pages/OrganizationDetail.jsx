import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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
import EstablishmentCard from '@/components/cards/EstablishmentCard';
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  MapPin, 
  Search, 
  Loader2,
  X
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';

const DEPARTEMENTS = {
  '67': 'Bas-Rhin (67)',
  '68': 'Haut-Rhin (68)',
};

const TERRITOIRE_LABELS = {
  national: 'National',
  regional: 'Régional',
  departmental: 'Départemental',
  local: 'Local',
};

export default function OrganizationDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const city = searchParams.get('city') || '';
  const department = searchParams.get('department') || '';
  const page = searchParams.get('page') || '1';

  // Fetch organization details
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => client.entities.Organization.filter({ slug }),
    select: (data) => data?.items?.[0] || data,
  });

  // Fetch establishments
  const { data: establishmentsData, isLoading: estLoading } = useQuery({
    queryKey: ['establishments', slug, { city, department, page }],
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations?organizationSlug=${slug}&city=${city}&department=${department}&page=${page}&pageSize=20`
      );
      if (!response.ok) throw new Error('Failed to fetch establishments');
      return response.json();
    },
    enabled: !!slug,
  });

  const establishments = establishmentsData?.items || [];
  const pagination = establishmentsData?.pagination || {};

  const handleParamChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== '_all') {
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

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <EmptyState
            title="Organisation non trouvée"
            message="Cette organisation n'existe pas ou n'est plus disponible."
            actionLabel="Retour à l'annuaire"
            onAction={() => window.location.href = '/annuaire'}
            type="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title={organization.nom} 
        description={organization.description || `Établissements de ${organization.nom}`} 
        path={`/annuaire/${slug}`} 
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link 
            to="/annuaire" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'annuaire
          </Link>

          <div className="flex items-start gap-4 mb-4">
            <Building2 className="h-8 w-8 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{organization.nom}</h1>
              {organization.description && (
                <p className="text-slate-600 text-lg mb-4">{organization.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {organization.territoire_couverture && (
                  <Badge variant="outline" className="text-slate-700">
                    {TERRITOIRE_LABELS[organization.territoire_couverture] || organization.territoire_couverture}
                  </Badge>
                )}
                {organization.categories?.map((cat, idx) => (
                  <Badge key={idx} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>

              {organization.site_web_officiel && (
                <a
                  href={organization.site_web_officiel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Site officiel
                </a>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-blue-900 font-medium">
              {organization.establishmentCount || 0} {organization.establishmentCount > 1 ? 'établissements' : 'établissement'} disponible{organization.establishmentCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Filtrer par ville..."
              defaultValue={city}
              onBlur={(e) => handleParamChange('city', e.target.value)}
              className="h-10 bg-white"
            />

            <Select value={department} onValueChange={(v) => handleParamChange('department', v)}>
              <SelectTrigger className="h-10 bg-white">
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

            {(city || department) && (
              <Button variant="outline" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Establishments List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {estLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500">Chargement des établissements...</p>
          </div>
        ) : establishments.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {establishments.map((est) => (
                <EstablishmentCard key={est.id} establishment={est} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-2">
                <Button 
                  variant="outline" 
                  disabled={pagination.page <= 1} 
                  onClick={() => handleParamChange('page', pagination.page - 1)}
                >
                  Précédent
                </Button>
                <span className="flex items-center px-4 text-sm font-medium">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={pagination.page >= pagination.totalPages} 
                  onClick={() => handleParamChange('page', pagination.page + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Aucun établissement trouvé"
            message="Aucun établissement ne correspond à vos critères de recherche."
            actionLabel="Réinitialiser les filtres"
            onAction={clearFilters}
            type="search"
          />
        )}
      </div>
    </div>
  );
}
