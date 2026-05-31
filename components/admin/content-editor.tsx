"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { updateSettings } from "@/app/actions/admin-settings";
import { SOCIAL_PLATFORMS, type SocialLink } from "@/lib/socials";
import { cn } from "@/lib/cn";
import {
  TextField,
  TextArea,
  Card,
  AdminPageHeader,
  SaveButton,
  inputBase,
  labelBase,
} from "./admin-fields";

type Settings = {
  company?: {
    tagline?: string;
    heroHeadline?: string;
    heroSubheadline?: string;
    description?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    city?: string;
    region?: string;
    businessHours?: string;
  };
  socials?: SocialLink[];
} | null;

export function ContentEditor({ settings }: { settings: Settings }) {
  const router = useRouter();
  const c = siteConfig.company;
  const ct = siteConfig.contact;

  const [heroHeadline, setHeroHeadline] = React.useState(
    settings?.company?.heroHeadline ?? c.heroHeadline,
  );
  const [heroSubheadline, setHeroSubheadline] = React.useState(
    settings?.company?.heroSubheadline ?? c.heroSubheadline,
  );
  const [tagline, setTagline] = React.useState(settings?.company?.tagline ?? c.tagline);
  const [description, setDescription] = React.useState(
    settings?.company?.description ?? c.description,
  );

  const [email, setEmail] = React.useState(settings?.contact?.email ?? ct.email);
  const [phone, setPhone] = React.useState(settings?.contact?.phone ?? ct.phone ?? "");
  const [city, setCity] = React.useState(settings?.contact?.city ?? ct.city);
  const [region, setRegion] = React.useState(settings?.contact?.region ?? ct.region);
  const [businessHours, setBusinessHours] = React.useState(
    settings?.contact?.businessHours ?? ct.businessHours ?? "",
  );

  const [socials, setSocials] = React.useState<SocialLink[]>(
    () => settings?.socials ?? siteConfig.socials.map((s) => ({ ...s })),
  );

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  function updateSocial(i: number, patch: Partial<SocialLink>) {
    setSocials((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addSocial() {
    setSocials((prev) => [...prev, { platform: "instagram", url: "", handle: "" }]);
  }
  function removeSocial(i: number) {
    setSocials((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings({
        company: { heroHeadline, heroSubheadline, tagline, description },
        contact: { email, phone, city, region, businessHours },
        socials: socials
          .filter((s) => s.url.trim())
          .map((s) => ({ platform: s.platform, url: s.url.trim(), handle: s.handle?.trim() || undefined })),
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

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Content"
        description="Headlines, copy, and contact details. Changes appear on the site live."
        action={<SaveButton saving={saving} saved={saved} onClick={save} />}
      />

      <Card title="Hero & company">
        <TextField label="Hero headline" value={heroHeadline} onChange={setHeroHeadline} />
        <TextArea
          label="Hero subheadline"
          value={heroSubheadline}
          onChange={setHeroSubheadline}
          rows={3}
        />
        <TextField label="Tagline" value={tagline} onChange={setTagline} />
        <TextArea label="Company description" value={description} onChange={setDescription} rows={3} />
      </Card>

      <Card title="Contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Email" value={email} onChange={setEmail} type="email" />
          <TextField label="Phone" value={phone} onChange={setPhone} type="tel" />
          <TextField label="City" value={city} onChange={setCity} />
          <TextField label="Region" value={region} onChange={setRegion} />
        </div>
        <TextField label="Business hours" value={businessHours} onChange={setBusinessHours} />
      </Card>

      <Card title="Social links">
        <div className="flex flex-col gap-3">
          {socials.length === 0 ? (
            <p className="text-sm text-muted-2">No social links yet.</p>
          ) : (
            socials.map((s, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelBase}>Platform</label>
                  <select
                    value={s.platform}
                    onChange={(e) => updateSocial(i, { platform: e.target.value })}
                    className={cn(inputBase, "w-36")}
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                    {/* Preserve a custom platform value if it isn't in the list */}
                    {SOCIAL_PLATFORMS.every((p) => p.value !== s.platform) && s.platform ? (
                      <option value={s.platform}>{s.platform}</option>
                    ) : null}
                  </select>
                </div>
                <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                  <label className={labelBase}>URL</label>
                  <input
                    value={s.url}
                    onChange={(e) => updateSocial(i, { url: e.target.value })}
                    placeholder="https://…"
                    className={inputBase}
                  />
                </div>
                <div className="flex w-36 flex-col gap-1.5">
                  <label className={labelBase}>Handle</label>
                  <input
                    value={s.handle ?? ""}
                    onChange={(e) => updateSocial(i, { handle: e.target.value })}
                    placeholder="@you"
                    className={inputBase}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSocial(i)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label="Remove social link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={addSocial}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-brand-orange/50 hover:text-brand-orange"
          >
            <Plus className="h-4 w-4" />
            Add social link
          </button>
        </div>
      </Card>
    </div>
  );
}
