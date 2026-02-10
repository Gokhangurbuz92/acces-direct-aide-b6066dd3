import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function NewsSection() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-8 w-1 rounded-full bg-blue-500" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-slate-900">Actualités officielles</h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-700">Aucune actualité chargée pour le moment</p>
          <p className="mt-2 text-sm text-slate-500">Les informations officielles apparaîtront ici prochainement.</p>
        </div>

        <div className="mt-6">
          <Link to="/actualites" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            Voir toutes les actualités
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
