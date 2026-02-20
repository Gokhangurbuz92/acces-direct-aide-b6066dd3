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
        info: 'bg-primary/10',
        warning: 'bg-secondary/10',
        search: 'bg-muted'
    }[type];

    const iconColor = {
        info: 'text-primary',
        warning: 'text-secondary',
        search: 'text-muted-foreground'
    }[type];

    return (
        <div className={`text-center py-12 px-6 rounded-2xl ${bgColor} border-2 border-dashed border-border`}>
            <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-background shadow-sm border border-border`}>
                    <Icon className={`h-8 w-8 ${iconColor}`} />
                </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">
                {title}
            </h3>

            <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
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
