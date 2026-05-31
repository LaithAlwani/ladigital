import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { PricingEditor } from "@/components/admin/pricing-editor";

export const dynamic = "force-dynamic";

export default async function PricingAdminPage() {
  const settings = await fetchQuery(api.settings.getPublic, {}).catch(() => null);
  return <PricingEditor settings={settings} />;
}
