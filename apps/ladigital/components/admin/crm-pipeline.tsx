"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Receipt,
  UserCheck,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  PIPELINE_STAGES,
  STAGE_MAP,
  adjacentStage,
  openPipelineValue,
  formatMoney,
  type DealStage,
} from "@ladigital/crm";
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

export function CrmPipeline({
  initial,
}: {
  initial: { deals: Deal[]; contacts: Contact[] };
}) {
  const router = useRouter();
  const { deals, contacts } = initial;
  const contactById = React.useMemo(
    () => new Map(contacts.map((c) => [c._id, c])),
    [contacts],
  );
  const [openId, setOpenId] = React.useState<string | null>(null);
  const forecast = openPipelineValue(deals);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">
            Leads and deals through the funnel · {formatMoney(forecast)} open
          </p>
        </div>
        <NewContactButton onDone={() => router.refresh()} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {PIPELINE_STAGES.map((stage) => {
          const col = deals
            .filter((d) => d.stage === stage.value)
            .sort((a, b) => a.order - b.order);
          return (
            <div key={stage.value} className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                <span className="text-xs text-muted-2">{col.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {col.map((deal) => (
                  <DealCard
                    key={deal._id}
                    deal={deal}
                    contact={deal.contactId ? contactById.get(deal.contactId) : undefined}
                    onOpen={() => setOpenId(deal._id)}
                    onMoved={() => router.refresh()}
                  />
                ))}
                <AddDealInline
                  stage={stage.value}
                  contacts={contacts}
                  onDone={() => router.refresh()}
                />
              </div>
            </div>
          );
        })}
      </div>

      {openId ? (
        <DealDrawer
          dealId={openId}
          contacts={contacts}
          onClose={() => setOpenId(null)}
          onChanged={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}

function DealCard({
  deal,
  contact,
  onOpen,
  onMoved,
}: {
  deal: Deal;
  contact?: Contact;
  onOpen: () => void;
  onMoved: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const left = adjacentStage(deal.stage, -1);
  const right = adjacentStage(deal.stage, 1);

  async function move(stage: DealStage) {
    setBusy(true);
    try {
      await moveDeal(deal._id, stage);
      onMoved();
    } catch {
      toast("Could not move the deal.", "error");
      setBusy(false);
    }
  }

  return (
    <div className="group rounded-lg border border-border bg-surface p-3 shadow-card transition-colors hover:border-border-strong">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <p className="text-sm font-medium text-foreground">{deal.title}</p>
        {contact ? (
          <p className="mt-0.5 text-xs text-muted">{contact.company || contact.name}</p>
        ) : null}
        {typeof deal.value === "number" && deal.value > 0 ? (
          <p className="mt-1 text-xs font-semibold text-foreground">{formatMoney(deal.value)}</p>
        ) : null}
      </button>
      <div className="mt-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          disabled={!left || busy}
          onClick={() => left && move(left)}
          aria-label="Move left"
          className="grid h-6 w-6 place-items-center rounded text-muted-2 transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-2" /> : null}
        <button
          type="button"
          disabled={!right || busy}
          onClick={() => right && move(right)}
          aria-label="Move right"
          className="grid h-6 w-6 place-items-center rounded text-muted-2 transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
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
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-brand-orange hover:text-brand-orange"
      >
        <Plus className="h-3.5 w-3.5" /> Add deal
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Deal title"
        className={inputBase}
      />
      <select
        value={contactId}
        onChange={(e) => setContactId(e.target.value)}
        className={inputBase}
      >
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
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createContact({ name: name.trim(), company, email, source: "manual" });
      setName("");
      setCompany("");
      setEmail("");
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
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow"
      >
        <Plus className="h-4 w-4" /> New contact
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 flex w-72 flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-card-hover">
          <TextField label="Name" value={name} onChange={setName} />
          <TextField label="Company" value={company} onChange={setCompany} />
          <TextField label="Email" value={email} onChange={setEmail} type="email" />
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
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-orange-soft disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Add
            </button>
          </div>
        </div>
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
  contacts,
  onClose,
  onChanged,
}: {
  dealId: string;
  contacts: Contact[];
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
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface p-6 shadow-card-hover">
        <div className="flex items-start justify-between gap-4">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
              detail ? STAGE_MAP[detail.deal.stage].badge : "border-border text-muted"
            }`}
          >
            {detail ? STAGE_MAP[detail.deal.stage].label : "…"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-2 hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid flex-1 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-2" />
          </div>
        ) : !detail ? (
          <p className="mt-6 text-sm text-muted">Deal not found.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
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
                <div className="flex h-[42px] items-center px-1 text-sm text-foreground">
                  {detail.contact ? detail.contact.company || detail.contact.name : "—"}
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
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
              </button>
              <button
                type="button"
                onClick={del}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium text-muted hover:border-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>

            {/* Promote */}
            <div className="flex flex-col gap-2 rounded-card border border-border bg-surface-2 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Promote</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => promote(false)}
                  disabled={promoting || !detail.contact}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
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
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Tasks</p>
              {detail.tasks.map((t) => (
                <div key={t._id} className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={async () => {
                      await toggleTask(t._id, !t.done);
                      await load();
                    }}
                    className="text-muted-2 hover:text-foreground"
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
                    className="text-muted-2 hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newTask()}
                  placeholder="Add a task…"
                  className={inputBase}
                />
              </div>
            </div>

            {/* Activity */}
            <div className="flex flex-col gap-2">
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
                  className="inline-flex h-[42px] items-center rounded-lg border border-border-strong px-3 text-sm font-medium text-foreground hover:bg-surface-2"
                >
                  Log
                </button>
              </div>
              <ul className="flex flex-col gap-2">
                {detail.activities.map((a) => (
                  <li key={a._id} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                    <span className="text-foreground">{a.body}</span>
                    <span className="ml-2 text-xs text-muted-2">{a.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
