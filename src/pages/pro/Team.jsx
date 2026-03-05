import { SkeletonList } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    UserPlus,
    Mail,
    Users,
    Calendar,
    MessageCircle,
    ShieldCheck,
    BarChart3,
    Crown,
    UserCog,
    UserX,
    TrendingUp,
    RefreshCw,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

/**
 * ProTeam — Page enrichie de gestion d'équipe
 *
 * Affiche les statistiques globales et par agent, les invitations
 * en attente, et permet d'inviter ou désactiver des membres.
 *
 * Accessible uniquement aux STRUCTURE_ADMIN et SUPERADMIN.
 */
export default function ProTeam() {
    const { user } = useOutletContext();
    const [data, setData] = useState({ users: [], invitations: [] });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    const [disablingId, setDisablingId] = useState(null);
    const [confirmDisable, setConfirmDisable] = useState(null);
    const [resendingId, setResendingId] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;
    const headers = { Authorization: `Bearer ${token}` };

    const fetchTeam = useCallback(async () => {
        setLoading(true);
        try {
            const [teamRes, statsRes] = await Promise.allSettled([
                fetch('/api/pro/team', { headers }),
                fetch('/api/pro/team/stats', { headers }),
            ]);

            if (teamRes.status === 'fulfilled' && teamRes.value.ok) {
                setData(await teamRes.value.json());
            }
            if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
                setStats(await statsRes.value.json());
            }
        } catch (e) {
            if (import.meta.env.DEV) console.error('[ProTeam] Erreur:', e);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('PRO');

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await fetch('/api/pro/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            });
            if (res.ok) {
                toast.success(`Invitation envoyée à ${inviteEmail}`);
                fetchTeam();
                setIsInviteOpen(false);
                setInviteEmail('');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Erreur lors de l\'envoi');
            }
        } catch {
            toast.error('Erreur réseau. Veuillez réessayer.');
        } finally {
            setInviting(false);
        }
    };

    const handleDisable = async (targetUserId) => {
        setDisablingId(targetUserId);
        try {
            const res = await fetch(`/api/pro/team?userId=${targetUserId}`, {
                method: 'DELETE',
                headers,
            });
            if (res.ok) {
                toast.success('Collaborateur désactivé.');
                fetchTeam();
            } else {
                toast.error('Erreur lors de la désactivation.');
            }
        } catch {
            toast.error('Erreur réseau.');
        } finally {
            setDisablingId(null);
            setConfirmDisable(null);
        }
    };

    const handleResendInvitation = async (invitationId, email) => {
        setResendingId(invitationId);
        try {
            const res = await fetch('/api/pro/resend-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ invitationId }),
            });
            if (res.ok) {
                toast.success(`Invitation relancée à ${email}`);
            } else {
                const err = await res.json();
                toast.error(err.error || 'Erreur lors de la relance');
            }
        } catch {
            toast.error('Erreur réseau.');
        } finally {
            setResendingId(null);
        }
    };

    const handleCancelInvitation = async (invitationId, email) => {
        setCancellingId(invitationId);
        try {
            const res = await fetch(`/api/pro/invite?id=${invitationId}`, {
                method: 'DELETE',
                headers,
            });
            if (res.ok) {
                toast.success(`Invitation annulée pour ${email}`);
                fetchTeam();
            } else {
                toast.error('Erreur lors de l\'annulation.');
            }
        } catch {
            toast.error('Erreur réseau.');
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="w-full p-4"><SkeletonList count={3} variant="card" /></div>
        );
    }

    const globalStats = stats?.global || {};
    const memberStats = stats?.members || [];
    const activeMemberCount = data.users.filter((u) => u.status === 'active').length;

    // Build a lookup for per-member appointment counts from stats
    const memberCountMap = {};
    for (const m of memberStats) {
        memberCountMap[m.id] = m.appointmentsCount || 0;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mon Équipe</h1>
                    <p className="text-sm text-slate-500">
                        Gestion et pilotage de votre structure
                    </p>
                </div>
                <Button onClick={() => setIsInviteOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inviter un collaborateur
                </Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users className="text-indigo-500" size={18} />}
                    label="Membres actifs"
                    value={activeMemberCount}
                />
                <StatCard
                    icon={<Calendar className="text-emerald-500" size={18} />}
                    label="RDV aujourd'hui"
                    value={globalStats.appointmentsToday ?? '--'}
                />
                <StatCard
                    icon={<TrendingUp className="text-amber-500" size={18} />}
                    label="RDV à venir"
                    value={globalStats.appointmentsUpcoming ?? '--'}
                />
                <StatCard
                    icon={<MessageCircle className="text-purple-500" size={18} />}
                    label="Conversations actives"
                    value={globalStats.conversationsActive ?? '--'}
                />
            </div>

            {/* E2EE notice */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                <p className="text-xs text-emerald-700">
                    <strong>Zero-Knowledge :</strong> les messages entre agents et usagers
                    sont chiffrés de bout en bout. Même en tant que Responsable, vous ne
                    pouvez pas lire leur contenu.
                </p>
            </div>

            {/* Members table */}
            <div>
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-500" />
                    Membres et Performance
                </h2>
                <div className="space-y-3">
                    {data.users.map((u) => (
                        <Card
                            key={u.id}
                            className={
                                u.status === 'disabled'
                                    ? 'opacity-50'
                                    : u.status === 'active'
                                        ? ''
                                        : 'bg-slate-50'
                            }
                        >
                            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="relative w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                                        {(u.email || '?')[0].toUpperCase()}
                                        {u.status === 'active' && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 text-sm truncate">
                                            {u.email}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                            <RoleBadge role={u.role} />
                                            <span>•</span>
                                            <span
                                                className={
                                                    u.status === 'active'
                                                        ? 'text-emerald-600'
                                                        : 'text-slate-400'
                                                }
                                            >
                                                {u.status === 'active' ? 'Actif' : u.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Stat pill */}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                                        <Calendar size={12} />
                                        <span className="font-semibold text-slate-700">
                                            {memberCountMap[u.id] ?? 0}
                                        </span>
                                        <span>RDV</span>
                                    </div>

                                    {/* Actions */}
                                    {u.id !== user?.id && u.status !== 'disabled' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setConfirmDisable(u)}
                                            disabled={disablingId === u.id}
                                        >
                                            {disablingId === u.id ? (
                                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <UserX className="mr-1 h-3.5 w-3.5" />
                                            )}
                                            Désactiver
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Pending Invitations */}
            {data.invitations.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Mail size={16} className="text-indigo-500" />
                        Invitations en attente
                    </h2>
                    <div className="space-y-2">
                        {data.invitations.map((inv) => (
                            <Card key={inv.id} className="bg-slate-50">
                                <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4">
                                    <div>
                                        <p className="font-medium text-sm">{inv.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <RoleBadge role={inv.role} />
                                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">En attente</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleResendInvitation(inv.id, inv.email)}
                                            disabled={resendingId === inv.id}
                                        >
                                            {resendingId === inv.id ? (
                                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                            )}
                                            Relancer
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleCancelInvitation(inv.id, inv.email)}
                                            disabled={cancellingId === inv.id}
                                        >
                                            {cancellingId === inv.id ? (
                                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                            )}
                                            Annuler
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Dialog */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inviter un membre</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div>
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="invite-role">Rôle</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger id="invite-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRO">
                                        Professionnel (Lecture seule équipe)
                                    </SelectItem>
                                    <SelectItem value="STRUCTURE_ADMIN">
                                        Administrateur (Gestion équipe/services)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={inviting}>
                                {inviting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                )}
                                {inviting ? 'Envoi...' : 'Inviter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Disable Dialog */}
            <Dialog open={!!confirmDisable} onOpenChange={() => setConfirmDisable(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Désactiver ce collaborateur ?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600">
                        Le compte de <strong>{confirmDisable?.email}</strong> sera désactivé.
                        Il ne pourra plus accéder à l&apos;Espace Pro.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmDisable(null)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleDisable(confirmDisable?.id)}
                            disabled={disablingId === confirmDisable?.id}
                        >
                            {disablingId === confirmDisable?.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <UserX className="mr-2 h-4 w-4" />
                            )}
                            Confirmer la désactivation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-slate-500">
                    {label}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

function RoleBadge({ role }) {
    if (role === 'STRUCTURE_ADMIN' || role === 'SUPERADMIN') {
        return (
            <span className="inline-flex items-center gap-1 text-amber-600">
                <Crown size={10} />
                {role === 'SUPERADMIN' ? 'Super Admin' : 'Responsable'}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1">
            <UserCog size={10} />
            Agent
        </span>
    );
}
