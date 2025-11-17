"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Navbar } from "./Navbar";

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b bg-blue-600 px-3 sm:px-4 md:px-6 text-white shadow-md">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        
      
        <SidebarTrigger className="text-white hover:bg-blue-700 flex-shrink-0" />

        <h1 className="text-lg sm:text-xl font-bold truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <Navbar />
      </div>
    </header>
  );
}