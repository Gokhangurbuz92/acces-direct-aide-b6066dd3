import * as React from "react";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <>
      {/* Skip to content link - visible on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        Aller au contenu
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
            >
              <img
                src="/logo.svg"
                alt="AccesDirectAide"
                className="h-8 w-8"
              />
              <span className="font-heading font-bold text-lg text-ink hidden sm:inline">
                AccesDirectAide
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
              <Link
                to="/"
                className="text-sm font-medium text-ink hover:text-primary transition-colors duration-240 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm px-2 py-1"
              >
                Accueil
              </Link>
              <Link
                to="/aides"
                className="text-sm font-medium text-ink hover:text-primary transition-colors duration-240 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm px-2 py-1"
              >
                Aides
              </Link>
              <Link
                to="/demarches"
                className="text-sm font-medium text-ink hover:text-primary transition-colors duration-240 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm px-2 py-1"
              >
                Démarches
              </Link>
              <Link
                to="/structures"
                className="text-sm font-medium text-ink hover:text-primary transition-colors duration-240 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-sm px-2 py-1"
              >
                Annuaire
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-ink hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
