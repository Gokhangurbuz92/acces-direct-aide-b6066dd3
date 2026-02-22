import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Accueil", to: "/" },
  { label: "Mon Assistant", to: "/orientation" },
  { label: "Les Aides", to: "/aides" },
  { label: "Démarches", to: "/demarches" },
  { label: "Lieux d'accueil", to: "/annuaire" },
];

function navClassName(isActive) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
      ? "bg-slate-100 text-slate-900"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>

      <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <NavLink
              to="/"
              className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              onClick={() => setMobileOpen(false)}
            >
              <img src="/logo.svg" alt="AccesDirectAide" className="h-9 w-9" />
              <div className="hidden sm:block">
                <p className="text-base font-semibold text-slate-900">AccesDirectAide</p>
                <p className="text-xs text-slate-500">L'information sociale claire</p>
              </div>
            </NavLink>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => navClassName(isActive)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Auth action links — desktop */}
            <div className="hidden items-center gap-2 lg:flex">
              <NavLink
                to="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                aria-label="Se connecter"
              >
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Se connecter
              </NavLink>
              <NavLink
                to="/pro/register"
                className={buttonVariants({ variant: "solid", size: "sm" })}
                aria-label="Créer un compte professionnel"
              >
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Créer un compte
              </NavLink>
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Navigation mobile">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => navClassName(isActive)}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Auth section — mobile */}
              <hr className="my-2 border-slate-200" />
              <NavLink
                to="/login"
                className={buttonVariants({ variant: "ghost" })}
                onClick={() => setMobileOpen(false)}
                aria-label="Se connecter"
              >
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Se connecter
              </NavLink>
              <NavLink
                to="/pro/register"
                className={buttonVariants({ variant: "solid" })}
                onClick={() => setMobileOpen(false)}
                aria-label="Créer un compte professionnel"
              >
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Créer un compte (Pro)
              </NavLink>
              <NavLink
                to="/pro/login"
                className={({ isActive }) => navClassName(isActive)}
                onClick={() => setMobileOpen(false)}
                aria-label="Accéder à l'espace professionnel"
              >
                Espace Pro
              </NavLink>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer pour compenser le header fixed */}
      <div className="h-20" aria-hidden="true" />
    </>
  );
}
