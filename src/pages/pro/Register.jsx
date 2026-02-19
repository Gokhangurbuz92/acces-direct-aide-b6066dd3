import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';

export default function ProRegister() {
    const [structureName, setStructureName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const next = normalizeNextPath(searchParams.get('next'), '/pro/dashboard');
    const loginPath = appendNext('/pro/login', next);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/pro/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ structureName, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de l\'inscription');
            }

            localStorage.setItem('pro_token', data.token);
            navigate(next);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <SEO
                title="Créer un compte Pro"
                description="Inscription à l'espace professionnel AccesDirect"
                path="/pro/register"
                noindex={true}
            />
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Créer un compte Pro</CardTitle>
                    <CardDescription className="text-center">Rejoignez AccesDirect pour gérer votre structure</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="structureName">Nom de la structure</Label>
                            <Input
                                id="structureName"
                                type="text"
                                placeholder="Ex: CCAS de Paris, Association Espoir..."
                                value={structureName}
                                onChange={e => setStructureName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email professionnel</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "S'inscrire"}
                        </Button>
                        <div className="text-center text-sm text-slate-600 mt-4">
                            Déjà un compte ? <Link to={loginPath} className="text-blue-600 hover:underline">Se connecter</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
