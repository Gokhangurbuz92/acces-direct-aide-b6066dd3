
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Loader2, LayoutDashboard, Building2, Users, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';

export default function ProLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('pro_token');
        if (!token) {
            if (location.pathname !== '/pro/login') {
                navigate('/pro/login');
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
                if (location.pathname === '/pro/login') {
                    navigate('/pro/dashboard');
                }
            })
            .catch(() => {
                localStorage.removeItem('pro_token');
                navigate('/pro/login');
            })
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('pro_token');
        navigate('/pro/login');
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    // If on login page, just render Outlet (Login component)
    if (location.pathname === '/pro/login') {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <SEO
                title="AccesDirect Pro"
                description="Espace professionnel."
                noindex={true}
            />
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h1 className="font-bold text-xl text-blue-800">AccesDirect Pro</h1>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <NavLink to="/pro/dashboard" icon={LayoutDashboard}>Tableau de bord</NavLink>
                    <NavLink to="/pro/appointments" icon={FileText}>Mes rendez-vous</NavLink>
                    <NavLink to="/pro/services" icon={FileText}>Mes services</NavLink>
                    {user?.role === 'STRUCTURE_ADMIN' || user?.role === 'SUPERADMIN' ? (
                        <>
                            <NavLink to="/pro/team" icon={Users}>Mon équipe</NavLink>
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
                    <Button size="sm" variant="ghost" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
                </header>
                <div className="p-8">
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
