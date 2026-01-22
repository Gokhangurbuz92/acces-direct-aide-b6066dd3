import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { createPageUrl } from '@/utils';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/search/SearchBar';
import QuickAccessCards from '@/components/home/QuickAccessCards';
import CategoryGrid from '@/components/home/CategoryGrid';
import AideCard from '@/components/cards/AideCard';
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Clock,
  Heart,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const { data: aidesUrgentes = [] } = useQuery({
    queryKey: ['aides-urgentes'],
    queryFn: () => client.entities.Aide.filter({ est_urgent: true, statut: 'publie' }, '-created_date', 3),
  });

  const { data: dernieresAides = [] } = useQuery({
    queryKey: ['dernieres-aides'],
    queryFn: () => client.entities.Aide.filter({ statut: 'publie' }, '-created_date', 6),
  });

  const { data: actualites = [] } = useQuery({
    queryKey: ['actualites-home'],
    queryFn: () => client.entities.Actualite.filter({ statut: 'publie' }, '-date_publication', 3),
  });

  const handleSearch = (searchParams) => {
    const params = new URLSearchParams();
    if (searchParams.query) params.set('q', searchParams.query);
    if (searchParams.categorie) params.set('categorie', searchParams.categorie);
    if (searchParams.departement) params.set('departement', searchParams.departement);
    if (searchParams.urgent) params.set('urgent', 'true');
    window.location.href = createPageUrl('Aides') + '?' + params.toString();
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Accueil"
        description="Trouvez les aides sociales, les démarches administratives et les structures d'accompagnement près de chez vous. Site gratuit et accessible."
        path="/"
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Trouvez les aides et les services
            <br className="hidden md:block" />
            <span className="text-blue-200">près de chez vous</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Un site simple et gratuit pour trouver des aides,
            des démarches expliquées pas à pas, et des structures d'accompagnement.
          </p>

          {/* Barre de recherche */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-2xl max-w-3xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Accès rapides */}
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8">
            Comment pouvons-nous vous aider ?
          </h2>
          <QuickAccessCards />
        </div>
      </section>

      {/* Aides urgentes */}
      {aidesUrgentes.length > 0 && (
        <section className="py-12 bg-red-50 border-y border-red-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                Aides pour les situations urgentes
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {aidesUrgentes.map((aide) => (
                <AideCard key={aide.id} aide={aide} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Catégories */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8">
            Explorer par catégorie
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* Dernières aides */}
      {dernieresAides.length > 0 && (
        <section className="py-12 md:py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Dernières aides ajoutées
              </h2>
              <Link to={createPageUrl('Aides')}>
                <Button variant="outline" className="hidden md:flex">
                  Voir toutes les aides
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dernieresAides.map((aide) => (
                <AideCard key={aide.id} aide={aide} compact />
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link to={createPageUrl('Aides')}>
                <Button>
                  Voir toutes les aides
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Engagements */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">
            Notre engagement
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Informations vérifiées
              </h3>
              <p className="text-slate-600">
                Toutes nos informations viennent de sources officielles et sont vérifiées régulièrement.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Site gratuit et sans pub
              </h3>
              <p className="text-slate-600">
                AccesDirectAide est un site non lucratif. Pas de publicité, pas de revente de données.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Accessible à tous
              </h3>
              <p className="text-slate-600">
                Le site est conçu pour être lisible par tous, avec un langage simple et clair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Actualités */}
      {actualites.length > 0 && (
        <section className="py-12 md:py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Dernières actualités
              </h2>
              <Link to={createPageUrl('Actualites')}>
                <Button variant="outline">
                  Toutes les actus
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {actualites.map((actu) => (
                <div key={actu.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="text-sm text-slate-500 mb-2">
                    {new Date(actu.date_publication).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{actu.titre}</h3>
                  <p className="text-slate-600 text-sm line-clamp-3">{actu.contenu}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 md:py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Vous ne trouvez pas ce que vous cherchez ?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Notre assistant peut vous aider à trouver la bonne aide ou la bonne structure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Contact')}>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Nous contacter
              </Button>
            </Link>
            <Link to={createPageUrl('Annuaire')}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-blue-600">
                Trouver une structure
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Avertissement */}
      <section className="py-8 bg-slate-100 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-slate-600">
            ℹ️ Ce site informe et oriente. Il ne remplace pas l'administration ou un professionnel.
            En cas de doute, contactez toujours l'organisme concerné.
          </p>
        </div>
      </section>
    </div>
  );
}