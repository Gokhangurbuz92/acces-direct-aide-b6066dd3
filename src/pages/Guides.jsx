
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

export default function Guides() {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [facets, setFacets] = useState({ categories: [], publics: [], contextes: [] });
    const [filters, setFilters] = useState({
        categorie: '',
        public: '',
        contexte: ''
    });

    useEffect(() => {
        // Load facets
        fetch('/api/guides/facets')
            .then(res => res.json())
            .then(data => setFacets(data))
            .catch(e => console.error("Facets error", e));
    }, []);

    useEffect(() => {
        async function fetchGuides() {
            setLoading(true);
            const query = new URLSearchParams();
            if (filters.categorie) query.append('categorie', filters.categorie);
            if (filters.public) query.append('public', filters.public);
            if (filters.contexte) query.append('contexte', filters.contexte);
            query.append('statut', 'publie');

            try {
                const res = await fetch(`/api/guides?${query.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setGuides(data);
                }
            } catch (e) {
                console.error("Error fetching guides", e);
            } finally {
                setLoading(false);
            }
        }
        fetchGuides();
    }, [filters]);

    return (
        <div className="container mx-auto px-4 py-8">
            <SEO
                title="Bonnes Pratiques"
                description="Guides et bonnes pratiques FALC pour l'accessibilité."
                path="/bonnes-pratiques"
            />

            <h1 className="text-3xl font-bold mb-8 text-blue-900">Bonnes Pratiques</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Filters */}
                <aside className="bg-white p-6 rounded-lg shadow h-fit">
                    <h2 className="font-semibold mb-4">Filtrer par</h2>

                    <div className="mb-4">
                        <label htmlFor="guides-f1" className="block text-sm font-medium mb-1">Catégorie</label>
                        <select id="guides-f1"
                            className="w-full border rounded p-2"
                            value={filters.categorie}
                            onChange={e => setFilters({ ...filters, categorie: e.target.value })}
                        >
                            <option value="">Toutes</option>
                            {facets.categories?.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="guides-f2" className="block text-sm font-medium mb-1">Public</label>
                        <select id="guides-f2"
                            className="w-full border rounded p-2"
                            value={filters.public}
                            onChange={e => setFilters({ ...filters, public: e.target.value })}
                        >
                            <option value="">Tous</option>
                            {facets.publics?.map(p => (
                                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="guides-f3" className="block text-sm font-medium mb-1">Contexte</label>
                        <select id="guides-f3"
                            className="w-full border rounded p-2"
                            value={filters.contexte}
                            onChange={e => setFilters({ ...filters, contexte: e.target.value })}
                        >
                            <option value="">Tous</option>
                            {facets.contextes?.map(c => (
                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </aside>

                {/* Results */}
                <main className="md:col-span-3">
                    {loading ? (
                        <div className="text-center py-10">Chargement...</div>
                    ) : (
                        <div className="grid gap-6">
                            {guides.map(guide => (
                                <Link key={guide.id} to={`/bonnes-pratiques/${guide.slug}`} className="block group">
                                    <article className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 group-hover:shadow-md transition">
                                        <div className="flex gap-2 mb-2">
                                            {guide.categorie && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-bold">
                                                    {guide.categorie}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">
                                            {guide.titre}
                                        </h2>
                                        <p className="text-gray-600 line-clamp-2">
                                            {guide.resume_falc || "Voir le guide..."}
                                        </p>
                                    </article>
                                </Link>
                            ))}

                            {guides.length === 0 && (
                                <div className="text-gray-500 text-center py-10 bg-gray-50 rounded">
                                    Aucun guide trouvé pour ces filtres.
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
