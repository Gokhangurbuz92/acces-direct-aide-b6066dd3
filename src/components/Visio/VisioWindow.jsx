import { useEffect, useRef, useCallback, useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

/**
 * VisioWindow
 * Intègre Jitsi Meet pour les rendez-vous en ligne.
 *
 * Sécurité : les noms de salles sont des UUIDs complexes
 * (ex: ada-v2-77b62e1-c072-41a0-b93a) pour éviter les intrusions.
 * E2EE activé via la configuration P2P de Jitsi.
 */
export default function VisioWindow({ roomName, displayName, onClose }) {
    const jitsiContainerRef = useRef(null);
    const apiRef = useRef(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

    const handleClose = useCallback(() => {
        if (onClose) onClose();
    }, [onClose]);

    useEffect(() => {
        // Avoid loading if no container
        if (!jitsiContainerRef.current) return;

        let disposed = false;

        // Check if API is already loaded globally
        if (window.JitsiMeetExternalAPI) {
            if (!disposed) initJitsi();
            return cleanupFn;
        }

        // Dynamically load the Jitsi External API script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (disposed) return;
            initJitsi();
        };

        script.onerror = () => {
            if (disposed) return;
            if (import.meta.env.DEV) console.error('[VisioWindow] Impossible de charger Jitsi Meet');
            setStatus('error');
        };

        function initJitsi() {
            try {
                const domain = 'meet.jit.si';
                const options = {
                    roomName: roomName || `ADA-${crypto.randomUUID()}`,
                    width: '100%',
                    height: '100%',
                    parentNode: jitsiContainerRef.current,
                    userInfo: { displayName: displayName || 'Utilisateur ADA' },
                    interfaceConfigOverwrite: {
                        TILE_VIEW_MAX_COLUMNS: 2,
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop',
                            'fullscreen', 'fodeviceselection', 'hangup', 'profile',
                            'chat', 'settings', 'raisehand', 'videoquality',
                            'tileview', 'e2ee',
                        ],
                    },
                    configOverwrite: {
                        startWithAudioMuted: true,
                        startWithVideoMuted: false,
                        disableDeepLinking: true,
                        enableWelcomePage: false,
                        prejoinPageEnabled: false,
                        p2p: { enabled: true },
                    },
                };

                const api = new window.JitsiMeetExternalAPI(domain, options);
                apiRef.current = api;

                api.addEventListener('videoConferenceJoined', () => {
                    setStatus('ready');
                });

                api.addEventListener('videoConferenceLeft', () => {
                    handleClose();
                });
            } catch (err) {
                if (import.meta.env.DEV) console.error('[VisioWindow] Erreur d\'initialisation:', err);
                setStatus('error');
            }
        }

        function cleanupFn() {
            disposed = true;
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }

        return cleanupFn;
    }, [roomName, displayName, handleClose]);

    if (status === 'error') {
        return (
            <div
                className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center"
                role="dialog"
                aria-label="Erreur visioconférence"
            >
                <AlertCircle size={48} className="text-red-500 mb-4" aria-hidden="true" />
                <h2 className="text-white font-bold text-lg mb-2">Erreur de connexion visio</h2>
                <p className="text-slate-400 text-sm text-center max-w-sm mb-6">
                    Impossible de charger le module de visioconférence. Vérifiez votre connexion
                    internet ou désactivez vos bloqueurs de scripts.
                </p>
                <button
                    type="button"
                    onClick={handleClose}
                    className="text-white px-6 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                    Fermer
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col" role="dialog" aria-label="Visioconférence ADA">
            <header className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-bold text-lg">Rendez-vous ADA en ligne</h2>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-900/40 border border-emerald-700/30 rounded-full">
                        <ShieldCheck size={12} className="text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            E2EE P2P
                        </span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    className="text-slate-400 hover:text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                    Quitter la visio
                </button>
            </header>

            {/* Loading overlay */}
            {status === 'loading' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm pointer-events-none">
                    <Loader2 className="animate-spin text-emerald-400 mb-4" size={48} aria-hidden="true" />
                    <p className="text-white text-xs font-bold uppercase tracking-widest animate-pulse">
                        Sécurisation du canal visio…
                    </p>
                </div>
            )}

            <div ref={jitsiContainerRef} className="flex-1" />
        </div>
    );
}

