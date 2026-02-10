import React from 'react';
import SEO from '@/components/SEO';

export default function Orientation() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Mon Assistant"
        description="Assistant d'orientation pour trouver les aides et démarches adaptées à votre situation."
        path="/orientation"
      />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900">Mon Assistant</h1>
        <p className="mt-3 text-slate-600">
          Cette page est un squelette de l&apos;assistant d&apos;orientation. Bientôt, vous pourrez répondre à quelques questions pour être guidé vers les aides et démarches pertinentes.
        </p>
      </section>
    </div>
  );
}
