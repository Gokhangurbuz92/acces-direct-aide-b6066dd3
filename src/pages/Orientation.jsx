
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatAssistant from '@/components/chat/ChatAssistant';

export default function Orientation() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO
        title="Mon Assistant"
        description="Assistant d'orientation pour trouver les aides et démarches adaptées à votre situation."
        path="/orientation"
        noindex
      />
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Mon Assistant</h1>
        <p className="mb-6 text-slate-600">
          Posez vos questions sur les aides sociales. L&apos;assistant vous oriente en fonction de votre situation.
        </p>

        <ChatAssistant embedded />

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
      </section>
    </div>
  );
}
