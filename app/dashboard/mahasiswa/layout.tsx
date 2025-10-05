// src/app/dashboard/admin/layout.tsx

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/sidebar";

export default function MahasiswaDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // SidebarProvider membungkus seluruh layout dasbor
    <SidebarProvider>
      {/* AppSidebar dipanggil di sini dengan role yang spesifik */}
      <AppSidebar role="mahasiswa" userName="Mahasiswa" userRole="mahasiswa" />

      {/* SidebarInset membungkus konten utama halaman */}
      <SidebarInset>
        <header className="p-4 bg-blue-500 border-b mb-4">
            
          <div className="max-w-7xl mx-auto flex items-center">
            {/* Tombol untuk membuka/menutup sidebar di mobile */}
            
              <SidebarTrigger className="bg-white"/>
           

            {/* Judul Halaman */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-white" >Dasbor Mahasiswa</h1>
            </div>

            {/* Placeholder untuk menyeimbangkan layout */}
            <div className="flex-none w-8 lg:hidden" />
          </div>
        </header>

        {/* 'children' adalah konten dari setiap halaman admin */}
        <div className="p-6">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


