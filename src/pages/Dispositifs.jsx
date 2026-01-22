import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export default function Dispositifs() {
    const [dispositifs, setDispositifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState('');
    const [filterPublic, setFilterPublic] = useState('');

    useEffect(() => {
        fetchDispositifs();
    }, [filterDept, filterPublic]);

    const fetchDispositifs = async () => {
        setLoading(true);
        try {
            let url = '/api/dispositifs';
            const params = new URLSearchParams();
            if (filterDept) params.append('departement', filterDept);
            if (filterPublic) params.append('public', filterPublic);

            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setDispositifs(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Helmet>
                <title>Dispositifs territoriaux | AccesDirectAide</title>
                <meta name="description" content="Découvrez les dispositifs locaux et territoriaux pour vous aider." />
            </Helmet>

            <h1 className="text-3xl font-bold mb-6 text-slate-800">Dispositifs Territoriaux</h1>

            <div className="bg-white p-4 rounded-lg shadow mb-8 flex flex-wrap gap-4 items-center">
                <select
                    className="border p-2 rounded"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                >
                    <option value="">Tous les départements</option>
                    <option value="67">Bas-Rhin (67)</option>
                    <option value="68">Haut-Rhin (68)</option>
                </select>

                <select
                    className="border p-2 rounded"
                    value={filterPublic}
                    onChange={(e) => setFilterPublic(e.target.value)}
                >
                    <option value="">Tous publics</option>
                    <option value="jeunes">Jeunes</option>
                    <option value="seniors">Seniors</option>
                    <option value="familles">Familles</option>
                    <option value="handicap">Personnes handicapées</option>
                </select>
            </div>

            {loading ? (
                <p>Chargement...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dispositifs.map((d) => (
                        <div key={d.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition">
                            <h2 className="text-xl font-semibold mb-2 text-indigo-700">{d.titre}</h2>
                            <p className="text-gray-600 mb-4 line-clamp-3">{d.description_falc || "Pas de description disponible."}</p>

                            {d.montant && (
                                <div className="mb-4 text-sm font-medium text-green-700 bg-green-50 p-2 rounded inline-block">
                                    💰 {d.montant}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-auto">
                                {d.liens && Array.isArray(d.liens) && d.liens.map((l, idx) => (
                                    <a
                                        key={idx}
                                        href={l.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline text-sm"
                                    >
                                        {l.nom || "En savoir plus"}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                    {dispositifs.length === 0 && (
                        <p className="col-span-3 text-center text-gray-500">Aucun dispositif trouvé pour ces critères.</p>
                    )}
                </div>
            )}
        </div>
    );
}
