import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Login() {
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
                <CardContent className="grid gap-3 sm:grid-cols-2">
                    <Link
                        to="/admin/login"
                        aria-label="Aller à la connexion administration"
                        className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Administration
                    </Link>
                    <Link
                        to="/pro/login"
                        aria-label="Aller à la connexion espace pro"
                        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Espace Pro
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
