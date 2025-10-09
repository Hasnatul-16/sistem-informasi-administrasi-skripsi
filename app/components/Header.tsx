"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Navbar } from "./Navbar"; // Pastikan nama file ini benar

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-blue-600 px-4 text-white shadow-md sm:px-6">
      <div className="flex items-center gap-4">
        
        {/* Tombol untuk toggle sidebar */}
        <SidebarTrigger className="text-white hover:bg-blue-700" />

        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Navbar />
      </div>
    </header>
  );
}