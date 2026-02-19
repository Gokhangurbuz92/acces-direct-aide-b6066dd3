import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * @param {string} status
 */
function getStatusCopy(status) {
  switch (status) {
    case 'success':
      return {
        title: 'Email verifie',
        description: 'Votre compte est actif. Vous pouvez continuer votre parcours.',
      };
    case 'expired':
      return {
        title: 'Lien expire',
        description: 'Le lien de verification n’est plus valide. Demandez un nouvel email.',
      };
    case 'invalid':
      return {
        title: 'Lien invalide',
        description: 'Ce lien est invalide. Demandez un nouvel email de verification.',
      };
    case 'error':
      return {
        title: 'Verification indisponible',
        description: 'Une erreur est survenue. Reessayez dans quelques instants.',
      };
    default:
      return {
        title: 'Verification de votre email',
        description: 'Consultez votre boite mail et cliquez sur le lien de verification.',
      };
  }
}

export default function AuthVerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const status = String(searchParams.get('status') || 'pending').trim().toLowerCase();
  const next = normalizeNextPath(searchParams.get('next'), '/annuaire');
  const email = String(searchParams.get('email') || '').trim();
  const copy = useMemo(() => getStatusCopy(status), [status]);

  async function handleResend() {
    if (!email) {
      setMessage('Renseignez votre email depuis la page de connexion pour renvoyer le lien.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next }),
      });
      setMessage("Si l'email est valide, un nouveau lien vient d'etre envoye.");
    } catch {
      setMessage("Impossible d'envoyer le lien pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <SEO
        title="Verification email"
        description="Activez votre compte Particulier Acces Direct Aide."
        path="/auth/verify-email"
        noindex={true}
      />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          {status === 'success' ? (
            <Link
              to={next}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Continuer
            </Link>
          ) : (
            <Button type="button" onClick={handleResend} disabled={loading}>
              {loading ? 'Envoi...' : 'Renvoyer un email de verification'}
            </Button>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="text-blue-700 hover:underline" to={appendNext('/auth/login', next)}>
              Retour a la connexion
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
