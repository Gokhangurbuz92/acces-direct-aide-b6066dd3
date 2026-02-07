import * as React from "react";

export function Card({
  className = "",
  ...props
}) {
  return (
    <div
      className={
        "rounded-xl bg-surface border border-border shadow-subtle " +
        "transition-all duration-240 ease-apple hover:border-primary hover:shadow-float " +
        "motion-reduce:transform-none motion-reduce:transition-none " +
        className
      }
      {...props}
    />
  );
}
