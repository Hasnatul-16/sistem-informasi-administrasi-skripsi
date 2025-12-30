import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role;

        if (userRole !== Role.ADMIN) {
            return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const roleFilter = searchParams.get('role') as Role | null;
        const jurusanFilter = searchParams.get('jurusan') || '';

        const whereClause: Prisma.UserWhereInput = {};

        if (search) {
            whereClause.OR = [
                { nama: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (roleFilter && Object.values(Role).includes(roleFilter)) {
            whereClause.role = roleFilter;
        }
      
        if (jurusanFilter) {
            whereClause.jurusan = jurusanFilter as 'MATEMATIKA' | 'SISTEM_INFORMASI';
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                nama: true,
                email: true,
                role: true,
                jurusan: true,
                mahasiswa: {
                    select: {
                        id: true,
                        nim: true,
                    }
                }
            },
            orderBy: [
                { role: 'asc' },
                { nama: 'asc' }
            ]
        });

        return NextResponse.json(users, { status: 200 });

    } catch (error: unknown) {
        console.error("Gagal memuat data pengguna:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
        return NextResponse.json({
            message: 'Gagal memuat data pengguna.',
            details: errorMessage
        }, { status: 500 });
    }
}
