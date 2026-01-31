import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Globe,
  MapPin,
  ArrowRight,
  Users
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TYPE_LABELS = {
  service_public: 'Service public',
  association: 'Association',
  etablissement_sante: 'Établissement de santé',
  reseau: 'Réseau',
  autre: 'Autre',
};

const TYPE_COLORS = {
  service_public: 'bg-blue-100 text-blue-800',
  association: 'bg-green-100 text-green-800',
  etablissement_sante: 'bg-red-100 text-red-800',
  reseau: 'bg-purple-100 text-purple-800',
};

const TERRITOIRE_LABELS = {
  national: 'National',
  regional: 'Régional',
  departmental: 'Départemental',
  local: 'Local',
};

export default function OrganizationCard({ organization, compact = false }) {
  const targetUrl = organization.slug ? `/annuaire/${organization.slug}` : `/annuaire/view?id=${organization.id}`;
  const establishmentCount = organization.establishmentCount || 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300 bg-white relative" data-testid="organization-card">
      {/* Overlay Link */}
      <Link
        to={targetUrl}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        aria-label={`Voir les établissements de ${organization.nom}`}
      >
        <span className="sr-only">Voir les établissements de {organization.nom}</span>
      </Link>

      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex flex-col gap-3">
          {/* En-tête */}
          <div className="flex flex-wrap gap-2 items-start justify-between relative z-0">
            <div className="flex flex-wrap gap-2">
              <Badge className={TYPE_COLORS[organization.type_organization] || 'bg-slate-100 text-slate-800'}>
                {TYPE_LABELS[organization.type_organization] || organization.type_organization || 'Organisation'}
              </Badge>
              {organization.territoire_couverture && (
                <Badge variant="outline" className="text-slate-700 border-slate-300">
                  {TERRITOIRE_LABELS[organization.territoire_couverture] || organization.territoire_couverture}
                </Badge>
              )}
            </div>
          </div>

          {/* Nom */}
          <div className="flex items-start gap-2">
            <Building2 className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <h3 className={`font-semibold text-slate-900 group-hover:text-blue-700 transition-colors ${compact ? 'text-base' : 'text-lg'}`} data-testid="organization-title">
              {organization.nom}
            </h3>
          </div>

          {/* Description */}
          {organization.description && (
            <p className="text-slate-600 text-sm line-clamp-2">
              {organization.description}
            </p>
          )}

          {/* Establishment Count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700 font-medium">
              {establishmentCount} {establishmentCount > 1 ? 'établissements' : 'établissement'}
            </span>
          </div>

          {/* Categories */}
          {organization.categories && organization.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {organization.categories.slice(0, 3).map((cat, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
              {organization.categories.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{organization.categories.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-2">
            {organization.site_web_officiel && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="relative z-20"
              >
                <a href={organization.site_web_officiel} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Globe className="h-4 w-4 mr-1" />
                  Site officiel
                </a>
              </Button>
            )}
            <div
              className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm group-hover:text-blue-800 transition-colors"
            >
              Voir les établissements
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
