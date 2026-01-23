
import SEO from '@/components/SEO';
import { Lock, Trash2, EyeOff } from 'lucide-react';

export default function Security() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <SEO
                title="Sécurité et Données Personnelles (RGPD)"
                description="Comment nous protégeons vos données. Stockage minimal et chiffré."
                path="/securite-et-rgpd"
            />

            <h1 className="text-3xl font-bold mb-6 text-blue-900">Sécurité et Vie Privée</h1>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-8">
                <p className="text-xl font-medium text-gray-900 mb-6">
                    Nous collectons le <strong>minimum possible</strong> d'informations vous concernant.
                    Et nous les protégeons comme un trésor.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
                    <div className="p-4 border rounded-lg">
                        <Lock className="w-10 h-10 mx-auto mb-3 text-green-600" />
                        <h3 className="font-bold">Données Chiffrées</h3>
                        <p className="text-sm text-gray-600">Tout ce qui est sensible est transformé en code secret (AES-256).</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <Trash2 className="w-10 h-10 mx-auto mb-3 text-orange-600" />
                        <h3 className="font-bold">Suppression Auto</h3>
                        <p className="text-sm text-gray-600">Vos messages ne sont gardés que 60 jours. Après, c'est supprimé.</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <EyeOff className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                        <h3 className="font-bold">Pas de Vente</h3>
                        <p className="text-sm text-gray-600">Vos données ne servent qu'à vous aider. Jamais vendues.</p>
                    </div>
                </div>

                <details className="group border rounded-lg p-4 mb-4">
                    <summary className="font-bold cursor-pointer text-blue-800 group-open:mb-4">
                        Ce que nous stockons (Détails)
                    </summary>
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                        <li><strong>Identifiants Pros</strong> : E-mail et mot de passe (haché).</li>
                        <li><strong>Rendez-vous</strong> : Date, heure, lieu.</li>
                        <li><strong>Messages</strong> : Contenu chiffré, pièces jointes.</li>
                        <li><strong>Bénéficiaires</strong> : Nom/Prénom (chiffré), E-mail/Tél (chiffré).</li>
                    </ul>
                </details>

                <details className="group border rounded-lg p-4 mb-4">
                    <summary className="font-bold cursor-pointer text-blue-800 group-open:mb-4">
                        Ce que nous NE stockons PAS
                    </summary>
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                        <li>Votre numéro de sécurité sociale complet.</li>
                        <li>Vos données bancaires.</li>
                        <li>Votre dossier médical.</li>
                        <li>Des informations sur votre vie privée (religion, orientation, etc.).</li>
                    </ul>
                </details>

                <details className="group border rounded-lg p-4 mb-4">
                    <summary className="font-bold cursor-pointer text-blue-800 group-open:mb-4">
                        Règles de Suppression (Purge)
                    </summary>
                    <ul className="list-disc pl-6 space-y-2 text-sm">
                        <li><strong>Messages</strong> : Effacés 60 jours après la fin du dossier.</li>
                        <li><strong>Pièces jointes</strong> : Effacées 30 jours après envoi.</li>
                        <li><strong>Rendez-vous passés</strong> : Anonymisés après 1 an pour les statistiques.</li>
                        <li><strong>Comptes inactifs</strong> : Supprimés après 2 ans sans connexion.</li>
                    </ul>
                </details>
            </div>

            <div className="prose prose-sm max-w-none text-gray-600">
                <h3>Vos Droits (RGPD)</h3>
                <p>
                    Conformément au RGPD, vous pouvez demander à voir, modifier ou supprimer vos données.
                    Pour cela, utilisez le formulaire de contact ou écrivez à notre Déraptement Protection des Données (DPO).
                </p>
                <h3>Cookies</h3>
                <p>
                    Nous n'utilisons pas de cookies publicitaires.
                    Seuls des cookies techniques (pour rester connecté) et des outils de mesure d'erreur (Sentry) sont utilisés.
                </p>
                <h3>Technique</h3>
                <p>
                    Hébergement : Vercel (Europe/USA avec clauses de protection). Base de Données : Neon (Postgres).
                    Chiffrement : AES-256-GCM pour les données au repos, TLS 1.3 pour les échanges.
                </p>
            </div>
        </div>
    );
}
