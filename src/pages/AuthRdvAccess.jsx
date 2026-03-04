import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * @param {{ mode?: 'login' | 'signup' }} props
 */
export default function AuthRdvAccess({ mode = 'login' }) {
  const isSignupMode = mode === 'signup';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const next = normalizeNextPath(searchParams.get('next'), '/annuaire');

  const pageTitle = isSignupMode ? 'Creer un compte Particulier' : 'Connexion Particulier';
  const altPath = isSignupMode ? appendNext('/auth/login', next) : appendNext('/auth/signup', next);
  const forgotPath = appendNext('/auth/forgot', next);
  const proLoginPath = appendNext('/pro/login', next);

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (!isSignupMode) return true;
    return confirmPassword.length > 0;
  }, [confirmPassword.length, email, isSignupMode, password]);

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfo('');

    if (isSignupMode && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignupMode ? '/api/auth/signup' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, next }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (!isSignupMode && response.status === 403 && payload?.code === 'EMAIL_NOT_VERIFIED') {
          setInfo('Votre email doit être vérifié avant la connexion.');
          return;
        }
        throw new Error(payload?.error || 'Une erreur est survenue.');
      }

      if (isSignupMode) {
        navigate(
          `/auth/verify-email?status=pending&next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`,
          { replace: true },
        );
        return;
      }

      if (typeof window !== 'undefined') {
        window.location.assign(next);
        return;
      }
      navigate(next, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email) {
      setError("Renseignez votre email pour renvoyer le lien de verification.");
      return;
    }
    setError('');
    setInfo('');
    setResendLoading(true);
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next }),
      });
      setInfo("Si l'email est valide, un lien de verification vient d'etre renvoye.");
    } catch {
      setError('Impossible de renvoyer le lien pour le moment.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <SEO
        title={pageTitle}
        description="Connexion au compte Particulier pour finaliser une demande de rendez-vous."
        path={isSignupMode ? '/auth/signup' : '/auth/login'}
        noindex={true}
      />

      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">{pageTitle}</CardTitle>
          <CardDescription>
            Connectez-vous pour poursuivre votre demande de rendez-vous.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {info && (
            <Alert>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-password">Mot de passe</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={isSignupMode ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>

            {isSignupMode && (
              <div className="space-y-2">
                <Label htmlFor="auth-password-confirm">Confirmer le mot de passe</Label>
                <Input
                  id="auth-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSignupMode ? 'Creer mon compte' : 'Se connecter'}
            </Button>
          </form>

          {!isSignupMode && (
            <div className="flex flex-wrap gap-3 text-sm">
              <Link className="text-blue-800 hover:underline" to={forgotPath}>
                Mot de passe oublié ?
              </Link>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-blue-800 hover:underline disabled:opacity-60"
              >
                {resendLoading ? 'Envoi...' : 'Renvoyer un email de verification'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="text-blue-800 hover:underline" to={altPath}>
              {isSignupMode ? "J'ai deja un compte" : "Je n'ai pas de compte"}
            </Link>
            <Link className="text-slate-600 hover:underline" to={proLoginPath}>
              Je suis une structure / un pro
            </Link>
            <Link className="text-slate-600 hover:underline" to={next}>
              Retour au parcours
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
