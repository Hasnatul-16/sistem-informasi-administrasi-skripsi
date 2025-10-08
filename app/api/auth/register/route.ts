// app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '../../../../lib/prisma';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // Kita tidak lagi menerima 'role' dari frontend
    const { email, password, fullName, nim } = await request.json();

    if (!email || !password || !fullName || !nim) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    // Buat user baru dengan role 'MAHASISWA' secara default
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.MAHASISWA, // <-- Perubahan di sini
      },
    });

    // Buat juga profil mahasiswanya
    await prisma.studentProfile.create({
      data: {
        userId: newUser.id,
        fullName,
        nim,
        jurusan: 'SISTEM_INFORMASI', // Default jurusan
      },
    });

    return NextResponse.json({ message: 'Akun mahasiswa berhasil dibuat.' }, { status: 201 });
  } catch (error) {
    console.error("Gagal melakukan registrasi:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}