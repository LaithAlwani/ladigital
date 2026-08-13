import { CrmTabs } from "@/components/admin/crm-tabs";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <CrmTabs />
      {children}
    </div>
  );
}
