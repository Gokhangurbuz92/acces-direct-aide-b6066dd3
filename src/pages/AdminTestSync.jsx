import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, Database, Activity, Loader2 } from 'lucide-react';
import { adminClient as client } from '@/api/client';
import { useMutation } from '@tanstack/react-query';

export default function AdminTestSync() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Tests Backend - Go-Live
        </h1>
        <p className="text-slate-600 mb-8">
          Checklist des tests à effectuer avant ouverture publique
        </p>

        {/* Diagnostic Ping */}
        <DiagnosticPingCard />

        {/* Tests Sync Aides */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              A) Sync Aides (daily_sync_official_sources)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">1️⃣ Dry-run (test sans écriture)</h3>
              <p className="text-sm text-slate-600 mb-2">Paramètres : limit=5, write=false</p>
              <div className="bg-slate-100 rounded-lg p-3 text-sm font-mono text-slate-700">
                Vérifier : parsing OK + filtres OK + génération FALC OK
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">2️⃣ Run réel</h3>
              <p className="text-sm text-slate-600 mb-2">Paramètres : limit=15, write=true</p>
              <div className="bg-slate-100 rounded-lg p-3 text-sm">
                <p className="font-semibold text-slate-900 mb-2">À vérifier dans UpdateLog :</p>
                <ul className="space-y-1 text-slate-700">
                  <li>✓ duration_ms &lt; 180000 (3 min max)</li>
                  <li>✓ items_fetched_count ≈ 15</li>
                  <li>✓ items_created_count &gt; 0</li>
                  <li>✓ Toutes en status=NeedsReview (aucune publiée auto)</li>
                  <li>✓ items_skipped_count logique (doublons/hors-territoire)</li>
                  <li>✓ Source.last_sync mis à jour</li>
                  <li>✓ Pas d'erreurs LLM répétées</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests Sync Structures */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              B) Sync Structures (weekly_sync_structures_official)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">1️⃣ Dry-run</h3>
              <p className="text-sm text-slate-600 mb-2">Paramètres : limit=100, write=false</p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">2️⃣ Run réel</h3>
              <p className="text-sm text-slate-600 mb-2">Paramètres : limit=500, write=true</p>
              <div className="bg-slate-100 rounded-lg p-3 text-sm">
                <p className="font-semibold text-slate-900 mb-2">À vérifier dans UpdateLog :</p>
                <ul className="space-y-1 text-slate-700">
                  <li>✓ Pas de doublons (external_id/canonical_url)</li>
                  <li>✓ items_skipped_count &gt; 0 au 2e run</li>
                  <li>✓ Structures Published ssi coverage=OFFICIAL</li>
                  <li>✓ last_seen_at renseigné sur toutes</li>
                  <li>✓ Structures hors 67/68 rejetées</li>
                  <li>✓ duration_ms acceptable</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests Archivage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              C) Archivage (archive_not_seen_structures)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">1️⃣ Preview/dry-run</h3>
              <p className="text-sm text-slate-600">Compter combien seraient archivées (last_seen_at &lt; now-60j)</p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">2️⃣ Run réel</h3>
              <div className="bg-slate-100 rounded-lg p-3 text-sm">
                <ul className="space-y-1 text-slate-700">
                  <li>✓ Archive seulement si last_seen_at &lt; 60j</li>
                  <li>✓ notes contient "Archivé auto... non vue depuis 60j"</li>
                  <li>✓ Ne touche pas les seed Draft si voulu</li>
                  <li>✓ Retourne archived_count</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contrôles UI */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              D) Contrôles UI publiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-slate-400">□</span>
                Annuaire public : confirmer Draft/a_verifier/Archived invisibles
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">□</span>
                Fiche Structure affiche label FALC coverage (Source officielle / Open data local / À vérifier)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">□</span>
                Pages accessibles depuis footer : Sources & méthode, Accessibilité, Mentions légales, Confidentialité, Cookies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">□</span>
                Avertissement visible : "Ce site informe et oriente..."
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">□</span>
                Chatbot affiche disclaimer transparence
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Critères KO */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Critères d'échec (KO) - Ne pas lancer en prod
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-800 space-y-2">
            <p>❌ Sync Aides : created_count=0 alors que fetch&gt;0 (parsing cassé)</p>
            <p>❌ Sync Aides : erreurs LLM répétées/timeouts</p>
            <p>❌ Sync Structures : doublons créés au lieu d'updater</p>
            <p>❌ Sync Structures : last_seen_at vide (archivage impossible)</p>
            <p>❌ Structures non officielles en Published</p>
            <p>❌ UI : Draft/a_verifier visibles en public</p>
          </CardContent>
        </Card>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Pour valider le go-live</h3>
          <p className="text-sm text-blue-800">
            Après les tests, fournir :
          </p>
          <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
            <li>UpdateLog complet du run réel Aides</li>
            <li>UpdateLog complet du run réel Structures</li>
            <li>Confirmation que tous les contrôles UI sont OK</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function DiagnosticPingCard() {
  const [result, setResult] = useState(null);

  const pingMutation = useMutation({
    mutationFn: async () => {
      void('Invoking debug_ping...');
      return await client.functions.invoke('debug_ping', { hello: 'world' });
    },
    onSuccess: (data) => {
      void('Ping success:', data);
      setResult({ success: true, data });
    },
    onError: (error) => {
      console.error('Ping failed:', error);
      setResult({ success: false, error });
    }
  });

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Diagnostic Rapide (debug_ping)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-4">
              Vérifie que le backend répond et peut écrire dans la base de données (UpdateLog).
              Utile si les synchronisations ne semblent rien produire.
            </p>
            {result && (
              <div className={`text-xs font-mono p-3 rounded mb-4 overflow-auto max-h-40 ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                <pre>{JSON.stringify(result.data || result.error, null, 2)}</pre>
              </div>
            )}
          </div>
          <Button
            onClick={() => pingMutation.mutate()}
            disabled={pingMutation.isPending}
          >
            {pingMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Lancer Ping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}