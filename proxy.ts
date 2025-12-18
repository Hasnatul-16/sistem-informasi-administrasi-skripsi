// proxy.ts

import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export default async function proxy(req: any) {
    const { pathname } = req.nextUrl;

    // Ignore Next.js internals and auth routes
    if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth') || pathname.includes('.')) {
        return NextResponse.next();
    }

    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
        const token = await getToken({ req });

        // If no token, force redirect to login
        if (!token) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Ensure role exists and is a string
        const role = typeof token.role === 'string' ? token.role.toLowerCase() : null;
        if (!role) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        const expectedPath = `/dashboard/${role}`;
        if (!pathname.startsWith(expectedPath)) {
            return NextResponse.redirect(new URL(expectedPath, req.url));
        }
    }

    return NextResponse.next();
}

export const config = { matcher: ["/dashboard", "/dashboard/:path*"] }
