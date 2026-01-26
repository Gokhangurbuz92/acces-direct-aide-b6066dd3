import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  isolement: 'bg-rose-100 text-rose-800',
  lgbtqia: 'bg-violet-100 text-violet-800',
  vieillissement: 'bg-amber-100 text-amber-800',
};

const CATEGORIE_LABELS = {
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
  isolement: 'Isolement',
  lgbtqia: 'LGBTQIA+',
  vieillissement: 'Autonomie',
};

export default function AideCard({ aide, compact = false }) {
  const getTerritoireLabel = () => {
    if (!aide.territoires?.length) return null;
    if (aide.territoires.includes('national')) return 'France entière';
    return aide.territoires.map(t => {
      if (t === '67') return 'Bas-Rhin';
      if (t === '68') return 'Haut-Rhin';
      return t;
    }).join(', ');
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300 bg-white">
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex flex-col gap-3">
          {/* En-tête avec badges */}
          <div className="flex flex-wrap gap-2 items-start justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge className={`${CATEGORIE_COLORS[aide.categorie] || 'bg-slate-100 text-slate-800'}`}>
                {CATEGORIE_LABELS[aide.categorie] || aide.categorie}
              </Badge>
              {aide.est_urgent && (
                <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Urgence
                </Badge>
              )}
            </div>
            {aide.sources?.some(s => s.type === 'officielle') && (
              <Badge variant="outline" className="text-green-700 border-green-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Source officielle
              </Badge>
            )}
          </div>

          {/* Titre */}
          <h3 className={`font-semibold text-slate-900 group-hover:text-blue-700 transition-colors ${compact ? 'text-base' : 'text-lg'}`}>
            {aide.titre}
          </h3>

          {/* Description courte */}
          <p className="text-slate-600 text-sm line-clamp-2">
            {aide.cest_quoi}
          </p>

          {/* Métadonnées */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-1">
            {getTerritoireLabel() && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {getTerritoireLabel()}
              </span>
            )}
            {aide.date_verification && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Vérifié le {new Date(aide.date_verification).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>

          {/* Lien */}
          <Link
            to={`/aides/${aide.slug ?? aide.id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm mt-2 group/link"
            aria-label={`Voir l'aide ${aide.titre}`}
          >
            Voir cette aide
            <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}