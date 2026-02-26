import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ className, title, description, icon, actions, ...props }, ref) => {
        return (
            <div
                ref={ref}
                data-testid="empty-state"
                className={cn(
                    "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-border bg-background",
                    className
                )}
                {...props}
            >
                {icon && (
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {icon}
                    </div>
                )}
                <h3 className="text-xl font-semibold text-foreground mb-2">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                        {description}
                    </p>
                )}
                {actions && (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        )
    }
)
EmptyState.displayName = "EmptyState"

export default EmptyState
