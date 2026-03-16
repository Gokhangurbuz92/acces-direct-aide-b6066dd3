
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Printer } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import LazyImage from '@/components/ui/LazyImage';

export default function GuideDetail() {
    const { slug } = useParams();
    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch slug
        fetch(`/api/guides?slug=${slug}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => setGuide(data))
            .catch(e => { if (import.meta.env.DEV) console.error(e); })
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
    if (!guide) return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <EmptyState
                title="Guide introuvable"
                description="Cette page n'existe pas ou a été déplacée."
                actions={
                    <Link to="/bonnes-pratiques" className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                        Retour aux bonnes pratiques
                    </Link>
                }
            />
        </div>
    );

    const steps = typeof guide.contenu_json === 'string'
        ? JSON.parse(guide.contenu_json)
        : (guide.contenu_json || []);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
            <SEO
                title={`${guide.titre} - Bonnes Pratiques`}
                description={guide.resume_falc || "Guide de bonnes pratiques"}
                path={`/bonnes-pratiques/${slug}`}
            />

            <div className="flex justify-between items-start mb-6 print:hidden">
                <Link to="/bonnes-pratiques" className="text-blue-600 hover:underline">
                    &larr; Retour aux bonnes pratiques
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-gray-700 font-medium"
                >
                    <Printer size={18} />
                    Imprimer la fiche
                </button>
            </div>

            <article className="bg-white p-8 rounded-lg shadow-lg print:shadow-none print:p-0">
                <header className="mb-8 border-b pb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {guide.categorie && (
                            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full uppercase font-bold print:border print:border-blue-800">
                                {guide.categorie}
                            </span>
                        )}
                        {guide.publics?.map(p => (
                            <span key={p} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                {p}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{guide.titre}</h1>

                    {guide.resume_falc && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-lg text-gray-800 font-medium">
                            <span className="block text-sm uppercase text-yellow-700 mb-1 font-bold">Resumé Facile à Lire :</span>
                            {guide.resume_falc}
                        </div>
                    )}
                </header>

                <div className="space-y-8">
                    {Array.isArray(steps) && steps.map((step, idx) => (
                        <section key={idx} className="print:break-inside-avoid">
                            {step.titre && <h3 className="text-2xl font-bold text-blue-900 mb-3">{idx + 1}. {step.titre}</h3>}
                            {step.texte && <div className="prose max-w-none text-gray-700 whitespace-pre-line">{step.texte}</div>}
                            {step.image && (
                                <LazyImage src={step.image} alt="" className="mt-4 rounded shadow max-w-full md:max-w-md" />
                            )}
                        </section>
                    ))}

                    {steps.length === 0 && !guide.resume_falc && (
                        <p className="text-gray-500 italic">Contenu en cours de rédaction.</p>
                    )}
                </div>

                {(guide.sources_urls?.length > 0) && (
                    <footer className="mt-12 pt-6 border-t text-sm text-gray-500">
                        <h4 className="font-bold mb-2">Sources :</h4>
                        <ul className="list-disc pl-5">
                            {guide.sources_urls.map((url, i) => (
                                <li key={i}>{url}</li>
                            ))}
                        </ul>
                    </footer>
                )}
            </article>
        </div>
    );
}
