"use client";

import { useState, useCallback, useRef } from "react";

export interface Toast {
  id: number;
  type: "success" | "error";
  bericht: string;
}

let nextId = 0;

export function useToast(duurMs = 4000) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const verwijder = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toon = useCallback(
    (type: Toast["type"], bericht: string) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, type, bericht }]);
      const timer = setTimeout(() => verwijder(id), duurMs);
      timers.current.set(id, timer);
    },
    [duurMs, verwijder]
  );

  const success = useCallback((b: string) => toon("success", b), [toon]);
  const error = useCallback((b: string) => toon("error", b), [toon]);

  return { toasts, success, error, verwijder };
}
