import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
    Building2, Users, Calendar, Bell, Shield, Plug,
    Mail, Phone, MapPin, Clock, CheckCircle, ExternalLink,
    AlertTriangle, Eye, UserPlus, Trash2, Download
} from 'lucide-react';

import SEO from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ─── Local Preferences helpers ────────────────────────────────
const PRO_PREFS_KEY = 'ada_pro_prefs';

function loadProPrefs() {
    try {
        return JSON.parse(localStorage.getItem(PRO_PREFS_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveProPrefs(prefs) {
    localStorage.setItem(PRO_PREFS_KEY, JSON.stringify(prefs));
}

// ─── Tab: Structure ───────────────────────────────────────────

function StructureTab({ structure, user }) {
    if (!structure) {
        return (
            <div className="p-6 text-center text-slate-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Aucune structure associée à ce compte.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Informations de la structure</h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                        <Building2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-slate-500">Nom de la structure</Label>
                            <p className="text-sm font-semibold text-slate-900">{structure.nom || structure.name || '-'}</p>
                        </div>
                    </div>

                    {(structure.adresse || structure.address) && (
                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                            <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium text-slate-500">Adresse</Label>
                                <p className="text-sm text-slate-900">{structure.adresse || structure.address}</p>
                                {(structure.code_postal || structure.zipCode) && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {structure.code_postal || structure.zipCode} {structure.ville || structure.city}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                        <Mail className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-slate-500">Email de contact</Label>
                            <p className="text-sm text-slate-900">{user?.email || structure.email || '-'}</p>
                        </div>
                    </div>

                    {(structure.telephone || structure.phone) && (
                        <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                            <Phone className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium text-slate-500">Téléphone</Label>
                                <p className="text-sm text-slate-900">{structure.telephone || structure.phone}</p>
                            </div>
                        </div>
                    )}

                    <div className="p-4 rounded-lg border bg-slate-50 text-sm text-slate-600">
                        <p>Module RDV : {structure.is_pro_enabled ? (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">Activé</Badge>
                        ) : (
                            <Badge variant="outline" className="text-slate-500">Non activé</Badge>
                        )}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-medium mb-1">✏️ Modifier les informations</p>
                <p>
                    Pour modifier les informations de votre structure, rendez-vous sur la{' '}
                    <Link to="/pro/structure" className="underline font-medium">page Structure</Link>.
                </p>
            </div>
        </div>
    );
}

// ─── Tab: Équipe ──────────────────────────────────────────────

function TeamTab({ structure }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Gestion de l'équipe</h3>
                <div className="space-y-4">
                    <div className="p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <Users className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Membres de l'équipe</Label>
                                <p className="text-xs text-slate-500 mt-1">
                                    Gérez les accès de votre équipe à l'espace professionnel.
                                </p>
                                <Button variant="outline" size="sm" className="mt-3" asChild>
                                    <Link to="/pro/team">
                                        <Users className="h-3.5 w-3.5 mr-1.5" />
                                        Gérer l'équipe
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <UserPlus className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Inviter un collaborateur</Label>
                                <p className="text-xs text-slate-500 mt-1">
                                    Envoyez un lien d'invitation pour ajouter un membre à votre structure.
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <Input
                                        type="email"
                                        placeholder="email@structure.fr"
                                        className="max-w-xs"
                                        disabled
                                    />
                                    <Button size="sm" disabled>
                                        Inviter
                                    </Button>
                                </div>
                                <p className="text-xs text-amber-600 mt-2">
                                    ⚠️ Fonctionnalité bientôt disponible
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Rendez-vous ─────────────────────────────────────────

function RdvTab() {
    const [prefs, setPrefs] = useState(() => {
        const saved = loadProPrefs();
        return {
            rdvDuration: saved.rdvDuration ?? 30,
            rdvBuffer: saved.rdvBuffer ?? 15,
            rdvReminders24h: saved.rdvReminders24h ?? true,
            rdvReminders1h: saved.rdvReminders1h ?? true,
            autoConfirm: saved.autoConfirm ?? false,
        };
    });

    const handleToggle = (key) => {
        setPrefs(prev => {
            const next = { ...prev, [key]: !prev[key] };
            saveProPrefs(next);
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Paramètres des rendez-vous</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Rappels 24h avant</Label>
                            <p className="text-xs text-slate-500">Envoyer un rappel automatique aux bénéficiaires</p>
                        </div>
                        <Switch
                            checked={prefs.rdvReminders24h}
                            onCheckedChange={() => handleToggle('rdvReminders24h')}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Rappels 1h avant</Label>
                            <p className="text-xs text-slate-500">Notification de rappel de dernière minute</p>
                        </div>
                        <Switch
                            checked={prefs.rdvReminders1h}
                            onCheckedChange={() => handleToggle('rdvReminders1h')}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Confirmation automatique</Label>
                            <p className="text-xs text-slate-500">Confirmer les RDV automatiquement sans validation manuelle</p>
                        </div>
                        <Switch
                            checked={prefs.autoConfirm}
                            onCheckedChange={() => handleToggle('autoConfirm')}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p>
                    Pour configurer vos services, disponibilités et absences, utilisez la{' '}
                    <Link to="/pro/rdv" className="underline font-medium">section Rendez-vous</Link>.
                </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Les préférences sont sauvegardées localement. La synchronisation serveur sera disponible prochainement.
            </div>
        </div>
    );
}

// ─── Tab: Notifications ───────────────────────────────────────

function NotificationsProTab() {
    const [prefs, setPrefs] = useState(() => {
        const saved = loadProPrefs();
        return {
            emailNewRdv: saved.emailNewRdv ?? true,
            emailCancellation: saved.emailCancellation ?? true,
            emailNewMessage: saved.emailNewMessage ?? true,
            smsReminders: saved.smsReminders ?? false,
            dailyDigest: saved.dailyDigest ?? false,
        };
    });

    const handleToggle = (key) => {
        setPrefs(prev => {
            const next = { ...prev, [key]: !prev[key] };
            saveProPrefs(next);
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Notifications professionnelles</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Nouveau rendez-vous</Label>
                            <p className="text-xs text-slate-500">Email quand un bénéficiaire prend RDV</p>
                        </div>
                        <Switch checked={prefs.emailNewRdv} onCheckedChange={() => handleToggle('emailNewRdv')} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Annulations</Label>
                            <p className="text-xs text-slate-500">Notification quand un RDV est annulé</p>
                        </div>
                        <Switch checked={prefs.emailCancellation} onCheckedChange={() => handleToggle('emailCancellation')} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Nouveaux messages</Label>
                            <p className="text-xs text-slate-500">Email quand un bénéficiaire vous écrit</p>
                        </div>
                        <Switch checked={prefs.emailNewMessage} onCheckedChange={() => handleToggle('emailNewMessage')} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Rappels SMS</Label>
                            <p className="text-xs text-slate-500">Rappels par SMS pour les RDV du jour</p>
                        </div>
                        <Switch checked={prefs.smsReminders} onCheckedChange={() => handleToggle('smsReminders')} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Résumé quotidien</Label>
                            <p className="text-xs text-slate-500">Email récapitulatif chaque matin</p>
                        </div>
                        <Switch checked={prefs.dailyDigest} onCheckedChange={() => handleToggle('dailyDigest')} />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Les préférences sont sauvegardées localement. La synchronisation serveur sera disponible prochainement.
            </div>
        </div>
    );
}

// ─── Tab: Sécurité ────────────────────────────────────────────

function SecurityProTab({ user }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Sécurité du compte professionnel</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                        <Mail className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <Label className="text-sm font-medium">Email professionnel</Label>
                            <p className="text-sm text-slate-900 mt-0.5">{user?.email || '-'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <Shield className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <Label className="text-sm font-medium">Mot de passe</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Modifiez votre mot de passe régulièrement</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/pro/forgot-password">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Modifier
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <Shield className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <Label className="text-sm font-medium">Authentification à deux facteurs (2FA)</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Renforcez la sécurité de votre compte</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/pro/mfa-settings">
                                Configurer
                            </Link>
                        </Button>
                    </div>

                    <div className="p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4 mb-3">
                            <Eye className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Journal d'audit</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Historique des actions sur votre compte</p>
                            </div>
                        </div>
                        <div className="ml-9">
                            <Button variant="outline" size="sm" asChild>
                                <Link to="/pro/audit">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    Voir le journal
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab: Intégrations ────────────────────────────────────────

function IntegrationsTab() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Intégrations & API</h3>
                <div className="space-y-4">
                    <div className="p-6 text-center rounded-lg border border-dashed bg-slate-50">
                        <Plug className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm font-medium text-slate-700">Intégrations bientôt disponibles</p>
                        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                            Connectez votre structure à des outils tiers : agenda Google/Outlook, 
                            CRM, logiciel de gestion, plateforme de visioconférence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { name: 'Google Calendar', desc: 'Sync des RDV', icon: '📅' },
                            { name: 'Microsoft 365', desc: 'Outlook + Teams', icon: '💼' },
                            { name: 'API Webhooks', desc: 'Notifications temps réel', icon: '🔔' },
                            { name: 'Export CSV', desc: 'Données structurées', icon: '📊' },
                        ].map(item => (
                            <div key={item.name} className="p-4 rounded-lg border bg-white opacity-60">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{item.icon}</span>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="mt-2 text-xs">Bientôt</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────

export default function ProParametres() {
    const [structure, setStructure] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('pro_token');
                if (!token) return;
                const res = await fetch('/api/pro/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStructure(data.structure);
                    setUser(data.user || data);
                }
            } catch (e) {
                if (import.meta.env.DEV) console.error('[ProParametres] fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="Paramètres Pro"
                description="Gérez votre structure, équipe, rendez-vous et sécurité."
                path="/pro/parametres"
                noindex={true}
            />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
                <p className="text-sm text-slate-500 mt-1">
                    {structure?.nom || 'Ma structure'} — Configuration et préférences
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="structure" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 h-auto p-1">
                    <TabsTrigger value="structure" className="text-xs sm:text-sm gap-1 py-2.5">
                        <Building2 className="h-4 w-4 hidden sm:block" />
                        Structure
                    </TabsTrigger>
                    <TabsTrigger value="team" className="text-xs sm:text-sm gap-1 py-2.5">
                        <Users className="h-4 w-4 hidden sm:block" />
                        Équipe
                    </TabsTrigger>
                    <TabsTrigger value="rdv" className="text-xs sm:text-sm gap-1 py-2.5">
                        <Calendar className="h-4 w-4 hidden sm:block" />
                        RDV
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="text-xs sm:text-sm gap-1 py-2.5">
                        <Bell className="h-4 w-4 hidden sm:block" />
                        Notifs
                    </TabsTrigger>
                    <TabsTrigger value="security" className="text-xs sm:text-sm gap-1 py-2.5">
                        <Shield className="h-4 w-4 hidden sm:block" />
                        Sécurité
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="text-xs sm:text-sm gap-1 py-2.5">
                        <Plug className="h-4 w-4 hidden sm:block" />
                        Intégr.
                    </TabsTrigger>
                </TabsList>

                <Card>
                    <CardContent className="pt-6">
                        <TabsContent value="structure" className="mt-0">
                            <StructureTab structure={structure} user={user} />
                        </TabsContent>
                        <TabsContent value="team" className="mt-0">
                            <TeamTab structure={structure} />
                        </TabsContent>
                        <TabsContent value="rdv" className="mt-0">
                            <RdvTab />
                        </TabsContent>
                        <TabsContent value="notifications" className="mt-0">
                            <NotificationsProTab />
                        </TabsContent>
                        <TabsContent value="security" className="mt-0">
                            <SecurityProTab user={user} />
                        </TabsContent>
                        <TabsContent value="integrations" className="mt-0">
                            <IntegrationsTab />
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
