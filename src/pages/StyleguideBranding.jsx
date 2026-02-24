import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Page de preview des 3 familles de logos (A/B/C)
 * Route: /styleguide/branding
 * Permet de visualiser et comparer les variantes avant choix final
 */
export default function StyleguideBranding() {
  const [selectedFamily, setSelectedFamily] = useState('a');
  const [selectedBackground, setSelectedBackground] = useState('light');

  const families = [
    { id: 'a', name: 'Famille A', description: 'Pin + Halo minimal (concept principal)' },
    { id: 'b', name: 'Famille B', description: 'Pin + Rayons + Chemin discret' },
    { id: 'c', name: 'Famille C', description: 'Pin stylisé + Éclat + Chevron institutionnel' }
  ];

  const variants = [
    { id: 'icon', name: 'Icône seule', width: 64 },
    { id: 'full', name: 'Logo complet', width: 280 },
    { id: 'tagline', name: 'Avec slogan', width: 320 },
    { id: 'white', name: 'Version blanche', width: 280 }
  ];

  const backgrounds = [
    { id: 'light', name: 'Fond clair (ivoire)', color: '#F7F4EE' },
    { id: 'dark', name: 'Fond bleu nuit', color: '#002D5A' },
    { id: 'accent', name: 'Fond turquoise', color: '#2BC4D7' },
    { id: 'white', name: 'Fond blanc', color: '#FFFFFF' }
  ];

  const sizes = [
    { name: '24px (favicon)', height: 24 },
    { name: '40px (header)', height: 40 },
    { name: '64px (large)', height: 64 },
    { name: '120px (hero)', height: 120 }
  ];

  const currentBg = backgrounds.find(bg => bg.id === selectedBackground);

  return (
    <>
      <Helmet>
        <title>Styleguide Branding - AccesDirectAide</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Styleguide Branding
            </h1>
            <p className="text-lg text-muted max-w-3xl">
              Preview des 3 familles de logos (A/B/C) pour AccesDirectAide.
              Testez les variantes sur différents fonds et tailles pour choisir la meilleure option.
            </p>
          </div>

          {/* Sélecteurs */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sélection famille */}
              <div>
                <label className="block text-sm font-semibold text-body mb-3">
                  Famille de logo
                </label>
                <div className="space-y-2">
                  {families.map(family => (
                    <button
                      key={family.id}
                      onClick={() => setSelectedFamily(family.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${selectedFamily === family.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-slate-200 hover:border-primary/50'
                        }`}
                    >
                      <div className="font-semibold text-body">{family.name}</div>
                      <div className="text-sm text-muted mt-1">{family.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélection fond */}
              <div>
                <label className="block text-sm font-semibold text-body mb-3">
                  Fond de test
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {backgrounds.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg.id)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${selectedBackground === bg.id
                          ? 'border-primary shadow-sm'
                          : 'border-slate-200 hover:border-primary/50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-slate-300"
                          style={{ backgroundColor: bg.color }}
                        />
                        <span className="text-sm font-medium text-body">{bg.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grille de preview par variante */}
          <div className="space-y-8">
            {variants.map(variant => (
              <div key={variant.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
                  <h3 className="font-semibold text-body">{variant.name}</h3>
                </div>

                <div
                  className="p-8"
                  style={{ backgroundColor: currentBg.color }}
                >
                  <div className="grid md:grid-cols-4 gap-8">
                    {sizes.map(size => (
                      <div key={size.height} className="text-center">
                        <div className="mb-3 flex items-center justify-center" style={{ minHeight: size.height + 20 }}>
                          <img
                            src={`/assets/branding/logo-${selectedFamily}-${variant.id}.svg`}
                            alt={`Logo ${selectedFamily.toUpperCase()} - ${variant.name}`}
                            style={{ height: `${size.height}px`, width: 'auto' }}
                            className="object-contain"
                          />
                        </div>
                        <div className={`text-xs font-medium ${selectedBackground === 'dark' || selectedBackground === 'accent'
                            ? 'text-white'
                            : 'text-muted'
                          }`}>
                          {size.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mock Header */}
          <div className="mt-12 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-body">Contexte Header (mock)</h3>
            </div>
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <img
                  src={`/assets/branding/logo-${selectedFamily}-full.svg`}
                  alt="Logo dans header"
                  style={{ height: '40px', width: 'auto' }}
                  className="object-contain"
                />
                <nav className="flex gap-6" aria-label="Navigation mock">
                  <span className="text-sm font-medium text-primary">Aides</span>
                  <span className="text-sm font-medium text-primary">Démarches</span>
                  <span className="text-sm font-medium text-primary">Annuaire</span>
                </nav>
              </div>
            </div>
          </div>

          {/* Mock Footer */}
          <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-body">Contexte Footer (mock)</h3>
            </div>
            <div className="bg-primary px-6 py-8">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <img
                  src={`/assets/branding/logo-${selectedFamily}-white.svg`}
                  alt="Logo dans footer"
                  style={{ height: '48px', width: 'auto' }}
                  className="object-contain"
                />
                <div className="text-white text-sm">
                  © 2025 AccesDirectAide
                </div>
              </div>
            </div>
          </div>

          {/* Favicon preview */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-body mb-4">Preview Favicon (16x16)</h3>
            <div className="flex gap-4 items-center">
              <div className="bg-slate-100 p-2 rounded">
                <img
                  src={`/assets/branding/logo-${selectedFamily}-icon.svg`}
                  alt="Favicon preview"
                  style={{ width: '16px', height: '16px' }}
                  className="object-contain"
                />
              </div>
              <div className="text-sm text-muted">
                Lisibilité à 16x16 (taille favicon réelle)
              </div>
            </div>
          </div>

          {/* Palette de couleurs */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-body mb-4">Palette officielle</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="w-full h-20 rounded-lg" style={{ backgroundColor: '#002D5A' }}></div>
                <div className="mt-2 text-sm font-mono">#002D5A</div>
                <div className="text-xs text-muted">Primary</div>
              </div>
              <div>
                <div className="w-full h-20 rounded-lg border border-slate-200" style={{ backgroundColor: '#F7F4EE' }}></div>
                <div className="mt-2 text-sm font-mono">#F7F4EE</div>
                <div className="text-xs text-muted">Background</div>
              </div>
              <div>
                <div className="w-full h-20 rounded-lg" style={{ backgroundColor: '#2BC4D7' }}></div>
                <div className="mt-2 text-sm font-mono">#2BC4D7</div>
                <div className="text-xs text-muted">Secondary</div>
              </div>
              <div>
                <div className="w-full h-20 rounded-lg" style={{ backgroundColor: '#F6B445' }}></div>
                <div className="mt-2 text-sm font-mono">#F6B445</div>
                <div className="text-xs text-muted">Highlight</div>
              </div>
            </div>
          </div>

          {/* Typographie */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-body mb-4">Typographie (Inter)</h3>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-bold text-primary">Titre H1</div>
                <div className="text-xs text-muted mt-1">Inter Bold 36px</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">Titre H2</div>
                <div className="text-xs text-muted mt-1">Inter Semibold 24px</div>
              </div>
              <div>
                <div className="text-base text-body">Texte de corps standard avec une bonne lisibilité</div>
                <div className="text-xs text-muted mt-1">Inter Regular 16px</div>
              </div>
            </div>
          </div>

          {/* Boutons exemples */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-body mb-4">Exemples de boutons</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                Bouton Primary
              </button>
              <button className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors">
                Bouton Secondary
              </button>
              <button className="px-6 py-3 bg-highlight text-body rounded-lg font-semibold hover:bg-highlight/90 transition-colors">
                Bouton Highlight
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
