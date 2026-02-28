
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';

export default function ProLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const next = normalizeNextPath(searchParams.get('next'), '/pro/dashboard');
    const forgotPath = appendNext('/pro/forgot-password', next);
    const registerPath = appendNext('/pro/register', next);

    // MFA state
    const [mfaToken, setMfaToken] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const isMfaStep = Boolean(mfaToken);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/pro/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // MFA required — switch to code input
            if (data.mfa_required) {
                setMfaToken(data.mfa_token);
                return;
            }

            localStorage.setItem('pro_token', data.token);
            navigate(next);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/pro/auth/mfa-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mfa_token: mfaToken, code: mfaCode })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
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
                title="Espace Pro"
                description="Connexion à votre espace professionnel"
                path="/pro/login"
                noindex={true}
            />
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">AccesDirect Pro</CardTitle>
                    <CardDescription className="text-center">
                        {isMfaStep ? 'Vérification en deux étapes' : 'Connexion à votre espace structure'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* MFA Code Step */}
                    {isMfaStep ? (
                        <form onSubmit={handleMfaVerify} className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-2">
                                <ShieldCheck className="h-4 w-4 text-teal-600" />
                                Entrez le code de votre application d&apos;authentification
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mfa-code">Code à 6 chiffres</Label>
                                <Input
                                    id="mfa-code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-xl tracking-[0.3em] font-mono"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading || mfaCode.length !== 6}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Vérifier'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setMfaToken(''); setMfaCode(''); setError(''); }}
                                className="w-full text-sm text-slate-500 hover:text-slate-700"
                            >
                                ← Retour à la connexion
                            </button>
                        </form>
                    ) : (
                        /* Standard Login Form */
                        <form onSubmit={handleLogin} className="space-y-4">
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
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Link to={forgotPath} className="text-xs text-blue-600 hover:underline">Oublié ?</Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Se connecter'}
                            </Button>
                            <div className="text-center text-sm text-slate-600 mt-4">
                                Pas encore de compte ? <Link to={registerPath} className="text-blue-600 hover:underline">Créer ma structure</Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

