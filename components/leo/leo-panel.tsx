"use client";

import { Fragment, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import { leoStrings } from "@/lib/leo-strings";
import { LeoMessage } from "./leo-message";
import { LeoInput } from "./leo-input";
import { LeoLeadForm } from "./leo-lead-form";
import { LeoBookingCard } from "./leo-booking-card";
import { LeoSuggestions } from "./leo-suggestions";
import { useLeoChat } from "./use-leo-chat";

type Props = { open: boolean; onClose: () => void };

export function LeoPanel({ open, onClose }: Props) {
  const reduced = useReducedMotion();
  const chat = useLeoChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const strings = leoStrings(chat.locale);

  // Auto-scroll to the bottom whenever messages update or streaming continues.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.isStreaming]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock page scroll while the panel is open so the dimmed background
  // can't move under the chat.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={onClose}
          aria-hidden
          className="fixed inset-0 z-58 bg-ink/65 backdrop-blur-sm"
        />
      )}
      {open && (
        <motion.div
          key="panel"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-60 flex flex-col overflow-hidden bg-ink shadow-card-hover sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(620px,calc(100vh-8rem))] sm:w-[min(380px,calc(100vw-2rem))] sm:rounded-card sm:border sm:border-border"
          role="dialog"
          aria-modal="true"
          aria-label="Leo chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-orange/15 text-brand-orange ring-1 ring-brand-orange/40">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-sm font-semibold text-foreground">Leo</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-2">
                  LA Digital
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={strings.closeLabel}
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-ink px-3 py-4"
          >
            {chat.messages.map((m) => (
              <Fragment key={m.id}>
                <LeoMessage message={m} />
                {m.showLeadForm ? (
                  <LeoLeadForm
                    locale={chat.locale}
                    status={m.leadFormStatus ?? "open"}
                    onSubmit={chat.submitLead}
                    onDismiss={() => chat.dismissLeadForm(m.id)}
                  />
                ) : null}
                {m.showBooking ? <LeoBookingCard locale={chat.locale} /> : null}
              </Fragment>
            ))}
            {chat.error ? (
              <div
                role="alert"
                className="rounded-card border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
              >
                {chat.error}
              </div>
            ) : null}
          </div>

          {/* Quick suggestions + input */}
          <LeoSuggestions
            locale={chat.locale}
            onSend={chat.send}
            onBook={chat.openBooking}
            disabled={chat.isStreaming}
          />
          <LeoInput
            locale={chat.locale}
            disabled={chat.isStreaming}
            onSend={chat.send}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
