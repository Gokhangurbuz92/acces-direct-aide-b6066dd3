import { useFalc } from '@/contexts/FalcContext';
import { Button } from '@/components/ui/button';

/**
 * FALC Mode Toggle
 * Allows users to switch to "Facile à Lire et à Comprendre" mode
 */
export function FalcToggle() {
  const { falcMode, toggleFalcMode } = useFalc();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleFalcMode}
      aria-label={falcMode ? 'Désactiver le mode Facile à lire' : 'Activer le mode Facile à lire'}
      title={falcMode ? 'Désactiver le mode Facile à lire' : 'Activer le mode Facile à lire'}
      className="falc-toggle"
    >
      {falcMode ? '📖 Mode FALC activé' : '📖 Mode Facile à lire'}
    </Button>
  );
}
