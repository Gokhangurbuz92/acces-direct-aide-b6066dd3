import { Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { appendNext, normalizeNextPath } from '@/lib/rdvRouting';

export default function Login() {
    const [searchParams] = useSearchParams();
    const next = normalizeNextPath(searchParams.get('next'), '');
    const mode = String(searchParams.get('mode') || '').trim().toLowerCase();
    const adminLoginPath = appendNext('/admin/login', next);
    const proLoginPath = appendNext('/pro/login', next);
    const signupPath = appendNext('/auth/signup', next);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <SEO
                title="Connexion"
                description="AccesDirectAide - Connexion admin ou espace professionnel"
                path="/login"
                noindex={true}
            />
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Connexion</CardTitle>
                    <CardDescription className="text-center">
                        Choisissez votre espace de connexion
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mode === 'pro' && (
                        <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
                            Une connexion est requise pour accéder au parcours rendez-vous.
                        </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Link
                            to={adminLoginPath}
                            aria-label="Aller à la connexion administration"
                            className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Administration
                        </Link>
                        <Link
                            to={proLoginPath}
                            aria-label="Aller à la connexion espace pro"
                            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Espace Pro
                        </Link>
                    </div>
                    <div className="text-center text-sm text-slate-700">
                        Pas encore de compte ?{' '}
                        <Link className="text-blue-900 hover:underline" to={signupPath}>
                            Créer un compte
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
