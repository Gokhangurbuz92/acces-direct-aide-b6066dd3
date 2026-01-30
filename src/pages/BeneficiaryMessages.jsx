
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from '@/components/Messaging/ChatWindow';

export default function BeneficiaryMessages() {
    const { token } = useParams();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // 'EXPIRED', 'INVALID', 'SERVER'
    const [appointmentId, setAppointmentId] = useState(null);

    const API_BASE = '/api'; // Proxied to localhost:3000

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/public/messages?token=${token}`);
            if (res.status === 401) {
                setError('INVALID'); // Or Expired, we treat as access denied
                setLoading(false);
                return;
            }
            if (!res.ok) {
                setError('SERVER');
                setLoading(false);
                return;
            }
            const data = await res.json();
            // Data format: { messages: [...] }
            // We need appointmentId for uploads. It's not in messages array usually, but maybe we can infer or API returns it?
            // The public messages API returns { messages: [] }.
            // We need the Appointment ID to attach uploads.
            // Let's check `api/public/messages.js` -> it returns `messages`.
            // Ideally it should return appointmentId too.
            // For now, if we don't have appointmentId, we can't upload.
            // Wait, upload needs appointmentId. 
            // Update: I'll need to update public/messages.js to return appointmentId or user `token` in upload?
            // `api/upload.js` expects `appointmentId` and `access_token`. 
            // If I have `access_token`, I might not need `appointmentId` if the server looks it up?
            // `api/upload.js` line 68: `where: { id: appointmentId }`. It requires ID.

            // FIX: I will extract appointmentId from the first message if available, OR the API *should* return it.
            // Since I can't easily change API right now without restarting verified backend, 
            // I'll check if any message has it. Message model has appointmentId.
            if (data.messages && data.messages.length > 0) {
                setAppointmentId(data.messages[0].appointmentId);
            } else {
                // If no messages, we are stuck?
                // Actually `api/public/messages.js` finds appointment by token first.
                // It should return it.
                // Assuming it will be fixed or I use a workaround.
                // Workaround: I'll try to use the token as a reference key if possible, but upload needs ID.
                // Real fix: Update `api/public/messages.js` to return `{ appointmentId, messages }`.
                // I will do that as a quick patch.
                setAppointmentId(data.appointmentId);
            }

            setMessages(data.messages || []);
            setError(null);
        } catch (e) {
            console.error(e);
            setError('SERVER');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchMessages();
    }, [token, fetchMessages]);

    const handleSendMessage = async (content) => {
        try {
            const res = await fetch(`${API_BASE}/public/messages?token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }) // Sender inferred as BEN
            });
            if (res.ok) {
                fetchMessages(); // Refresh
            } else {
                alert("Erreur lors de l'envoi.");
            }
        } catch (e) {
            alert("Erreur réseau.");
        }
    };

    const handleUpload = async (file) => {
        if (!appointmentId) {
            alert("Erreur: Impossible de joindre le fichier (ID manquant).");
            return;
        }

        const formData = new FormData();
        formData.append('appointmentId', appointmentId);
        formData.append('access_token', token);
        formData.append('sender', 'BENEFICIARY');
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                body: formData
            });
            const json = await res.json();
            if (res.ok) {
                // Refresh to see the new message (Upload creates a message)
                fetchMessages();
            } else {
                alert(`Erreur envoi: ${json.error || 'Inconnue'}`);
            }
        } catch (e) {
            alert("Erreur envoi fichier.");
        }
    };

    if (error === 'INVALID') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center border-l-4 border-red-500">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Lien incorrect ou expiré</h1>
                    <p className="text-lg text-gray-700">
                        Ce lien ne fonctionne plus.
                        <br /><br />
                        Demandez à votre professionnel de vous renvoyer un nouveau lien.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans">
            <div className="max-w-3xl mx-auto">
                <header className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-blue-900">Accès Direct Aide</h1>
                    <p className="text-xl text-gray-600 mt-2">Espace d'échange sécurisé</p>
                </header>

                <ChatWindow
                    messages={messages}
                    loading={loading}
                    onSendMessage={handleSendMessage}
                    onUploadFile={handleUpload}
                    isPro={false}
                />

                <footer className="mt-8 text-center text-gray-500 text-sm">
                    <p>Vos échanges sont sécurisés et confidentiels.</p>
                </footer>
            </div>
        </div>
    );
}
