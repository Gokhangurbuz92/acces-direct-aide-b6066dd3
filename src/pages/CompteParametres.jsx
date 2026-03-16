import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useMemo, useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    User, Bell, Shield, Accessibility, Database,
    Mail, Phone, CheckCircle, XCircle, ExternalLink,
    Download, Trash2, AlertTriangle, Eye, EyeOff,
    Sun, Moon, Type, Minus
} from 'lucide-react';

import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { rdvMessagingClient } from '@/api/rdv-messaging-client';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';

// ─── Local Preferences helpers ────────────────────────────────
const PREFS_KEY = 'ada_citizen_prefs';

function loadPrefs() {
    try {
        return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    } catch {
        return {};
    }
}

function savePrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─── Tab Components ───────────────────────────────────────────

function ProfilTab({ user }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Informations du compte</h3>
                <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                        <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <Label className="text-sm font-medium text-slate-500">Adresse email</Label>
                            <p className="text-sm font-semibold text-slate-900 break-all">{user?.email || '-'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                {user?.emailVerifiedAt ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                        <CheckCircle className="h-3 w-3" />
                                        Vérifié
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                        <XCircle className="h-3 w-3" />
                                        Non vérifié
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                        <Phone className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <Label className="text-sm font-medium text-slate-500">Téléphone</Label>
                            <p className="text-sm font-semibold text-slate-900">
                                {user?.phone || <span className="text-slate-400 font-normal italic">Non renseigné</span>}
                            </p>
                        </div>
                    </div>

                    {/* Account dates */}
                    <div className="p-4 rounded-lg border bg-slate-50 text-sm text-slate-600 space-y-1">
                        <p>Compte créé le : <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}</span></p>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Modification du profil</p>
                <p>La modification de l'email et du téléphone sera disponible prochainement. Pour toute demande urgente, contactez-nous via la <Link to="/contact" className="underline font-medium">page contact</Link>.</p>
            </div>
        </div>
    );
}

