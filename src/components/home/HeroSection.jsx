import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-32 pb-16 lg:pt-40 lg:pb-24">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-br from-blue-50 to-white lg:block" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
            Plateforme officielle Grand Est
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Vos droits, <span className="text-blue-600">simplement.</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            AccesDirectAide centralise les aides sociales, les démarches utiles et les lieux d&apos;accueil pour vous orienter rapidement vers les bonnes informations.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Rechercher une aide (ex: AAH, RSA...)"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-300"
                  aria-label="Rechercher une aide"
                />
              </div>
              <Link
                to="/aides"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Rechercher
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
