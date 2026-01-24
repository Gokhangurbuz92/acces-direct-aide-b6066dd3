import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl, toSlug } from '@/utils';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Accessibility,
  ArrowRight
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TYPE_LABELS = {
  association: 'Association',
  service_public: 'Service public',
  etablissement_sante: 'Établissement de santé',
  mairie: 'Mairie',
  caf: 'CAF',
  mdph: 'MDPH',
  france_travail: 'France Travail',
  cpam: 'CPAM',
  autre: 'Autre',
};

const TYPE_COLORS = {
  association: 'bg-green-100 text-green-800',
  service_public: 'bg-blue-100 text-blue-800',
  etablissement_sante: 'bg-red-100 text-red-800',
  mairie: 'bg-purple-100 text-purple-800',
  caf: 'bg-orange-100 text-orange-800',
  mdph: 'bg-indigo-100 text-indigo-800',
  france_travail: 'bg-cyan-100 text-cyan-800',
  cpam: 'bg-teal-100 text-teal-800',
};

export default function StructureCard({ structure, compact = false }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300 bg-white">
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex flex-col gap-3">
          {/* En-tête */}
          <div className="flex flex-wrap gap-2 items-start justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge className={TYPE_COLORS[structure.type_structure] || 'bg-slate-100 text-slate-800'}>
                {TYPE_LABELS[structure.type_structure] || structure.type_structure}
              </Badge>
              {structure.coverage === 'OFFICIAL' && (
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Source officielle
                </Badge>
              )}
              {structure.coverage === 'LOCAL_OPEN_DATA' && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Open data local
                </Badge>
              )}
              {structure.coverage === 'SUGGESTED_NEEDS_REVIEW' && (
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  À vérifier
                </Badge>
              )}
            </div>
            {structure.accessibility_info?.pmr && (
              <Badge variant="outline" className="text-blue-700 border-blue-300 flex items-center gap-1">
                <Accessibility className="h-3 w-3" />
                Accessible PMR
              </Badge>
            )}
          </div>

          {/* Nom */}
          <h3 className={`font-semibold text-slate-900 group-hover:text-blue-700 transition-colors ${compact ? 'text-base' : 'text-lg'}`}>
            {structure.nom}
          </h3>

          {/* Description */}
          {structure.description_courte && (
            <p className="text-slate-600 text-sm line-clamp-2">
              {structure.description_courte}
            </p>
          )}

          {/* Infos de contact */}
          <div className="space-y-2 text-sm text-slate-600">
            {structure.adresse && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  {structure.adresse}, {structure.code_postal} {structure.ville}
                </span>
              </div>
            )}
            {structure.telephone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <a
                  href={`tel:${structure.telephone}`}
                  className="text-blue-600 hover:underline"
                >
                  {structure.telephone}
                </a>
              </div>
            )}
            {structure.horaires && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <span>{structure.horaires}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-2">
            {structure.site_web && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={structure.site_web} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-1" />
                  Site web
                </a>
              </Button>
            )}
            <Link
              to={structure.slug ? `/structures/${structure.slug}` : `/structures/view?id=${structure.id}`}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm group/link"
            >
              Plus d'infos
              <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}