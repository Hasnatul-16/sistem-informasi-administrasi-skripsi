// app/api/auth/auth.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                identifier: { label: "Email or NIM", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials.password) {
                    return null;
                }

                let user;

                user = await prisma.user.findUnique({
                    where: { email: credentials.identifier }
                });

                if (!user) {
                    const mahasiswa = await prisma.mahasiswa.findUnique({
                        where: { nim: credentials.identifier },
                        include: { user: true }
                    });
                    user = mahasiswa?.user;
                }

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
                    jurusan: user.jurusan, 
                };
            }
        })
    ],
    pages: {
        signIn: '/', 
    },
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                
                token.id = user.id as number;
                token.role = user.role;
                token.jurusan = user.jurusan; 
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                const tokenTyped = token as JWT & { id: number, role: string, jurusan: string };
                session.user.id = tokenTyped.id;
                session.user.role = tokenTyped.role;
                session.user.jurusan = tokenTyped.jurusan; 
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};