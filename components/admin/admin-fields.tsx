import * as React from "react";
import { Loader2, Save, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const inputBase =
  "w-full rounded-lg border border-border bg-ink/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-2 transition-colors focus:border-brand-orange focus:bg-ink/60 focus:outline-none";
export const labelBase = "text-xs font-medium uppercase tracking-[0.14em] text-muted";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelBase}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputBase}
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelBase}>{label}</label>
      <div className="relative">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={cn(inputBase, suffix && "pr-12")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-2">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelBase}>{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputBase, "resize-y")}
      />
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-orange" : "bg-surface-2",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SaveButton({
  saving,
  saved,
  onClick,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <Check className="h-4 w-4" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {saved ? "Saved" : "Save changes"}
    </button>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface/40 p-6">
      {title ? (
        <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      ) : null}
      {children}
    </div>
  );
}
