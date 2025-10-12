// app/layout.tsx

import type { Metadata } from "next";
// 1. Ganti font dari Geist menjadi Poppins
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "./AuthProvider"; // Impor provider sesi

// 2. Inisialisasi font Poppins dengan berbagai ketebalan
const poppins = Poppins({
  variable: "--font-poppins", // Opsional: untuk penggunaan lanjutan
  subsets: ["latin"],
  weight: ["200", "300", "500", "600"], // 400=regular, 600=semibold, 700=bold
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
      {/* 3. Terapkan kelas font Poppins ke seluruh aplikasi */}
      <body className={`${poppins.className} antialiased`}>
        {/* AuthProvider membungkus seluruh aplikasi */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}