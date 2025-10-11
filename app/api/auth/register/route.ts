// app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '../../../../lib/prisma';
import { Role, Jurusan } from '@prisma/client'; // <-- Impor tipe Jurusan

export async function POST(request: Request) {
  try {
    // --- PERBAIKAN DI SINI: Ambil 'jurusan' dari request ---
    const { email, password, fullName, nim, jurusan } = await request.json();

    if (!email || !password || !fullName || !nim || !jurusan) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 });
    }

    // (Opsional tapi direkomendasikan) Validasi nilai jurusan
    if (!Object.values(Jurusan).includes(jurusan as Jurusan)) {
        return NextResponse.json({ message: 'Nilai jurusan tidak valid.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.MAHASISWA,
      },
    });

    await prisma.studentProfile.create({
      data: {
        userId: newUser.id,
        fullName,
        nim,
        // --- PERBAIKAN DI SINI: Gunakan 'jurusan' dari request ---
        jurusan: jurusan, 
      },
    });

    return NextResponse.json({ message: 'Akun mahasiswa berhasil dibuat.' }, { status: 201 });
  } catch (error) {
    console.error("Gagal melakukan registrasi:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}