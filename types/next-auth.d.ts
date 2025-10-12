// types/next-auth.d.ts

import { Role, Jurusan } from '@prisma/client';
import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      role?: Role;
      jurusan?: Jurusan | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: number; // Pastikan id adalah number
    role?: Role;
    jurusan?: Jurusan | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number; // Pastikan id adalah number
    role?: Role;
    jurusan?: Jurusan | null;
  }
}