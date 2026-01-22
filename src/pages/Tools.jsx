
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function Tools() {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [facets, setFacets] = useState({ types: [], categories: [], publics: [] });
    const [filters, setFilters] = useState({
        type: '',
        categorie: '',
        public: ''
    });

    useEffect(() => {
        fetch('/api/tools/facets')
            .then(res => res.json())
            .then(data => setFacets(data))
            .catch(e => console.error("Facets error", e));
    }, []);

    useEffect(() => {
        fetchTools();
    }, [filters]);

    async function fetchTools() {
        setLoading(true);
        const query = new URLSearchParams();
        if (filters.type) query.append('type', filters.type);
        if (filters.categorie) query.append('categorie', filters.categorie);
        if (filters.public) query.append('public', filters.public);
        query.append('statut', 'publie');

        try {
            const res = await fetch(`/api/tools?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTools(data);
            }
        } catch (e) {
            console.error("Error fetching tools", e);
        } finally {
            setLoading(false);
        }
    }

    const typeLabels = {
        methode: "Méthode",
        numerique: "Outil Numérique",
        modele: "Modèle / Template",
        ressource: "Ressource"
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Helmet>
                <title>Boîte à Outils - Accès Direct Aide</title>
                <meta name="description" content="Outils pratiques pour l'accompagnement." />
            </Helmet>

            <h1 className="text-3xl font-bold mb-8 text-purple-900">Boîte à Outils</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Filters */}
                <aside className="bg-white p-6 rounded-lg shadow h-fit">
                    <h2 className="font-semibold mb-4">Filtrer par</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Type d'outil</label>
                        <select
                            className="w-full border rounded p-2"
                            value={filters.type}
                            onChange={e => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="">Tous</option>
                            {facets.types?.map(t => (
                                <option key={t} value={t}>{typeLabels[t] || t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Catégorie</label>
                        <select
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
                        <label className="block text-sm font-medium mb-1">Public</label>
                        <select
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
                </aside>

                {/* Results */}
                <main className="md:col-span-3">
                    {loading ? (
                        <div className="text-center py-10">Chargement...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tools.map(tool => (
                                <Link key={tool.id} to={`/outils/${tool.slug}`} className="block group h-full">
                                    <article className="bg-white p-6 rounded-lg shadow-sm border border-purple-50 hover:border-purple-200 group-hover:shadow-md transition h-full flex flex-col">
                                        <div className="flex gap-2 mb-3">
                                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full uppercase font-bold">
                                                {typeLabels[tool.type] || tool.type}
                                            </span>
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600">
                                            {tool.titre}
                                        </h2>
                                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                                            {tool.resume_falc}
                                        </p>
                                        <div className="text-purple-600 font-medium text-sm mt-auto">
                                            Voir l'outil &rarr;
                                        </div>
                                    </article>
                                </Link>
                            ))}

                            {tools.length === 0 && (
                                <div className="col-span-3 text-gray-500 text-center py-10 bg-gray-50 rounded">
                                    Aucun outil trouvé.
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
