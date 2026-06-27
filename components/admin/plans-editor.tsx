"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, Check } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { savePlans } from "@/app/actions/admin-plans";
import {
  TextField,
  NumberField,
  TextArea,
  Toggle,
  AdminPageHeader,
  inputBase,
  labelBase,
} from "./admin-fields";
import { cn } from "@/lib/cn";

type Unit = "one-time" | "per-month" | "per-project";

type PlanRow = {
  categoryId: string;
  slug: string;
  name: string;
  tagline?: string;
  price: number;
  unit?: Unit;
  setupFee?: number;
  setupWaivedAnnual?: boolean;
  features: string[];
  notes?: string[];
  highlight?: boolean;
  order: number;
};

type PlanForm = {
  slug?: string;
  name: string;
  tagline: string;
  price: number;
  unit: Unit;
  setupFee: number;
  setupWaivedAnnual: boolean;
  features: string;
  notes: string;
  highlight: boolean;
};

function toForm(p: {
  id?: string;
  slug?: string;
  name: string;
  tagline?: string;
  price: number;
  unit?: Unit;
  setupFee?: number;
  setupWaivedAnnual?: boolean;
  features?: string[];
  notes?: string[];
  highlight?: boolean;
}): PlanForm {
  return {
    slug: p.slug ?? p.id,
    name: p.name,
    tagline: p.tagline ?? "",
    price: p.price,
    unit: (p.unit ?? "per-month") as Unit,
    setupFee: p.setupFee ?? 0,
    setupWaivedAnnual: !!p.setupWaivedAnnual,
    features: (p.features ?? []).join("\n"),
    notes: (p.notes ?? []).join("\n"),
    highlight: !!p.highlight,
  };
}

const emptyPlan = (): PlanForm => ({
  name: "New plan",
  tagline: "",
  price: 0,
  unit: "per-month",
  setupFee: 0,
  setupWaivedAnnual: false,
  features: "",
  notes: "",
  highlight: false,
});

export function PlansEditor({ plans }: { plans: PlanRow[] }) {
  const router = useRouter();

  const [byCat, setByCat] = React.useState<Record<string, PlanForm[]>>(() => {
    const init: Record<string, PlanForm[]> = {};
    for (const cat of siteConfig.services) {
      const rows = plans
        .filter((r) => r.categoryId === cat.id)
        .sort((a, b) => a.order - b.order);
      const source = rows.length
        ? rows.map((r) => toForm({ ...r, slug: r.slug }))
        : cat.packages.filter((p) => !p.options).map(toForm);
      init[cat.id] = source;
    }
    return init;
  });

  const [savingCat, setSavingCat] = React.useState<string | null>(null);
  const [savedCat, setSavedCat] = React.useState<string | null>(null);

  function update(catId: string, i: number, patch: Partial<PlanForm>) {
    setByCat((prev) => ({
      ...prev,
      [catId]: prev[catId].map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  }
  function add(catId: string) {
    setByCat((prev) => ({ ...prev, [catId]: [...prev[catId], emptyPlan()] }));
  }
  function remove(catId: string, i: number) {
    setByCat((prev) => ({ ...prev, [catId]: prev[catId].filter((_, idx) => idx !== i) }));
  }
  function move(catId: string, i: number, dir: -1 | 1) {
    const arr = [...byCat[catId]];
    const t = i + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[i], arr[t]] = [arr[t], arr[i]];
    setByCat((prev) => ({ ...prev, [catId]: arr }));
  }

  async function saveCategory(catId: string) {
    setSavingCat(catId);
    setSavedCat(null);
    try {
      const payload = byCat[catId].map((f) => ({
        slug: f.slug,
        name: f.name,
        tagline: f.tagline || undefined,
        price: Number(f.price) || 0,
        unit: f.unit,
        setupFee: f.setupFee > 0 ? f.setupFee : undefined,
        setupWaivedAnnual: f.setupWaivedAnnual,
        features: f.features
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        notes:
          f.notes
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean).length > 0
            ? f.notes
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        highlight: f.highlight,
      }));
      await savePlans(catId, payload);
      setSavedCat(catId);
      router.refresh();
      setTimeout(() => setSavedCat(null), 2500);
    } catch (err) {
      console.error(err);
      alert("Could not save plans. Please try again.");
    } finally {
      setSavingCat(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Plans"
        description="Add, edit, reorder, or remove the plans in each category. Prices update on the site live."
      />

      {siteConfig.services.map((cat) => {
        const forms = byCat[cat.id] ?? [];
        const saving = savingCat === cat.id;
        const saved = savedCat === cat.id;
        return (
          <div key={cat.id} className="flex flex-col gap-4 rounded-card border border-border bg-surface/40 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-foreground">{cat.name}</h2>
              <button
                type="button"
                onClick={() => saveCategory(cat.id)}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-orange px-4 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : null}
                {saved ? "Saved" : "Save"}
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {forms.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-ink/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-2">
                      Plan {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(cat.id, i, -1)}
                        disabled={i === 0}
                        className="grid h-7 w-7 place-items-center rounded text-muted-2 hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(cat.id, i, 1)}
                        disabled={i === forms.length - 1}
                        className="grid h-7 w-7 place-items-center rounded text-muted-2 hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(cat.id, i)}
                        className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField label="Name" value={f.name} onChange={(v) => update(cat.id, i, { name: v })} />
                    <TextField
                      label="Tagline"
                      value={f.tagline}
                      onChange={(v) => update(cat.id, i, { tagline: v })}
                    />
                    <NumberField
                      label="Price"
                      value={f.price}
                      onChange={(v) => update(cat.id, i, { price: v })}
                      min={0}
                      suffix="CAD"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className={labelBase}>Billing</label>
                      <select
                        value={f.unit}
                        onChange={(e) => update(cat.id, i, { unit: e.target.value as Unit })}
                        className={inputBase}
                      >
                        <option value="per-month">per month</option>
                        <option value="one-time">one-time</option>
                        <option value="per-project">per project</option>
                      </select>
                    </div>
                    <NumberField
                      label="Setup fee (0 = none)"
                      value={f.setupFee}
                      onChange={(v) => update(cat.id, i, { setupFee: v })}
                      min={0}
                      suffix="CAD"
                    />
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 pb-1">
                      <Toggle
                        label="Most popular"
                        checked={f.highlight}
                        onChange={(v) => update(cat.id, i, { highlight: v })}
                      />
                      <Toggle
                        label="Setup waived with annual"
                        checked={f.setupWaivedAnnual}
                        onChange={(v) => update(cat.id, i, { setupWaivedAnnual: v })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <TextArea
                      label="Features (one per line)"
                      value={f.features}
                      onChange={(v) => update(cat.id, i, { features: v })}
                      rows={6}
                    />
                    <TextArea
                      label="Notes (one per line)"
                      value={f.notes}
                      onChange={(v) => update(cat.id, i, { notes: v })}
                      rows={6}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => add(cat.id)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-brand-orange/50 hover:text-brand-orange"
              >
                <Plus className="h-4 w-4" />
                Add a plan to {cat.name}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
