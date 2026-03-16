import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, Outlet, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { apiClient } from '@/api/client';
import {
    LayoutDashboard, FileText, Building2, FileStack, Database,
    CalendarDays, MessageCircle, Inbox,
    CheckCircle, ListChecks,
    Bot, ToggleRight, MessagesSquare, Globe,
    RefreshCw, HeartPulse, Activity, Play, Shield,
    TestTube, Clock, BookOpen,
    LogOut, ChevronDown, ChevronRight, Menu, X, Settings
} from 'lucide-react';
import { hasPermission, SIDEBAR_PERMISSIONS } from '@/lib/rbac';

/**
 * AdminLayout — Sidebar navigation layout for all admin pages.
 * 
 * Features:
 * - Server-side auth validation via /api/auth/me (same as AdminGuard)
 * - Collapsible sidebar sections organized by category
 * - noindex/nofollow meta on all admin pages
 * - Responsive: drawer on mobile, fixed sidebar on desktop
 */

function isAdminUser(user) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.is_admin === true) return true;
    if (user.isAdmin === true) return true;
    if (Array.isArray(user.roles) && user.roles.includes('admin')) return true;
    if (Array.isArray(user.permissions) && user.permissions.includes('admin')) return true;
    return false;
}

const SIDEBAR_SECTIONS = [
    {
        label: 'Tableau de bord',
        icon: LayoutDashboard,
        items: [
            { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        label: 'Contenu',
        icon: FileText,
        items: [
            { label: 'Aides', to: '/admin/aides', icon: FileText },
            { label: 'Structures', to: '/admin/structures', icon: Building2 },
            { label: 'Démarches', to: '/admin/demarches', icon: FileStack },
            { label: 'Sources', to: '/admin/sources', icon: Database },
        ]
    },
    {
        label: 'RDV & Messages',
        icon: CalendarDays,
        items: [
            { label: 'Rendez-vous', to: '/admin/appointments', icon: CalendarDays },
            { label: 'Messages', to: '/admin/messages', icon: MessageCircle },
            { label: 'Boîte de réception', to: '/admin/inbox', icon: Inbox },
        ]
    },
    {
        label: 'Validation',
        icon: CheckCircle,
        items: [
            { label: 'Review', to: '/admin/review', icon: CheckCircle },
            { label: "File d'attente", to: '/admin/review-queue', icon: ListChecks },
        ]
    },
    {
        label: 'IA & Orchestration',
        icon: Bot,
        items: [
            { label: 'Orchestrateur', to: '/admin/orchestrator', icon: Bot },
            { label: 'Features', to: '/admin/features', icon: ToggleRight },
            { label: 'Conversations', to: '/admin/conversations', icon: MessagesSquare },
            { label: 'Dashboard National', to: '/admin/national', icon: Globe },
        ]
    },
    {
        label: 'Système',
        icon: Activity,
        items: [
            { label: 'Sync', to: '/admin/sync', icon: RefreshCw },
            { label: 'Health', to: '/admin/health', icon: HeartPulse },
            { label: 'Observability', to: '/admin/observability', icon: Activity },
            { label: 'Runs', to: '/admin/runs', icon: Play },
            { label: 'Audit', to: '/admin/audit', icon: Shield },
        ]
    },
    {
        label: 'Sync avancé',
        icon: RefreshCw,
        items: [
            { label: 'Test Sync', to: '/admin/sync/test', icon: TestTube },
            { label: 'Syncs récents', to: '/admin/sync/recent', icon: Clock },
            { label: 'Guide Sync', to: '/admin/guides/sync', icon: BookOpen },
        ]
    },
];

function SidebarSection({ section, isActive }) {
    const [open, setOpen] = useState(isActive);
    const SectionIcon = section.icon;

    // Auto-open section when it contains the active page
    useEffect(() => {
        if (isActive) setOpen(true);
    }, [isActive]);

    // Dashboard section = single link, not collapsible
    if (section.items.length === 1) {
        const item = section.items[0];
        return <NavItem item={item} />;
    }

    return (
        <div className="mb-1">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
            >
                <SectionIcon className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">{section.label}</span>
                {open
                    ? <ChevronDown className="h-3 w-3" />
                    : <ChevronRight className="h-3 w-3" />
                }
            </button>
            {open && (
                <div className="ml-2 space-y-0.5">
                    {section.items.map(item => (
                        <NavItem key={item.to} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

function NavItem({ item }) {
    const location = useLocation();
    const isActive = location.pathname === item.to ||
        (item.to !== '/admin/dashboard' && location.pathname.startsWith(item.to + '/'));
    const Icon = item.icon;

    return (
        <Link
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{item.label}</span>
        </Link>
    );
}

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
    </div>
);

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [allowed, setAllowed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const userData = await apiClient.auth.getUser();
                if (cancelled) return;

                if (isAdminUser(userData)) {
                    setUser(userData);
                    setAllowed(true);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // If on login page, just render it (no sidebar)
    if (location.pathname === '/admin/login') {
        return <Outlet />;
    }

    if (loading) return <PageLoader />;
    if (!allowed) return <Navigate to="/admin/login" replace />;

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        navigate('/admin/login', { replace: true });
    };

    const sidebarContent = (
        <>
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <Link to="/admin/dashboard" className="font-bold text-lg text-blue-800">
                    Admin ADA
                </Link>
                <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="md:hidden p-1 rounded hover:bg-slate-100"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {SIDEBAR_SECTIONS
                    .filter(section => {
                        const requiredPerm = SIDEBAR_PERMISSIONS[section.label];
                        if (!requiredPerm) return true; // No restriction
                        return hasPermission(user?.role, requiredPerm);
                    })
                    .map(section => (
                    <SidebarSection
                        key={section.label}
                        section={section}
                        isActive={section.items.some(item =>
                            location.pathname === item.to ||
                            location.pathname.startsWith(item.to + '/')
                        )}
                    />
                ))}
            </nav>

            {/* Paramètres link */}
            <div className="px-3 pb-2">
                <NavItem item={{ label: 'Paramètres', to: '/admin/parametres', icon: Settings }} />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200">
                <div className="mb-3">
                    <p className="font-medium text-sm text-slate-900">{user?.email || 'Admin'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                        {user?.role === 'admin' || user?.role === 'super_admin' ? 'Super Admin' :
                         user?.role === 'editor' ? 'Éditeur' :
                         user?.role === 'moderator' ? 'Modérateur' :
                         user?.role === 'viewer' ? 'Auditeur' :
                         user?.role || 'admin'}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden">
                {sidebarContent}
            </aside>

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        role="button"
                        tabIndex={0}
                        aria-label="Fermer le menu"
                        onClick={() => setMobileMenuOpen(false)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setMobileMenuOpen(false); }}
                    />
                    <aside className="relative w-72 h-full bg-white flex flex-col shadow-xl">
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Mobile Header */}
                <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40 md:hidden flex items-center justify-between">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-1 rounded hover:bg-slate-100"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="font-bold text-lg text-blue-800">Admin ADA</h1>
                    <button
                        onClick={handleLogout}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </header>

                {/* Page Content */}
                <div className="p-6 lg:p-8">
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
}
