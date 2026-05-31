"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Loader2 } from "lucide-react";
import type { Rules } from "@/convex/availability";
import { saveAvailability, addBlackout, removeBlackout } from "@/app/actions/admin-settings";
import {
  TextField,
  NumberField,
  Toggle,
  Card,
  AdminPageHeader,
  SaveButton,
  inputBase,
  labelBase,
} from "./admin-fields";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Blackout = { _id: string; startDate: string; endDate: string; reason?: string };

type DayRow = { weekday: number; enabled: boolean; start: string; end: string };

export function AvailabilityEditor({
  rules,
  blackouts,
}: {
  rules: Rules;
  blackouts: Blackout[];
}) {
  const router = useRouter();

  const [days, setDays] = React.useState<DayRow[]>(() =>
    Array.from({ length: 7 }, (_, wd) => {
      const w = rules.weeklyHours.find((x) => x.weekday === wd);
      return { weekday: wd, enabled: !!w, start: w?.start ?? "09:00", end: w?.end ?? "16:00" };
    }),
  );
  const [slotMinutes, setSlotMinutes] = React.useState(rules.slotMinutes);
  const [durationMinutes, setDurationMinutes] = React.useState(rules.durationMinutes);
  const [bufferAfter, setBufferAfter] = React.useState(rules.bufferAfter);
  const [minNoticeHours, setMinNoticeHours] = React.useState(rules.minNoticeHours);
  const [maxAdvanceDays, setMaxAdvanceDays] = React.useState(rules.maxAdvanceDays);
  const [meetingTitle, setMeetingTitle] = React.useState(rules.meetingTitle);
  const [timezone, setTimezone] = React.useState(rules.timezone);

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Blackout add form
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function setDay(wd: number, patch: Partial<DayRow>) {
    setDays((prev) => prev.map((d) => (d.weekday === wd ? { ...d, ...patch } : d)));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await saveAvailability({
        timezone,
        weeklyHours: days
          .filter((d) => d.enabled)
          .map((d) => ({ weekday: d.weekday, start: d.start, end: d.end })),
        slotMinutes,
        durationMinutes,
        bufferBefore: 0,
        bufferAfter,
        minNoticeHours,
        maxAdvanceDays,
        meetingTitle,
      });
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

  function addBlackoutRange() {
    if (!from) return;
    const end = to || from;
    startTransition(async () => {
      await addBlackout(from, end, reason);
      setFrom("");
      setTo("");
      setReason("");
      router.refresh();
    });
  }

  function deleteBlackout(id: string) {
    startTransition(async () => {
      await removeBlackout(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Availability"
        description="Set your bookable hours, slot length, and days off."
        action={<SaveButton saving={saving} saved={saved} onClick={save} />}
      />

      <Card title="Weekly hours">
        <div className="flex flex-col gap-2">
          {days.map((d) => (
            <div key={d.weekday} className="flex flex-wrap items-center gap-3">
              <div className="w-32">
                <Toggle
                  label={DAY_NAMES[d.weekday]}
                  checked={d.enabled}
                  onChange={(v) => setDay(d.weekday, { enabled: v })}
                />
              </div>
              {d.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={d.start}
                    onChange={(e) => setDay(d.weekday, { start: e.target.value })}
                    className={`${inputBase} w-32`}
                  />
                  <span className="text-muted-2">–</span>
                  <input
                    type="time"
                    value={d.end}
                    onChange={(e) => setDay(d.weekday, { end: e.target.value })}
                    className={`${inputBase} w-32`}
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-2">Closed</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Slots">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Call length" value={durationMinutes} onChange={setDurationMinutes} min={5} suffix="min" />
          <NumberField label="Slot interval" value={slotMinutes} onChange={setSlotMinutes} min={5} suffix="min" />
          <NumberField label="Gap between calls" value={bufferAfter} onChange={setBufferAfter} min={0} suffix="min" />
          <NumberField label="Minimum notice" value={minNoticeHours} onChange={setMinNoticeHours} min={0} suffix="hrs" />
          <NumberField label="Bookable up to" value={maxAdvanceDays} onChange={setMaxAdvanceDays} min={1} suffix="days" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Time zone (IANA)" value={timezone} onChange={setTimezone} />
          <TextField label="Meeting title" value={meetingTitle} onChange={setMeetingTitle} />
        </div>
      </Card>

      <Card title="Days off (blackout dates)">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputBase} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>To (optional)</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputBase} />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className={labelBase}>Reason (optional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vacation, holiday…"
              className={inputBase}
            />
          </div>
          <button
            type="button"
            onClick={addBlackoutRange}
            disabled={!from || pending}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong px-4 text-sm font-medium text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </div>

        {blackouts.length > 0 ? (
          <div className="mt-2 flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
            {blackouts.map((b) => (
              <div key={b._id} className="flex items-center justify-between gap-3 bg-ink/30 px-4 py-2.5">
                <div className="text-sm text-foreground">
                  {b.startDate === b.endDate ? b.startDate : `${b.startDate} → ${b.endDate}`}
                  {b.reason ? <span className="ml-2 text-muted-2">· {b.reason}</span> : null}
                </div>
                <button
                  type="button"
                  onClick={() => deleteBlackout(b._id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-2">No days off set.</p>
        )}
      </Card>
    </div>
  );
}
