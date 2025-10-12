// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { JWT } from 'next-auth/jwt';
import { User } from '@prisma/client'; // Impor tipe User dari Prisma

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

        // --- PERUBAHAN 1: Sertakan 'jurusan' saat user berhasil login ---
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          jurusan: user.jurusan, // Menambahkan jurusan ke objek user
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
      if (user) {
        // --- PERUBAHAN 2: Simpan 'jurusan' ke dalam token JWT ---
        token.id = user.id as any;
        token.role = user.role;
        token.jurusan = user.jurusan; // Menambahkan jurusan ke token
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        // --- PERUBAHAN 3: Teruskan 'jurusan' dari token ke sesi ---
        const tokenTyped = token as JWT;
        session.user.id = tokenTyped.id as number;
        session.user.role = tokenTyped.role;
        session.user.jurusan = tokenTyped.jurusan; // Menambahkan jurusan ke sesi
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };