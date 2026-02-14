
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ProStructure() {
    useOutletContext();
    const [structure, setStructure] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [summaryFalc, setSummaryFalc] = useState('');
    const [isProEnabled, setIsProEnabled] = useState(false);

    const fetchStructure = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('pro_token');
            const res = await fetch('/api/pro/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStructure(data.structure);
                setSummaryFalc(data.structure.summary_falc || '');
                setIsProEnabled(data.structure.is_pro_enabled || false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStructure();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('pro_token');

        // We need an endpoint to update structure. /api/pro/structure?
        // User request: "/pro/structure (edit structure profile FALC + enable pro module)"
        // And backend API list: "Structure Settings: PUT /api/pro/structure" (from my implementation plan).
        // I haven't implemented `api/pro/structure.js` yet! I missed it in previous step.
        // I will use `api/pro/me` logic or create `api/pro/structure.js`. 
        // `api/pro/me` is GET only.
        // I'll create `api/pro/structure.js` after this.

        try {
            const res = await fetch('/api/pro/structure', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    summary_falc: summaryFalc,
                    is_pro_enabled: isProEnabled
                })
            });
            if (res.ok) {
                // Success
                alert("Modifications enregistrées");
                fetchStructure();
            } else {
                alert("Erreur lors de la sauvegarde");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Ma Structure</h1>

            <Card>
                <CardHeader>
                    <CardTitle>{structure?.nom}</CardTitle>
                    <CardDescription>Gérez les informations publiques de votre structure.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Résumé FALC (Facile à lire et à comprendre)</Label>
                            <Textarea
                                rows={5}
                                value={summaryFalc}
                                onChange={e => setSummaryFalc(e.target.value)}
                                placeholder="Décrivez votre structure simplement..."
                            />
                        </div>

                        <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50">
                            <Checkbox
                                id="pro-enable"
                                checked={isProEnabled}
                                onCheckedChange={setIsProEnabled}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="pro-enable" className="text-base font-medium">
                                    Activer le module "Services & Prise de RDV"
                                </Label>
                                <p className="text-sm text-slate-500">
                                    En cochant cette case, vos services seront visibles sur votre page publique et le bouton "Prendre RDV" apparaîtra (bientôt disponible).
                                </p>
                            </div>
                        </div>

                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer les modifications
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
