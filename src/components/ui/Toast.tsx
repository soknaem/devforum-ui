"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };

type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, kind }].slice(-4));
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[2000] flex justify-center px-4 sm:bottom-7 sm:justify-end">
        <div className="flex w-full max-w-sm flex-col gap-2">
          {items.map((item) => {
            const Icon = item.kind === "success" ? CheckCircle2 : item.kind === "error" ? XCircle : Info;
            return (
              <div key={item.id} className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
                <Icon className={`h-5 w-5 shrink-0 ${item.kind === "success" ? "text-emerald-500" : item.kind === "error" ? "text-red-500" : "text-blue-500"}`} />
                <p className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{item.message}</p>
                <button type="button" onClick={() => setItems((current) => current.filter((x) => x.id !== item.id))} className="shrink-0 text-slate-400 hover:text-slate-700" aria-label="Dismiss notification">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
