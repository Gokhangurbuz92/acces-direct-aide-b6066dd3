import * as React from "react";

export function Card({
  className = "",
  ...props
}) {
  return (
    <div
      className={
        "rounded-xl bg-bt-surface border border-bt-border shadow-subtle " +
        "transition-colors duration-240 ease-apple hover:border-bt-primary " +
        className
      }
      {...props}
    />
  );
}
