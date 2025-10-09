import { AppSidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function KaprodiDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
    <SidebarProvider>
        
       
        <AppSidebar role="kaprodi" />

        
        <SidebarInset>
          <Header title="Dasbor Kepala Program Studi" />
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
        
    </SidebarProvider>
  );
}