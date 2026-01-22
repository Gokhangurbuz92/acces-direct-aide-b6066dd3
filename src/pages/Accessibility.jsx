
import { Helmet } from 'react-helmet-async';
import { Settings, Eye } from 'lucide-react';

export default function Accessibility() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Helmet>
                <title>Accessibilité - Accès Direct Aide</title>
                <meta name="description" content="Nos efforts pour rendre le site utilisable par tous." />
            </Helmet>

            <h1 className="text-3xl font-bold mb-6 text-blue-900">Accessibilité</h1>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-8">
                <p className="text-xl font-medium text-gray-900 mb-6">
                    Ce site est conçu pour être utilisable par <strong>tout le monde</strong>,
                    même si vous avez du mal à voir, à lire, ou à utiliser une souris.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="flex gap-4">
                        <Eye className="w-8 h-8 text-blue-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg">Facile à Lire (FALC)</h3>
                            <p className="text-gray-600">
                                Nous utilisons des phrases courtes et des mots simples.
                                Nous évitons le jargon administratif.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Settings className="w-8 h-8 text-blue-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg">Navigation Claire</h3>
                            <p className="text-gray-600">
                                Les boutons sont gros. Les couleurs sont contrastées.
                                On peut naviguer au clavier.
                            </p>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-bold mb-4">Fonctionnalités disponibles</h3>
                <ul className="list-disc pl-6 space-y-2 mb-8">
                    <li>Contraste des couleurs élevé.</li>
                    <li>Compatible avec les lecteurs d'écran.</li>
                    <li>Zoom possible jusqu'à 200% sans casser l'affichage.</li>
                    <li>Navigation sans souris possible.</li>
                </ul>

                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                    <h3 className="font-bold text-lg mb-2 is-alert">Un problème ?</h3>
                    <p>
                        Si vous n'arrivez pas à lire quelque chose ou à cliquer sur un bouton, dites-le nous.
                        Nous corrigerons le problème pour tout le monde.
                    </p>
                    <a href="/contact" className="text-blue-700 underline font-bold mt-2 inline-block">Contactez-nous</a>
                </div>
            </div>

            <div className="text-gray-500 text-sm">
                Statut de conformité : <strong>Partiellement conforme</strong>.
                Nous travaillons en continu pour respecter les critères du RGAA (Référentiel Général d'Amélioration de l'Accessibilité).
            </div>
        </div>
    );
}
