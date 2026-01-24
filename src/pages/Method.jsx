
import SEO from '@/components/SEO';
import { ClipboardCheck, Edit, Eye, Check } from 'lucide-react';

export default function Method() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <SEO
                title="Notre Méthode"
                description="Comment nous créons et vérifions l'information."
                path="/notre-methode"
            />

            <h1 className="text-3xl font-bold mb-6 text-blue-900">Notre Méthode</h1>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-8">
                <p className="text-lg text-gray-700 mb-6">
                    Pour que vous ayez confiance, nous expliquons comment chaque page est fabriquée.
                    Rien n'est publié sans être vérifié.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded">
                        <Edit className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <div className="font-bold">1. Collecte</div>
                        <div className="text-sm">On cherche l'info officielle.</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded">
                        <Eye className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                        <div className="font-bold">2. Simplification</div>
                        <div className="text-sm">On traduit en FALC.</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded">
                        <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <div className="font-bold">3. Vérification</div>
                        <div className="text-sm">Un autre expert relit.</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded">
                        <Check className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <div className="font-bold">4. Publication</div>
                        <div className="text-sm">En ligne pour vous.</div>
                    </div>
                </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4">Statuts de nos contenus</h2>
                <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                        <span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold uppercase mt-1">Brouillon</span>
                        <span>L'article est en cours d'écriture. Personne ne le voit.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="bg-yellow-200 px-2 py-1 rounded text-xs font-bold uppercase mt-1">En Revue</span>
                        <span>L'article est fini. Une deuxième personne doit vérifier que tout est vrai et simple.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="bg-green-200 px-2 py-1 rounded text-xs font-bold uppercase mt-1">Publié</span>
                        <span>C'est validé. Vous pouvez le lire sur le site.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="bg-red-200 px-2 py-1 rounded text-xs font-bold uppercase mt-1">Refusé</span>
                        <span>L'information était fausse ou mal expliquée. On recommence ou on jette.</span>
                    </li>
                </ul>

                <h2 className="text-2xl font-bold mt-8 mb-4">Signaler une erreur</h2>
                <p>
                    Tout le monde peut se tromper. Si vous voyez une faute, cliquez sur "Contact" en bas de page.
                    Nous corrigerons très vite.
                </p>

                <p className="text-sm text-gray-500 mt-8">
                    Dernière mise à jour des contenus : {new Date().toLocaleDateString('fr-FR')} (Automatique)
                </p>
            </div>
        </div>
    );
}
