"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Check, Loader2, Users } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  createClient,
  updateClient,
  removeClient,
} from "@/app/actions/admin-clients";
import { TextField, TextArea, inputBase, labelBase } from "./admin-fields";
import { useConfirm } from "./confirm-dialog";

type Client = Doc<"clients">;

export function ClientsAdmin({ initial }: { initial: Client[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function addClient() {
    startTransition(async () => {
      await createClient({ name: "New client" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Clients</h1>
          <p className="mt-1 text-sm text-muted">Saved client details, reusable on invoices.</p>
        </div>
        <button
          type="button"
          onClick={addClient}
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New client
        </button>
      </div>

      {initial.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-surface/30 p-10 text-center">
          <Users className="h-7 w-7 text-muted-2" />
          <p className="text-sm text-muted">No clients yet. Add one, or save a client from an invoice.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {initial.map((c) => (
            <ClientCard key={c._id} client={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: Client }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [company, setCompany] = React.useState(client.company ?? "");
  const [name, setName] = React.useState(client.name);
  const [email, setEmail] = React.useState(client.email ?? "");
  const [phone, setPhone] = React.useState(client.phone ?? "");
  const [address, setAddress] = React.useState(client.address ?? "");
  const [notes, setNotes] = React.useState(client.notes ?? "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await updateClient(client._id, { name, company, email, phone, address, notes });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Could not save the client.");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    const ok = await confirm({
      title: "Delete client",
      message: `Delete ${company || name || "this client"}? This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await removeClient(client._id);
      router.refresh();
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface/40 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Company" value={company} onChange={setCompany} />
        <TextField label="Contact name" value={name} onChange={setName} />
        <TextField label="Email" value={email} onChange={setEmail} type="email" />
        <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelBase}>Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputBase} />
      </div>
      <TextArea label="Notes" value={notes} onChange={setNotes} rows={2} />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={del}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-orange px-5 text-sm font-medium text-white transition-all hover:bg-brand-orange-soft hover:shadow-glow disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
