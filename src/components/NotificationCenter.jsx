import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Bell,
    MessageSquare,
    Calendar,
    FileText,
    Clock,
    UserPlus,
    ShieldCheck,
    Settings,
    X,
} from 'lucide-react';

/**
 * NotificationCenter — Composant souverain (sans Firebase)
 *
 * Utilise le polling sur /api/pro/notifications pour alerter
 * les agents des événements de leur structure.
 *
 * Props:
 * - proId: ID de l'agent connecté
 * - className: classes CSS additionnelles
 */
export default function NotificationCenter({ proId, className = '' }) {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [readIds, setReadIds] = useState(() => {
        try {
            const stored = localStorage.getItem('ada_notif_read');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });
    const panelRef = useRef(null);

    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('pro_token')
            : null;

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/pro/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch {
            // Silently handle
        }
    }, [token]);

    // Initial fetch + polling every 30s
    useEffect(() => {
        fetchNotifications();
        const timer = setInterval(fetchNotifications, 30000);
        return () => clearInterval(timer);
    }, [fetchNotifications]);

    // Close panel on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    // Compute unread count (exclude own actions)
    const unreadCount = notifications.filter(
        (n) => !n.isOwn && !readIds[n.id]
    ).length;

    const markAsRead = (id) => {
        const nextRead = { ...readIds, [id]: true };
        setReadIds(nextRead);
        try {
            localStorage.setItem('ada_notif_read', JSON.stringify(nextRead));
        } catch {
            // Quota exceeded
        }
    };

    const markAllRead = () => {
        const nextRead = { ...readIds };
        notifications.forEach((n) => {
            nextRead[n.id] = true;
        });
        setReadIds(nextRead);
        try {
            localStorage.setItem('ada_notif_read', JSON.stringify(nextRead));
        } catch {
            // Quota exceeded
        }
    };

    return (
        <div ref={panelRef} className={`relative ${className}`}>
            {/* Bell button */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ''}`}
            >
                <Bell
                    className={unreadCount > 0 ? 'text-indigo-600' : 'text-slate-400'}
                    size={20}
                />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white min-w-[18px]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                            Alertes
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Tout lire
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                                aria-label="Fermer"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Aucune notification</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const isRead = notif.isOwn || readIds[notif.id];
                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => markAsRead(notif.id)}
                                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors ${isRead ? 'opacity-60' : ''
                                            }`}
                                    >
                                        <div
                                            className={`p-1.5 rounded-lg h-fit mt-0.5 shrink-0 ${getIconBg(
                                                notif.type
                                            )}`}
                                        >
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-900 truncate">
                                                {notif.title}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                                                <Clock size={8} />
                                                {formatTime(notif.timestamp)}
                                            </p>
                                        </div>
                                        {!isRead && (
                                            <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function getIcon(type) {
    const size = 14;
    switch (type) {
        case 'message':
            return <MessageSquare size={size} className="text-blue-600" />;
        case 'appointment':
            return <Calendar size={size} className="text-indigo-600" />;
        case 'dossier':
            return <FileText size={size} className="text-amber-600" />;
        case 'auth':
            return <UserPlus size={size} className="text-emerald-600" />;
        case 'team':
            return <Settings size={size} className="text-red-500" />;
        default:
            return <ShieldCheck size={size} className="text-slate-500" />;
    }
}

function getIconBg(type) {
    switch (type) {
        case 'message':
            return 'bg-blue-50';
        case 'appointment':
            return 'bg-indigo-50';
        case 'dossier':
            return 'bg-amber-50';
        case 'auth':
            return 'bg-emerald-50';
        case 'team':
            return 'bg-red-50';
        default:
            return 'bg-slate-100';
    }
}

function formatTime(ts) {
    if (!ts) return "À l'instant";
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
