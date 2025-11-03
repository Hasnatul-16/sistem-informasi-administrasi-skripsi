import { AppSidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import prisma from "@/lib/prisma"; 

export default async function KaprodiDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
   const user = await  prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { jurusan: true },
  });

  const namaJurusan = user?.jurusan
    ? user.jurusan.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    : 'Jurusan Tidak Dikenal';

    const headerTitle = `Dashboard Kepala Program Studi ${namaJurusan}`;
  return (
    
    <SidebarProvider>
        
       
        <AppSidebar role="kaprodi" />

        
        <SidebarInset>
          <Header title={headerTitle} />
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
        
    </SidebarProvider>
  );
}