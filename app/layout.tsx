import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "./AuthProvider";


const poppins = Poppins({
  variable: "--font-poppins", 
  subsets: ["latin"],
  weight: ["200", "300", "500", "600"], 
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
    
      <body className={`${poppins.className} antialiased`}>
      
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}