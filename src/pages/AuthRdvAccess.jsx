import { Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';

/**
 * @param {{ mode?: 'login' | 'signup' }} props
 */
export default function AuthRdvAccess({ mode = 'login' }) {
  const [searchParams] = useSearchParams();
  const next = normalizeNextPath(searchParams.get('next'), '/annuaire');

  const proLoginPath = appendNext('/pro/login', next);
  const proSignupPath = appendNext('/pro/register', next);
  const backPath = next || '/annuaire';

  const isSignupMode = mode === 'signup';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <SEO
        title={isSignupMode ? 'Inscription requise' : 'Connexion requise'}
        description="AccesDirectAide - parcours de rendez-vous"
        path={isSignupMode ? '/auth/signup' : '/auth/login'}
        noindex={true}
      />

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isSignupMode ? 'Inscription requise' : 'Connexion requise'}
          </CardTitle>
          <CardDescription>
            Pour continuer la prise de rendez-vous, connectez-vous ou créez un compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Le compte Particulier est en cours de déploiement. En attendant, l&apos;accès passe par l&apos;espace Pro.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to={proLoginPath}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Se connecter
            </Link>
            <Link
              to={proSignupPath}
              className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Créer un compte
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {!isSignupMode ? (
              <Link className="text-blue-700 hover:underline" to={appendNext('/auth/signup', next)}>
                Je n&apos;ai pas de compte
              </Link>
            ) : (
              <Link className="text-blue-700 hover:underline" to={appendNext('/auth/login', next)}>
                J&apos;ai déjà un compte
              </Link>
            )}
            <Link className="text-slate-600 hover:underline" to={backPath}>
              Retour au parcours
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
