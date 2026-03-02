// @ts-nocheck
import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Loader2, LayoutDashboard, Building2, Users, FileText, LogOut, CalendarDays, Clock3, MessageCircle, Video, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import NotificationCenter from '@/components/NotificationCenter';
import OnboardingTour from '@/components/OnboardingTour';
import ProBreadcrumb from '@/components/ProBreadcrumb';

export default function ProLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const proLoginEntry = '/login?mode=pro';

    useEffect(() => {
        const token = localStorage.getItem('pro_token');
        if (!token) {
            if (location.pathname !== '/pro/login' && location.pathname !== '/pro/register' && location.pathname !== '/pro/register-invite' && location.pathname !== '/pro/forgot-password' && location.pathname !== '/pro/reset-password') {
                navigate(proLoginEntry, { replace: true });
            } else {
                setLoading(false);
            }
            return;
        }

        // Verify token validity via /api/pro/me
        fetch('/api/pro/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Unauthorized');
            })
            .then(data => {
                setUser(data.user);
                // Show onboarding on first login
                if (!localStorage.getItem('ada_onboarding_done')) {
                    setShowOnboarding(true);
                }
                if (['/pro/login', '/pro/register', '/pro/forgot-password', '/pro/reset-password'].includes(location.pathname)) {
                    navigate('/pro/dashboard');
                }
            })
            .catch(() => {
                localStorage.removeItem('pro_token');
                navigate(proLoginEntry, { replace: true });
            })
            .finally(() => setLoading(false));
    }, [navigate, location.pathname, proLoginEntry]); // Added location.pathname dependency

    const handleLogout = () => {
        localStorage.removeItem('pro_token');
        navigate(proLoginEntry, { replace: true });
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    // If on public auth pages, just render Outlet
    if (['/pro/login', '/pro/register', '/pro/register-invite', '/pro/forgot-password', '/pro/reset-password'].includes(location.pathname)) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <SEO
                title="AccesDirect Pro"
                description="Espace professionnel."
                noindex={true}
            />
            {/* Onboarding Tour */}
            {showOnboarding && (
                <OnboardingTour onComplete={() => setShowOnboarding(false)} />
            )}
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h1 className="font-bold text-xl text-blue-800">AccesDirect Pro</h1>
                    {user && <NotificationCenter proId={user.id} />}
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <NavLink to="/pro/dashboard" icon={LayoutDashboard}>Tableau de bord</NavLink>
                    <NavLink to="/pro/rdv/agenda" icon={CalendarDays}>Agenda RDV</NavLink>
                    <NavLink to="/pro/rdv/new" icon={FileText}>Nouveau RDV</NavLink>
                    <NavLink to="/pro/rdv/services" icon={FileText}>Services RDV</NavLink>
                    <NavLink to="/pro/rdv/disponibilites" icon={Clock3}>Disponibilites</NavLink>
                    <NavLink to="/pro/rdv/absences" icon={Clock3}>Absences</NavLink>
                    <NavLink to="/pro/messages" icon={MessageCircle}>Messages</NavLink>
                    <NavLink to="/pro/visio" icon={Video}>Visioconférence</NavLink>
                    {user?.role === 'STRUCTURE_ADMIN' || user?.role === 'SUPERADMIN' ? (
                        <>
                            <NavLink to="/pro/team" icon={Users}>Mon équipe</NavLink>
                            <NavLink to="/pro/audit" icon={Shield}>Journal d&apos;audit</NavLink>
                            <NavLink to="/pro/reports" icon={BarChart3}>Impact</NavLink>
                            <NavLink to="/pro/structure" icon={Building2}>Ma structure</NavLink>
                        </>
                    ) : null}
                </nav>
                <div className="p-4 border-t border-slate-200">
                    <div className="mb-4">
                        <p className="font-medium text-sm text-slate-900">{user?.email}</p>
                        <p className="text-xs text-slate-500">{user?.role}</p>
                    </div>
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-slate-200 p-4 sticky top-0 md:hidden flex justify-between items-center">
                    <h1 className="font-bold text-lg text-blue-800">AccesDirect Pro</h1>
                    <div className="flex items-center gap-2">
                        {user && <NotificationCenter />}
                        <Button size="sm" variant="ghost" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
                    </div>
                </header>
                <div className="p-8">
                    <ProBreadcrumb />
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    );
}

function NavLink({ to, icon: Icon, children }) {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <Icon className="h-5 w-5" />
            {children}
        </Link>
    );
}
