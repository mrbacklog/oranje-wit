import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = "", style, ...props }: CardProps) {
  return (
    <div
      className={`border-border-default bg-surface-card rounded-xl border ${className}`}
      style={{ boxShadow: "var(--shadow-card)", ...style }}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={`border-border-light border-b px-5 py-4 ${className}`} {...props} />;
}

export function CardBody({ className = "", ...props }: CardProps) {
  return <div className={`px-5 py-4 ${className}`} {...props} />;
}
