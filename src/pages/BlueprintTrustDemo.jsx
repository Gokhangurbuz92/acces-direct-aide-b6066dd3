
import SEO from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/home/Hero';
import { TrustBand } from '@/components/home/TrustBand';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { SourceProof } from '@/components/ui/SourceProof';
import { SearchInput } from '@/components/ui/SearchInput';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Blueprint Trust Design System - Component Showcase
 * 
 * This page demonstrates all Blueprint Trust components in action.
 * Use this as a reference for implementing the design system across the app.
 */
export default function BlueprintTrustDemo() {
  return (
    <>
      <SEO
        title="Blueprint Trust Design System — Demo"
        description="Component showcase for the Blueprint Trust design system"
      />
      
      <div className="min-h-screen">
        <Header />
        
        <main id="main-content">
          {/* Hero Section */}
          <Hero />
          
          {/* Trust Band */}
          <TrustBand />
          
          {/* Component Showcase */}
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4 max-w-6xl space-y-16">
              
              {/* Typography */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Typography
                </h2>
                <div className="space-y-4">
                  <h1 className="font-heading font-extrabold text-5xl text-ink">
                    Heading 1 - Geist Sans
                  </h1>
                  <h2 className="font-heading font-bold text-3xl text-ink">
                    Heading 2 - Geist Sans
                  </h2>
                  <p className="font-body text-lg text-ink">
                    Body text - Inter Regular. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <p className="font-mono text-sm uppercase tracking-wide text-muted">
                    Meta text - JetBrains Mono • Uppercase • Tracking
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Buttons
                </h2>
                <div className="flex flex-wrap gap-4">
                  <Button variant="solid">Solid Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="solid" disabled>Disabled</Button>
                </div>
                <p className="text-sm text-muted mt-4">
                  ✓ Min height 44px • ✓ Focus ring accent cyan • ✓ Reduced motion support
                </p>
              </div>

              {/* Badges */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Badges
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Badge>CAF</Badge>
                  <Badge>MSA</Badge>
                  <Badge>France Travail</Badge>
                  <Badge>Logement</Badge>
                  <Badge>Santé</Badge>
                </div>
                <p className="text-sm text-muted mt-4">
                  ✓ JetBrains Mono • ✓ Uppercase • ✓ Tracking 0.05em
                </p>
              </div>

              {/* Cards */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Cards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h3 className="font-heading font-bold text-lg text-ink mb-2">
                      Card Title
                    </h3>
                    <p className="text-muted">
                      Border-first design with subtle shadow. Hover to see border-primary effect.
                    </p>
                  </Card>
                  <Card className="p-6">
                    <CheckCircle2 className="h-8 w-8 text-success mb-4" />
                    <h3 className="font-heading font-bold text-lg text-ink mb-2">
                      With Icon
                    </h3>
                    <p className="text-muted">
                      Cards can include icons and various content types.
                    </p>
                  </Card>
                  <Card className="p-6 border-warning bg-warning/5">
                    <AlertCircle className="h-8 w-8 text-warning mb-4" />
                    <h3 className="font-heading font-bold text-lg text-ink mb-2">
                      Alert Card
                    </h3>
                    <p className="text-muted">
                      Custom styling for different states.
                    </p>
                  </Card>
                </div>
                <p className="text-sm text-muted mt-4">
                  ✓ Rounded-xl • ✓ Border-first • ✓ Hover: border-primary + shadow-float
                </p>
              </div>

              {/* Search Input */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Search Input
                </h2>
                <div className="max-w-2xl">
                  <SearchInput
                    placeholder="Rechercher une aide, une démarche..."
                    showCommandHint={true}
                  />
                </div>
                <p className="text-sm text-muted mt-4">
                  ✓ Height 64px • ✓ Focus ring accent • ✓ Optional ⌘K hint
                </p>
              </div>

              {/* Source Proof */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Source Proof (Trust Signature)
                </h2>
                <div className="space-y-4">
                  <SourceProof
                    publisher="Service-Public.fr"
                    date="2026-01-15"
                    url="https://www.service-public.fr"
                  />
                  <SourceProof
                    publisher="CAF"
                    date="2026-02-01"
                  />
                </div>
                <p className="text-sm text-muted mt-4">
                  ✓ ShieldCheck icon • ✓ Mono uppercase • ✓ Optional external link
                </p>
              </div>

              {/* Colors */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Color Palette
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-20 rounded-lg bg-ink border border-border"></div>
                    <p className="text-sm font-mono mt-2">ink</p>
                    <p className="text-xs text-muted">#0B1220</p>
                  </div>
                  <div>
                    <div className="h-20 rounded-lg bg-primary border border-border"></div>
                    <p className="text-sm font-mono mt-2">primary</p>
                    <p className="text-xs text-muted">#0B3A6A</p>
                  </div>
                  <div>
                    <div className="h-20 rounded-lg bg-accent border border-border"></div>
                    <p className="text-sm font-mono mt-2">accent</p>
                    <p className="text-xs text-muted">#2BC4D7</p>
                  </div>
                  <div>
                    <div className="h-20 rounded-lg bg-background border border-border"></div>
                    <p className="text-sm font-mono mt-2">background</p>
                    <p className="text-xs text-muted">#F7FAFF</p>
                  </div>
                  <div>
                    <div className="h-20 rounded-lg bg-surface border border-border"></div>
                    <p className="text-sm font-mono mt-2">surface</p>
                    <p className="text-xs text-muted">#FFFFFF</p>
                  </div>
                  <div>
                    <div className="h-20 rounded-lg bg-success border border-border"></div>
                    <p className="text-sm font-mono mt-2">success</p>
                    <p className="text-xs text-muted">#157F3D</p>
                  </div>
                  <div>
                    <div className="h-20 rounded-lg bg-warning border border-border"></div>
                    <p className="text-sm font-mono mt-2">warning</p>
                    <p className="text-xs text-muted">#B45309</p>
                  </div>
                  <div>
                    <div className="h-20 rounded-lg bg-danger border border-border"></div>
                    <p className="text-sm font-mono mt-2">danger</p>
                    <p className="text-xs text-muted">#B42318</p>
                  </div>
                </div>
              </div>

              {/* Blueprint Grid */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Blueprint Grid
                </h2>
                <div className="h-64 rounded-xl bg-background bg-blueprint-grid bg-[size:40px_40px] border border-border flex items-center justify-center">
                  <p className="font-heading font-bold text-2xl text-ink bg-surface/90 px-6 py-3 rounded-lg">
                    Blueprint Grid Background
                  </p>
                </div>
                <p className="text-sm text-muted mt-4">
                  ✓ 40px grid size • ✓ Subtle alpha • ✓ Used on hero only
                </p>
              </div>

              {/* Accessibility */}
              <div>
                <h2 className="font-heading font-bold text-3xl text-ink mb-8">
                  Accessibility (WCAG AA)
                </h2>
                <Card className="p-6">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-ink">
                        <strong>Focus Visible:</strong> All interactive elements use accent cyan (#2BC4D7) focus ring with 2px offset
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-ink">
                        <strong>Touch Targets:</strong> Minimum 44px height for buttons
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-ink">
                        <strong>Contrast Ratios:</strong> All text meets 4.5:1 minimum
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-ink">
                        <strong>Reduced Motion:</strong> Animations disabled when prefers-reduced-motion: reduce
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-ink">
                        <strong>Skip Links:</strong> "Aller au contenu" visible on focus (try pressing TAB)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-ink">
                        <strong>Keyboard Navigation:</strong> Full keyboard support with visible focus states
                      </span>
                    </li>
                  </ul>
                </Card>
              </div>

            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-surface py-8">
          <div className="container mx-auto px-4 text-center">
            <SourceProof
              publisher="Blueprint Trust Design System"
              date="2026-02-07"
              className="justify-center"
            />
          </div>
        </footer>
      </div>
    </>
  );
}
