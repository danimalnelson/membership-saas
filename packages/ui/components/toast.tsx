"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type ToastVariant = "default" | "success" | "warning" | "error";

interface Toast {
  id: number;
  text: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  message: (opts: { text: string }) => void;
  success: (text: string) => void;
  warning: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToasts(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within <ToastProvider>");
  return ctx;
}

const DURATION = 4000;
let nextId = 0;

const VARIANT_STYLES: Record<ToastVariant, { container: string; close: string }> = {
  default: {
    container: "border border-gray-200 bg-white text-gray-950 shadow-lg dark:bg-gray-100 dark:border-gray-600 dark:text-white",
    close: "text-gray-600 hover:text-gray-950 dark:text-gray-800 dark:hover:text-white",
  },
  success: {
    container: "bg-blue-600 text-white shadow-lg border border-blue-700",
    close: "text-white/70 hover:text-white",
  },
  warning: {
    container: "bg-orange-500 text-gray-950 shadow-lg border border-orange-600",
    close: "text-gray-950/60 hover:text-gray-950",
  },
  error: {
    container: "bg-red-600 text-white shadow-lg border border-red-700",
    close: "text-white/70 hover:text-white",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [exiting, setExiting] = React.useState<Set<number>>(new Set());

  React.useEffect(() => setMounted(true), []);

  const dismiss = React.useCallback((id: number) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  }, []);

  const push = React.useCallback(
    (text: string, variant: ToastVariant) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, text, variant }]);
      setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss]
  );

  const ctx = React.useMemo<ToastContextValue>(
    () => ({
      message: ({ text }) => push(text, "default"),
      success: (text) => push(text, "success"),
      warning: (text) => push(text, "warning"),
      error: (text) => push(text, "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2">
            {toasts.map((t) => {
              const styles = VARIANT_STYLES[t.variant];
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 p-4 min-w-[360px] rounded-lg text-sm transition-all duration-200 ${styles.container} ${
                    exiting.has(t.id)
                      ? "opacity-0 translate-y-2"
                      : "opacity-100 translate-y-0 animate-toast-in"
                  }`}
                >
                  <span className="flex-1">{t.text}</span>
                  <button
                    onClick={() => dismiss(t.id)}
                    className={`shrink-0 transition-colors ${styles.close}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
