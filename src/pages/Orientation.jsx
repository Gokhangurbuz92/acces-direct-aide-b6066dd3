
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Orientation() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Mon Assistant"
        description="Assistant d'orientation pour trouver les aides et démarches adaptées à votre situation."
        path="/orientation"
        noindex
      />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Bot className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Mon Assistant</h1>
          <p className="mt-3 text-slate-600">
            Fonctionnalite bientot disponible. En attendant, vous pouvez trouver les aides, les demarches et les structures depuis les rubriques principales.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/aides">
              <Button>Voir les aides</Button>
            </Link>
            <Link to="/demarches">
              <Button variant="outline">Voir les demarches</Button>
            </Link>
            <Link to="/annuaire">
              <Button variant="outline" className="gap-2">
                Voir l&apos;annuaire
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
