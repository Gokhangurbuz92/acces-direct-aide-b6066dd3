import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

export default function AssistantFeatureSection() {
  return (
    <section className="bg-slate-900 py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
            Exclusivité AccesDirect
          </p>
          <h2 className="mt-4 text-3xl font-bold">Ne cherchez plus, laissez-vous guider.</h2>
          <p className="mt-4 text-slate-300">
            Notre assistant vous pose quelques questions simples pour vous orienter vers les aides et démarches les plus pertinentes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/orientation"
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Lancer le diagnostic
            </Link>
            <Link
              to="/orientation"
              className="rounded-xl border border-slate-500 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-300"
            >
              En savoir plus
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
            <Bot className="h-5 w-5" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-700 px-4 py-3 text-slate-100">
              Bonjour, je peux vous aider à clarifier votre situation.
            </div>
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-blue-700 px-4 py-3 text-white">
              Je cherche des aides pour le logement.
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-700 px-4 py-3 text-slate-100">
              Analyse en cours…
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
