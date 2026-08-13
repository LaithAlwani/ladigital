"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Trash2,
  Receipt,
  UserCheck,
  CheckCircle2,
  Circle,
  Loader2,
  GripVertical,
  Inbox,
} from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  PIPELINE_STAGES,
  STAGE_MAP,
  openPipelineValue,
  formatMoney,
  type DealStage,
} from "@ladigital/crm";
import { cn } from "@/lib/cn";
import { TextField, TextArea, inputBase, labelBase } from "./admin-fields";
import { toast } from "./toast";
import { useConfirm } from "./confirm-dialog";
import {
  createContact,
  createDeal,
  moveDeal,
  removeDeal,
  updateDeal,
  addActivity,
  addTask,
  toggleTask,
  removeTask,
  getDealDetail,
  promoteContactToClient,
  promoteContactToInvoice,
} from "@/app/actions/admin-crm";

type Deal = Doc<"deals">;
type Contact = Doc<"contacts">;

function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function CrmPipeline({
  initial,
}: {
  initial: { deals: Deal[]; contacts: Contact[] };
}) {
  const router = useRouter();
  const { contacts } = initial;

  // Local mirror of the deals so drag-and-drop feels instant; the server
  // refresh reconciles it. Reset whenever a fresh server payload arrives.
  const [deals, setDeals] = React.useState<Deal[]>(initial.deals);
  React.useEffect(() => setDeals(initial.deals), [initial.deals]);

  const contactById = React.useMemo(
    () => new Map(contacts.map((c) => [c._id, c])),
    [contacts],
  );
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<DealStage | null>(null);

  const openValue = openPipelineValue(deals);
  const wonValue = deals
    .filter((d) => d.stage === "won")
    .reduce((s, d) => s + (Number(d.value) || 0), 0);

  async function drop(toStage: DealStage) {
    const id = draggingId;
    setOverStage(null);
    setDraggingId(null);
    if (!id) return;
    const deal = deals.find((d) => d._id === id);
    if (!deal || deal.stage === toStage) return;
    // Optimistic move to the bottom of the target column.
    setDeals((prev) =>
      prev.map((d) => (d._id === id ? { ...d, stage: toStage, order: Number.MAX_SAFE_INTEGER } : d)),
    );
    try {
      await moveDeal(id, toStage);
    } catch {
      toast("Could not move the deal.", "error");
    } finally {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">Track leads from first hello to won — drag cards between stages.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatChip label="Open" value={formatMoney(openValue)} />
          <StatChip label="Won" value={formatMoney(wonValue)} accent />
          <NewContactButton onDone={() => router.refresh()} />
        </div>
      </div>

      {/* Board — horizontal scroll only. px/pt/pb give the card hover-lift and
          shadow room inside the scroll box (overflow-x also implies overflow-y:
          auto), and there's no negative margin bleeding past the container. */}
      <div className="scrollbar-thin flex gap-3 overflow-x-auto px-0.5 pt-1 pb-3">
        {PIPELINE_STAGES.map((stage) => {
          const col = deals
            .filter((d) => d.stage === stage.value)
            .sort((a, b) => a.order - b.order);
          const colValue = col.reduce((s, d) => s + (Number(d.value) || 0), 0);
          const isOver = overStage === stage.value;
          return (
            <section
              key={stage.value}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overStage !== stage.value) setOverStage(stage.value);
              }}
              onDragLeave={(e) => {
                // Only clear when leaving the column itself, not a child.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setOverStage((s) => (s === stage.value ? null : s));
                }
              }}
              onDrop={() => drop(stage.value)}
              className={cn(
                "flex w-68 shrink-0 flex-col rounded-2xl border transition-colors",
                isOver
                  ? "border-brand-orange/50 bg-brand-orange/5"
                  : "border-border/70 bg-ink-2/40",
              )}
            >
              <header className="flex items-center justify-between gap-2 px-3.5 pt-3.5 pb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", stage.dot)} />
                  <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-surface-2 px-1.5 text-[11px] font-medium text-muted">
                    {col.length}
                  </span>
                </div>
                {colValue > 0 ? (
                  <span className="text-xs font-medium tabular-nums text-muted-2">{formatMoney(colValue)}</span>
                ) : null}
              </header>

              <div className="flex min-h-20 flex-1 flex-col gap-2 p-2.5 pt-1">
                {col.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/70 py-6 text-center">
                    <Inbox className="h-4 w-4 text-muted-2" />
                    <span className="text-xs text-muted-2">Drop a deal here</span>
                  </div>
                ) : (
                  col.map((deal) => (
                    <DealCard
                      key={deal._id}
                      deal={deal}
                      contact={deal.contactId ? contactById.get(deal.contactId) : undefined}
                      dragging={draggingId === deal._id}
                      onOpen={() => setOpenId(deal._id)}
                      onDragStart={() => setDraggingId(deal._id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverStage(null);
                      }}
                    />
                  ))
                )}
                <AddDealInline
                  stage={stage.value}
                  contacts={contacts}
                  onDone={() => router.refresh()}
                />
              </div>
            </section>
          );
        })}
      </div>

      {openId ? (
        <DealDrawer
          dealId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border px-3.5 py-1.5",
        accent ? "border-success/25 bg-success/5" : "border-border bg-surface",
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-2">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", accent ? "text-success" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function DealCard({
  deal,
  contact,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  deal: Deal;
  contact?: Contact;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const label = contact ? contact.company || contact.name : "";
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", deal._id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-border bg-surface p-3 shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover",
        dragging && "opacity-40 ring-2 ring-brand-orange/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{deal.title}</p>
        {typeof deal.value === "number" && deal.value > 0 ? (
          <span className="shrink-0 rounded-md bg-brand-orange/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-brand-orange">
            {formatMoney(deal.value)}
          </span>
        ) : null}
      </div>

      {contact ? (
        <div className="mt-2.5 flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted">
            {initialsOf(label)}
          </span>
          <span className="truncate text-xs text-muted">{label}</span>
        </div>
      ) : (
        <div className="mt-2.5 text-xs text-muted-2">No contact</div>
      )}

      {/* Drag affordance */}
      <GripVertical className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-muted-2 opacity-0 transition-opacity group-hover:opacity-100" />
    </article>
  );
}

function AddDealInline({
  stage,
  contacts,
  onDone,
}: {
  stage: DealStage;
  contacts: Contact[];
  onDone: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [contactId, setContactId] = React.useState("");
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createDeal({
        title: title.trim(),
        stage,
        contactId: contactId || undefined,
        value: value ? Number(value) : undefined,
      });
      setTitle("");
      setContactId("");
      setValue("");
      setOpen(false);
      onDone();
    } catch {
      toast("Could not create the deal.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted-2 transition-colors hover:border-brand-orange/60 hover:bg-surface hover:text-brand-orange"
      >
        <Plus className="h-3.5 w-3.5" /> Add deal
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-2.5 shadow-sm">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Deal title"
        className={inputBase}
      />
      <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={inputBase}>
        <option value="">No contact</option>
        {contacts.map((c) => (
          <option key={c._id} value={c._id}>
            {c.company || c.name}
          </option>
        ))}
      </select>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Value"
        type="number"
        className={inputBase}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !title.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-orange-soft disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Add
        </button>
      </div>
    </div>
  );
}

function NewContactButton({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function reset() {
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
  }

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createContact({ name: name.trim(), company, email, phone, source: "manual" });
      reset();
      setOpen(false);
      onDone();
      toast("Contact added.", "success");
    } catch {
      toast("Could not add the contact.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
      >
        <Plus className="h-4 w-4" /> New contact
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-20 mt-2 flex w-80 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card-hover">
            <TextField label="Name" value={name} onChange={setName} />
            <TextField label="Company" value={company} onChange={setCompany} />
            <TextField label="Email" value={email} onChange={setEmail} type="email" />
            <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy || !name.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-orange-soft disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Add
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

type DealDetail = {
  deal: Deal;
  contact: Contact | null;
  activities: Doc<"activities">[];
  tasks: Doc<"tasks">[];
};

function DealDrawer({
  dealId,
  onClose,
  onChanged,
}: {
  dealId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [detail, setDetail] = React.useState<DealDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [value, setValue] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [note, setNote] = React.useState("");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [moving, setMoving] = React.useState(false);
  const [promoting, setPromoting] = React.useState(false);

  const load = React.useCallback(async () => {
    const d = (await getDealDetail(dealId)) as DealDetail | null;
    setDetail(d);
    if (d) {
      setTitle(d.deal.title);
      setValue(typeof d.deal.value === "number" ? String(d.deal.value) : "");
      setNotes(d.deal.notes ?? "");
    }
    setLoading(false);
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Close on Escape.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    try {
      await updateDeal(dealId, {
        title: title.trim(),
        value: value ? Number(value) : undefined,
        notes: notes.trim() || undefined,
      });
      onChanged();
      toast("Saved.", "success");
    } catch {
      toast("Could not save.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function moveTo(stage: DealStage) {
    if (!detail || detail.deal.stage === stage) return;
    setMoving(true);
    try {
      await moveDeal(dealId, stage);
      await load();
      onChanged();
    } catch {
      toast("Could not move the deal.", "error");
    } finally {
      setMoving(false);
    }
  }

  async function del() {
    const ok = await confirm({
      title: "Delete deal",
      message: "Delete this deal and its activity/tasks?",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await removeDeal(dealId);
    onChanged();
    onClose();
  }

  async function logNote() {
    if (!note.trim()) return;
    await addActivity({ dealId, contactId: detail?.contact?._id, type: "note", body: note.trim() });
    setNote("");
    await load();
  }

  async function newTask() {
    if (!taskTitle.trim()) return;
    await addTask({ title: taskTitle.trim(), dealId, contactId: detail?.contact?._id });
    setTaskTitle("");
    await load();
  }

  async function promote(withInvoice: boolean) {
    if (!detail?.contact) {
      toast("Link a contact to promote this deal.", "error");
      return;
    }
    setPromoting(true);
    try {
      if (withInvoice) {
        const invoiceId = await promoteContactToInvoice(detail.contact._id);
        router.push(`/admin/invoices/${invoiceId}`);
      } else {
        await promoteContactToClient(detail.contact._id);
        toast("Saved to clients.", "success");
      }
    } catch {
      toast("Could not promote.", "error");
    } finally {
      setPromoting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-card-hover">
        {/* Sticky header */}
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Deal</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-2 transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-2" />
          </div>
        ) : !detail ? (
          <p className="p-6 text-sm text-muted">Deal not found.</p>
        ) : (
          <div className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto p-6">
            {/* Stage switcher */}
            <div className="flex flex-col gap-2">
              <label className={labelBase}>Stage</label>
              <div className="flex flex-wrap gap-1.5">
                {PIPELINE_STAGES.map((s) => {
                  const active = detail.deal.stage === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      disabled={moving}
                      onClick={() => moveTo(s.value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
                        active
                          ? s.badge
                          : "border-border text-muted hover:border-border-strong hover:text-foreground",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", active ? s.dot : "bg-muted-2/50")} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <TextField label="Title" value={title} onChange={setTitle} />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelBase}>Value</label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  type="number"
                  className={inputBase}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelBase}>Contact</label>
                <div className="flex h-[42px] items-center gap-2 px-1 text-sm text-foreground">
                  {detail.contact ? (
                    <>
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted">
                        {initialsOf(detail.contact.company || detail.contact.name)}
                      </span>
                      <span className="truncate">{detail.contact.company || detail.contact.name}</span>
                    </>
                  ) : (
                    <span className="text-muted-2">—</span>
                  )}
                </div>
              </div>
            </div>
            <TextArea label="Notes" value={notes} onChange={setNotes} rows={2} />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-orange px-4 text-sm font-medium text-white hover:bg-brand-orange-soft disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes
              </button>
              <button
                type="button"
                onClick={del}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium text-muted transition-colors hover:border-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>

            {/* Promote */}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface-2/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Promote</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => promote(false)}
                  disabled={promoting || !detail.contact}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:border-brand-orange/50 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" /> To client
                </button>
                <button
                  type="button"
                  onClick={() => promote(true)}
                  disabled={promoting || !detail.contact}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-orange px-3 text-sm font-semibold text-white hover:bg-brand-orange-soft disabled:opacity-50"
                >
                  {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  New invoice
                </button>
              </div>
              {!detail.contact ? (
                <p className="text-xs text-muted-2">Link a contact to enable promotion.</p>
              ) : null}
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tasks</p>
              {detail.tasks.length === 0 ? (
                <p className="text-xs text-muted-2">No tasks yet.</p>
              ) : (
                detail.tasks.map((t) => (
                  <div key={t._id} className="group flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleTask(t._id, !t.done);
                        await load();
                      }}
                      className="text-muted-2 transition-colors hover:text-foreground"
                    >
                      {t.done ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <span className={t.done ? "flex-1 text-muted-2 line-through" : "flex-1 text-foreground"}>
                      {t.title}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await removeTask(t._id);
                        await load();
                      }}
                      className="text-muted-2 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newTask()}
                placeholder="Add a task and press Enter…"
                className={inputBase}
              />
            </div>

            {/* Activity */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Activity</p>
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && logNote()}
                  placeholder="Log a note…"
                  className={inputBase}
                />
                <button
                  type="button"
                  onClick={logNote}
                  className="inline-flex h-[42px] shrink-0 items-center rounded-lg border border-border-strong px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                >
                  Log
                </button>
              </div>
              {detail.activities.length === 0 ? (
                <p className="text-xs text-muted-2">No activity yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {detail.activities.map((a) => (
                    <li key={a._id} className="rounded-lg border border-border bg-surface-2/60 px-3 py-2">
                      <p className="text-sm text-foreground">{a.body}</p>
                      <span className="mt-0.5 inline-block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-2">
                        {a.type.replace("-", " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