function NotificationsTab({ user }) {
    const [prefs, setPrefs] = useState(() => {
        const saved = loadPrefs();
        return {
            emailNotifications: user?.notificationEmailEnabled ?? true,
            smsNotifications: saved.smsNotifications ?? false,
            pushNotifications: saved.pushNotifications ?? false,
            newsletterWeekly: saved.newsletterWeekly ?? false,
            rdvReminders: saved.rdvReminders ?? true,
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
            <div>
                <h3 className="text-lg font-semibold mb-4">Préférences de notification</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Notifications par email</Label>
                            <p className="text-xs text-slate-500">Recevoir les mises à jour par email</p>
                        </div>
                        <Switch
                            checked={prefs.emailNotifications}
                            onCheckedChange={() => handleToggle('emailNotifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Notifications SMS</Label>
                            <p className="text-xs text-slate-500">Rappels rendez-vous par SMS</p>
                        </div>
                        <Switch
                            checked={prefs.smsNotifications}
                            onCheckedChange={() => handleToggle('smsNotifications')}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Rappels rendez-vous</Label>
                            <p className="text-xs text-slate-500">Rappel 24h et 1h avant chaque RDV</p>
                        </div>
                        <Switch
                            checked={prefs.rdvReminders}
                            onCheckedChange={() => handleToggle('rdvReminders')}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Newsletter hebdomadaire</Label>
                            <p className="text-xs text-slate-500">Nouvelles aides et actualités</p>
                        </div>
                        <Switch
                            checked={prefs.newsletterWeekly}
                            onCheckedChange={() => handleToggle('newsletterWeekly')}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Les préférences sont sauvegardées localement. La synchronisation serveur sera disponible prochainement.
            </div>
        </div>
    );
}

function SecurityTab({ user }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Sécurité du compte</h3>
                <div className="space-y-4">
                    {/* Email verification */}
                    <div className="flex items-start gap-4 p-4 rounded-lg border bg-white">
                        <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <Label className="text-sm font-medium">Email vérifié</Label>
                            <div className="mt-1">
                                {user?.emailVerifiedAt ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                                        <CheckCircle className="h-4 w-4" />
                                        Vérifié le {new Date(user.emailVerifiedAt).toLocaleDateString('fr-FR')}
                                    </span>
                                ) : (
                                    <div className="space-y-2">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            Non vérifié
                                        </span>
                                        <p className="text-xs text-slate-500">
                                            Vérifiez votre boîte mail pour le lien de confirmation.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <Label className="text-sm font-medium">Mot de passe</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Modifiez votre mot de passe régulièrement</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/auth/forgot">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Modifier
                            </Link>
                        </Button>
                    </div>

                    {/* Sessions */}
                    <div className="p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4 mb-3">
                            <Eye className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Sessions actives</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Appareils connectés à votre compte</p>
                            </div>
                        </div>
                        <div className="ml-9 p-3 bg-slate-50 rounded text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span>Session actuelle — {typeof navigator !== 'undefined' ? navigator.userAgent.split('(')[1]?.split(')')[0] || 'Navigateur' : 'Navigateur'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AccessibilityTab() {
    const [prefs, setPrefs] = useState(() => {
        const saved = loadPrefs();
        return {
            fontSize: saved.fontSize ?? 100,
            reduceMotion: saved.reduceMotion ?? false,
            highContrast: saved.highContrast ?? false,
        };
    });

    const handleChange = (key, value) => {
        setPrefs(prev => {
            const next = { ...prev, [key]: value };
            savePrefs(next);

            // Apply immediately
            if (key === 'fontSize') {
                document.documentElement.style.fontSize = `${value}%`;
            }
            if (key === 'reduceMotion') {
                document.body.classList.toggle('reduce-motion', value);
            }
            if (key === 'highContrast') {
                document.body.classList.toggle('high-contrast', value);
            }

            return next;
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Préférences d'accessibilité</h3>
                <div className="space-y-4">
                    {/* Font Size */}
                    <div className="p-4 rounded-lg border bg-white">
                        <div className="flex items-center gap-4 mb-3">
                            <Type className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <div>
                                <Label className="text-sm font-medium">Taille du texte</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Ajuster la taille de l'interface ({prefs.fontSize}%)</p>
                            </div>
                        </div>
                        <div className="ml-9 flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChange('fontSize', Math.max(80, prefs.fontSize - 10))}
                                disabled={prefs.fontSize <= 80}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                                <div
                                    className="bg-blue-500 rounded-full h-2 transition-all"
                                    style={{ width: `${((prefs.fontSize - 80) / 60) * 100}%` }}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChange('fontSize', Math.min(140, prefs.fontSize + 10))}
                                disabled={prefs.fontSize >= 140}
                            >
                                <Type className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Reduce Motion */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <Minus className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <Label className="text-sm font-medium">Réduire les animations</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Désactiver les transitions et effets visuels</p>
                            </div>
                        </div>
                        <Switch
                            checked={prefs.reduceMotion}
                            onCheckedChange={(v) => handleChange('reduceMotion', v)}
                        />
                    </div>

                    {/* High Contrast */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <Sun className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <Label className="text-sm font-medium">Contraste élevé</Label>
                                <p className="text-xs text-slate-500 mt-0.5">Augmenter le contraste des couleurs</p>
                            </div>
                        </div>
                        <Switch
                            checked={prefs.highContrast}
                            onCheckedChange={(v) => handleChange('highContrast', v)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                <p>💡 Vous pouvez aussi utiliser le <strong>panneau d'accessibilité</strong> dans le header (bouton « Accessibilité ») pour des contrôles rapides.</p>
            </div>
        </div>
    );
}

function DataTab({ user }) {
    const [exporting, setExporting] = useState(false);

    const handleExport = () => {
        setExporting(true);
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                profile: {
                    email: user?.email,
                    phone: user?.phone,
                    emailVerified: !!user?.emailVerifiedAt,
                    createdAt: user?.createdAt,
                },
                preferences: loadPrefs(),
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `accesdirectaide-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Mes données personnelles</h3>
                <div className="space-y-4">
                    {/* Export */}
                    <div className="p-4 rounded-lg border bg-white">
                        <div className="flex items-start gap-4">
                            <Download className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Exporter mes données</Label>
                                <p className="text-xs text-slate-500 mt-1">
                                    Téléchargez une copie de toutes vos données personnelles (RGPD Art. 20).
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="mt-3"
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    {exporting ? 'Export en cours...' : 'Télécharger (JSON)'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50/50">
                        <div className="flex items-start gap-4">
                            <Trash2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium text-red-800">Supprimer mon compte</Label>
                                <p className="text-xs text-red-700/80 mt-1">
                                    Cette action est irréversible. Toutes vos données, rendez-vous et messages seront supprimés.
                                </p>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="mt-3">
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                            Supprimer mon compte
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irréversible. Toutes vos données personnelles, rendez-vous et conversations seront définitivement supprimés.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700"
                                                onClick={() => {
                                                    // TODO: Implement account deletion API
                                                    alert('Fonctionnalité bientôt disponible. Contactez-nous via la page contact.');
                                                }}
                                            >
                                                Confirmer la suppression
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                <p>
                    Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                    Pour toute demande, contactez-nous via la <Link to="/contact" className="underline">page contact</Link> ou 
                    consultez notre <Link to="/securite-et-rgpd" className="underline">politique de confidentialité</Link>.
                </p>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────

export default function CompteParametres() {
    const location = useLocation();
    const safeNext = useMemo(
        () => normalizeNextPath(location.pathname + location.search, '/compte/parametres'),
        [location.pathname, location.search],
    );

    const authQuery = useQuery({
        queryKey: ['compte-parametres-auth'],
        queryFn: () => rdvMessagingClient.authMe(),
        staleTime: 30_000,
    });

    const isUser = authQuery.data?.session?.kind === 'user';
    const user = authQuery.data?.session?.user;

    if (authQuery.isLoading) {
        return (
            <div className="w-full p-4"><SkeletonList count={4} variant="card" /></div>
        );
    }

    if (!isUser) {
        return <Navigate to={appendNext('/auth/login', safeNext)} replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <SEO
                title="Paramètres du compte"
                description="Gérez vos paramètres, notifications et données personnelles."
                path="/compte/parametres"
                noindex={true}
            />

            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez votre compte et vos préférences</p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="profil" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                        <TabsTrigger value="profil" className="text-xs sm:text-sm gap-1.5 py-2.5">
                            <User className="h-4 w-4 hidden sm:block" />
                            Profil
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="text-xs sm:text-sm gap-1.5 py-2.5">
                            <Bell className="h-4 w-4 hidden sm:block" />
                            Notifs
                        </TabsTrigger>
                        <TabsTrigger value="security" className="text-xs sm:text-sm gap-1.5 py-2.5">
                            <Shield className="h-4 w-4 hidden sm:block" />
                            Sécurité
                        </TabsTrigger>
                        <TabsTrigger value="accessibility" className="text-xs sm:text-sm gap-1.5 py-2.5">
                            <Accessibility className="h-4 w-4 hidden sm:block" />
                            Accès
                        </TabsTrigger>
                        <TabsTrigger value="data" className="text-xs sm:text-sm gap-1.5 py-2.5">
                            <Database className="h-4 w-4 hidden sm:block" />
                            Données
                        </TabsTrigger>
                    </TabsList>

                    <Card>
                        <CardContent className="pt-6">
                            <TabsContent value="profil" className="mt-0">
                                <ProfilTab user={user} />
                            </TabsContent>
                            <TabsContent value="notifications" className="mt-0">
                                <NotificationsTab user={user} />
                            </TabsContent>
                            <TabsContent value="security" className="mt-0">
                                <SecurityTab user={user} />
                            </TabsContent>
                            <TabsContent value="accessibility" className="mt-0">
                                <AccessibilityTab />
                            </TabsContent>
                            <TabsContent value="data" className="mt-0">
                                <DataTab user={user} />
                            </TabsContent>
                        </CardContent>
                    </Card>
                </Tabs>

                {/* Back to messages */}
                <div className="mt-6 text-center">
                    <Link to="/compte/messages" className="text-sm text-blue-600 hover:underline">
                        ← Retour à mes messages
                    </Link>
                </div>
            </div>
        </div>
    );
}
