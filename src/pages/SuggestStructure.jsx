
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function SuggestStructure() {
    const [form, setForm] = useState({
        structureName: '',
        city: '',
        type: 'Association',
        website: '',
        email: '',
        message: '',
        consent: false,
        honeypot: '' // Anti-spam
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMsg('');

        try {
            const res = await fetch('/api/public/suggest-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) throw new Error("Trop de demandes. Réessayez plus tard.");
                throw new Error(data.error || "Une erreur est survenue.");
            }

            setStatus('success');
            setForm({ structureName: '', city: '', type: 'Association', website: '', email: '', message: '', consent: false, honeypot: '' });
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Helmet>
                <title>Proposer une Structure - Accès Direct Aide</title>
                <meta name="description" content="Formulaire pour référencer une structure d'aide." />
            </Helmet>

            <h1 className="text-3xl font-bold mb-6 text-blue-900">Proposer une Structure</h1>

            {status === 'success' ? (
                <div className="bg-green-50 p-8 rounded-lg border border-green-200 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <h2 className="text-2xl font-bold text-green-800 mb-2">Merci !</h2>
                    <p className="text-green-700">
                        Votre proposition a bien été reçue. Nous allons la vérifier et l'ajouter au site prochainement.
                    </p>
                    <button
                        onClick={() => setStatus('idle')}
                        className="mt-6 text-green-700 font-bold underline"
                    >
                        Proposer une autre structure
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 space-y-6">

                    {/* Accessibilité Info */}
                    <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 mb-4">
                        Pas besoin de créer de compte. Remplissez juste les champs obligatoires (*).
                    </div>

                    {status === 'error' && (
                        <div className="bg-red-50 p-4 rounded flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">Nom de la structure *</label>
                            <input
                                type="text"
                                name="structureName"
                                value={form.structureName}
                                onChange={handleChange}
                                required
                                className="w-full border rounded p-3 focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Maison pour Tous"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Ville / Département</label>
                            <input
                                type="text"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                className="w-full border rounded p-3"
                                placeholder="Ex: Lyon (69)"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Type</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="w-full border rounded p-3"
                        >
                            <option value="Association">Association</option>
                            <option value="CCAS / Mairie">CCAS / Mairie</option>
                            <option value="Service Public">Service Public</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">Site Internet officiel *</label>
                            <input
                                type="url"
                                name="website"
                                value={form.website}
                                onChange={handleChange}
                                required
                                className="w-full border rounded p-3"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Email de contact *</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full border rounded p-3"
                                placeholder="contact@structure.fr"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Message (Facultatif)</label>
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            rows="3"
                            className="w-full border rounded p-3"
                            placeholder="Précisions utiles..."
                        ></textarea>
                    </div>

                    {/* Honeypot - Hidden */}
                    <input
                        type="text"
                        name="honeypot"
                        value={form.honeypot}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                        tabIndex="-1"
                        autoComplete="off"
                    />

                    <div className="flex items-start gap-3 pt-4 border-t">
                        <input
                            type="checkbox"
                            name="consent"
                            id="consent"
                            checked={form.consent}
                            onChange={handleChange}
                            required
                            className="mt-1 w-5 h-5 text-blue-600 rounded"
                        />
                        <label htmlFor="consent" className="text-sm text-gray-700">
                            J'accepte que ces informations soient traitées pour vérifier l'existence de la structure.
                            (Voir <a href="/securite-et-rgpd" className="text-blue-700 underline" target="_blank">politique de confidentialité</a>).
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {status === 'submitting' ? 'Envoi en cours...' : (
                            <>
                                <Send className="w-5 h-5" />
                                Envoyer la proposition
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
