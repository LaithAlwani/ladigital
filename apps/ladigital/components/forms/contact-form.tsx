"use client";

import { useActionState, useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitContact } from "@/app/actions/contact";
import { INITIAL_CONTACT_STATE, BUDGET_VALUES, type ContactFieldErrors } from "@/lib/schemas";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/cn";

type Props = {
  defaultService?: string;
  defaultPackage?: string;
};

const inputBase =
  "w-full rounded-lg border border-border bg-ink/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-2 transition-colors focus:border-brand-orange focus:bg-ink/60 focus:outline-none";

const labelBase = "text-xs font-medium uppercase tracking-[0.14em] text-muted";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  consent: boolean;
};

function emptyValues(defaultService?: string, messagePrefill = ""): FormValues {
  return {
    name: "",
    email: "",
    phone: "",
    company: "",
    service: defaultService ?? "",
    budget: "",
    message: messagePrefill,
    consent: false,
  };
}

export function ContactForm({ defaultService, defaultPackage }: Props) {
  const [state, formAction, pending] = useActionState(submitContact, INITIAL_CONTACT_STATE);
  const reduced = useReducedMotion();

  const messagePrefill = defaultPackage
    ? `I'm interested in the "${defaultPackage}" plan. Here's a bit about my business:\n\n`
    : "";

  // Controlled state for every field. React 19 resets uncontrolled inputs
  // after a server-action submission (even when the action returns an error),
  // which wipes out anything the user typed when validation fails. Holding
  // the values in React state keeps them through an error round-trip and we
  // clear them explicitly on success below.
  const [values, setValues] = useState<FormValues>(() =>
    emptyValues(defaultService, messagePrefill),
  );

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  useEffect(() => {
    if (state.status === "success") {
      setValues(emptyValues());
    }
  }, [state.status]);

  const fieldErrors: ContactFieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <div className="relative">
      {state.status === "success" ? (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-4 rounded-card border border-success/30 bg-success/5 p-8"
          role="status"
          aria-live="polite"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success/20 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h3 className="font-display text-xl font-semibold text-foreground">Message sent.</h3>
            <p className="text-sm text-muted">{state.message}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="text-sm font-medium text-brand-orange hover:text-brand-orange-soft"
          >
            Send another →
          </button>
        </motion.div>
      ) : (
        <form
          action={formAction}
          className="flex flex-col gap-5 rounded-card border border-border bg-surface/40 p-6 md:p-8"
          noValidate
        >
            {state.status === "error" ? (
              <div
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger"
              >
                {state.message}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Name"
                name="name"
                required
                autoComplete="name"
                value={values.name}
                onChange={(v) => set("name", v)}
                error={fieldErrors.name?.[0]}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={values.email}
                onChange={(v) => set("email", v)}
                error={fieldErrors.email?.[0]}
              />
              <Field
                label="Phone (optional)"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(v) => set("phone", v)}
                error={fieldErrors.phone?.[0]}
              />
              <Field
                label="Company (optional)"
                name="company"
                autoComplete="organization"
                value={values.company}
                onChange={(v) => set("company", v)}
                error={fieldErrors.company?.[0]}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="service" className={labelBase}>
                  Service
                </label>
                <select
                  id="service"
                  name="service"
                  value={values.service}
                  onChange={(e) => set("service", e.target.value)}
                  className={inputBase}
                >
                  <option value="">Not sure yet</option>
                  {siteConfig.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget" className={labelBase}>
                  Budget (optional)
                </label>
                <select
                  id="budget"
                  name="budget"
                  value={values.budget}
                  onChange={(e) => set("budget", e.target.value)}
                  className={inputBase}
                >
                  <option value="">No preference</option>
                  {BUDGET_VALUES.map((b) => (
                    <option key={b} value={b}>
                      {b} CAD
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className={labelBase}>
                Tell us about your business
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                minLength={10}
                maxLength={2000}
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="What does your business do? What are you trying to accomplish over the next 6–12 months?"
                className={cn(inputBase, "resize-y")}
              />
              {fieldErrors.message?.[0] ? (
                <p className="text-xs text-danger">{fieldErrors.message[0]}</p>
              ) : null}
            </div>

            <label className="flex items-start gap-2.5 text-xs text-muted">
              <input
                type="checkbox"
                name="consent"
                required
                checked={values.consent}
                onChange={(e) => set("consent", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border bg-ink/40 accent-brand-orange"
              />
              <span>
                I agree to be contacted about my inquiry. Read our{" "}
                <a href="/privacy" className="text-brand-orange hover:underline">
                  privacy policy
                </a>
                .
              </span>
            </label>
            {fieldErrors.consent?.[0] ? (
              <p className="-mt-3 text-xs text-danger">{fieldErrors.consent[0]}</p>
            ) : null}

            {/* Honeypot — must stay uncontrolled & empty (bots fill it, humans don't). */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
            />

            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:cursor-wait disabled:opacity-70"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send message
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className={labelBase}>
        {label}
        {required ? <span className="ml-1 text-brand-orange">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
