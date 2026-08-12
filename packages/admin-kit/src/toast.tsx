"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { cn } from "@ladigital/ui";

// Lightweight toast for admin feedback — replaces raw alert() so errors and
// confirmations read as direction, not a browser interruption.
type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };

// Module-level dispatch so any admin component can `toast("…")` without wiring a
// hook — the mounted ToastProvider registers its enqueue here.
let dispatch: ((message: string, kind: ToastKind) => void) | null = null;

export function toast(message: string, kind: ToastKind = "info") {
  dispatch?.(message, kind);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setItems((s) => s.filter((t) => t.id !== id));
  }, []);

  const enqueue = React.useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = (idRef.current += 1);
      setItems((s) => [...s, { id, message, kind }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  React.useEffect(() => {
    dispatch = enqueue;
    return () => {
      if (dispatch === enqueue) dispatch = null;
    };
  }, [enqueue]);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(92vw,22rem)] flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-surface px-4 py-3 text-sm shadow-card-hover",
                t.kind === "error"
                  ? "border-danger/30"
                  : t.kind === "success"
                    ? "border-success/30"
                    : "border-border",
              )}
            >
              {t.kind === "error" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              ) : t.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : null}
              <span className="flex-1 text-foreground">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="text-muted-2 transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
