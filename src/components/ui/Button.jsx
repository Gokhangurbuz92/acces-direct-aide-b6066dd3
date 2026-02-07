import * as React from "react";

const ButtonVariants = {
  solid: "bg-primary text-white hover:bg-primaryHover",
  outline: "border border-border bg-surface text-ink hover:bg-background",
  ghost: "bg-transparent text-ink hover:bg-background",
};

export const Button = React.forwardRef(
  ({ className = "", variant = "solid", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-lg px-4 py-2 min-h-[44px] text-sm font-medium " +
      "transition-colors duration-240 ease-apple disabled:opacity-50 disabled:pointer-events-none " +
      "motion-reduce:transform-none motion-reduce:transition-none";

    const focus =
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
      "focus-visible:ring-offset-2 ring-offset-surface";

    return (
      <button
        ref={ref}
        className={`${base} ${focus} ${ButtonVariants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
