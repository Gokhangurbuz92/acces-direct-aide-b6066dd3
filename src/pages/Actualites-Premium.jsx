import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import SEO from '@/components/SEO';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  ExternalLink,
  AlertTriangle,
  Info,
  Star,
  Loader2,
  ArrowRight,
  Search,
  Sparkles,
  Bell
} from 'lucide-react';
import NewsFallback from '@/components/news/NewsFallback';

// Import taxonomy (path relative to src/)
const TOPICS_MAP = {
  'toutes': 'Toutes',
  'logement': 'Logement',
  'sante': 'Santé',
  'handicap': 'Handicap',
  'emploi': 'Emploi',
  'famille': 'Famille',
  'budget': 'Budget',
  'mobilite': 'Mobilité',
  'justice': 'Justice',
  'numerique': 'Numérique',
  'nouveaux_arrivants': 'Nouveaux arrivants',
  'education_formation': 'Éducation & Formation',
  'retraite_dependance': 'Retraite & Dépendance',
  'energie_environnement': 'Énergie & Environnement',
  'consommation_fraudes': 'Consommation & Fraudes',
  'impots_finances_publiques': 'Impôts & Finances publiques',
  'vie_associative': 'Vie associative',
  'securite_civile': 'Sécurité civile',
  'international': 'International',
  'general': 'Général'
};

const TOPICS_FOR_TABS = [
  'logement', 'sante', 'handicap', 'emploi', 'famille', 'budget',
  'mobilite', 'justice', 'numerique', 'nouveaux_arrivants',
  'education_formation', 'retraite_dependance', 'energie_environnement',
  'consommation_fraudes', 'impots_finances_publiques', 'vie_associative',
  'securite_civile', 'international', 'general'
];

const IMPACT_ICONS = {
  alerte: AlertTriangle,
  important: Star,
  info: Info,
};

const IMPACT_COLORS = {
  alerte: 'bg-red-100 text-red-800 border-red-300',
  important: 'bg-amber-100 text-amber-800 border-amber-300',
  info: 'bg-blue-100 text-blue-800 border-blue-300',
};

async function fetchActualites(params) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/actualites?${query.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch actualites');
  return response.json();
}

async function fetchPremium() {
  const response = await fetch('/api/actualites/premium');
  if (!response.ok) throw new Error('Failed to fetch premium');
  return response.json();
}

export default function ActualitesPremium() {
  const [searchParams, setSearchParams] = useSearchParams();

  const topic = searchParams.get('topic') || 'toutes';
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(q);

  // Fetch premium sections
  const { data: premium, isLoading: isPremiumLoading } = useQuery({
    queryKey: ['actualites-premium'],
    queryFn: fetchPremium,
    staleTime: 5 * 60 * 1000, // 5min cache
  });

  // Fetch main listing
  const { data: listing, isLoading: isListingLoading } = useQuery({
    queryKey: ['actualites-list', topic, q, page],
    queryFn: () => fetchActualites({
      topic: topic !== 'toutes' ? topic : undefined,
      q: q || undefined,
      page,
      limit: 20,
      sort: 'recent',
      statut: 'publie'
    }),
  });

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const handleTopicChange = (newTopic) => {
    setSearchParams({ topic: newTopic, page: '1' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = { topic, page: '1' };
    if (searchInput) params.q = searchInput;
    setSearchParams(params);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderActualiteCard = (actu) => {
    const ImpactIcon = IMPACT_ICONS[actu.impact] || Info;
    const linkUrl = actu.slug ? `/actualites/${actu.slug}` : `/actualites/view?id=${actu.id}`;

    return (
      <Card key={actu.id} className="group hover:shadow-lg transition-all relative" data-testid="actualite-card">
        <Link
          to={linkUrl}
          className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
          aria-label={`Lire l'actualité ${actu.titre}`}
        >
          <span className="sr-only">Lire l'actualité {actu.titre}</span>
        </Link>

        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={IMPACT_COLORS[actu.impact] || IMPACT_COLORS.info}>
              <ImpactIcon className="h-3 w-3 mr-1" />
              {actu.impact === 'alerte' ? 'Alerte' : actu.impact === 'important' ? 'Important' : 'Info'}
            </Badge>
            {actu.topic_primary && (
              <Badge variant="outline">
                {TOPICS_MAP[actu.topic_primary] || actu.topic_primary}
              </Badge>
            )}
            {actu.is_new && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <Sparkles className="h-3 w-3 mr-1" />
                Nouveau
              </Badge>
            )}
          </div>

          <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-3" data-testid="actualite-title">
            {actu.titre}
          </h2>

          <p className="text-slate-600 mb-4 leading-relaxed line-clamp-3">
            {actu.excerpt || actu.contenu || ''}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 relative z-20">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(actu.source_published_at || actu.date_publication)}
              </span>
              {actu.source_name && (
                <span>Source : {actu.source_name}</span>
              )}
            </div>

            <span className="text-blue-600 group-hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition-colors">
              Lire la suite
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Actualités"
        description="Les dernières informations sur les aides et les droits pour les personnes en situation de précarité."
        path="/actualites"
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Actualités
          </h1>
          <p className="text-slate-600">
            Les dernières informations sur les aides et les droits
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Premium Sections */}
        {isPremiumLoading ? (
          <div className="mb-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (premium && (premium.alerts?.length > 0 || premium.weeklyImportant?.length > 0)) ? (
          <div className="mb-8 space-y-6">
            {/* Alertes du moment */}
            {premium.alerts?.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alertes du moment
                </h2>
                <div className="space-y-4">
                  {premium.alerts.map((actu) => (
                    <div key={actu.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <Link to={`/actualites/${actu.slug || `view?id=${actu.id}`}`} className="block hover:text-blue-700">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900">{actu.titre}</h3>
                            <p className="text-sm text-slate-600 mt-1">{actu.excerpt}</p>
                            <p className="text-xs text-slate-500 mt-2">{formatDate(actu.source_published_at)}</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changements importants cette semaine */}
            {premium.weeklyImportant?.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
                <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Changements importants cette semaine
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {premium.weeklyImportant.map((actu) => (
                    <Link
                      key={actu.id}
                      to={`/actualites/${actu.slug || `view?id=${actu.id}`}`}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-bold text-slate-900 mb-1">{actu.titre}</h3>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{actu.excerpt}</p>
                      <p className="text-xs text-slate-500">{formatDate(actu.source_published_at)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher une actualité..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Topics Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            <Button
              variant={topic === 'toutes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTopicChange('toutes')}
            >
              Toutes
            </Button>
            {TOPICS_FOR_TABS.map((topicKey) => (
              <Button
                key={topicKey}
                variant={topic === topicKey ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTopicChange(topicKey)}
              >
                {TOPICS_MAP[topicKey]}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Listing */}
        {isListingLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (listing?.items && listing.items.length > 0) ? (
          <div className="space-y-6">
            {listing.items.map(renderActualiteCard)}

            {/* Pagination */}
            {listing.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setSearchParams({ topic, q, page: String(page - 1) })}
                >
                  Précédent
                </Button>
                <span className="text-sm text-slate-600">
                  Page {page} / {listing.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= listing.totalPages}
                  onClick={() => setSearchParams({ topic, q, page: String(page + 1) })}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        ) : (
          <NewsFallback />
        )}
      </div>
    </div>
  );
}
