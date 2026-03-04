
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Brand/Logo';
import { createPageUrl } from '@/utils';
import {
  Menu,
  X,
  Home,
  HandHeart,
  FileText,
  MapPin,
  Newspaper,
  Activity,
  ListChecks,
  Info,
  Calendar,
  ChevronDown,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Button, buttonVariants } from "@/components/ui/button";
import AccessibilityPanel from '@/components/ui/AccessibilityPanel';
import HideScreenButton from '@/components/ui/HideScreenButton';
import ChatAssistant from '@/components/chat/ChatAssistant';
import { adminClient as client } from '@/api/client';
import PropTypes from 'prop-types';

const NAV_ITEMS = [
  { label: 'Accueil', page: 'Home', icon: Home },
  {
    label: 'Aides',
    page: 'Aides',
    icon: HandHeart,
    submenu: [
      { label: 'Toutes les aides', page: 'Aides' },
      { label: 'Logement', page: 'Aides', params: 'categorie=logement' },
      { label: 'Santé', page: 'Aides', params: 'categorie=sante' },
      { label: 'Handicap', page: 'Aides', params: 'categorie=handicap' },
      { label: 'Emploi', page: 'Aides', params: 'categorie=emploi' },
      { label: 'Famille', page: 'Aides', params: 'categorie=famille' },
    ]
  },
  { label: 'Démarches', page: 'Demarches', icon: FileText },
  { label: 'Annuaire', page: 'Annuaire', icon: MapPin },
  { label: 'Actualités', page: 'Actualites', icon: Newspaper },
  { label: 'Rendez-vous', page: 'AdminAppointments', icon: Calendar, adminOnly: true },
  { label: 'Structures', page: 'AdminStructures', icon: MapPin, adminOnly: true },
  { label: 'Démarches', page: 'AdminDemarches', icon: FileText, adminOnly: true },
  { label: 'Observabilité', page: 'AdminObservability', icon: Activity, adminOnly: true },
  { label: 'Review Queue', page: 'AdminReviewQueue', icon: ListChecks, adminOnly: true },
  { label: 'Admin', page: 'AdminSync', icon: Info, adminOnly: true },
];

