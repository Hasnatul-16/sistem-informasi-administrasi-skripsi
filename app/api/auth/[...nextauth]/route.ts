// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  pages: {
    signIn: '/', // Ubah ke halaman utama jika halaman login Anda di sana
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Saat login, objek 'user' dari authorize akan ada di sini
      if (user) {
        token.id = user.id as number;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Setiap kali sesi diakses, data dari token akan ditambahkan ke sesi
      if (session?.user) {
        const tokenTyped = token as JWT;
        session.user.id = typeof tokenTyped.id === 'string' ? Number(tokenTyped.id) : tokenTyped.id;
        session.user.role = tokenTyped.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };