import { useState } from 'react';
import { Video, Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { getCsrfHeaders } from '@/lib/csrf';
/**
 * VisioTrigger — Inline button to start a video call from a ProAppointment.
 *
 * Props:
 * - appointmentId: string (required)
 * - existingRoomId: string | null (pre-existing room if visio already started)
 *
 * Usage in appointment detail:
 *   <VisioTrigger appointmentId={appointment.id} existingRoomId={appointment.visioRoomId} />
 */
export default function VisioTrigger({ appointmentId, existingRoomId }) {
    const [loading, setLoading] = useState(false);
    const [roomId, setRoomId] = useState(existingRoomId || '');
    const [notified, setNotified] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('pro_token');

    const startVisio = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/pro/appointments/start-visio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({ appointmentId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');

            setRoomId(data.roomId);
            setNotified(data.emailSent);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const joinVisio = () => {
        const url = `https://meet.jit.si/ADA-${roomId}`;
        window.open(url, '_blank', 'noopener');
    };

    if (error) {
        return (
            <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    // Room already exists — show join button
    if (roomId) {
        return (
            <div className="space-y-2">
                {notified && (
                    <Alert className="bg-emerald-50 border-emerald-200 rounded-xl">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <AlertDescription className="text-emerald-700 text-sm">
                            Lien envoyé au bénéficiaire par email
                        </AlertDescription>
                    </Alert>
                )}
                <Button onClick={joinVisio} className="w-full gap-2">
                    <ExternalLink size={16} />
                    Rejoindre la visioconférence
                </Button>
            </div>
        );
    }

    // No room yet — show start button
    return (
        <Button
            onClick={startVisio}
            disabled={loading}
            variant="outline"
            className="w-full gap-2"
        >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Video size={16} />}
            Lancer le rendez-vous vidéo
        </Button>
    );
}
