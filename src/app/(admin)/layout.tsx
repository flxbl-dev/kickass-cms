import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { CommandPalette } from "@/components/admin/command-palette";
import { AuthProvider, RequireAuth } from "@/lib/auth/context";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Admin | Kickass CMS",
  description: "Content management dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <RequireAuth>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AdminHeader />
            <main className="flex-1 overflow-auto p-4 md:p-6">
              {children}
            </main>
          </SidebarInset>
          <CommandPalette />
          <Toaster />
        </SidebarProvider>
      </RequireAuth>
    </AuthProvider>
  );
}

