import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import DispositifCard from '@/components/cards/DispositifCard';

export default function Dispositifs() {
    const [dispositifs, setDispositifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDept, setFilterDept] = useState('');
    const [filterPublic, setFilterPublic] = useState('');

    useEffect(() => {
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
                if (import.meta.env.DEV) console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDispositifs();
    }, [filterDept, filterPublic]);

    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="Dispositifs territoriaux"
                description="Découvrez les dispositifs locaux et territoriaux pour vous aider."
                path="/dispositifs"
            />

            {/* Gradient Banner */}
            <div
                className="relative overflow-hidden py-10 sm:py-14"
                style={{ background: 'linear-gradient(135deg, #020617 0%, #002D5A 30%, #1e3a8a 60%, #3730a3 85%, #4F46E5 100%)' }}
            >
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" aria-hidden="true" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">Dispositifs Territoriaux</h1>
                    <p className="mt-2 text-blue-100/80 text-sm sm:text-base">Découvrez les dispositifs locaux et territoriaux pour vous aider.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>
    );
}
