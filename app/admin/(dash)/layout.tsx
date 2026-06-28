import { requireAdmin } from "@/lib/admin-session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ConfirmProvider } from "@/components/admin/confirm-dialog";

export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <ConfirmProvider>
      <div className="flex min-h-[100svh] flex-col bg-ink lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </ConfirmProvider>
  );
}
