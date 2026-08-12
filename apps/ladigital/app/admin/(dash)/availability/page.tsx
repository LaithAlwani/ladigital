import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { AvailabilityEditor } from "@/components/admin/availability-editor";

export const dynamic = "force-dynamic";

export default async function AvailabilityAdminPage() {
  const [rules, blackouts] = await Promise.all([
    fetchQuery(api.availability.getRules, {}),
    fetchQuery(api.availability.listBlackouts, {}).catch(() => []),
  ]);
  return <AvailabilityEditor rules={rules} blackouts={blackouts} />;
}
