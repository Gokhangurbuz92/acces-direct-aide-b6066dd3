
import { useParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { SourceProof } from '@/components/ui/SourceProof';
import { CheckCircle2, FileText, AlertCircle } from 'lucide-react';

export default function AideDetailBlueprintTrust() {
  const { slug } = useParams();

  // Mock data for demonstration
  const aide = {
    titre: "Allocation de Solidarité aux Personnes Âgées (ASPA)",
    slug: slug,
    categorie: "Autonomie",
    montant: "1 012,02 € / mois",
    description: "L'ASPA est une allocation destinée aux personnes âgées disposant de faibles ressources.",
    conditions: [
      "Avoir au moins 65 ans",
      "Résider en France de manière stable et régulière",
      "Avoir des ressources inférieures au plafond"
    ],
    pieces: [
      "Justificatif d'identité",
      "Justificatif de domicile",
      "Avis d'imposition",
      "RIB"
    ],
    source: {
      publisher: "Service-Public.fr",
      date: "2026-01-15",
      url: "https://www.service-public.fr/particuliers/vosdroits/F16871"
    }
  };

  return (
    <>
      <SEO
        title={`${aide.titre} — AccesDirectAide`}
        description={aide.description}
      />
      
      <div className="min-h-screen">
        <Header />
        
        <main id="main-content" className="py-8 bg-bt-background">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-bt-muted" aria-label="Fil d'Ariane">
              <a href="/" className="hover:text-primary transition-colors">Accueil</a>
              <span className="mx-2">/</span>
              <a href="/aides" className="hover:text-primary transition-colors">Aides</a>
              <span className="mx-2">/</span>
              <span className="text-bt-ink">{aide.titre}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Left 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge>{aide.categorie}</Badge>
                    {aide.montant && <Badge>Montant : {aide.montant}</Badge>}
                  </div>
                  <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-bt-ink mb-4">
                    {aide.titre}
                  </h1>
                  <p className="text-lg text-bt-muted">
                    {aide.description}
                  </p>
                </div>

                {/* Conditions */}
                <Card className="p-6">
                  <h2 className="font-heading font-bold text-xl text-bt-ink mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Conditions d'éligibilité
                  </h2>
                  <ul className="space-y-3">
                    {aide.conditions.map((condition, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-bt-ink">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Démarches */}
                <Card className="p-6">
                  <h2 className="font-heading font-bold text-xl text-bt-ink mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Comment faire la demande ?
                  </h2>
                  <p className="text-bt-muted mb-4">
                    Vous pouvez faire votre demande en ligne ou auprès de votre caisse de retraite.
                  </p>
                  <Button variant="solid">
                    Faire une demande
                  </Button>
                </Card>

                {/* Source Proof - Mandatory */}
                <div className="pt-6 border-t border-bt-border">
                  <SourceProof
                    publisher={aide.source.publisher}
                    date={aide.source.date}
                    url={aide.source.url}
                  />
                </div>
              </div>

              {/* Sidebar - Right 1/3 Sticky */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Eligibility Checklist */}
                  <Card className="p-6">
                    <h3 className="font-heading font-bold text-lg text-bt-ink mb-4">
                      Éligibilité & Pièces
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm text-bt-muted uppercase tracking-wide mb-2">
                          Pièces à fournir
                        </h4>
                        <ul className="space-y-2">
                          {aide.pieces.map((piece, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <FileText className="h-4 w-4 text-bt-muted mt-0.5 flex-shrink-0" />
                              <span className="text-bt-ink">{piece}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>

                  {/* Alert Card */}
                  <Card className="p-6 border-warning bg-warning/5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm text-bt-ink mb-1">
                          Besoin d'aide ?
                        </h4>
                        <p className="text-sm text-bt-muted">
                          Contactez une structure d'accompagnement près de chez vous.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
