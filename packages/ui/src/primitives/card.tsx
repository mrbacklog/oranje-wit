import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={`border-b border-gray-100 px-5 py-4 ${className}`} {...props} />;
}

export function CardBody({ className = "", ...props }: CardProps) {
  return <div className={`px-5 py-4 ${className}`} {...props} />;
}
