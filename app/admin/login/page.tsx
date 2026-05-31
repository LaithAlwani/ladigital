"use client";

import { useActionState } from "react";
import { Loader2, Lock } from "lucide-react";
import { signInAdmin } from "@/app/actions/admin-auth";
import { INITIAL_ADMIN_LOGIN_STATE } from "@/lib/admin-types";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(signInAdmin, INITIAL_ADMIN_LOGIN_STATE);

  return (
    <section className="grid min-h-[100svh] place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-orange/15 text-brand-orange">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Admin</h1>
            <p className="mt-1 text-sm text-muted">Sign in to manage your site.</p>
          </div>
        </div>

        <form
          action={formAction}
          className="flex flex-col gap-4 rounded-card border border-border bg-surface/40 p-6"
        >
          {state.status === "error" ? (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger"
            >
              {state.message}
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-ink/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-2 transition-colors focus:border-brand-orange focus:bg-ink/60 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-orange px-6 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
