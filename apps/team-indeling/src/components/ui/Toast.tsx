"use client";

import type { Toast as ToastType } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: ToastType[];
  onVerwijder: (id: number) => void;
}

export default function ToastContainer({ toasts, onVerwijder }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm text-white animate-slide-in-right ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          role="alert"
        >
          <span>{toast.type === "success" ? "\u2713" : "\u2717"}</span>
          <span className="flex-1">{toast.bericht}</span>
          <button
            onClick={() => onVerwijder(toast.id)}
            className="text-white/70 hover:text-white ml-2"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
