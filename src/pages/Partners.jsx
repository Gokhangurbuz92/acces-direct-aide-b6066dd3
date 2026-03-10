import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Handshake, MapPin, Users, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Partners() {
    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <SEO
                title="Partenaires & Collectivités"
                description="Espace dédié aux collectivités, associations et acteurs sociaux qui souhaitent rejoindre l'écosystème Accès Direct Aide."
                path="/partenaires"
            />

            {/* Hero Section */}
            <div className="bg-slate-900 text-white pt-16 pb-32 border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 mb-6 ring-1 ring-purple-500/30">
                        <HeartHandshake className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-slate-50">Espace Partenaires</h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Notre plateforme s'appuie sur la transparence de l'Open Data et l'intelligence collective locale. Vous aidez le public ? Rejoignez le réseau.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 space-y-8">

                {/* Appel à partenaires (Puisque l'association démarre et n'a pas encore signé les acteurs) */}
                <Card className="border-slate-200 shadow-xl overflow-hidden">
                    <div className="bg-purple-600 h-2 w-full"></div>
                    <CardContent className="p-6 md:p-10 text-center space-y-8">

                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                                Associations, CCAS, Structures Solidaires : Ralliez L'initiative
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Accès Direct Aide est déployé pour simplifier la vie des demandeurs et soulager l'accueil des professionnels. <strong>Référencez votre structure</strong> dans notre annuaire pour bénéficier de la prise de RDV intégrée et d'une visibilité civique.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                            <div className="p-4">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Visibilité Civique</h3>
                                <p className="text-sm text-slate-600">Apparaissez sur les cartes de diagnostic et touchez réellement le public que vous pouvez aider dans votre territoire.</p>
                            </div>
                            <div className="p-4">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">Orientation Qualifiée</h3>
                                <p className="text-sm text-slate-600">Moins de rendez-vous "hors-scope". L'IA d'orientation qualifie le candidat avant de le rediriger vers vous.</p>
                            </div>
                            <div className="p-4">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Handshake className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">100% Gratuit & Éthique</h3>
                                <p className="text-sm text-slate-600">Zéro coût caché pour les structures d'aide. L'Espace Pro est un outil de bien commun mis à votre disposition.</p>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* Engagements et CTA */}
                <div className="grid md:grid-cols-2 gap-6">

                    <Card className="border-slate-200 shadow-sm bg-white">
                        <CardContent className="p-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Nos engagements fermes</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    <span className="text-sm text-slate-700">Vous gardez la <strong>maîtrise totale</strong> des horaires et des services que vous exposez.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    <span className="text-sm text-slate-700">Droit de regard exclusif : nous ne modifions pas vos pages annuaire sans consulter votre représentant.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    <span className="text-sm text-slate-700">En cas d'erreur signalée par un usager, vous êtes immédiatement notifié via votre Espace Pro.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-none text-white shadow-xl flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <HeartHandshake className="w-32 h-32" />
                        </div>
                        <CardContent className="p-8 relative z-10">
                            <h3 className="text-2xl font-bold mb-4">Proposer votre structure</h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-8">
                                L'inscription prend 2 minutes. Notre équipe modératrice vérifiera votre SIRET et votre agrément social avant d'activer votre présence sur la carte publique et de vous ouvrir votre Espace Pro.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                                    <Link to="/auth/signup">
                                        Créer mon Espace Pro
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white">
                                    <Link to="/contact?sujet=partenariat">
                                        Discuter d'un partenariat
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </div>
    );
}
