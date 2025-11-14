import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Jurusan, Role } from '@prisma/client';
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
    const jurusan = searchParams.get('jurusan') as Jurusan;
    const search = searchParams.get('search') || '';

    if (!jurusan || !(jurusan in Jurusan)) {
      return NextResponse.json({ message: 'Parameter jurusan tidak valid.' }, { status: 400 });
    }

    const dosen = await prisma.dosen.findMany({
      where: {
        jurusan,
        OR: [
          { nama: { contains: search } },
          { nip: { contains: search } }
        ]
      },
      orderBy: { nama: 'asc' }
    });

    return NextResponse.json(dosen, { status: 200 });

  } catch (error: unknown) {
    console.error("Gagal memuat data dosen:", error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    return NextResponse.json({
      message: 'Gagal memuat data dosen.',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (userRole !== Role.ADMIN) {
      return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json();
    const { nama, nip, jurusan } = body;

    if (!nama || !nip || !jurusan) {
      return NextResponse.json({ message: 'Nama, NIP, dan jurusan wajib diisi.' }, { status: 400 });
    }

    if (!(jurusan in Jurusan)) {
      return NextResponse.json({ message: 'Jurusan tidak valid.' }, { status: 400 });
    }

    // Check if NIP already exists
    const existingDosen = await prisma.dosen.findUnique({
      where: { nip }
    });

    if (existingDosen) {
      return NextResponse.json({ message: 'NIP sudah terdaftar.' }, { status: 400 });
    }

    const newDosen = await prisma.dosen.create({
      data: {
        nama,
        nip,
        jurusan: jurusan as Jurusan
      }
    });

    return NextResponse.json(newDosen, { status: 201 });

  } catch (error: unknown) {
    console.error("Gagal menambah dosen:", error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan internal server.';
    return NextResponse.json({
      message: 'Gagal menambah dosen.',
      details: errorMessage
    }, { status: 500 });
  }
}
