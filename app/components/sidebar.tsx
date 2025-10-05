"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, UserCircle } from "lucide-react";
import { menuItemsByRole, MenuItem } from "./sidebarConfig";

// Impor kembali komponen dari library UI Anda
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

  return (
    // Gunakan komponen <Sidebar> sebagai pembungkus utama
    <Sidebar>
      {/* Gunakan <SidebarContent> untuk mengisi kontennya */}
      <SidebarContent className="flex h-full flex-col px-5 py-8">
        
        {/* 1. Header Sidebar */}
        <SidebarHeader>
          <Link href="#" className="flex items-center text-2xl font-bold text-blue-600">
            <BookOpen className="h-8 w-8 mr-2" />
            <span>SisAdmin Skripsi</span>
          </Link>
        </SidebarHeader>
        
        {/* 2. Menu Utama */}
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

        {/* 3. Footer Sidebar (Profil Pengguna & Logout) */}
        <SidebarFooter>
          <div className="flex items-center gap-x-4">
            <UserCircle className="h-10 w-10 text-gray-400" />
            <div>
              <h1 className="text-sm font-semibold text-gray-700">{userName}</h1>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
          <Link
            href="/logout"
            className="mt-4 flex items-center rounded-lg p-2 text-gray-600 hover:bg-red-100 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            <span className="mx-2 text-sm font-medium">Logout</span>
          </Link>
        </SidebarFooter>

      </SidebarContent>
    </Sidebar>
  );
}