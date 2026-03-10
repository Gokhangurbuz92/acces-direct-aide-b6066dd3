import SEO from '@/components/SEO';
import { Database, Search, Sparkles, BookOpenCheck, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SourcesMethode() {
  const sources = [
    {
      id: 'aides-territoires',
      name: 'Aides-Territoires (Beta.gouv.fr)',
      url: 'https://aides-territoires.beta.gouv.fr',
      notes: 'Base de données nationale et locale des aides publiques',
      trust_level: 'officiel'
    },
    {
      id: 'openfisca',
      name: 'OpenFisca',
      url: 'https://openfisca.org',
      notes: 'Moteur de calcul du système socio-fiscal français',
      trust_level: 'officiel'
    },
    {
      id: 'service-public',
      name: 'Service-Public.fr',
      url: 'https://www.service-public.fr',
      notes: 'Informations administratives et droits',
      trust_level: 'officiel'
    },
    {
      id: 'data-gouv',
      name: 'Data.gouv.fr',
      url: 'https://www.data.gouv.fr',
      notes: 'Plateforme ouverte des données publiques',
      trust_level: 'officiel'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="Sources et Méthode FALC"
        description="Comment nous trouvons et simplifions l'information sur les aides avec l'Open Data et l'IA (FALC)."
        path="/sources-et-methode"
      />

      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-16 pb-24 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 mb-6 ring-1 ring-teal-500/30">
            <BookOpenCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-50">Sources & Méthodologie</h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            La transparence est la base de la confiance. Découvrez l'exigence avec laquelle nous récoltons et vulgarisons l'information.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-8">

        {/* Le travail de l'IA démystifié */}
        <Card className="border-teal-200 bg-teal-50/50 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-100 text-teal-700 rounded-full mt-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-teal-900 mb-3">
                  Le rôle de l'IA ? Traduire, pas inventer.
                </h2>
                <div className="space-y-3 text-teal-900/80 leading-relaxed text-sm">
                  <p>
                    L'Intelligence Artificielle (notre moteur LLM fermé et audité) que nous utilisons a un protocole unique : <strong>le FALC (Facile À Lire et à Comprendre).</strong>
                  </p>
                  <p>
                    Elle est programmée pour prendre un texte juridique officiel (par exemple le Code de l'Action Sociale de 5 pages) et de le recracher sous forme de liste à puces simple, avec un vocabulaire accessible à tous.
                  </p>
                  <div className="bg-white/60 p-3 rounded-lg border border-teal-200 font-medium">
                    L'IA d'Accès Direct Aide refuse d'inventer des conditions ou de générer des montants. Si le texte de loi source ne contient pas le chiffre exact, elle n'en mettra pas.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-8">

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Origine Gouvernementale</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Nos robots moissonnent l'Open-Data. Les aides affichées sur cette plateforme tirent directement leur source des bases de données institutionnelles de l'État et des régions.
                </p>
                <div className="grid gap-3 mt-4">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          {source.name}
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hidden sm:inline-flex">
                            {source.trust_level === 'officiel' ? 'Fiabilité État' : 'Vérifié'}
                          </Badge>
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{source.notes}</p>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition"
                        title={`Visiter ${source.url}`}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Notre charte qualité des données</h2>
              </div>
              <div className="space-y-4 px-2">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Mises à jour régulières</h4>
                    <p className="text-sm text-slate-600">Notre connecteur se synchronise aux bases gouvernementales pour assurer la fraîcheur des dispositifs. Les fiches obsolètes sont passées en "Archivé".</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Traçabilité complète</h4>
                    <p className="text-sm text-slate-600">Chaque fiche aide affiche obligatoirement un bouton "Voir sur le site officiel" afin que l'usager puisse toujours retourner à la source originelle.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Ce que nous refusons */}
            <div className="p-6 bg-red-50/50 border border-red-100 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Lignes rouges absolues
              </h2>
              <ul className="space-y-2 text-sm text-red-800">
                <li className="flex items-center gap-2"><span className="font-bold">❌</span> Scraper des blogs ou forums non-sourcés</li>
                <li className="flex items-center gap-2"><span className="font-bold">❌</span> Affirmer l'éligibilité formelle d'un usager (seuls les simulateurs officiels comme Mes-Droit-Sociaux font foi)</li>
                <li className="flex items-center gap-2"><span className="font-bold">❌</span> Proposer des numéros payants "surtaxés" pour joindre les administrations</li>
              </ul>
            </div>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Boucle d'amélioration humaine</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Les institutions et les citoyens peuvent à tout moment corriger une aide qui comporterait une coquille via le bouton de <strong>Signalement</strong>. Un administrateur local corrige la donnée maîtresse sous 48 heures ouvrées max.
                </p>
                <a href="/contact?sujet=signalement_erreur" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:underline mt-2">
                  Signaler une erreur sur la base de données
                </a>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}