
"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

// Fungsi untuk mendapatkan inisial dari nama
const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Jika sesi belum dimuat, tampilkan placeholder
  if (!session?.user) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />;
  }
  
  // Ambil nama dari sesi, jika tidak ada gunakan email
  const userName = session.user.name || session.user.email || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
      >
        {getInitials(userName)}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Link
            href="/dashboard/profile" // Arahkan ke halaman profil nanti
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profil Saya</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}