
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ShieldCheck, Building2, Lock, Mail, ArrowRight } from 'lucide-react';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';

/**
 * ProLogin — Page de connexion Espace Professionnel
 * Design premium avec support MFA.
 */
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
                body: JSON.stringify({ email, password }),
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
                body: JSON.stringify({ mfa_token: mfaToken, code: mfaCode }),
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <SEO title="Espace Pro" description="Connexion à votre espace professionnel" path="/pro/login" noindex={true} />

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 md:p-12">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="relative inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] mb-6 ring-8 ring-emerald-50/50">
                            <Building2 size={40} />
                            <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Espace Pro</h1>
                        <p className="text-slate-500 mt-3 font-medium text-lg">
                            {isMfaStep ? 'Vérification en deux étapes' : 'Accès réservé aux structures'}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive" className="mb-6 rounded-2xl bg-red-50 border-red-100">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="font-semibold text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* MFA Step */}
                    {isMfaStep ? (
                        <form onSubmit={handleMfaVerify} className="space-y-6">
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-2">
                                <ShieldCheck className="h-4 w-4 text-teal-600" />
                                Entrez le code de votre application d&apos;authentification
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mfa-code" className="text-slate-700 font-bold text-xs uppercase tracking-widest">
                                    Code à 6 chiffres
                                </Label>
                                <Input
                                    id="mfa-code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-xl tracking-[0.3em] font-mono h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-[1.25rem] shadow-xl"
                                disabled={loading || mfaCode.length !== 6}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Vérifier'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMfaToken('');
                                    setMfaCode('');
                                    setError('');
                                }}
                                className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                ← Retour à la connexion
                            </button>
                        </form>
                    ) : (
                        /* Standard Login */
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-bold text-xs uppercase tracking-widest ml-1">
                                    Identifiant professionnel
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nom@structure.fr"
                                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-base"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <Label htmlFor="password" className="text-slate-700 font-bold text-xs uppercase tracking-widest">
                                        Mot de passe
                                    </Label>
                                    <Link to={forgotPath} className="text-xs font-bold text-emerald-600 hover:underline uppercase tracking-tight">
                                        Oublié ?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white transition-all text-base"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-lg rounded-[1.25rem] shadow-xl transition-all active:scale-95 disabled:opacity-70 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Se connecter <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                            <div className="text-center text-sm text-slate-600 mt-4">
                                Pas encore de compte ?{' '}
                                <Link to={registerPath} className="text-emerald-600 font-bold hover:underline">
                                    Créer ma structure
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Security badge */}
                    {!isMfaStep && (
                        <p className="text-center text-[9px] text-slate-400 uppercase tracking-[0.25em] font-black flex items-center justify-center gap-2 pt-8">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Sécurité Renforcée · MFA · Chiffrement E2E
                        </p>
                    )}
                </div>
            </div>

            <p className="mt-8 text-slate-400 text-sm font-medium">
                Besoin d&apos;aide ?{' '}
                <a href="/contact" className="text-indigo-600 hover:underline">
                    Contacter le support
                </a>
            </p>
        </div>
    );
}
