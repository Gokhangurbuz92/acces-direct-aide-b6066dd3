
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Shield,
  Heart,
  Users,
  Target,
  BookOpen,
  ExternalLink
} from 'lucide-react';

export default function APropos() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            À propos d'AccesDirectAide
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Un site gratuit et sans but lucratif pour vous aider à trouver 
            les aides et les services dont vous avez besoin.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Notre mission */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Target className="h-7 w-7 text-blue-600" />
            Notre mission
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed">
              AccesDirectAide est né d'un constat simple : trouver les bonnes aides 
              et comprendre les démarches administratives peut être très compliqué.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Notre objectif est de rendre ces informations accessibles à tous, 
              avec des explications simples et claires, dans un langage que tout le monde peut comprendre.
            </p>
          </div>
        </section>

        {/* Nos engagements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-600" />
            Nos engagements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Informations vérifiées</h3>
                    <p className="text-slate-600 text-sm">
                      Toutes nos informations proviennent de sources officielles 
                      (sites de l'État, CAF, CPAM, etc.) et sont vérifiées régulièrement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Zéro fake news</h3>
                    <p className="text-slate-600 text-sm">
                      Nous ne publions jamais d'informations non vérifiées. 
                      En cas de doute, nous préférons ne pas publier.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">100% gratuit</h3>
                    <p className="text-slate-600 text-sm">
                      AccesDirectAide est un site non lucratif. Pas de publicité, 
                      pas de revente de données, pas de frais cachés.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Accessible à tous</h3>
                    <p className="text-slate-600 text-sm">
                      Le site est conçu pour être utilisable par tous : 
                      langage simple, navigation facile, compatible avec les lecteurs d'écran.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Langage FALC */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-blue-600" />
            Notre façon d'écrire
          </h2>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <p className="text-slate-700 mb-4">
                Nous utilisons le <strong>Facile à Lire et à Comprendre (FALC)</strong>, 
                une méthode d'écriture qui rend les textes accessibles à tous.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  Des phrases courtes et simples
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  Des mots de tous les jours
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  Pas de jargon administratif
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  Des explications concrètes avec des exemples
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Sources */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Nos sources
          </h2>
          <p className="text-slate-600 mb-6">
            Nous utilisons uniquement des sources officielles et fiables :
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: 'Service-Public.fr', url: 'https://www.service-public.fr' },
              { name: 'CAF.fr', url: 'https://www.caf.fr' },
              { name: 'Ameli.fr', url: 'https://www.ameli.fr' },
              { name: 'France Travail', url: 'https://www.francetravail.fr' },
              { name: 'MDPH', url: 'https://www.monparcourshandicap.gouv.fr' },
              { name: 'Data.gouv.fr', url: 'https://www.data.gouv.fr' },
            ].map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <span className="font-medium text-slate-900">{source.name}</span>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Vous avez une question ou une suggestion ?
          </h2>
          <Link to={createPageUrl('Contact')}>
            <Button size="lg">
              Nous contacter
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}