const FOOTER_LINKS = [
  { label: 'À propos', page: 'APropos' },
  { label: 'Sources & méthode', page: 'SourcesMethode' },
  { label: 'Contact', page: 'Contact' },
  { label: 'Signaler une erreur', page: 'Contact' }, // Points to Contact for now
  { label: 'Partenaires', href: '/partenaires' },
  { label: 'Impact', href: '/impact' },
  { label: 'Accessibilité', page: 'Accessibilite' },
  { label: 'Mentions légales', page: 'MentionsLegales' },
  { label: 'Politique de confidentialité', page: 'Confidentialite' },
  { label: 'Cookies', page: 'Cookies' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    // Audit: Check for admin role. Since exact API is unknown, checking common patterns.
    // Assuming client.auth.user gives current user info.
    const checkAdmin = async () => {
      try {
        const user = client.auth?.user || (await client.auth?.getUser?.());
        // Basic check: if user exists and has admin role or specific email
        // Adjust this logic based on actual User entity structure
        if (user && (user.role === 'admin' || user.is_admin === true)) {
          setIsAdmin(true);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, []);

  const filteredNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Styles d'accessibilité */}
      <style>{`

        :root {
          --primary-color: #2563eb;
          --text-color: #1e293b;
          --bg-color: #f8fafc;
        }
        
        body.high-contrast {
          --primary-color: #000;
          --text-color: #000;
          --bg-color: #fff;
        }
        
        body.high-contrast * {
          border-color: #000 !important;
        }
        
        body.high-contrast .bg-blue-600,
        body.high-contrast .bg-blue-500 {
          background-color: #000 !important;
        }
        
        body.dark-mode {
          --text-color: #f1f5f9;
          --bg-color: #0f172a;
        }
        
        body.dark-mode {
          background-color: #0f172a;
          color: #f1f5f9;
        }
        
        body.dark-mode .bg-white,
        body.dark-mode .bg-slate-50 {
          background-color: #1e293b !important;
        }
        
        body.dark-mode .text-slate-900,
        body.dark-mode .text-slate-800,
        body.dark-mode .text-slate-700 {
          color: #f1f5f9 !important;
        }
        
        body.dark-mode .border-slate-200 {
          border-color: #334155 !important;
        }
        
        body.large-line-height p,
        body.large-line-height li,
        body.large-line-height span {
          line-height: 2 !important;
        }
        
        body.simplified-mode .hidden-simplified {
          display: none !important;
        }
        
        body.simplified-mode {
          font-family: 'Arial', sans-serif !important;
        }
        
        /* Focus visible pour accessibilité clavier */
        *:focus-visible {
          outline: 3px solid #2563eb !important;
          outline-offset: 2px !important;
        }
        
        /* Skip link — sr-only pattern within viewport for tab-order compatibility */
        .skip-link {
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: #2563eb;
          color: white;
          padding: 0;
          z-index: 9999;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }
        
        .skip-link:focus {
          position: fixed;
          top: 4px;
          left: 4px;
          width: auto;
          height: auto;
          overflow: visible;
          padding: 8px 16px;
          border-radius: 6px;
        }
        
        /* Print styles pour PDF */
        @media print {
          header, footer, .hidden-print, button, .skip-link {
            display: none !important;
          }
          body {
            background: white;
            color: black;
          }
          .max-w-4xl, .max-w-5xl, .max-w-6xl, .max-w-7xl {
            max-width: 100%;
          }
          a[href]:after {
            content: " (" attr(href) ")";
            font-size: 0.8em;
            color: #555;
          }
        }
      `}</style>

      {/* Skip link pour accessibilité */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Header */}
      <header role="banner" className="bg-surface border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              {/* Mobile: Logo Icon Only */}
              <Link
                to={createPageUrl('Home')}
                className="sm:hidden inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-colors hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label="Aller à l’accueil"
              >
                <Logo variant="icon" size={40} />
              </Link>
              {/* Desktop: Logo Full */}
              <Link
                to={createPageUrl('Home')}
                className="hidden sm:inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-colors hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label="Aller à l’accueil"
              >
                <Logo variant="full" size={40} />
              </Link>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
              {filteredNavItems.map((item) => (
                <div key={item.page} className="relative group">
                  {item.submenu ? (
                    <>
                      <Link
                        to={createPageUrl(item.page)}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-lg relative
                          ${currentPageName === item.page
                            ? 'text-brand-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-brand-primary'
                            : 'text-text-body hover:text-brand-primary hover:bg-brand-highlight/10'
                          }`}
                        aria-haspopup="menu"
                        aria-controls={`nav-${item.page.toLowerCase()}-menu`}
                      >
                        {item.label}
                        <ChevronDown className="h-4 w-4" />
                      </Link>
                      <div
                        id={`nav-${item.page.toLowerCase()}-menu`}
                        className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block"
                        role="menu"
                        aria-label={`Sous-menu ${item.label}`}
                      >
                        <div className="bg-surface rounded-xl shadow-lg border border-border py-2 min-w-[180px]">
                          {item.submenu.map((sub, idx) => (
                            <Link
                              key={idx}
                              to={createPageUrl(sub.page) + (sub.params ? `?${sub.params}` : '')}
                              className="block px-4 py-2 text-sm text-text-body hover:bg-brand-highlight/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                              role="menuitem"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      to={createPageUrl(item.page)}
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-lg relative
                        ${currentPageName === item.page
                          ? 'text-brand-primary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-brand-primary'
                          : 'text-text-body hover:text-brand-primary hover:bg-brand-highlight/10'
                        }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Auth links — desktop */}
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/login"
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                aria-label="Se connecter"
              >
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Se connecter
              </Link>
              <Link
                to="/pro/register"
                className={buttonVariants({ variant: 'solid', size: 'sm' })}
                aria-label="Créer un compte professionnel"
              >
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Créer un compte (Pro)
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <AccessibilityPanel />

              {/* Menu mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-surface">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1" aria-label="Navigation mobile">
              {filteredNavItems.map((item) => (
                <div key={item.page}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => setOpenSubmenu(openSubmenu === item.page ? null : item.page)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-text-body hover:bg-brand-highlight/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                        aria-expanded={openSubmenu === item.page}
                        aria-controls={`mobile-submenu-${item.page}`}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openSubmenu === item.page ? 'rotate-180' : ''}`} />
                      </button>
                      <div
                        id={`mobile-submenu-${item.page}`}
                        className={`pl-12 space-y-1 ${openSubmenu === item.page ? '' : 'hidden'}`}
                      >
                        {item.submenu.map((sub, idx) => (
                          <Link
                            key={idx}
                            to={createPageUrl(sub.page) + (sub.params ? `?${sub.params}` : '')}
                            className="block px-4 py-2 text-sm text-text-muted hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      to={createPageUrl(item.page)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-body hover:bg-brand-highlight/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Auth links — mobile */}
              <hr className="my-2 border-border" />
              <Link
                to="/login"
                className={buttonVariants({ variant: 'ghost' })}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Se connecter"
              >
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Se connecter
              </Link>
              <Link
                to="/pro/register"
                className={buttonVariants({ variant: 'solid' })}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Créer un compte professionnel"
              >
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Créer un compte (Pro)
              </Link>
              <Link
                to="/pro/login"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-body hover:bg-brand-highlight/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-inset"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Accéder à l'espace professionnel"
              >
                Espace Pro
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Logo et description */}
            <div className="md:col-span-2">
              <div className="mb-6">
                <Logo variant="full" tone="white" size={48} />
              </div>
              <p className="text-white text-sm mb-4">
                Un site non lucratif pour vous aider à trouver les aides,
                les démarches et les structures d&apos;accompagnement près de chez vous.
              </p>
              <p className="text-white text-sm">
                Toutes les informations sont vérifiées et sourcées.
                Zéro fake news, zéro approximation.
              </p>
            </div>

            {/* Liens */}
            <div>
              <h3 className="font-semibold mb-4">Liens utiles</h3>
              <ul className="space-y-2">
                {FOOTER_LINKS.slice(0, 6).map((link, idx) => (
                  <li key={link.label + idx}>
                    <Link
                      to={link.href || createPageUrl(link.page)}
                      className="text-white hover:text-slate-200 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h3 className="font-semibold mb-4">Informations légales</h3>
              <ul className="space-y-2">
                {FOOTER_LINKS.slice(6).map((link, idx) => (
                  <li key={link.label + idx}>
                    <Link
                      to={link.href || createPageUrl(link.page)}
                      className="text-white hover:text-slate-200 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white">
            <p>© {new Date().getFullYear()} AccesDirectAide. Site non lucratif.</p>
            <p className="mt-2">
              Territoire couvert : Alsace (Bas-Rhin, Haut-Rhin) et aides nationales.
            </p>
          </div>
        </div>
      </footer>

      {/* Chat Assistant */}
      <ChatAssistant />

      {/* Privacy Screen — Bouton "Cacher mon écran" */}
      <HideScreenButton />

    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
  currentPageName: PropTypes.string,
};
