
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Handshake, MapPin, Users } from 'lucide-react';

export default function Partners() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <SEO
                title="Devenir Partenaire"
                description="Rejoignez le réseau des structures d'aide."
                path="/partenaires"
            />

            <h1 className="text-3xl font-bold mb-6 text-blue-900">Espace Partenaires</h1>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Vous aidez le public ? Rejoignez-nous.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
                    <div className="p-4">
                        <Users className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                        <h3 className="font-bold text-lg">Plus de visibilité</h3>
                        <p className="text-gray-600">Faites connaître vos services aux personnes qui en ont besoin.</p>
                    </div>
                    <div className="p-4">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-green-600" />
                        <h3 className="font-bold text-lg">Orientation ciblée</h3>
                        <p className="text-gray-600">Recevez des demandes qualifiées, adaptées à votre champ d'action.</p>
                    </div>
                    <div className="p-4">
                        <Handshake className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                        <h3 className="font-bold text-lg">Gratuit & Éthique</h3>
                        <p className="text-gray-600">Pas de frais d'inscription, pas de commission. Service 100% public.</p>
                    </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-xl text-center">
                    <h3 className="text-xl font-bold mb-4">Proposer votre structure</h3>
                    <p className="mb-6 max-w-lg mx-auto text-gray-700">
                        C'est simple et rapide. Remplissez le formulaire, nous vérifions, et vous apparaissez sur la carte.
                        Pas besoin de créer un compte pour proposer.
                    </p>
                    <Link
                        to="/proposer-une-structure"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow transition transform hover:scale-105"
                    >
                        Proposer une structure
                    </Link>
                </div>
            </div>

            <div className="prose max-w-none text-gray-600">
                <h3>Nos Engagements Partenaires</h3>
                <ul>
                    <li>Nous ne modifions pas vos informations sans vérifier.</li>
                    <li>Nous vous prévenons si un utilisateur signale une erreur.</li>
                    <li>Vous pouvez demander le retrait de votre fiche à tout moment.</li>
                </ul>
            </div>
        </div>
    );
}
