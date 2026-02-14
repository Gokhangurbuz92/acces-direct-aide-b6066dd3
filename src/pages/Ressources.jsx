import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Loader2, FileText, ExternalLink } from 'lucide-react';

export default function Ressources() {
    const [ressources, setRessources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');

    useEffect(() => {
        const fetchRessources = async () => {
            setLoading(true);
            try {
                let url = '/api/ressources';
                const params = new URLSearchParams();
                if (filterType) params.append('type', filterType);

                if (params.toString()) url += `?${params.toString()}`;

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setRessources(data.items || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRessources();
    }, [filterType]);

    return (
        <div className="container mx-auto px-4 py-8">
            <SEO
                title="Ressources d'accessibilité"
                description="Découvrez les ressources pour améliorer l'accessibilité et l'inclusion."
                path="/ressources"
            />

            <h1 className="text-3xl font-bold mb-6 text-slate-800">Ressources d'Accessibilité</h1>

            <div className="bg-white p-4 rounded-lg shadow mb-8 flex flex-wrap gap-4 items-center">
                <select
                    className="border p-2 rounded"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="">Tous les types</option>
                    <option value="guide">Guides</option>
                    <option value="tool">Outils</option>
                    <option value="document">Documents</option>
                    <option value="link">Liens utiles</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ressources.map((r) => (
                        <Link key={r.id} to={`/ressources/${r.slug}`} data-testid="ressource-card">
                            <Card className="h-full hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-3 mb-3">
                                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                                        <h3 className="font-semibold text-lg text-slate-900" data-testid="ressource-title">
                                            {r.title}
                                        </h3>
                                    </div>
                                    {r.type && (
                                        <Badge className="mb-3 bg-blue-100 text-blue-800">
                                            {r.type}
                                        </Badge>
                                    )}
                                    {r.content && (
                                        <p className="text-sm text-slate-600 line-clamp-3">
                                            {r.content.substring(0, 150)}...
                                        </p>
                                    )}
                                    {r.source_url && (
                                        <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
                                            <ExternalLink className="h-3 w-3" />
                                            <span>Source externe</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                    {ressources.length === 0 && (
                        <p className="col-span-3 text-center text-gray-500">Aucune ressource trouvée pour ces critères.</p>
                    )}
                </div>
            )}
        </div>
    );
}
