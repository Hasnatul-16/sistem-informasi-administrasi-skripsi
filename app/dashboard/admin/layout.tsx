import { AppSidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // SidebarProvider sudah membuat container flex-nya sendiri.
    <SidebarProvider>
       
        <AppSidebar role="admin" />

        
        <SidebarInset>
          <Header  title="Dasbor admin" />
          <main className="flex-1 p-4 sm:p-6 ">
            {children}
          </main>
        </SidebarInset>
        
    </SidebarProvider>
  );
}