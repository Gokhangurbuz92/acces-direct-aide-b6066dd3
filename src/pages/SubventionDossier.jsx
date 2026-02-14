
import SEO from '@/components/SEO';
import { Printer } from 'lucide-react';

export default function SubventionDossier() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <SEO
                title="Dossier Innovation Sociale"
                description="Dossier de présentation pour demandes de subventions."
                noindex={true}
            />

            <div className="flex justify-between items-center mb-8 print:hidden">
                <h1 className="text-2xl font-bold text-gray-400">Dossier de Présentation (Subventions)</h1>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
                >
                    <Printer className="w-4 h-4" />
                    Imprimer / PDF
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-12 shadow-lg print:shadow-none print:p-0">
                {/* Header Détaillé */}
                <header className="border-b-2 border-blue-900 pb-8 mb-12 flex justify-between items-end">
                    <div>
                        <div className="text-4xl font-extrabold text-blue-900 mb-2">Accès Direct Aide</div>
                        <div className="text-xl text-gray-600 font-medium">L'accès aux droits simplifié par le numérique</div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        Version : {new Date().getFullYear()}.1<br />
                        Document généré le {new Date().toLocaleDateString('fr-FR')}
                    </div>
                </header>

                {/* 1. Résumé Exécutif */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-4 uppercase tracking-wider border-l-4 border-blue-600 pl-4">1. Résumé Exécutif</h2>
                    <p className="text-lg leading-relaxed text-gray-800 text-justify">
                        Accès Direct Aide est une plateforme numérique innovante visant à lutter contre le non-recours aux droits.
                        En combinant une interface "Facile à Lire et à Comprendre" (FALC) pour les usagers et des outils de coordination
                        sécurisés pour les professionnels, nous créons un pont direct entre le besoin social et la réponse administrative.
                        Notre approche unique garantit l'anonymat, la sécurité des données (chiffrement de bout en bout) et une accessibilité universelle.
                    </p>
                </section>

                {/* 2. Problème et Solution */}
                <section className="mb-12 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-2 text-red-700">Le Problème</h3>
                        <p className="text-gray-700 leading-relaxed">
                            30% des aides sociales ne sont jamais réclamées. La complexité administrative,
                            la fracture numérique et la peur de la stigmatisation isolent les publics fragiles.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2 text-green-700">La Solution</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Une porte d'entrée unique qui "traduit" l'administration, géolocalise les aides
                            humaines, et permet une prise de rendez-vous sans barrière technologique.
                        </p>
                    </div>
                </section>

                {/* 3. Métriques d'Impact (Placeholder stats) */}
                <section className="mb-12 bg-gray-50 p-6 rounded print:bg-transparent print:p-0">
                    <h2 className="text-2xl font-bold text-blue-900 mb-6 uppercase tracking-wider border-l-4 border-blue-600 pl-4">2. Indicateurs Clés</h2>
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-3xl font-bold text-blue-600">Active</div>
                            <div className="text-sm font-bold uppercase mt-1">Plateforme</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-blue-600">100%</div>
                            <div className="text-sm font-bold uppercase mt-1">Gratuit</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-blue-600">RGPD</div>
                            <div className="text-sm font-bold uppercase mt-1">Conformité</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-blue-600">FALC</div>
                            <div className="text-sm font-bold uppercase mt-1">Accessibilité</div>
                        </div>
                    </div>
                </section>

                {/* 4. Modèle Économique & Partenariats */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-blue-900 mb-4 uppercase tracking-wider border-l-4 border-blue-600 pl-4">3. Modèle & Besoins</h2>
                    <div className="text-gray-800 space-y-4 text-justify">
                        <p>
                            Notre modèle repose sur le financement public et le mécénat pour garantir la gratuité totale aux usagers.
                            Nous ne vendons aucune donnée.
                        </p>
                        <p>
                            <strong>Nous recherchons des financements pour :</strong>
                        </p>
                        <ul className="list-disc pl-6">
                            <li>Déployer la plateforme sur de nouveaux territoires.</li>
                            <li>Former les travailleurs sociaux à nos outils numériques.</li>
                            <li>Développer des modules d'accessibilité avancée (audio, traduction).</li>
                        </ul>
                    </div>
                </section>

                <footer className="mt-20 pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
                    <p>Accès Direct Aide - Association / Structure Tech for Good</p>
                    <p>Contact : partenariats@acces-direct-aide.fr | www.acces-direct-aide.fr</p>
                </footer>
            </div>
        </div>
    );
}
