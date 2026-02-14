
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/home/Hero';
import { TrustBand } from '@/components/home/TrustBand';

export default function HomeBlueprintTrust() {
  return (
    <>
      <SEO
        title="Accueil — Vos droits, clarifiés et sourcés"
        description="Trouvez les aides sociales, préparez vos démarches (FALC) et prenez rendez-vous avec des structures d'accompagnement."
      />
      
      <div className="min-h-screen">
        <Header />
        
        <main id="main-content">
          <Hero />
          <TrustBand />
          
          {/* Additional sections will go here */}
          <section className="py-16 bg-bt-surface">
            <div className="container mx-auto px-4">
              <h2 className="font-heading font-bold text-3xl text-bt-ink text-center mb-8">
                Découvrez nos services
              </h2>
              <p className="text-center text-bt-muted max-w-2xl mx-auto">
                Blueprint Trust Design System implémenté avec succès.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
