import SEO from '@/components/SEO';
import { Scale, Building2, Server, FileText, AlertTriangle, ExternalLink, Mail } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="Mentions légales"
        description="Informations légales : éditeur, hébergement, responsabilités et contact du site AccesDirectAide."
        path="/mentions-legales"
      />

      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-16 pb-24 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 mb-6 ring-1 ring-blue-500/30">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-50">Mentions Légales</h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Transparence, souveraineté des données et cadre légal de la plateforme publique Accès Direct Aide.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <Card className="border-slate-200 shadow-md">
          <CardContent className="p-6 md:p-10 space-y-12">

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">1. Éditeur de la plateforme</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p><strong>Nom du service :</strong> Accès Direct Aide (accesdirectaide.fr)</p>
                <p><strong>Nature du projet :</strong> Service public d'information non lucratif, civique et solidaire.</p>
                <p><strong>Structure juridique :</strong> Association loi 1908 (Droit local Alsace-Moselle) - <em>En cours d'immatriculation au Registre des Associations du Tribunal de Proximité de Strasbourg.</em></p>
                <p><strong>Numéro SIRET :</strong> <em>[En attente d'immatriculation]</em></p>
                <p><strong>Territoire d'action :</strong> Déploiement initial en Alsace (Bas-Rhin 67, Haut-Rhin 68) et aides nationales, avec la France entière à terme.</p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Server className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">2. Hébergement & Infrastructures</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Dans une démarche stricte de souveraineté des données et de conformité RGPD, l'ensemble de notre infrastructure technique est localisée au sein de l'Union Européenne :
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                  <li><strong>Hébergement de l'application (Frontend/Backend) :</strong> Vercel Inc. — Serveurs physiquement localisés à Francfort, Allemagne (Région <code>fra1</code>).</li>
                  <li><strong>Hébergement de la base de données :</strong> Neon (Serverless Postgres) — Serveurs physiquement localisés à Francfort, Allemagne (Région <code>eu-central-1</code>).</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">3. Propriété intellectuelle et Open Data</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Le code source de la plateforme, la structure, l'identité visuelle et les textes originaux
                  sont la propriété exclusive de l'association éditrice.
                </p>
                <p>
                  Les données consultables concernant les aides (titres, montants, critères, délais) sont
                  issues de <strong>l'Open Data gouvernemental</strong> (Aides-Territoires, OpenFisca, API data.gouv.fr, API Mes-Aides) et des collectivités publiques territoriales.
                </p>
                <p>
                  Les "Résumés AI (FALC - Facile À Lire et à Comprendre)" sont générés dynamiquement et ne
                  substituent en aucun cas la source légale originale à laquelle ils font systématiquement référence.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">4. Responsabilité & Limites</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Accès Direct Aide est un facilitateur de droits. Nous concevons la plateforme avec la plus grande rigueur technique (architecture Zero-Knowledge pour la sécurité) et humaine, mais le site ne possède <strong>aucun caractère décisionnel ou réglementaire</strong>.
                </p>
                <p>
                  Toutes les informations (montants, conditions) sont données à titre purement indicatif pour orienter le public.
                  En cas de litige, désaccord ou doute, seules les décisions officielles de la CAF, MSA, CPAM, France Travail, des Conseils Départementaux (CeA) ou de tout autre organisme public feront foi.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">5. Nous contacter</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Pour toute question d'ordre légal, concernant des droits d'auteurs, un signalement de sécurité (bug bounty) ou nos conditions d'utilisation, veuillez contacter notre équipe :
                </p>
                <p className="mt-4">
                  <a href="/contact" className="text-blue-600 font-medium hover:text-blue-700 hover:underline inline-flex items-center gap-1">
                    Remplir notre formulaire de contact <ExternalLink className="w-4 h-4" />
                  </a>
                </p>
                <p className="text-sm mt-8 text-slate-500 border-t border-slate-100 pt-4">
                  Dernière mise à jour : <span suppressHydrationWarning>{new Date().toLocaleDateString('fr-FR')}</span>
                </p>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
