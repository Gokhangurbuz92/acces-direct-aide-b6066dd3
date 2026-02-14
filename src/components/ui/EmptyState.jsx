import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({
    title = "Aucun résultat trouvé",
    message = "Nous n'avons pas trouvé ce que vous cherchez avec ces filtres.",
    actionLabel,
    onAction,
    icon: Icon = Search,
    type = 'info' // 'info', 'warning', 'search'
}) {
    const bgColor = {
        info: 'bg-blue-50',
        warning: 'bg-amber-50',
        search: 'bg-slate-50'
    }[type];

    const iconColor = {
        info: 'text-blue-500',
        warning: 'text-amber-500',
        search: 'text-slate-400'
    }[type];

    return (
        <div className={`text-center py-12 px-6 rounded-2xl ${bgColor} border-2 border-dashed border-slate-200`}>
            <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm`}>
                    <Icon className={`h-8 w-8 ${iconColor}`} />
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
                {title}
            </h3>

            <p className="text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
                {message}
            </p>

            {onAction && actionLabel && (
                <Button onClick={onAction} variant="outline" className="gap-2">
                    {actionLabel}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
