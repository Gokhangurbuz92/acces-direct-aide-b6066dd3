import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import SEO from '@/components/SEO';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await apiClient.auth.login(email, password);
            toast.success("Connexion réussie");
            navigate('/admin');
        } catch (err) {
            toast.error("Erreur de connexion", { description: "Vérifiez vos identifiants" });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <SEO
                title="Administration"
                description="Connexion à l'espace d'administration"
                path="/admin/login"
                noindex={true}
            />
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Administration</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email">Email</label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password">Mot de passe</label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">Se connecter</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
