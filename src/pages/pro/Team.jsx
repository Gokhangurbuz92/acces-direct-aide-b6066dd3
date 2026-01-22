
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Mail, ShieldAlert } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProTeam() {
    const { user } = useOutletContext();
    const [data, setData] = useState({ users: [], invitations: [] });
    const [loading, setLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('PRO');

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('pro_token');
            const res = await fetch('/api/pro/team', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setData(await res.json());
            } else {
                // Redirect or error if 403 (should be handled by layout/guard usually)
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('pro_token');
        try {
            const res = await fetch('/api/pro/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            if (res.ok) {
                fetchTeam();
                setIsInviteOpen(false);
                setInviteEmail('');
            } else {
                const err = await res.json();
                alert("Erreur: " + err.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDisable = async (targetUserId) => {
        if (!confirm("Désactiver ce compte collaborateur ?")) return;
        const token = localStorage.getItem('pro_token');
        await fetch(`/api/pro/team?userId=${targetUserId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchTeam();
    };

    if (loading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Mon Équipe</h1>
                <Button onClick={() => setIsInviteOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inviter un collaborateur
                </Button>
            </div>

            {/* Members */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Membres Actifs</h2>
                {data.users.map(u => (
                    <Card key={u.id}>
                        <CardContent className="flex justify-between items-center p-4">
                            <div>
                                <p className="font-medium">{u.email}</p>
                                <div className="flex gap-2 text-sm text-slate-500">
                                    <span>{u.role}</span>
                                    <span>•</span>
                                    <span className={u.status === 'active' ? 'text-green-600' : 'text-slate-400'}>{u.status}</span>
                                </div>
                            </div>
                            {u.id !== user.id && u.status !== 'disabled' && (
                                <Button variant="ghost" className="text-red-600" onClick={() => handleDisable(u.id)}>Désactiver</Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Invitations */}
            {data.invitations.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Invitations en attente</h2>
                    {data.invitations.map(inv => (
                        <Card key={inv.id} className="bg-slate-50">
                            <CardContent className="flex justify-between items-center p-4">
                                <div>
                                    <p className="font-medium">{inv.email}</p>
                                    <span className="text-sm text-slate-500">{inv.role}</span>
                                </div>
                                <div className="flex items-center text-sm text-slate-500">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Envoyé
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
                            <Label>Email</Label>
                            <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                        </div>
                        <div>
                            <Label>Rôle</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRO">Professionnel (Lecture seule équipe)</SelectItem>
                                    <SelectItem value="STRUCTURE_ADMIN">Administrateur (Gestion équipe/services)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Inviter</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
