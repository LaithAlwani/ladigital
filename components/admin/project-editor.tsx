"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Trash2,
  ArrowLeftRight,
  Upload,
  Loader2,
  Save,
  ImageIcon,
  ExternalLink,
  Globe,
  EyeOff,
} from "lucide-react";
import type { ResolvedProject } from "@/convex/projects";
import { PROJECT_STATUSES, STATUS_MAP, type ProjectStatus } from "@/lib/project-status";
import {
  getProjectUploadUrl,
  setProjectImages,
  setProjectPublished,
  updateProject,
} from "@/app/actions/admin-projects";
import { cn } from "@/lib/cn";

const inputBase =
  "w-full rounded-lg border border-border bg-ink/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-2 transition-colors focus:border-brand-orange focus:bg-ink/60 focus:outline-none";
const labelBase = "text-xs font-medium uppercase tracking-[0.14em] text-muted";

type LocalImage = { storageId: string; alt?: string; url: string | null };

export function ProjectEditor({ project }: { project: ResolvedProject }) {
  const router = useRouter();

  const [title, setTitle] = React.useState(project.title);
  const [subtitle, setSubtitle] = React.useState(project.subtitle ?? "");
  const [description, setDescription] = React.useState(project.description);
  const [url, setUrl] = React.useState(project.url ?? "");
  const [status, setStatus] = React.useState<ProjectStatus>(project.status);

  const [images, setImages] = React.useState<LocalImage[]>(project.images);
  const [coverIndex, setCoverIndex] = React.useState(project.coverIndex);

  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  async function togglePublish() {
    setPublishing(true);
    try {
      await setProjectPublished(project._id, !project.published);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Could not update publish state. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  // After a server refresh, re-sync images (real resolved URLs replace any
  // optimistic object URLs). Keyed on the set of storage ids so it doesn't
  // clobber in-flight edits unnecessarily.
  const imgSig = project.images.map((i) => i.storageId).join(",");
  React.useEffect(() => {
    setImages(project.images);
    setCoverIndex(project.coverIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSig]);

  async function persistImages(next: LocalImage[], cover: number) {
    await setProjectImages(
      project._id,
      next.map((i) => ({ storageId: i.storageId, alt: i.alt })),
      cover,
    );
    router.refresh();
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const added: LocalImage[] = [];
      for (const file of Array.from(files)) {
        const uploadUrl = await getProjectUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { storageId } = (await res.json()) as { storageId: string };
        added.push({ storageId, alt: "", url: URL.createObjectURL(file) });
      }
      const next = [...images, ...added];
      setImages(next);
      await persistImages(next, coverIndex);
    } catch (err) {
      console.error(err);
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    let cover = coverIndex;
    if (index === coverIndex) cover = 0;
    else if (index < coverIndex) cover = Math.max(0, coverIndex - 1);
    setImages(next);
    setCoverIndex(cover);
    await persistImages(next, cover);
  }

  async function makeCover(index: number) {
    setCoverIndex(index);
    await persistImages(images, index);
  }

  async function moveImage(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    let cover = coverIndex;
    if (coverIndex === index) cover = target;
    else if (coverIndex === target) cover = index;
    setImages(next);
    setCoverIndex(cover);
    await persistImages(next, cover);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await updateProject({ id: project._id, title, subtitle, description, url, status });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const statusMeta = STATUS_MAP[status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {project.published ? (
            <Link
              href={`/work/${project.slug}`}
              target="_blank"
              className="hidden items-center gap-1.5 text-sm text-muted hover:text-brand-orange sm:inline-flex"
            >
              View <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={togglePublish}
            disabled={publishing}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors disabled:opacity-60",
              project.published
                ? "border-border-strong text-foreground hover:border-danger hover:text-danger"
                : "border-success/40 bg-success/10 text-success hover:bg-success/20",
            )}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : project.published ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {project.published ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Details */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className={labelBase}>
              Title
            </label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputBase} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="subtitle" className={labelBase}>
              Subtitle
            </label>
            <input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Brand site · Next.js · 2025"
              className={inputBase}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className={labelBase}>
              Description
            </label>
            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was the project, what did you build, what was the outcome?"
              className={cn(inputBase, "resize-y")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className={labelBase}>
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={inputBase}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="url" className={labelBase}>
                Live URL
              </label>
              <input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={inputBase}
              />
              <p className="text-[11px] text-muted-2">
                {statusMeta.showsLink
                  ? "Shown as a clickable link on the site."
                  : `Hidden on the site while status is “${statusMeta.label}”.`}
              </p>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className={labelBase}>Images</span>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>

          {images.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-40 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border bg-surface/30 text-sm text-muted hover:border-brand-orange/50"
            >
              <ImageIcon className="h-6 w-6 text-muted-2" />
              Add images
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <div
                  key={img.storageId}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border bg-ink",
                    i === coverIndex ? "border-brand-orange" : "border-border",
                  )}
                >
                  <div className="aspect-[4/3]">
                    {img.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  {i === coverIndex ? (
                    <span className="absolute left-1.5 top-1.5 rounded-pill bg-brand-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                      Cover
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-linear-to-t from-ink/90 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconBtn title="Set as cover" onClick={() => makeCover(i)}>
                      <Star className={cn("h-3.5 w-3.5", i === coverIndex && "fill-current")} />
                    </IconBtn>
                    <IconBtn title="Move" onClick={() => moveImage(i, -1)}>
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn title="Remove" danger onClick={() => removeImage(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-2">
            The cover is used on cards. Hover an image to set cover, reorder, or remove. Changes save
            automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md bg-surface-2/90 text-foreground transition-colors hover:bg-surface-2",
        danger && "hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}
