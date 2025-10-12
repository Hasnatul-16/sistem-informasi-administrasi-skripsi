"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, LogOut, User as UserIcon } from "lucide-react";
import { menuItemsByRole, MenuItem } from "./sidebarConfig";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  role: 'admin' | 'mahasiswa' | 'kaprodi';
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const menuItems: MenuItem[] = menuItemsByRole[role] || [];
  
  const [openMenu, setOpenMenu] = useState<string | null>(() => {
    const activeParent = menuItems.find(item => 
      item.subItems?.some(sub => pathname.startsWith(sub.url))
    );
    return activeParent?.title || null;
  });

  return (
    <Sidebar>
      <SidebarContent className="flex h-full flex-col">
        
        <SidebarHeader className="bg-blue-600 p-4">
          <Link href="#" className="flex items-center text-2x1 font-bold text-white">
            <BookOpen className="h-15 w-10 mr-3" />
            <span>SisAdmin Skripsi</span>
          </Link>
        </SidebarHeader>
        
        <SidebarMenu className="mt-3 flex-1">
          {menuItems.map((item) => {
            const isParentActive = item.subItems?.some(sub => pathname.startsWith(sub.url));

            if (item.subItems) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => setOpenMenu(openMenu === item.title ? null : item.title)}
                    className={cn(
                      "font-semibold",
                      isParentActive && "text-blue-600"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", openMenu === item.title && "rotate-90")} />
                  </SidebarMenuButton>
                  {openMenu === item.title && (
                    <SidebarMenuSub>
                      {item.subItems.map(subItem => (
                        <Link href={subItem.url} key={subItem.title} className="block">
                          <SidebarMenuSubButton 
                            className={cn(
                              pathname === subItem.url && "bg-blue-100 text-blue-700 font-bold"
                            )}
                          >
                            {subItem.title}
                          </SidebarMenuSubButton>
                        </Link>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url || "#"}>
                  <SidebarMenuButton 
                    className={cn(
                      "font-semibold",
                      pathname === item.url && "bg-blue-100 text-blue-700"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <div className="mt-auto p-4 border-t border-gray-200">
           <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
              <UserIcon className="h-6 w-6 text-gray-500"/>
            </div>
            <div>
              {/* --- PERBAIKAN 1: Tambahkan text-sm untuk email --- */}
              <p className="font-semibold text-gray-800 truncate text-sm">{session?.user?.email || "User"}</p>
              <p className="text-sm text-gray-500 capitalize">{role}</p>
            </div>
           </div>

           {/* --- PERBAIKAN 2: Tambahkan text-sm untuk tombol logout --- */}
           <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-semibold text-red-600 hover:bg-gray-100 text-sm"
           >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
           </button>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}