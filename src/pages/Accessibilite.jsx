import React from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Eye, Keyboard, Type } from 'lucide-react';

export default function Accessibilite() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEO
        title="Accessibilité"
        description="Un site conçu pour être accessible à tous"
        path="/accessibilite"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Accessibilité
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Un site conçu pour être accessible à tous
        </p>

        {/* Engagement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Notre engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              AccesDirectAide s'engage à rendre son site accessible au plus grand nombre, 
              conformément aux standards WCAG 2.1 niveau AA.
            </p>
            <p className="text-slate-700">
              Nous travaillons continuellement à améliorer l'accessibilité pour que 
              chacun puisse accéder facilement aux informations, quelles que soient 
              ses capacités ou son équipement.
            </p>
          </CardContent>
        </Card>

        {/* Fonctionnalités */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="h-5 w-5 text-blue-600" />
                Taille du texte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">
                Utilisez les boutons A- / A+ en haut de page pour agrandir ou 
                réduire la taille du texte selon vos besoins.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-blue-600" />
                Contraste élevé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">
                Activez le mode contraste élevé pour améliorer la lisibilité 
                si vous avez des difficultés visuelles.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Keyboard className="h-5 w-5 text-blue-600" />
                Navigation clavier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">
                Tout le site est navigable au clavier. Utilisez la touche Tab 
                pour passer d'un élément à l'autre.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Langage simple
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">
                Tous nos contenus sont rédigés en langage facile inspiré du FALC 
                (Facile à Lire et à Comprendre).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compatibilité */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Compatibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Ce site est compatible avec :
            </p>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Les lecteurs d'écran (NVDA, JAWS, VoiceOver)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Les navigateurs récents (Chrome, Firefox, Safari, Edge)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Les appareils mobiles (smartphones et tablettes)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Les outils d'agrandissement d'écran
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contenus */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contenus accessibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Textes</h3>
              <p className="text-slate-700">
                Phrases courtes, vocabulaire simple, structure claire avec des titres 
                et sous-titres.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Images</h3>
              <p className="text-slate-700">
                Toutes les images importantes ont une description alternative 
                pour les lecteurs d'écran.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Liens</h3>
              <p className="text-slate-700">
                Les liens sont explicites et compréhensibles hors contexte.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Formulaires</h3>
              <p className="text-slate-700">
                Tous les champs sont clairement identifiés avec des labels visibles.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Signalement */}
        <Card>
          <CardHeader>
            <CardTitle>Signaler un problème d'accessibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-4">
              Si vous rencontrez une difficulté d'accessibilité sur ce site, 
              nous vous encourageons à nous le signaler :
            </p>
            <ul className="space-y-2 text-slate-700 mb-4">
              <li>• Via notre <a href="/contact" className="text-blue-600 hover:underline">formulaire de contact</a></li>
              <li>• En précisant la page concernée et la nature du problème</li>
              <li>• En indiquant votre configuration (navigateur, lecteur d'écran, etc.)</li>
            </ul>
            <p className="text-slate-700">
              Nous nous engageons à vous répondre sous 5 jours ouvrés et à corriger 
              les problèmes signalés dans les meilleurs délais.
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-slate-500 mt-8 text-center">
          Dernière révision : {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
}