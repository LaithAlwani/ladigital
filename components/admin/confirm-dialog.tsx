"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

const ConfirmContext = React.createContext<(opts?: ConfirmOptions) => Promise<boolean>>(
  async () => false,
);

export function useConfirm() {
  return React.useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = React.useCallback(
    (opts: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => setState({ opts, resolve })),
    [],
  );

  const finish = React.useCallback(
    (val: boolean) => {
      setState((s) => {
        s?.resolve(val);
        return null;
      });
    },
    [],
  );

  React.useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, finish]);

  const o = state?.opts;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state ? (
          <motion.div
            key="confirm"
            className="fixed inset-0 z-[100] grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
              onClick={() => finish(false)}
              aria-hidden
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-card-hover"
            >
              <div className="flex items-start gap-3">
                {o?.danger ? (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                ) : null}
                <div className="flex-1">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {o?.title ?? "Are you sure?"}
                  </h2>
                  {o?.message ? <p className="mt-1.5 text-sm text-muted">{o.message}</p> : null}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => finish(false)}
                  className="inline-flex h-10 items-center rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  {o?.cancelLabel ?? "Cancel"}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => finish(true)}
                  className={cn(
                    "inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold text-white transition-colors",
                    o?.danger ? "bg-danger/90 hover:bg-danger" : "bg-brand-orange hover:bg-brand-orange-soft",
                  )}
                >
                  {o?.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
