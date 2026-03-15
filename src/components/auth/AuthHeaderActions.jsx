import { Link } from 'react-router-dom';
import { User, Briefcase, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * AuthHeaderActions — Menus "Se connecter" / "S'inscrire" unifiés
 * 
 * Remplace les anciens boutons directs "Se connecter" + "Créer un compte (Pro)"
 * par deux dropdowns propres Particulier / Professionnel.
 * 
 * Sécurité : le bouton "Administration" est supprimé de la vue publique.
 * L'admin accède via /admin/login directement.
 */
export function AuthHeaderActions() {
    return (
        <div className="flex items-center gap-2">
            {/* Menu "Se connecter" */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                        <LogIn className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Se connecter</span>
                        <ChevronDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                        <Link to="/auth/login" className="flex items-center gap-2.5 cursor-pointer">
                            <User className="h-4 w-4 text-indigo-500" />
                            <div>
                                <p className="font-medium">Espace Particulier</p>
                                <p className="text-xs text-slate-500">Gérer mes aides et RDV</p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/pro/login" className="flex items-center gap-2.5 cursor-pointer">
                            <Briefcase className="h-4 w-4 text-emerald-500" />
                            <div>
                                <p className="font-medium">Espace Professionnel</p>
                                <p className="text-xs text-slate-500">Accéder à ma structure</p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Bouton "S'inscrire" */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-1.5 rounded-full px-5 shadow-sm">
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">S'inscrire</span>
                        <ChevronDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                        <Link to="/auth/signup" className="flex items-center gap-2.5 cursor-pointer">
                            <User className="h-4 w-4 text-indigo-500" />
                            <div>
                                <p className="font-medium">Compte Particulier</p>
                                <p className="text-xs text-slate-500">Simuler mes droits, prendre RDV</p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/pro/register" className="flex items-center gap-2.5 cursor-pointer">
                            <Briefcase className="h-4 w-4 text-emerald-500" />
                            <div>
                                <p className="font-medium">Compte Structure / Pro</p>
                                <p className="text-xs text-slate-500">Accompagner les usagers</p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/**
 * AuthMobileActions — Version mobile pour le menu hamburger
 * Affiche les liens directement (pas de dropdown)
 */
export function AuthMobileActions({ onNavigate }) {
    const linkClass = "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50";

    return (
        <div className="space-y-1">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Se connecter
            </p>
            <Link to="/auth/login" className={linkClass} onClick={onNavigate}>
                <User className="h-4 w-4 text-indigo-500" />
                Espace Particulier
            </Link>
            <Link to="/pro/login" className={linkClass} onClick={onNavigate}>
                <Briefcase className="h-4 w-4 text-emerald-500" />
                Espace Professionnel
            </Link>

            <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                S'inscrire
            </p>
            <Link to="/auth/signup" className={linkClass} onClick={onNavigate}>
                <UserPlus className="h-4 w-4 text-indigo-500" />
                Compte Particulier
            </Link>
            <Link to="/pro/register" className={linkClass} onClick={onNavigate}>
                <UserPlus className="h-4 w-4 text-emerald-500" />
                Compte Structure / Pro
            </Link>
        </div>
    );
}

export default AuthHeaderActions;
