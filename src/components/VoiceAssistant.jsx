import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

/**
 * VoiceAssistant — Bouton d'aide vocale accessible
 *
 * Appelle le proxy serveur POST /api/tts pour garder la clé API
 * sécurisée. Fallback sur l'API native speechSynthesis du navigateur
 * si le serveur est indisponible.
 *
 * Props:
 * - text: texte à lire à voix haute
 * - label?: libellé du bouton (défaut "Écouter")
 * - size?: "sm" | "default"
 */
export default function VoiceAssistant({ text, label = 'Écouter', size = 'sm' }) {
    const [status, setStatus] = useState('idle'); // idle | loading | playing
    const audioRef = useRef(null);
    const cacheRef = useRef(null); // cache blob URL for replay

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        window.speechSynthesis?.cancel();
        setStatus('idle');
    }, []);

    const playFromUrl = useCallback(
        (url) => {
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setStatus('idle');
            audio.onerror = () => {
                setStatus('idle');
                fallbackSpeech();
            };
            audio.play().then(() => setStatus('playing')).catch(() => fallbackSpeech());
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const fallbackSpeech = useCallback(() => {
        if (!window.speechSynthesis) {
            setStatus('idle');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;
        utterance.onend = () => setStatus('idle');
        utterance.onerror = () => setStatus('idle');
        window.speechSynthesis.speak(utterance);
        setStatus('playing');
    }, [text]);

    const handleClick = useCallback(async () => {
        if (status === 'playing') {
            stop();
            return;
        }

        if (!text) return;

        // Replay cached audio
        if (cacheRef.current) {
            playFromUrl(cacheRef.current);
            return;
        }

        setStatus('loading');

        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text.slice(0, 500) }),
            });

            if (!res.ok) throw new Error('TTS error');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            cacheRef.current = url;
            playFromUrl(url);
        } catch {
            // Fallback to browser speech synthesis
            fallbackSpeech();
        }
    }, [text, status, stop, playFromUrl, fallbackSpeech]);

    return (
        <Button
            variant="outline"
            size={size}
            onClick={handleClick}
            disabled={status === 'loading'}
            aria-label={
                status === 'playing'
                    ? 'Arrêter la lecture vocale'
                    : 'Lire le texte à voix haute'
            }
            className="gap-1.5"
        >
            {status === 'loading' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : status === 'playing' ? (
                <VolumeX className="h-3.5 w-3.5" />
            ) : (
                <Volume2 className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">
                {status === 'loading'
                    ? 'Chargement…'
                    : status === 'playing'
                        ? 'Arrêter'
                        : label}
            </span>
        </Button>
    );
}
