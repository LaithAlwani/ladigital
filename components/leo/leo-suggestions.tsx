"use client";

import { leoStrings, type Locale } from "@/lib/leo-strings";

type Props = {
  locale: Locale;
  onSend: (text: string) => void;
  onBook: () => void;
  disabled?: boolean;
};

// Quick-reply chips above the input — tap to ask a common question or open
// the booking picker.
export function LeoSuggestions({ locale, onSend, onBook, disabled }: Props) {
  const items = leoStrings(locale).suggestions;
  return (
    <div className="flex gap-2 overflow-x-auto border-t border-border bg-surface/40 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => (s.kind === "book" ? onBook() : onSend(s.text ?? s.label))}
          className="shrink-0 whitespace-nowrap rounded-pill border border-border bg-ink/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand-orange/50 hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-50"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
