
import SEO from '@/components/SEO';
import { ShieldCheck, Lock, Trash2, EyeOff, Database, UserCheck, ExternalLink } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function Security() {
    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <SEO
                title="Sécurité et Données Personnelles (RGPD)"
                description="Comment nous protégeons vos données. Stockage minimal et chiffré."
                path="/securite-et-rgpd"
            />

            {/* Hero Section */}
            <div className="bg-slate-900 text-white pt-16 pb-24 border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-green-500/20 text-green-400 mb-6 ring-1 ring-green-500/30">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-50">Sécurité et Vie Privée</h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Nous collectons le minimum possible d'informations vous concernant. Et nous les protégeons comme un trésor.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">

                {/* Piliers Sécurité */}
                <Card className="border-green-200 bg-green-50/50 shadow-sm overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="grid sm:grid-cols-3 gap-6 text-center">
                            <div className="p-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-green-900 mb-2">Données Chiffrées</h3>
                                <p className="text-sm text-green-800/70">Tout ce qui est sensible est transformé en code secret (AES-256).</p>
                            </div>
                            <div className="p-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-green-900 mb-2">Suppression Auto</h3>
                                <p className="text-sm text-green-800/70">Vos messages ne sont gardés que 60 jours. Après, c'est supprimé.</p>
                            </div>
                            <div className="p-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <EyeOff className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-green-900 mb-2">Pas de Vente</h3>
                                <p className="text-sm text-green-800/70">Vos données ne servent qu'à vous aider. Jamais vendues.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Détails */}
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-6 md:p-8 space-y-8">

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Database className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Ce que nous stockons</h2>
                            </div>
                            <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li><strong>Identifiants Pros</strong> : E-mail et mot de passe (haché).</li>
                                    <li><strong>Rendez-vous</strong> : Date, heure, lieu.</li>
                                    <li><strong>Messages</strong> : Contenu chiffré, pièces jointes.</li>
                                    <li><strong>Bénéficiaires</strong> : Nom/Prénom (chiffré), E-mail/Tél (chiffré).</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <EyeOff className="w-5 h-5 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Ce que nous NE stockons PAS</h2>
                            </div>
                            <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li>Votre numéro de sécurité sociale complet.</li>
                                    <li>Vos données bancaires.</li>
                                    <li>Votre dossier médical.</li>
                                    <li>Des informations sur votre vie privée (religion, orientation, etc.).</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Trash2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Règles de Suppression (Purge)</h2>
                            </div>
                            <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li><strong>Messages</strong> : Effacés 60 jours après la fin du dossier.</li>
                                    <li><strong>Pièces jointes</strong> : Effacées 30 jours après envoi.</li>
                                    <li><strong>Rendez-vous passés</strong> : Anonymisés après 1 an pour les statistiques.</li>
                                    <li><strong>Comptes inactifs</strong> : Supprimés après 2 ans sans connexion.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <UserCheck className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Vos Droits (RGPD)</h2>
                            </div>
                            <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                                <p className="text-sm">
                                    Conformément au RGPD, vous pouvez demander à voir, modifier ou supprimer vos données.
                                    Pour cela, utilisez le formulaire de contact ou écrivez à notre Délégué à la Protection des Données (DPO).
                                </p>
                                <p className="mt-4">
                                    <a href="/contact" className="text-blue-600 font-medium hover:text-blue-700 hover:underline inline-flex items-center gap-1">
                                        Formulaire de contact <ExternalLink className="w-4 h-4" />
                                    </a>
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Lock className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">Technique</h2>
                            </div>
                            <div className="space-y-3 text-slate-700 leading-relaxed px-2">
                                <ul className="list-disc pl-5 space-y-2 text-sm">
                                    <li><strong>Hébergement</strong> : Vercel (Francfort, Allemagne — UE).</li>
                                    <li><strong>Base de Données</strong> : Neon Postgres (Francfort, Allemagne — UE).</li>
                                    <li><strong>Chiffrement au repos</strong> : AES-256-GCM pour les données sensibles.</li>
                                    <li><strong>Chiffrement en transit</strong> : TLS 1.3 pour tous les échanges.</li>
                                </ul>
                                <p className="text-sm mt-8 text-slate-500 border-t border-slate-100 pt-4">
                                    Dernière mise à jour : <span suppressHydrationWarning>{new Date().toLocaleDateString('fr-FR')}</span>
                                </p>
                            </div>
                        </section>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
