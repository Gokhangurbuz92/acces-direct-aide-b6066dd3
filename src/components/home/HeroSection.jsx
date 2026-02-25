import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroBackground from '@/components/home/HeroBackground';

export default function HeroSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const search = query.trim();
    if (!search) {
      navigate('/aides');
      return;
    }
    navigate(`/aides?search=${encodeURIComponent(search)}`);
  };

  return (
    <section className="relative isolate overflow-hidden bg-white pt-24 pb-14 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24">
      <HeroBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/72 p-5 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.70)] backdrop-blur-md sm:p-8 lg:p-10">
            <div
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.66)_56%,rgba(255,255,255,0.48)_100%)]"
              aria-hidden="true"
            />

            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Trouvez une aide rapidement.
            </h1>

            <p className="mt-5 text-pretty text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
              Aides, démarches, structures — informations sourcées.
            </p>

            <form className="mt-7" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="search-input"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Logement, santé, handicap…"
                    className="w-full rounded-xl border border-slate-300 bg-white/92 py-3 pl-10 pr-4 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-500/30"
                    aria-label="Rechercher une aide"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2"
                >
                  Rechercher
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
