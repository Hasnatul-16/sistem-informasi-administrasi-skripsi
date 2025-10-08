// middleware.ts

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Arahkan pengguna berdasarkan role setelah login
    if (pathname.startsWith("/dashboard") && token) {
      // === PERBAIKAN DI SINI ===
      // Pastikan token.role adalah string sebelum memanggil toLowerCase()
      if (typeof token.role === 'string') {
        const userRole = token.role.toLowerCase();
        const expectedPath = `/dashboard/${userRole}`;
        
        if (!pathname.startsWith(expectedPath)) {
          return NextResponse.redirect(new URL(expectedPath, req.url));
        }
      } else {
        // Jika role tidak ada atau bukan string, arahkan ke halaman login
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
)

// Tentukan halaman mana yang dilindungi oleh middleware
export const config = { matcher: ["/dashboard/:path*"] }