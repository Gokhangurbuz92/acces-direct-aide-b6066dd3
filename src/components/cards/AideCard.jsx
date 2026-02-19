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
import { formatProvenanceDate, getFreshnessBadge, getProvenance } from '@/lib/provenance';

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
  autre: 'bg-slate-100 text-slate-800',
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
  autre: 'Autre',
};

const FRESHNESS_BADGE_CLASS = {
  up_to_date: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  to_review: 'bg-amber-100 text-amber-800 border-amber-200',
  at_risk: 'bg-rose-100 text-rose-800 border-rose-200',
  not_verified: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function AideCard({ aide, compact = false }) {
  const provenance = getProvenance(aide);
  const verifiedAt = formatProvenanceDate(provenance.verifiedAt);
  const sourceHost = provenance.sourceHost;
  const freshness = getFreshnessBadge(provenance.verifiedAt);
  const verificationLabel = verifiedAt ? `Vérifié le ${verifiedAt}` : 'À vérifier';
  const sourceLabel = sourceHost ? `Source: ${sourceHost}` : 'Source: non renseignée';

  const categorySlug = (() => {
    const raw = aide?.categorie || aide?.theme || aide?.category?.slug || aide?.category_code;
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;
    return /^[A-Z_]+$/.test(value) ? value.toLowerCase() : value;
  })();

  const categoryLabel = (categorySlug && CATEGORIE_LABELS[categorySlug]) || aide?.category?.label || categorySlug;
  const categoryColor = (categorySlug && CATEGORIE_COLORS[categorySlug]) || 'bg-slate-100 text-slate-800';

  const getTerritoireLabel = () => {
    if (!aide.territoires?.length) return null;
    if (aide.territoires.includes('national')) return 'France entière';
    return aide.territoires.map(t => {
      if (t === '67') return 'Bas-Rhin';
      if (t === '68') return 'Haut-Rhin';
      return t;
    }).join(', ');
  };

  const targetUrl = aide.slug ? `/aides/${aide.slug}` : `/aide/view?id=${aide.id}`;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-blue-300 bg-white relative" data-testid="aide-card">
      {/* Overlay Link for Clickable Card */}
      <Link
        to={targetUrl}
        data-testid={`aide-card-link-${aide.id}`}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
        aria-label={`Voir l'aide ${aide.titre}`}
      >
        <span className="sr-only">Voir l'aide {aide.titre}</span>
      </Link>

      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex flex-col gap-3">
          {/* En-tête avec badges */}
          <div className="flex flex-wrap gap-2 items-start justify-between relative z-0">
            <div className="flex flex-wrap gap-2">
              {categoryLabel && (
                <Badge className={categoryColor}>
                  {categoryLabel}
                </Badge>
              )}
              {aide.est_urgent && (
                <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Urgence
                </Badge>
              )}
            </div>
            <Badge
              variant="outline"
              className={FRESHNESS_BADGE_CLASS[freshness.state] || FRESHNESS_BADGE_CLASS.not_verified}
              data-testid="aide-freshness-badge"
            >
              {freshness.label}
            </Badge>
            {aide.sources?.some(s => s.type === 'officielle') && (
              <Badge variant="outline" className="text-green-700 border-green-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Source officielle
              </Badge>
            )}
          </div>

          {/* Titre */}
          <h3 className={`font-semibold text-slate-900 group-hover:text-blue-700 transition-colors ${compact ? 'text-base' : 'text-lg'}`} data-testid="aide-title">
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
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {verificationLabel}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {sourceLabel}
            </span>
          </div>

          {/* Visual Link (Not interactive, just decoration) */}
          <div className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm mt-2 group-hover:text-blue-800 transition-colors">
            Voir cette aide
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
