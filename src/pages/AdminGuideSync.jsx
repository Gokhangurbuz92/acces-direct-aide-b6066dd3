
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, PlayCircle, CheckCircle2 } from 'lucide-react';

export default function AdminGuideSync() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Guide : Lancer les synchronisations
        </h1>
        <p className="text-slate-600 mb-8">
          Comment exécuter les fonctions backend depuis le dashboard Base44
        </p>

        {/* Étape 1 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">1</span>
              Accéder au dashboard Functions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              Rendez-vous sur le dashboard Base44 et accédez à la section <strong>Functions</strong>.
            </p>
            <Button asChild>
              <a href="https://client.io/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir le dashboard Base44
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Étape 2 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">2</span>
              Lancer daily_sync_official_sources (Aides)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-100 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Test 1 : Dry-run (sans écriture)</h3>
              <p className="text-sm text-slate-600 mb-2">Paramètres à passer :</p>
              <pre className="bg-slate-800 text-slate-100 p-3 rounded text-sm overflow-x-auto">
                {`{
  "limit": 5,
    "dry_run": true
} `}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Test 2 : Run réel</h3>
              <p className="text-sm text-blue-800 mb-2">Paramètres à passer :</p>
              <pre className="bg-slate-800 text-slate-100 p-3 rounded text-sm overflow-x-auto">
                {`{
  "limit": 15,
    "dry_run": false
} `}
              </pre>
              <p className="text-xs text-blue-700 mt-2">
                ⚠️ Ce run va créer des fiches Aide en base (statut NeedsReview)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Étape 3 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">3</span>
              Lancer weekly_sync_structures_official (Structures)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-100 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Test 1 : Dry-run</h3>
              <p className="text-sm text-slate-600 mb-2">Paramètres à passer :</p>
              <pre className="bg-slate-800 text-slate-100 p-3 rounded text-sm overflow-x-auto">
                {`{
  "limit": 100,
    "dry_run": true
} `}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Test 2 : Run réel</h3>
              <p className="text-sm text-blue-800 mb-2">Paramètres à passer :</p>
              <pre className="bg-slate-800 text-slate-100 p-3 rounded text-sm overflow-x-auto">
                {`{
  "limit": 500,
    "dry_run": false
} `}
              </pre>
              <p className="text-xs text-blue-700 mt-2">
                ⚠️ Ce run va créer/mettre à jour des structures en base
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Étape 4 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">4</span>
              Vérifier les UpdateLog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Après chaque exécution, un UpdateLog est créé automatiquement.
              Vous pouvez consulter les logs via :
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                La page <a href="/admin-sync" className="text-blue-600 hover:underline">Admin Sync</a> (historique des syncs)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                La console de sortie de la fonction dans le dashboard Base44
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Directement dans l'entité UpdateLog
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Étape 5 optionnelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold">5</span>
              (Optionnel) Lancer archive_not_seen_structures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Cette fonction archive les structures non vues depuis 60 jours.
              Elle ne nécessite pas de paramètres.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                ⚠️ Au tout premier jour, cette fonction ne fera probablement rien
                car aucune structure n'a dépassé les 60 jours. Vous pouvez l'exécuter
                plus tard ou sauter cette étape pour l'instant.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Une fois les tests effectués
          </h3>
          <p className="text-sm text-green-800">
            Revenez avec les 2 UpdateLog (daily_sync + weekly_sync) pour validation
            avant le go-live final.
          </p>
        </div>
      </div>
    </div>
  );
}
