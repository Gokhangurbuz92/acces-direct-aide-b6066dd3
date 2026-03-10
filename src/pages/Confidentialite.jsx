import SEO from '@/components/SEO';
import { Lock, EyeOff, UserCheck, ShieldAlert, Database, HelpCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="Politique de Confidentialité"
        description="Traitements de données, sécurité Zero-Knowledge, bases légales, et droits RGPD sur AccesDirectAide."
        path="/politique-confidentialite"
      />

      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-16 pb-24 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6 ring-1 ring-indigo-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-50">Politique de Confidentialité</h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Vos données de vie privée ne sont ni une marchandise, ni une monnaie d'échange. Elles vous appartiennent.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">

        {/* Engagement Fondamental */}
        <Card className="border-indigo-200 bg-indigo-50/50 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full mt-1">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-indigo-900 mb-2">
                  Notre Engagement Strict
                </h2>
                <p className="text-indigo-800/80 leading-relaxed">
                  Accès Direct Aide est un service de bien commun. <strong>Nous lisons 0 donnée, nous exploitons 0 donnée personnelle.</strong><br /><br />
                  La fondation de notre architecture est le <strong>"Zero-Knowledge"</strong> (Zéro Connaissance). Cela signifie que même si nous le voulions, nos administrateurs généraux <em>(SuperAdmin)</em> n'ont pas la clé de déchiffrement pour lire les informations sensibles stockées par les usagers ou travailleurs sociaux.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Détails */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-8">

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Données collectées et cycle de vie</h2>
              </div>

              <div className="space-y-5 text-slate-700 leading-relaxed px-2">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>1. Navigation grand public (Anonyme)
                  </h3>
                  <p className="text-sm">Votre lecture des informations se fait de façon anonyme. Pas d'adresse IP sauvegardée en base, pas de profilage au niveau du serveur. Le moteur de recherche est exécuté localement dans votre navigateur pour une réactivité optimale et sans espionnage côté serveur.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>2. Espace Usager (Connecté)
                  </h3>
                  <p className="text-sm">Nous chiffrons les données (nom, prénoms, numéro CAF si renseigné) de bout en bout. Conservation : <strong>Max 2 ans d'inactivité</strong>, avec proposition de suppression automatique.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>3. Assistant IA (Boussole)
                  </h3>
                  <p className="text-sm">Les questions posées à l'assistant d'orientation ou "FALC" ne sont pas liées à votre identité personnelle et ne sont utilisées pur et dur que pour formuler la réponse immédiate. <strong>Ne lui transmettez jamais votre numéro de sécu ni de données de santé ou bancaires.</strong></p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Vos droits (RGPD) et le DPO</h2>
              </div>

              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Gökhan GURBUZ agit en tant que <strong>Délégué à la Protection des Données (DPO)</strong> pour le projet Accès Direct Aide. Vous disposez du contrôle absolu :
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <strong className="text-slate-900 block mb-1">Droit d'accès et Portabilité</strong>
                    <span className="text-sm">Exportez vos données en un clic depuis les paramètres de votre compte (Espace Pro/Usager).</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <strong className="text-slate-900 block mb-1">Droit à l'oubli ("Nuke")</strong>
                    <span className="text-sm">Le bouton "Supprimer mon compte" efface le compte, vos fichiers liés, et purge votre ID de la BDD instantanément.</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100 sm:col-span-2">
                    <strong className="text-slate-900 block mb-1">Droit de contact direct</strong>
                    <span className="text-sm">Pour toute demande complexe sans compte, contactez-nous : <code>dpo@accesdirectaide.fr</code> ou utilisez notre formulaire. Réponse en 10 jours ouvrés maximum garantie par charte.</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <EyeOff className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Ce que nous ne ferons JAMAIS</h2>
              </div>

              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <ul className="list-none space-y-3 text-sm">
                  <li className="flex gap-2 items-start"><span className="text-red-500 font-bold">✕</span> <span>Vendre une liste d'adresses emails de personnes en situation de précarité (pratique que nous combattons vigoureusement).</span></li>
                  <li className="flex gap-2 items-start"><span className="text-red-500 font-bold">✕</span> <span>Transmettre vos données de compte à Pôle Emploi, à la CAF ou à la police sans mandat judiciaire d'un magistrat français.</span></li>
                  <li className="flex gap-2 items-start"><span className="text-red-500 font-bold">✕</span> <span>Entraîner les intelligences artificielles "publiques" avec vos cas personnels ou vos pièces jointes de dossier.</span></li>
                </ul>

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
