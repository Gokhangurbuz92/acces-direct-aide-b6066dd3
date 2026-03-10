import SEO from '@/components/SEO';
import { Cookie, ShieldCheck, PieChart, Info, Settings2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO
        title="Cookies et Mesure d'Audience"
        description="Politique cookies d'AccesDirectAide : confidentialité avant tout. Zéro cookie de tracking publicitaire, zéro bandeau cookie."
        path="/cookies"
      />

      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-16 pb-24 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 mb-6 ring-1 ring-teal-500/30">
            <Cookie className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-50">Politique Cookies</h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Ici, pas de bandeau agaçant. Parce que nous avons fait le choix de respecter votre vie privée dès la conception (Privacy by Design).
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">

        {/* Le Secret du "sans bandeau" */}
        <Card className="border-green-200 bg-green-50/50 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 text-green-700 rounded-full mt-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-2">
                  Pourquoi n'avez-vous pas vu de bandeau d'acceptation ?
                </h2>
                <p className="text-green-800/80 leading-relaxed mb-4">
                  Selon la CNIL et le RGPD, le consentement n'est exigé que si un site dépose des traceurs publicitaires ou transmet des données comportementales. <strong>Nous avons refusé ces pratiques.</strong>
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>0 traceur de reciblage publicitaire</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>0 revente de profil comportemental</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>0 connexion croisée avec les réseaux sociaux</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mesure d'audience sans IP */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <PieChart className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Mesure d'audience (Statistiques)</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Pour comprendre si notre plateforme vous est réellement utile (quelles pages sont lues, depuis quelle région globale), nous utilisons la solution <strong>Vercel Web Analytics</strong>.
                </p>
                <p>
                  Cette solution <strong>ne dépose aucun cookie</strong> et a été certifiée "Privacy-First" :
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Votre adresse IP est cryptographiée (hachée) et jamais stockée en clair.</li>
                  <li>Incapable de suivre votre navigation entre différents jours ou différents sites.</li>
                  <li>Entièrement conforme à l'exemption de consentement de la directive ePrivacy.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Settings2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Cookies Absolument Nécessaires (Techniques)</h2>
              </div>
              <div className="space-y-4 text-slate-700 leading-relaxed px-2">
                <p>
                  Afin que l'application fonctionne correctement, nous devons mémoriser quelques éléments essentiels dans votre navigateur (local storage ou cookies de session). Ils sont exemptés de consentement.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-1">Préférences visuelles</h3>
                    <p className="text-sm text-slate-600 mb-2">Sauvegarde le mode d'accessibilité, la taille de police, et le mode nuit/jour.</p>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-700 rounded">Permanent (Local Storage)</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-1">Session sécurisée</h3>
                    <p className="text-sm text-slate-600 mb-2">Vous permet de rester connecté sur l'Espace Pro ou lors d'une démarche sensible.</p>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-700 rounded">Cookie de session</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Info className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Comment paramétrer vos cookies ?</h2>
              </div>
              <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                <p>
                  Bien que nous n'utilisions aucun cookie malsain, vous restez maître de votre navigateur. Vous pouvez bloquer la création de tout stockage dans vos paramètres :
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">Chrome: Paramètres → Confidentialité</span>
                  <span className="px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">Firefox: Options → Vie privée</span>
                  <span className="px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">Safari: Préférences → Confidentialité</span>
                </div>
                <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-3 rounded border border-amber-100">
                  ⚠️ Note : Si vous bloquez les cookies fonctionnels, l'Espace Pro et nos outils d'accessibilité (boutons dyslexie, polices) cesseront de fonctionner.
                </p>
              </div>
              <p className="text-sm mt-8 text-slate-500 border-t border-slate-100 pt-4">
                Dernière mise à jour : <span suppressHydrationWarning>{new Date().toLocaleDateString('fr-FR')}</span>
              </p>
            </section>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
