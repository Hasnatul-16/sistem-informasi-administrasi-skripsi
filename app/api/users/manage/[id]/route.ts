import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, Jurusan } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role;

        if (userRole !== Role.ADMIN) {
            return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json({ message: 'ID pengguna tidak valid.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });

    } catch (error: unknown) {
        console.error("Gagal memuat data pengguna:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
        return NextResponse.json({
            message: 'Gagal memuat data pengguna.',
            details: errorMessage
        }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role;
        const currentUserId = session?.user?.id;

        if (userRole !== Role.ADMIN) {
            return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json({ message: 'ID pengguna tidak valid.' }, { status: 400 });
        }

       
        if (currentUserId === userId) {
            return NextResponse.json({ message: 'Anda tidak dapat mengubah role akun Anda sendiri.' }, { status: 400 });
        }

        const body = await request.json();
        const { role, jurusan, nama } = body;

  
        if (role && !Object.values(Role).includes(role)) {
            return NextResponse.json({ message: 'Role tidak valid.' }, { status: 400 });
        }

    
        if (jurusan && !Object.values(Jurusan).includes(jurusan)) {
            return NextResponse.json({ message: 'Jurusan tidak valid.' }, { status: 400 });
        }

   
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { mahasiswa: true }
        });

        if (!existingUser) {
            return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
        }

    
        const updateData: { role?: Role; jurusan?: Jurusan; nama?: string } = {};
        if (role) updateData.role = role as Role;
        if (jurusan) updateData.jurusan = jurusan as Jurusan;
        if (nama !== undefined) updateData.nama = nama;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                nama: true,
                email: true,
                role: true,
                jurusan: true,
            }
        });

 
        if (jurusan && existingUser.mahasiswa) {
            await prisma.mahasiswa.update({
                where: { id: existingUser.mahasiswa.id },
                data: { jurusan: jurusan as Jurusan }
            });
        }

        return NextResponse.json({
            message: 'Data pengguna berhasil diperbarui.',
            user: updatedUser
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Gagal memperbarui pengguna:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
        return NextResponse.json({
            message: 'Gagal memperbarui pengguna.',
            details: errorMessage
        }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role;
        const currentUserId = session?.user?.id;

        if (userRole !== Role.ADMIN) {
            return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
        }

        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json({ message: 'ID pengguna tidak valid.' }, { status: 400 });
        }

 
        if (currentUserId === userId) {
            return NextResponse.json({ message: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
        }


        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                mahasiswa: {
                    include: {
                        judul: {
                            include: {
                                proposal: true,
                                seminar_hasil: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingUser) {
            return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
        }

    
        if (existingUser.mahasiswa && existingUser.mahasiswa.judul.length > 0) {
            return NextResponse.json({
                message: 'Pengguna tidak dapat dihapus karena memiliki data pengajuan judul. Hapus data pengajuan terlebih dahulu.',
            }, { status: 400 });
        }

     
        if (existingUser.mahasiswa) {
            await prisma.mahasiswa.delete({
                where: { id: existingUser.mahasiswa.id }
            });
        }

     
        await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ message: 'Pengguna berhasil dihapus.' }, { status: 200 });

    } catch (error: unknown) {
        console.error("Gagal menghapus pengguna:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
        return NextResponse.json({
            message: 'Gagal menghapus pengguna.',
            details: errorMessage
        }, { status: 500 });
    }
}
