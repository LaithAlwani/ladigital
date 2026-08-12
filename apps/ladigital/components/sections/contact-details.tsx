"use client";

import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { useSettings } from "@/lib/use-settings";

export function ContactDetails() {
  const settings = useSettings();
  const c = settings?.contact;
  const email = c?.email ?? siteConfig.contact.email;
  const phone = c?.phone ?? siteConfig.contact.phone;
  const city = c?.city ?? siteConfig.contact.city;
  const region = c?.region ?? siteConfig.contact.region;
  const hours = c?.businessHours ?? siteConfig.contact.businessHours;

  return (
    <ul className="mt-10 flex flex-col gap-4">
      <li>
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-3 rounded-card border border-border bg-surface/40 p-4 transition-colors hover:border-brand-orange/40"
        >
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30">
            <Mail className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Email</span>
            <span className="text-sm text-foreground">{email}</span>
          </div>
        </a>
      </li>
      {phone ? (
        <li>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center gap-3 rounded-card border border-border bg-surface/40 p-4 transition-colors hover:border-brand-orange/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30">
              <Phone className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Phone</span>
              <span className="text-sm text-foreground">{phone}</span>
            </div>
          </a>
        </li>
      ) : null}
      <li className="flex items-center gap-3 rounded-card border border-border bg-surface/40 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30">
          <MapPin className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Location</span>
          <span className="text-sm text-foreground">
            {city}, {region}
          </span>
        </div>
      </li>
      {hours ? (
        <li className="flex items-center gap-3 rounded-card border border-border bg-surface/40 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-orange/12 text-brand-orange ring-1 ring-brand-orange/30">
            <Clock className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Hours</span>
            <span className="text-sm text-foreground">{hours}</span>
          </div>
        </li>
      ) : null}
    </ul>
  );
}
