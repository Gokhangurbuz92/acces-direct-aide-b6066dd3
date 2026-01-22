import React, { useEffect, useState } from 'react';
import { adminClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

import SEO from '@/components/SEO';

export default function LoginPro() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Redundant safety check: component shouldn't be rendered if route is conditional,
    // but good to have as double protection.
    const isEnabled = import.meta.env.VITE_DEV_LOGIN_ENABLED === 'true';

    useEffect(() => {
        if (!isEnabled) {
            // In case the route was somehow reached (e.g. client side navigation glitch), 
            // redirect to 404 or Home.
            navigate('/', { replace: true });
        }
    }, [isEnabled, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await adminClient.auth.login(email, password);
            navigate('/adminaides');
        } catch (err) {
            console.error("Login failed", err);
            // Generic error message for security
            setError("Identifiants invalides.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isEnabled) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <SEO
                title="Connexion Pro"
                description="Espace d'administration"
                path="/login/pro"
                noindex={true}
            />
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Connexion Pro</CardTitle>
                    <CardDescription>
                        Accès réservé aux administrateurs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email pro"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Connexion..." : "Se connecter"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
