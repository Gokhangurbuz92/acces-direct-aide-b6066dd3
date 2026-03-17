import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
    User, Bell, Shield, Mail, CheckCircle,
    AlertTriangle, Eye, ExternalLink
} from 'lucide-react';

import SEO from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// ─── Local Preferences ───────────────────────────────────────
const ADMIN_PREFS_KEY = 'ada_admin_prefs';

function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(ADMIN_PREFS_KEY) || '{}'); }
    catch { return {}; }
}

function savePrefs(prefs) {
    localStorage.setItem(ADMIN_PREFS_KEY, JSON.stringify(prefs));
}

// ─── Profil Tab ──────────────────────────────────────────────

function ProfilTab({ user }) {
    const roleBadge = (role) => {
        const styles = {
            admin: 'bg-red-50 text-red-700 border-red-200',
            superadmin: 'bg-purple-50 text-purple-700 border-purple-200',
            moderator: 'bg-amber-50 text-amber-700 border-amber-200',
        };
        const labels = {
            admin: 'Administrateur',
            superadmin: 'Super Admin',
            moderator: 'Modérateur',
        };
        const r = String(role || 'admin').toLowerCase();
        return (
            <Badge variant="outline" className={styles[r] || styles.admin}>
                {labels[r] || role || 'Admin'}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Profil administrateur</h3>
            <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                    <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-500">Email</span>
                        <p className="text-sm font-semibold text-slate-900 break-all">{user?.email || '-'}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-sm font-medium text-slate-500">Rôle</span>
                        <div className="mt-1">{roleBadge(user?.role)}</div>
                    </div>
                </div>

                <div className="p-4 rounded-lg border bg-slate-50 text-sm text-slate-600 space-y-1">
                    <p>Dernière connexion : <span className="font-medium">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Session actuelle'}</span></p>
                    {user?.createdAt && (
                        <p>Compte créé le : <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span></p>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <p>💡 Les informations du profil admin sont gérées de manière centralisée. Contactez le Super Admin pour toute modification.</p>
            </div>
        </div>
    );
}

// ─── Notifications Tab ───────────────────────────────────────

function NotificationsTab() {
    const [prefs, setPrefs] = useState(() => {
        const saved = loadPrefs();
        return {
            systemErrors: saved.systemErrors ?? true,
            weeklyReport: saved.weeklyReport ?? true,
            newValidations: saved.newValidations ?? true,
            securityAlerts: saved.securityAlerts ?? true,
        };
    });

    const handleToggle = (key) => {
        setPrefs(prev => {
            const next = { ...prev, [key]: !prev[key] };
            savePrefs(next);
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Notifications système</h3>
            <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                    <div className="space-y-0.5">
                        <Label htmlFor="sw-admin-sys-errors" className="text-sm font-medium">Erreurs système</Label>
                        <p className="text-xs text-slate-500">Alertes en cas de panne ou erreur critique</p>
                    </div>
                    <Switch id="sw-admin-sys-errors" checked={prefs.systemErrors} onCheckedChange={() => handleToggle('systemErrors')} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                    <div className="space-y-0.5">
                        <Label htmlFor="sw-admin-weekly" className="text-sm font-medium">Rapports hebdomadaires</Label>
                        <p className="text-xs text-slate-500">Résumé d'activité plateforme chaque lundi</p>
                    </div>
                    <Switch id="sw-admin-weekly" checked={prefs.weeklyReport} onCheckedChange={() => handleToggle('weeklyReport')} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                    <div className="space-y-0.5">
                        <Label htmlFor="sw-admin-validations" className="text-sm font-medium">Nouvelles validations</Label>
                        <p className="text-xs text-slate-500">Contenu en attente de modération</p>
                    </div>
                    <Switch id="sw-admin-validations" checked={prefs.newValidations} onCheckedChange={() => handleToggle('newValidations')} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                    <div className="space-y-0.5">
                        <Label htmlFor="sw-admin-security" className="text-sm font-medium">Alertes sécurité</Label>
                        <p className="text-xs text-slate-500">Tentatives d'accès suspectes, brute force</p>
                    </div>
                    <Switch id="sw-admin-security" checked={prefs.securityAlerts} onCheckedChange={() => handleToggle('securityAlerts')} />
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Les préférences sont sauvegardées localement. La synchronisation serveur sera disponible prochainement.
            </div>
        </div>
    );
}

// ─── Security Tab ────────────────────────────────────────────

function SecurityTab({ user }) {
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Sécurité du compte admin</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                    <div className="flex items-start gap-4">
                        <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="text-sm font-medium">Mot de passe</span>
                            <p className="text-xs text-slate-500 mt-0.5">Changez régulièrement votre mot de passe admin</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/login">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Modifier
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                    <div className="flex items-start gap-4">
                        <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <span className="text-sm font-medium">Authentification 2FA</span>
                            <p className="text-xs text-slate-500 mt-0.5">Fortement recommandé pour les comptes admin</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                        Bientôt
                    </Badge>
                </div>

                <div className="p-4 rounded-lg border bg-white">
                    <div className="flex items-start gap-4 mb-3">
                        <Eye className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <span className="text-sm font-medium">Session actuelle</span>
                            <p className="text-xs text-slate-500 mt-0.5">Appareil connecté à l'interface admin</p>
                        </div>
                    </div>
                    <div className="ml-9 p-3 bg-slate-50 rounded text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span>{typeof navigator !== 'undefined' ? navigator.userAgent.split('(')[1]?.split(')')[0] || 'Navigateur' : 'Navigateur'}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-lg border bg-white">
                    <div className="flex items-start gap-4">
                        <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <span className="text-sm font-medium">Journal d'audit</span>
                            <p className="text-xs text-slate-500 mt-1">Historique complet des actions administratives</p>
                            <Button variant="outline" size="sm" className="mt-3" asChild>
                                <Link to="/admin/audit">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    Voir le journal
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-medium mb-1">⚠️ Sécurité renforcée</p>
                <p>Les comptes admin ont des privilèges élevés. Utilisez un mot de passe unique et activez le 2FA dès qu'il sera disponible. Ne partagez jamais vos identifiants.</p>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────

export default function AdminParametres() {
    const { user } = useOutletContext();

    return (
        <div className="space-y-6">
            <SEO
                title="Paramètres Admin"
                description="Configuration du compte administrateur."
                path="/admin/parametres"
                noindex={true}
            />

            <div>
                <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
                <p className="text-sm text-slate-500 mt-1">Configuration de votre compte administrateur</p>
            </div>

            <Tabs defaultValue="profil" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                    <TabsTrigger value="profil" className="gap-1.5 py-2.5">
                        <User className="h-4 w-4 hidden sm:block" />
                        Profil
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-1.5 py-2.5">
                        <Bell className="h-4 w-4 hidden sm:block" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-1.5 py-2.5">
                        <Shield className="h-4 w-4 hidden sm:block" />
                        Sécurité
                    </TabsTrigger>
                </TabsList>

                <Card>
                    <CardContent className="pt-6">
                        <TabsContent value="profil" className="mt-0">
                            <ProfilTab user={user} />
                        </TabsContent>
                        <TabsContent value="notifications" className="mt-0">
                            <NotificationsTab />
                        </TabsContent>
                        <TabsContent value="security" className="mt-0">
                            <SecurityTab user={user} />
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
