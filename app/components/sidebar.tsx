"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { menuItemsByRole, MenuItem } from "./sidebarConfig";
import { useState } from "react";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  role: 'admin' | 'mahasiswa' | 'kaprodi';
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const menuItems: MenuItem[] = menuItemsByRole[role] || [];
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="flex h-full flex-col px-3 py-4">
        <SidebarHeader>
          <Link href="#" className="flex items-center text-2xl font-bold text-gray-800">
            <BookOpen className="h-8 w-8 mr-2 text-blue-600" />
            <span>SisAdmin</span>
          </Link>
        </SidebarHeader>
        
        <SidebarMenu className="mt-8 flex-1">
          {menuItems.map((item) => {
            const isParentActive = item.subItems?.some(sub => pathname === sub.url);

            // Jika item punya sub-menu
            if (item.subItems) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => setOpenMenu(openMenu === item.title ? null : item.title)}
                    isActive={isParentActive}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", openMenu === item.title && "rotate-90")} />
                  </SidebarMenuButton>
                  {openMenu === item.title && (
                    <SidebarMenuSub>
                      {item.subItems.map(subItem => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <Link href={subItem.url}>
                            <SidebarMenuSubButton isActive={pathname === subItem.url}>
                              {subItem.title}
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            }

            // Jika item biasa (tanpa sub-menu)
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url || "#"}>
                  <SidebarMenuButton isActive={pathname === item.url}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}