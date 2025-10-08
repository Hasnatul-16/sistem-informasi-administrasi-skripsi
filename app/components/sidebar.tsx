"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, UserCircle } from "lucide-react";
import { menuItemsByRole, MenuItem } from "./sidebarConfig";
import { signOut } from "next-auth/react"; // <-- 1. Impor fungsi signOut

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  role: 'admin' | 'mahasiswa' | 'kaprodi';
  userName: string;
  userRole: string;
}

export function AppSidebar({ role, userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const menuItems: MenuItem[] = menuItemsByRole[role] || [];

  // 2. Buat fungsi untuk menangani logout
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' }); // Arahkan ke halaman login setelah logout
  };

  return (
    <Sidebar>
      <SidebarContent className="flex h-full flex-col px-0.1 py-0.2">
        
        <SidebarHeader className="p-0">
          <Link href="#" className="flex items-center text-1.9xl font-bold bg-blue-500 text-white h-25 w-full rounded-lg px-5 py-2">
            <BookOpen className="h-10 w-8 mr-2" />
            <span>SisAdmin Skripsi</span>
          </Link>
        </SidebarHeader>
        
        <SidebarMenu className="mt-6 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <SidebarMenuButton key={item.title} isActive={isActive} asChild>
                <Link href={item.url}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            );
          })}
        </SidebarMenu>

        <SidebarFooter>
          <div className="flex items-center gap-x-4">
            <UserCircle className="h-10 w-10 text-gray-400" />
            <div>
              <h1 className="text-sm font-semibold text-gray-700">{userName}</h1>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
          
          {/* === PERBAIKAN DI SINI === */}
          <button
            onClick={handleLogout} // 3. Panggil fungsi logout saat diklik
            className="mt-4 flex w-full items-center rounded-lg p-2 text-gray-600 hover:bg-red-100 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            <span className="mx-2 text-sm font-medium">Logout</span>
          </button>
        </SidebarFooter>

      </SidebarContent>
    </Sidebar>
  );
}