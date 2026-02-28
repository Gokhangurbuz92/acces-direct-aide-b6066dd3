import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, ArrowLeft, Copy, Check } from 'lucide-react';
import VisioWindow from '@/components/Visio/VisioWindow';

/**
 * Pro Visio Page
 * Wrapper page for Jitsi video conferencing, accessible at /pro/visio/:roomId
 */
export default function ProVisio() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [isInVisio, setIsInVisio] = useState(false);
    const [copied, setCopied] = useState(false);

    const fullRoomName = `ada-v2-${roomId || crypto.randomUUID()}`;
    const visioLink = `${window.location.origin}/pro/visio/${roomId || fullRoomName}`;

    const handleClose = useCallback(() => {
        setIsInVisio(false);
        navigate('/pro/dashboard');
    }, [navigate]);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(visioLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [visioLink]);

    if (isInVisio) {
        return (
            <VisioWindow
                roomName={fullRoomName}
                displayName="Professionnel ADA"
                onClose={handleClose}
            />
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <button
                type="button"
                onClick={() => navigate('/pro/dashboard')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
            >
                <ArrowLeft size={16} />
                Retour au tableau de bord
            </button>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                        <Video className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Rendez-vous en visioconférence
                        </h1>
                        <p className="text-sm text-slate-500">
                            Salle sécurisée propulsée par Jitsi Meet
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                        Lien de la salle
                    </span>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-white px-3 py-2 rounded-lg border border-slate-200 truncate">
                            {visioLink}
                        </code>
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors"
                            aria-label="Copier le lien"
                        >
                            {copied ? (
                                <Check size={16} className="text-emerald-500" />
                            ) : (
                                <Copy size={16} className="text-slate-400" />
                            )}
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                        Partagez ce lien avec le bénéficiaire pour rejoindre la visio.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsInVisio(true)}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                    <Video size={20} />
                    Démarrer la visioconférence
                </button>
            </div>
        </div>
    );
}
