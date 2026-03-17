import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ShieldCheck, Lock, Clock, AlertCircle, Loader2, Sparkles, AlertTriangle, MessageSquarePlus } from 'lucide-react';
import { cryptoE2EE } from '@/lib/crypto-messaging.js';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitize';

import { getCsrfHeaders } from '@/lib/csrf';
/**
 * SecureChat
 * Messagerie asynchrone avec chiffrement de bout en bout (E2EE).
 *
 * Les messages sont :
 *   1. Chiffrés dans le navigateur de l'expéditeur
 *   2. Stockés sous forme de blob opaque dans PostgreSQL
 *   3. Déchiffrés uniquement dans le navigateur du destinataire
 *
 * @param {string} shareId   - Secret partagé (clé de dérivation)
 * @param {string} senderId  - ID de l'expéditeur courant
 * @param {string} receiverId - ID du destinataire
 */
export default function SecureChat({ shareId, senderId, receiverId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    // AI Assist state
    const [aiConsent, setAiConsent] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiAction, setAiAction] = useState(null); // 'summarize', 'detect-urgency', 'suggest-reply'

    const fetchMessages = useCallback(async () => {
        if (!shareId) return;
        try {
            const res = await fetch(`/api/secure-messages?shareId=${encodeURIComponent(shareId)}`);
            if (!res.ok) throw new Error('Impossible de récupérer les messages.');

            const encryptedLogs = await res.json();

            // Déchiffrement local de chaque message
            const decrypted = await Promise.all(
                (encryptedLogs.items || []).map(async (msg) => {
                    try {
                        return {
                            ...msg,
                            content: await cryptoE2EE.decrypt(msg.encryptedContent, shareId),
                        };
                    } catch {
                        return { ...msg, content: '🔒 [Erreur de déchiffrement]' };
                    }
                })
            );

            setMessages(decrypted);
        } catch (err) {
            if (import.meta.env.DEV) console.error('[SecureChat] Erreur:', err.message);
        }
    }, [shareId]);

    useEffect(() => {
        if (!shareId) return;
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [shareId, fetchMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isProcessing) return;

        setIsProcessing(true);
        setError(null);
        try {
            // 1. Chiffrement côté client (Zero-Knowledge)
            const encryptedBlob = await cryptoE2EE.encrypt(newMessage, shareId);

            // 2. Envoi du blob chiffré au serveur
            const res = await fetch('/api/secure-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({
                    shareId,
                    senderId,
                    receiverId,
                    encryptedContent: encryptedBlob,
                }),
            });

            if (!res.ok) throw new Error("Échec de l'envoi au serveur.");

            setNewMessage('');
            fetchMessages();
        } catch (err) {
            setError('Erreur : ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Fonction IA Gemini (Réservée aux pros) ---
    const handleAiAction = async (action) => {
        if (!aiConsent || messages.length === 0) return;

        setAiLoading(true);
        setAiAction(action);
        setAiResult(null);
        setError(null);

        try {
            // Préparer les messages en clair (déjà déchiffrés localement)
            const clearMessages = messages.map(m => ({
                role: m.senderId === senderId ? 'pro' : 'user',
                body: m.content
            }));

            // Les envoyer temporairement au proxy Gemini
            const res = await fetch('/api/pro/ai/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({
                    messages: clearMessages,
                    action: action
                })
            });

            if (!res.ok) throw new Error("Erreur lors de l'analyse IA");

            const data = await res.json();
            setAiResult(data.result);
        } catch (err) {
            setError("L'assistant IA est indisponible: " + err.message);
        } finally {
            setAiLoading(false);
        }
    };

    const isPro = senderId && senderId !== 'citizen' && senderId.length > 5;

    return (
        <div className="flex flex-col h-full min-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans relative">
            {/* En-tête de sécurité */}
            <header className="bg-slate-900 p-5 text-white flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-xl">
                        <ShieldCheck className="text-emerald-400" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">
                            Conversation Souveraine
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            Messages chiffrés de bout en bout
                        </p>
                    </div>
                </div>
                <Lock size={16} className="text-slate-600" />
            </header>

            {/* Zone des messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth z-0 relative"
                role="log"
                aria-label="Messages de la conversation sécurisée"
                aria-live="polite"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-10">
                        <div className="p-4 bg-white rounded-full border border-slate-100 shadow-sm mb-4">
                            <Lock size={24} className="opacity-20" />
                        </div>
                        <p className="text-sm font-medium">
                            Aucun message pour l&apos;instant.
                        </p>
                        <p className="text-[11px] mt-2 leading-relaxed opacity-60">
                            Les messages échangés ici sont chiffrés sur votre appareil et ne
                            peuvent être lus par personne d&apos;autre que votre interlocuteur.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div
                            key={msg.id || i}
                            className={`flex ${msg.senderId === senderId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 sm:p-4 rounded-2xl shadow-sm ${msg.senderId === senderId
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200'
                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                    }`}
                            >
                                <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </p>
                                <div className={`text-[9px] mt-2 flex items-center gap-1 font-bold uppercase tracking-tight ${msg.senderId === senderId ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    <Clock size={10} />
                                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- AI Gemini Intégration (Pro Only) --- */}
            {isPro && messages.length > 0 && (
                <div className="bg-indigo-50/50 border-y border-indigo-100 p-3 shrink-0">
                    {!aiConsent ? (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-start gap-2">
                                <Sparkles size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-slate-600 leading-tight">
                                    L'IA Gemini peut analyser ces messages déchiffrés pour vous assister. <br />
                                    <span className="font-semibold">Ces données ne sont pas conservées par l'IA.</span>
                                </p>
                            </div>
                            <Button size="sm" variant="outline" className="text-[10px] h-7 border-indigo-200 text-indigo-700 bg-white shrink-0" onClick={() => setAiConsent(true)}>
                                Autoriser l'analyse locale
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Boutons d'action IA */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={aiAction === 'summarize' ? "default" : "outline"}
                                    className={`text-[10px] h-7 ${aiAction === 'summarize' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 border-indigo-200'}`}
                                    onClick={() => handleAiAction('summarize')}
                                    disabled={aiLoading}
                                >
                                    <Sparkles size={12} className="mr-1.5" /> Résumer
                                </Button>
                                <Button
                                    size="sm"
                                    variant={aiAction === 'detect-urgency' ? "default" : "outline"}
                                    className={`text-[10px] h-7 ${aiAction === 'detect-urgency' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border-amber-200'}`}
                                    onClick={() => handleAiAction('detect-urgency')}
                                    disabled={aiLoading}
                                >
                                    <AlertTriangle size={12} className="mr-1.5" /> Urgence ?
                                </Button>
                                <Button
                                    size="sm"
                                    variant={aiAction === 'suggest-reply' ? "default" : "outline"}
                                    className={`text-[10px] h-7 ${aiAction === 'suggest-reply' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border-emerald-200'}`}
                                    onClick={() => handleAiAction('suggest-reply')}
                                    disabled={aiLoading}
                                >
                                    <MessageSquarePlus size={12} className="mr-1.5" /> Suggérer
                                </Button>
                            </div>

                            {/* Zone de résultat IA */}
                            {aiLoading && (
                                <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-medium">
                                    <Loader2 size={12} className="animate-spin" /> Analyse en cours par Gemini...
                                </div>
                            )}

                            {aiResult && !aiLoading && (
                                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm text-xs relative max-h-[150px] overflow-y-auto">
                                    <button
                                        onClick={() => { setAiResult(null); setAiAction(null); }}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                                    >
                                        &times;
                                    </button>

                                    {aiAction === 'summarize' && (
                                        <div className="prose prose-sm prose-p:my-1 prose-indigo max-w-none text-slate-700">
                                            <p className="font-bold text-indigo-900 mb-2 flex items-center gap-1.5 border-b border-indigo-50 pb-1">
                                                <Sparkles size={12} /> Résumé psychologique
                                            </p>
                                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(aiResult.replace(/\n\n/g, '<br/>').replace(/\*/g, '')) }} />
                                        </div>
                                    )}

                                    {aiAction === 'detect-urgency' && (
                                        <div className={`border-l-2 pl-3 ${aiResult.isUrgent ? 'border-red-500' : 'border-emerald-500'}`}>
                                            <p className={`font-bold mb-1.5 flex items-center gap-1.5 ${aiResult.isUrgent ? 'text-red-700' : 'text-emerald-700'}`}>
                                                <AlertTriangle size={12} />
                                                {aiResult.isUrgent ? 'Urgence détectée' : 'Pas de risque immédiat détecté'}
                                            </p>
                                            {aiResult.reasons && aiResult.reasons.length > 0 && (
                                                <ul className="list-disc pl-4 text-slate-600 space-y-1 mb-2">
                                                    {aiResult.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                                                </ul>
                                            )}
                                            {aiResult.recommendedAction && (
                                                <p className="text-slate-800 font-medium bg-slate-50 p-1.5 rounded mt-2 text-[10px]">
                                                    Action : {aiResult.recommendedAction}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {aiAction === 'suggest-reply' && (
                                        <div>
                                            <p className="font-bold text-emerald-800 mb-2 flex items-center gap-1.5 border-b border-emerald-50 pb-1">
                                                <MessageSquarePlus size={12} /> Suggestions de réponse (cliquer pour copier)
                                            </p>
                                            <div className="space-y-2 mt-2">
                                                {aiResult.suggestions?.map((sug, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setNewMessage(sug)}
                                                        className="block w-full text-left bg-emerald-50 hover:bg-emerald-100 transition-colors p-2 rounded-lg text-emerald-900 border border-emerald-100 text-[11px]"
                                                    >
                                                        "{sug}"
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Feedback d'erreur général */}
            {error && (
                <div
                    className="mx-4 mb-2 p-3 bg-red-50 text-red-600 text-[11px] rounded-xl flex items-center justify-between gap-2 font-bold border border-red-100 z-10 shrink-0"
                    role="alert"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} /> {error}
                    </div>
                    <button onClick={() => setError(null)}>&times;</button>
                </div>
            )}

            {/* Barre de saisie */}
            <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 bg-white border-t border-slate-100 flex gap-2 sm:gap-3 z-10 shrink-0"
            >
                <label htmlFor="secure-chat-input" className="sr-only">
                    Votre message protégé
                </label>
                <textarea
                    id="secure-chat-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    placeholder="Votre message protégé..."
                    disabled={isProcessing}
                    rows={1}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 pt-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 resize-none min-h-[40px] max-h-[120px]"
                />
                <button
                    type="submit"
                    disabled={isProcessing || !newMessage.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-30 flex items-center justify-center min-w-[45px] self-end h-[44px]"
                    aria-label="Envoyer le message"
                >
                    {isProcessing ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Send size={18} className="ml-1" />
                    )}
                </button>
            </form>
        </div>
    );
}
