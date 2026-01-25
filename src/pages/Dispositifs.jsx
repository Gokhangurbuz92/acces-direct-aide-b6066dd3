import React, { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import DispositifCard from '@/components/cards/DispositifCard';

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
            <SEO
                title="Dispositifs territoriaux"
                description="Découvrez les dispositifs locaux et territoriaux pour vous aider."
                path="/dispositifs"
            />

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
                        <DispositifCard key={d.id} dispositif={d} />
                    ))}
                    {dispositifs.length === 0 && (
                        <p className="col-span-3 text-center text-gray-500">Aucun dispositif trouvé pour ces critères.</p>
                    )}
                </div>
            )}
        </div>
    );
}
