"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { updateSettings } from "@/app/actions/admin-settings";
import {
  TextField,
  NumberField,
  TextArea,
  Toggle,
  Card,
  AdminPageHeader,
  SaveButton,
} from "./admin-fields";

type Settings = {
  pricing?: { setupFee?: number; annualPromoLine?: string };
  offer?: { enabled: boolean; label?: string; text?: string };
} | null;

export function PricingEditor({ settings }: { settings: Settings }) {
  const router = useRouter();

  const [setupFee, setSetupFee] = React.useState(
    settings?.pricing?.setupFee ?? siteConfig.pricing.setupFee,
  );
  const [promoLine, setPromoLine] = React.useState(
    settings?.pricing?.annualPromoLine ?? siteConfig.pricing.annualPromoLine,
  );

  const [offerEnabled, setOfferEnabled] = React.useState(settings?.offer?.enabled ?? false);
  const [offerLabel, setOfferLabel] = React.useState(settings?.offer?.label ?? "Limited offer");
  const [offerText, setOfferText] = React.useState(settings?.offer?.text ?? "");

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings({
        pricing: {
          setupFee,
          annualPromoLine: promoLine,
          setupWaivedAnnual: siteConfig.pricing.setupWaivedAnnual,
        },
        offer: { enabled: offerEnabled, label: offerLabel, text: offerText },
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
        title="Pricing & offers"
        description="Setup fee, promo line, and an offer banner. Edit individual plan prices under Plans."
        action={<SaveButton saving={saving} saved={saved} onClick={save} />}
      />

      <Card title="Global pricing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Setup fee" value={setupFee} onChange={setSetupFee} min={0} suffix="CAD" />
        </div>
        <TextField label="Annual promo line" value={promoLine} onChange={setPromoLine} />
      </Card>

      <Card title="Promo / offer banner">
        <Toggle label="Show an offer banner on the site" checked={offerEnabled} onChange={setOfferEnabled} />
        {offerEnabled ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField label="Label" value={offerLabel} onChange={setOfferLabel} />
            <div className="sm:col-span-2">
              <TextArea
                label="Offer text"
                value={offerText}
                onChange={setOfferText}
                rows={2}
                placeholder="e.g. 20% off your first 3 months — this month only."
              />
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
