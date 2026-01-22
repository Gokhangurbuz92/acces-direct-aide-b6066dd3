import React from 'react';
import { client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Shield, 
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export default function SourcesMethode() {
  const { data: sources = [] } = useQuery({
    queryKey: ['sources-public'],
    queryFn: () => client.entities.Source.filter({ status: 'actif' }, 'name'),
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Sources et méthode
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Comment nous garantissons des informations fiables et à jour
        </p>

        {/* Notre engagement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Notre engagement : zéro intox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Uniquement des sources officielles
                </h3>
                <p className="text-slate-600">
                  Toutes nos informations viennent de sites gouvernementaux, 
                  d'administrations publiques ou d'organismes officiels vérifiés.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Pas de chiffres inventés
                </h3>
                <p className="text-slate-600">
                  Notre système de génération automatique de contenus refuse d'inventer 
                  des montants, des dates ou des conditions. Si un chiffre apparaît, 
                  il vient toujours de la source officielle.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Mises à jour régulières
                </h3>
                <p className="text-slate-600">
                  Nos informations sont vérifiées automatiquement chaque jour. 
                  Chaque fiche indique sa date de dernière vérification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Traçabilité complète
                </h3>
                <p className="text-slate-600">
                  Chaque information affiche sa source officielle avec un lien direct. 
                  Vous pouvez toujours vérifier vous-même.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sources actives */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Nos sources actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sources.map((source) => (
                <div 
                  key={source.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{source.name}</h3>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      {source.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {source.notes && (
                      <p className="text-sm text-slate-600 mt-2">{source.notes}</p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {source.trust_level === 'officiel' ? 'Officiel' : 'Vérifié'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ce que nous refusons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Ce que nous refusons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700">
              ❌ Les informations non vérifiables (blogs, forums, réseaux sociaux)
            </p>
            <p className="text-slate-700">
              ❌ Les contenus publicitaires ou promotionnels
            </p>
            <p className="text-slate-700">
              ❌ Les informations sans date de vérification
            </p>
            <p className="text-slate-700">
              ❌ Les montants ou conditions approximatifs
            </p>
          </CardContent>
        </Card>

        {/* Comment signaler */}
        <Card>
          <CardHeader>
            <CardTitle>Signaler une erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Si vous repérez une information inexacte, obsolète ou manquante, 
              vous pouvez nous le signaler :
            </p>
            <ul className="space-y-2 text-slate-700">
              <li>• Sur chaque fiche, utilisez le bouton "Signaler une erreur"</li>
              <li>• Via notre <a href="/contact" className="text-blue-600 hover:underline">formulaire de contact</a></li>
              <li>• En précisant toujours la page concernée et la source exacte si possible</li>
            </ul>
            <p className="text-sm text-slate-600 mt-4">
              Nous traitons chaque signalement sous 48h ouvrées.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}