"use client";

import * as React from "react";
import Link from "next/link";
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
  Search,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { STAGE_MAP, formatMoney } from "@ladigital/crm";
import { cn } from "@/lib/cn";
import { TextField, TextArea, inputBase, labelBase } from "./admin-fields";
import { toast } from "./toast";
import { useConfirm } from "./confirm-dialog";
import {
  createContact,
  updateContact,
  removeContact,
  getContactDetail,
  addActivity,
  addTask,
  toggleTask,
  removeTask,
  promoteContactToClient,
  promoteContactToInvoice,
} from "@/app/actions/admin-crm";

type Contact = Doc<"contacts">;
type Deal = Doc<"deals">;

function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function CrmContacts({ contacts, deals }: { contacts: Contact[]; deals: Deal[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const dealCount = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of deals) if (d.contactId) m.set(d.contactId, (m.get(d.contactId) ?? 0) + 1);
    return m;
  }, [deals]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.company, c.email, c.phone].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [contacts, query]);

  async function addContact() {
    setAdding(true);
    try {
      const id = await createContact({ name: "New contact", source: "manual" });
      router.refresh();
      setOpenId(id);
    } catch {
      toast("Could not add the contact.", "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className={cn(inputBase, "pl-9")}
          />
        </div>
        <button
          type="button"
          onClick={addContact}
          disabled={adding}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New contact
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/30 p-12 text-center">
          <Users className="h-7 w-7 text-muted-2" />
          <p className="text-sm text-muted">
            {query ? "No contacts match your search." : "No contacts yet. Add one, or capture leads from the site."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {filtered.map((c) => {
              const label = c.company || c.name;
              const n = dealCount.get(c._id) ?? 0;
              return (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c._id)}
                    className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-surface-2/60"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
                      {initialsOf(label)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.name}
                        {c.company ? <span className="text-muted"> · {c.company}</span> : null}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-2">
                        {c.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {c.email}
                          </span>
                        ) : null}
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {c.source ? (
                      <span className="hidden shrink-0 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2 sm:inline">
                        {c.source}
                      </span>
                    ) : null}
                    {n > 0 ? (
                      <span className="shrink-0 rounded-md bg-brand-orange/10 px-1.5 py-0.5 text-[11px] font-semibold text-brand-orange">
                        {n} deal{n > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {openId ? (
        <ContactDrawer contactId={openId} onClose={() => setOpenId(null)} onChanged={() => router.refresh()} />
      ) : null}
    </div>
  );
}

type ContactDetail = {
  contact: Contact;
  deals: Deal[];
  activities: Doc<"activities">[];
  tasks: Doc<"tasks">[];
};

function ContactDrawer({
  contactId,
  onClose,
  onChanged,
}: {
  contactId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [detail, setDetail] = React.useState<ContactDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [note, setNote] = React.useState("");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [promoting, setPromoting] = React.useState(false);

  const load = React.useCallback(async () => {
    const d = (await getContactDetail(contactId)) as ContactDetail | null;
    setDetail(d);
    if (d) {
      setName(d.contact.name);
      setCompany(d.contact.company ?? "");
      setEmail(d.contact.email ?? "");
      setPhone(d.contact.phone ?? "");
      setNotes(d.contact.notes ?? "");
    }
    setLoading(false);
  }, [contactId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    try {
      await updateContact(contactId, {
        name: name.trim() || "Unnamed",
        company,
        email,
        phone,
        notes,
      });
      onChanged();
      toast("Saved.", "success");
    } catch {
      toast("Could not save.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    const ok = await confirm({
      title: "Delete contact",
      message: "Delete this contact? Their deals stay in the pipeline but get unlinked.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await removeContact(contactId);
    onChanged();
    onClose();
  }

  async function logNote() {
    if (!note.trim()) return;
    await addActivity({ contactId, type: "note", body: note.trim() });
    setNote("");
    await load();
  }

  async function newTask() {
    if (!taskTitle.trim()) return;
    await addTask({ title: taskTitle.trim(), contactId });
    setTaskTitle("");
    await load();
  }

  async function promote(withInvoice: boolean) {
    setPromoting(true);
    try {
      if (withInvoice) {
        const invoiceId = await promoteContactToInvoice(contactId);
        router.push(`/admin/invoices/${invoiceId}`);
      } else {
        await promoteContactToClient(contactId);
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
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-foreground">Contact</h2>
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
          <p className="p-6 text-sm text-muted">Contact not found.</p>
        ) : (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Name" value={name} onChange={setName} />
              <TextField label="Company" value={company} onChange={setCompany} />
              <TextField label="Email" value={email} onChange={setEmail} type="email" />
              <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
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
                  disabled={promoting}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:border-brand-orange/50 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" /> To client
                </button>
                <button
                  type="button"
                  onClick={() => promote(true)}
                  disabled={promoting}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-orange px-3 text-sm font-semibold text-white hover:bg-brand-orange-soft disabled:opacity-50"
                >
                  {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                  New invoice
                </button>
              </div>
            </div>

            {/* Deals */}
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Deals</p>
              {detail.deals.length === 0 ? (
                <p className="text-xs text-muted-2">
                  No deals yet — add one from the{" "}
                  <Link href="/admin/crm" className="text-brand-orange hover:underline">
                    Pipeline
                  </Link>
                  .
                </p>
              ) : (
                detail.deals.map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <span className="truncate text-sm text-foreground">{d.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {typeof d.value === "number" && d.value > 0 ? (
                        <span className="text-xs font-semibold tabular-nums text-muted">{formatMoney(d.value)}</span>
                      ) : null}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          STAGE_MAP[d.stage].badge,
                        )}
                      >
                        {STAGE_MAP[d.stage].label}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
                      {t.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
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
