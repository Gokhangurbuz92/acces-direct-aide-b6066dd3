import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { getCsrfHeaders } from '@/lib/csrf';
export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                 <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Lien invalide ou manquant.</AlertDescription>
                 </Alert>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setStatus({ type: 'error', message: "Les mots de passe ne correspondent pas." });
            return;
        }
        if (password.length < 8) {
             setStatus({ type: 'error', message: "8 caractères minimum requis." });
             return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await fetch('/api/pro/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Erreur.");

            setStatus({ type: 'success', message: "Mot de passe modifié !" });
            setTimeout(() => navigate('/pro/login'), 2000);

        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <SEO title="Nouveau mot de passe" noindex={true} />
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Nouveau mot de passe</CardTitle>
                </CardHeader>
                <CardContent>
                     {status.message && (
                        <Alert variant={status.type === 'error' ? "destructive" : "default"} className={`mb-4 ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''}`}>
                            {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            <AlertDescription>{status.message}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pass">Mot de passe</Label>
                            <Input
                                id="pass"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirmation</Label>
                            <Input
                                id="confirm"
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Valider"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
