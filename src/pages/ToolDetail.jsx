
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Download, ExternalLink } from 'lucide-react';

export default function ToolDetail() {
    const { slug } = useParams();
    const [tool, setTool] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/tools?slug=${slug}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => setTool(data))
            .catch(e => { if (import.meta.env.DEV) console.error(e); })
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (!tool) return <div className="p-8 text-center text-red-500">Outil introuvable</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <SEO
                title={`${tool.titre} - Outil`}
                description={tool.resume_falc || "Détail de l'outil"}
                path={`/outils/${slug}`}
            />

            <Link to="/outils" className="text-purple-600 hover:underline mb-6 block">
                &larr; Retour à la boite à outils
            </Link>

            <article className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-purple-500">
                <header className="mb-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full uppercase font-bold">
                            {tool.type}
                        </span>
                        {tool.categorie && <span className="text-gray-500 text-sm px-2 py-1 bg-gray-100 rounded">{tool.categorie}</span>}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{tool.titre}</h1>

                    {tool.resume_falc && (
                        <div className="text-lg text-gray-700 leading-relaxed max-w-2xl">
                            {tool.resume_falc}
                        </div>
                    )}
                </header>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 prose max-w-none text-gray-800">
                        {tool.contenu_html ? (
                            <div dangerouslySetInnerHTML={{ __html: tool.contenu_html }} />
                        ) : (
                            <p className="italic text-gray-500">Pas de description détaillée disponible.</p>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
                            <h3 className="font-bold text-gray-900 mb-4">Accéder à l'outil</h3>

                            {tool.url_download ? (
                                <a
                                    href={tool.url_download}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded transition flex items-center justify-center gap-2"
                                >
                                    {tool.type === 'numerique' ? <ExternalLink size={20} /> : <Download size={20} />}
                                    {tool.type === 'numerique' ? 'Ouvrir le site' : 'Télécharger'}
                                </a>
                            ) : (
                                <div className="text-gray-500 text-sm text-center">
                                    Cet outil est consultable ci-contre.
                                </div>
                            )}

                            <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Publics cibles :</h4>
                                <div className="flex flex-wrap gap-2">
                                    {tool.publics?.map(p => (
                                        <span key={p} className="text-xs bg-white border px-2 py-1 rounded text-gray-600">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}
