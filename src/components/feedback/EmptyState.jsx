
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({
    title = "Aucune aide trouvée",
    message = "Essayez de modifier vos filtres ou d'élargir votre recherche.",
    actionLabel = "Réinitialiser les filtres",
    onAction,
    icon: Icon = Search,
}) {
    const bgColor = 'bg-slate-50';
    const iconColor = 'text-slate-400';

    return (
        <div
            className={`text-center py-12 px-6 rounded-2xl ${bgColor} border-2 border-dashed border-slate-200`}
            role="status"
            aria-live="polite"
            data-testid="empty-state"
        >
            <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm`}>
                    <Icon className={`h-8 w-8 ${iconColor}`} aria-hidden="true" alt="" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
                {title}
            </h3>

            <p className="text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
                {message}
            </p>

            {onAction && actionLabel && (
                <Button
                    onClick={onAction}
                    variant="outline"
                    className="gap-2"
                    data-testid="empty-reset"
                >
                    {actionLabel}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
