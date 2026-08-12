import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { PlansEditor } from "@/components/admin/plans-editor";

export const dynamic = "force-dynamic";

export default async function PlansAdminPage() {
  const plans = await fetchQuery(api.plans.getPublic, {}).catch(() => []);
  return <PlansEditor plans={plans} />;
}
