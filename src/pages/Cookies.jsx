
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Cookie } from 'lucide-react';
import SEO from '@/components/SEO';

export default function Cookies() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEO
        title="Cookies"
        description="Politique cookies d'AccesDirectAide: cookies necessaires uniquement et absence de tracking marketing."
        path="/cookies"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Cookies
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Comment nous utilisons les cookies sur ce site
        </p>

        {/* Notre politique */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-blue-600" />
              Pas de cookies publicitaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              AccesDirectAide est un site non lucratif. Nous n'utilisons
              <strong> aucun cookie publicitaire ou de tracking marketing</strong>.
            </p>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-slate-700">
                Pas de revente de données, pas de profilage, pas de publicité ciblée.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookies utilisés */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cookies strictement nécessaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Nous utilisons uniquement des cookies essentiels au fonctionnement du site :
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Préférences d'accessibilité
                </h3>
                <p className="text-slate-600 text-sm mb-2">
                  Mémorise vos choix : taille du texte, contraste élevé, mode sombre
                </p>
                <p className="text-xs text-slate-500">
                  Durée : Permanent (jusqu'à suppression manuelle)
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Session de navigation
                </h3>
                <p className="text-slate-600 text-sm mb-2">
                  Permet de maintenir votre session si vous utilisez l'assistant
                </p>
                <p className="text-xs text-slate-500">
                  Durée : Session (supprimé à la fermeture du navigateur)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestion */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Gérer les cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Les cookies que nous utilisons sont strictement nécessaires au bon
              fonctionnement du site. Vous pouvez néanmoins les désactiver via
              les paramètres de votre navigateur :
            </p>

            <ul className="space-y-2 text-slate-700 mb-4">
              <li>• <strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
              <li>• <strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies</li>
              <li>• <strong>Safari :</strong> Préférences → Confidentialité</li>
              <li>• <strong>Edge :</strong> Paramètres → Confidentialité → Cookies</li>
            </ul>

            <p className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              ⚠️ Attention : désactiver tous les cookies peut empêcher le bon fonctionnement
              du site (par exemple, vos préférences d'accessibilité ne seront pas sauvegardées).
            </p>
          </CardContent>
        </Card>

        {/* Pas de consentement */}
        <Card>
          <CardHeader>
            <CardTitle>Pourquoi pas de bandeau de consentement ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">
              Les cookies strictement nécessaires au fonctionnement d'un site
              ne nécessitent pas de consentement préalable selon le RGPD et la CNIL.
              C'est pourquoi vous ne verrez pas de bandeau de cookies sur AccesDirectAide.
            </p>
            <p className="text-sm text-slate-600">
              Inventaire technique actuel : aucun script Google Analytics, GTM, Matomo, Plausible
              ou PostHog n'est actif sur le site public.
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-sm text-tertiary text-center">
          <span suppressHydrationWarning>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
        </p>
      </div>
    </div>
  );
}
