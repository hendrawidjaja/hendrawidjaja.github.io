"use client";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { Button } from "@/src/ui/Button";
import { AlertCircle, CheckCircle2, Info, X } from "./Icons";

export type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="no-print pointer-events-none fixed right-5 bottom-5 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            className={`animate-in slide-in-from-bottom-2 pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-200 ${
              toast.type === "success"
                ? "border-slate-700/80 bg-slate-900/95 text-white shadow-slate-900/20"
                : toast.type === "error"
                  ? "border-rose-800 bg-rose-950/95 text-rose-100 shadow-rose-950/30"
                  : "border-slate-700 bg-slate-900/95 text-slate-100"
            }`}
            key={toast.id}
            role="status"
          >
            {toast.type === "success" && (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            )}

            {toast.type === "error" && (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            )}
            {toast.type === "info" && <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />}

            <p className="flex-1 text-sm leading-relaxed font-medium">{toast.message}</p>

            <Button
              aria-label="Dismiss toast"
              className="p-1 text-slate-400 transition-colors hover:text-white"
              onClick={() => removeToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}