"use client";

import type { Toast as ToastType } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: ToastType[];
  onVerwijder: (id: number) => void;
}

export default function ToastContainer({ toasts, onVerwijder }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-slide-in-right flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          role="alert"
        >
          <span>{toast.type === "success" ? "\u2713" : "\u2717"}</span>
          <span className="flex-1">{toast.bericht}</span>
          <button
            onClick={() => onVerwijder(toast.id)}
            className="ml-2 text-white/70 hover:text-white"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
