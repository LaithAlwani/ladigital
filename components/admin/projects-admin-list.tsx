"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
  ImageOff,
  Link2,
} from "lucide-react";
import type { ResolvedProject } from "@/convex/projects";
import { STATUS_MAP } from "@/lib/project-status";
import {
  createProject,
  importProjectFromUrl,
  removeProject,
  reorderProjects,
  setProjectPublished,
} from "@/app/actions/admin-projects";
import { cn } from "@/lib/cn";

export function ProjectsAdminList({ initial }: { initial: ResolvedProject[] }) {
  const router = useRouter();
  const [items, setItems] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [showImport, setShowImport] = React.useState(false);
  const [importUrl, setImportUrl] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);

  React.useEffect(() => setItems(initial), [initial]);

  function newProject() {
    startTransition(async () => {
      const id = await createProject();
      router.push(`/admin/projects/${id}`);
    });
  }

  function runImport() {
    const url = importUrl.trim();
    if (!url || importing) return;
    setImporting(true);
    setImportError(null);
    startTransition(async () => {
      const res = await importProjectFromUrl(url);
      setImporting(false);
      if (res.id) {
        router.push(`/admin/projects/${res.id}`);
      } else {
        setImportError(res.error ?? "Import failed.");
      }
    });
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    startTransition(async () => {
      await reorderProjects(next.map((p) => p._id));
      router.refresh();
    });
  }

  function togglePublish(p: ResolvedProject) {
    setBusyId(p._id);
    startTransition(async () => {
      await setProjectPublished(p._id, !p.published);
      setBusyId(null);
      router.refresh();
    });
  }

  function remove(p: ResolvedProject) {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    setBusyId(p._id);
    startTransition(async () => {
      await removeProject(p._id);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted">Showcase the work you've done.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowImport((v) => !v);
              setImportError(null);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
          >
            <Link2 className="h-4 w-4" />
            Import from URL
          </button>
          <button
            type="button"
            onClick={newProject}
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
          >
            {pending && !importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New project
          </button>
        </div>
      </div>

      {showImport ? (
        <div className="flex flex-col gap-2 rounded-card border border-border bg-surface/40 p-4">
          <p className="text-xs text-muted">
            Paste a site URL — we'll create a draft using its preview image, title, and description.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runImport()}
              placeholder="https://example.com"
              className="h-11 min-w-60 flex-1 rounded-lg border border-border bg-ink/40 px-3.5 text-sm text-foreground placeholder:text-muted-2 focus:border-brand-orange focus:outline-none"
            />
            <button
              type="button"
              onClick={runImport}
              disabled={!importUrl.trim() || importing}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Import
            </button>
          </div>
          {importError ? <p className="text-xs text-danger">{importError}</p> : null}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface/30 p-10 text-center text-sm text-muted">
          No projects yet. Create your first one to show it on the site.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((p, i) => {
            const status = STATUS_MAP[p.status];
            const busy = busyId === p._id;
            return (
              <div
                key={p._id}
                className="flex items-center gap-4 rounded-card border border-border bg-surface/40 p-3 pr-4"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || pending}
                    className="grid h-5 w-5 place-items-center rounded text-muted-2 hover:text-foreground disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1 || pending}
                    className="grid h-5 w-5 place-items-center rounded text-muted-2 hover:text-foreground disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-ink">
                  {p.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-2">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{p.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[11px] font-medium",
                        status.badge,
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                      {status.short}
                    </span>
                    {!p.published ? (
                      <span className="rounded-pill border border-border bg-ink/40 px-2 py-0.5 text-[11px] text-muted-2">
                        Draft
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => togglePublish(p)}
                    disabled={busy}
                    title={p.published ? "Unpublish" : "Publish"}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : p.published ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <Link
                    href={`/admin/projects/${p._id}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={busy}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
