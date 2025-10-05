// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist } from "next/font/google"; // Menggunakan satu font saja untuk simplisitas
import "./globals.css";

// Mengganti nama variabel agar lebih jelas
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Administrasi Skripsi",
  description: "Dibuat dengan Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        {/* 'children' akan merender semua halaman Anda, baik itu homepage atau dasbor */}
        
        {children}
      </body>
    </html>
  );
}