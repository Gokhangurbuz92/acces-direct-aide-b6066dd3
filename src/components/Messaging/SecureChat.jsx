import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ShieldCheck, Lock, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cryptoE2EE } from '@/lib/crypto-messaging.js';

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
            console.error('[SecureChat] Erreur:', err.message);
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
                headers: { 'Content-Type': 'application/json' },
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

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans">
            {/* En-tête de sécurité */}
            <header className="bg-slate-900 p-5 text-white flex justify-between items-center">
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
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 scroll-smooth"
                role="log"
                aria-label="Messages de la conversation sécurisée"
                aria-live="polite"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-10">
                        <div className="p-6 bg-white rounded-full shadow-sm mb-4">
                            <Lock size={32} className="opacity-20" />
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
                                className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.senderId === senderId
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200'
                                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </p>
                                <div className="text-[9px] mt-2 opacity-60 flex items-center gap-1 font-bold uppercase tracking-tight">
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

            {/* Feedback d'erreur */}
            {error && (
                <div
                    className="mx-4 mb-2 p-3 bg-red-50 text-red-600 text-[11px] rounded-xl flex items-center gap-2 font-bold border border-red-100"
                    role="alert"
                >
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Barre de saisie */}
            <form
                onSubmit={handleSendMessage}
                className="p-4 bg-white border-t border-slate-100 flex gap-3"
            >
                <label htmlFor="secure-chat-input" className="sr-only">
                    Votre message protégé
                </label>
                <input
                    id="secure-chat-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Votre message protégé..."
                    disabled={isProcessing}
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={isProcessing || !newMessage.trim()}
                    className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all disabled:opacity-30 shadow-lg shadow-slate-200 flex items-center justify-center min-w-[50px]"
                    aria-label="Envoyer le message"
                >
                    {isProcessing ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </form>
        </div>
    );
}
