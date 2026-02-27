import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Eye,
  Type,
  Moon,
  Sun,
  Minus,
  Plus,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AccessibilityToolbar() {
  const [settings, setSettings] = useState({
    fontSize: 100,
    contrast: 'normal',
    lineHeight: 'normal',
    simplifiedMode: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));

    // Phase 3.4 RGAA: Apply to <html> element too for CSS cascade
    document.documentElement.style.fontSize = `${settings.fontSize}%`;

    document.documentElement.classList.remove('high-contrast', 'dark-mode');
    document.body.classList.remove('high-contrast', 'dark-mode');
    if (settings.contrast === 'high') {
      document.documentElement.classList.add('high-contrast');
      document.body.classList.add('high-contrast');
    } else if (settings.contrast === 'dark') {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }

    document.body.classList.remove('large-line-height');
    if (settings.lineHeight === 'large') {
      document.body.classList.add('large-line-height');
    }

    document.body.classList.toggle('simplified-mode', settings.simplifiedMode);
  }, [settings]);

  const resetSettings = () => {
    setSettings({
      fontSize: 100,
      contrast: 'normal',
      lineHeight: 'normal',
      simplifiedMode: false
    });
  };

  const adjustFontSize = (delta) => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.min(150, Math.max(80, prev.fontSize + delta))
    }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-foreground border-border hover:bg-accent hover:text-accent-foreground"
          aria-label="Options d'accessibilité"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Accessibilité</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground text-lg">
            Adapter l'affichage
          </h3>

          {/* Taille du texte */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Taille du texte
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustFontSize(-10)}
                aria-label="Réduire la taille du texte"
                disabled={settings.fontSize <= 80}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="flex-1 text-center font-medium text-foreground">
                {settings.fontSize}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustFontSize(10)}
                aria-label="Augmenter la taille du texte"
                disabled={settings.fontSize >= 150}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Contraste */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Contraste
            </label>
            <div className="flex gap-2">
              <Button
                variant={settings.contrast === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, contrast: 'normal' }))}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-1" aria-hidden="true" />
                Normal
              </Button>
              <Button
                variant={settings.contrast === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, contrast: 'high' }))}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                Fort
              </Button>
              <Button
                variant={settings.contrast === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, contrast: 'dark' }))}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-1" aria-hidden="true" />
                Sombre
              </Button>
            </div>
          </div>

          {/* Interligne */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Espacement des lignes
            </label>
            <div className="flex gap-2">
              <Button
                variant={settings.lineHeight === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, lineHeight: 'normal' }))}
                className="flex-1"
              >
                Normal
              </Button>
              <Button
                variant={settings.lineHeight === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, lineHeight: 'large' }))}
                className="flex-1"
              >
                <Maximize2 className="h-4 w-4 mr-1" aria-hidden="true" />
                Large
              </Button>
            </div>
          </div>

          {/* Mode simplifié */}
          <div className="space-y-2">
            <Button
              variant={settings.simplifiedMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, simplifiedMode: !prev.simplifiedMode }))}
              className="w-full"
            >
              <Type className="h-4 w-4 mr-2" aria-hidden="true" />
              Mode lecture facile
            </Button>
          </div>

          {/* Réinitialiser */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="w-full text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Réinitialiser
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
