
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Menu,
  X,
  Home,
  HandHeart,
  FileText,
  MapPin,
  Newspaper,
  Info,
  ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import AccessibilityToolbar from '@/components/ui/AccessibilityToolbar';
import ChatWidget from '@/components/chat/ChatWidget';
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
        console.error('Error checking admin status:', error);
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
        
        /* Skip link */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: #2563eb;
          color: white;
          padding: 8px 16px;
          z-index: 100;
          transition: top 0.3s;
        }
        
        .skip-link:focus {
          top: 0;
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to={createPageUrl('Home')}
              className="flex items-center gap-2"
              aria-label="AccesDirectAide - Accueil"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <HandHeart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 hidden sm:block">
                AccesDirectAide
              </span>
            </Link>

            {/* Navigation desktop */}
            <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Navigation principale">
              {filteredNavItems.map((item) => (
                <div key={item.page} className="relative group">
                  {item.submenu ? (
                    <>
                      <button
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${currentPageName === item.page
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-slate-700 hover:text-blue-700 hover:bg-slate-100'
                          }`}
                        aria-expanded="false"
                        aria-haspopup="true"
                      >
                        {item.label}
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 py-2 min-w-[180px]">
                          {item.submenu.map((sub, idx) => (
                            <Link
                              key={idx}
                              to={createPageUrl(sub.page) + (sub.params ? `?${sub.params}` : '')}
                              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-700"
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
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${currentPageName === item.page
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-slate-700 hover:text-blue-700 hover:bg-slate-100'
                        }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <AccessibilityToolbar />

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
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1" role="navigation" aria-label="Navigation mobile">
              {filteredNavItems.map((item) => (
                <div key={item.page}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => setOpenSubmenu(openSubmenu === item.page ? null : item.page)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openSubmenu === item.page ? 'rotate-180' : ''}`} />
                      </button>
                      {openSubmenu === item.page && (
                        <div className="pl-12 space-y-1">
                          {item.submenu.map((sub, idx) => (
                            <Link
                              key={idx}
                              to={createPageUrl(sub.page) + (sub.params ? `?${sub.params}` : '')}
                              className="block px-4 py-2 text-sm text-slate-600 hover:text-blue-700"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={createPageUrl(item.page)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-grow" role="main">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo et description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <HandHeart className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">AccesDirectAide</span>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Un site non lucratif pour vous aider à trouver les aides,
                les démarches et les structures d'accompagnement près de chez vous.
              </p>
              <p className="text-slate-400 text-sm">
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
                      className="text-slate-400 hover:text-white text-sm transition-colors"
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
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} AccesDirectAide. Site non lucratif.</p>
            <p className="mt-2">
              Territoire couvert : Alsace (Bas-Rhin, Haut-Rhin) et aides nationales.
            </p>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node,
  currentPageName: PropTypes.string,
};
