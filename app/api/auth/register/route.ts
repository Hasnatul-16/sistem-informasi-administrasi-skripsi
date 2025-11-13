import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '../../../../lib/prisma';
import { Role, Jurusan } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { email, password, nama, nim, jurusan } = await request.json();

    if (!email || !password || !nama || !nim || !jurusan) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 });
    }

    if (!Object.values(Jurusan).includes(jurusan as Jurusan)) {
        return NextResponse.json({ message: 'Nilai jurusan tidak valid.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar.' }, { status: 400 });
    }

     const existingMahasiswa = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (existingMahasiswa) {
      return NextResponse.json({ message: 'NIM sudah terdaftar.' }, { status: 400 });
    }


    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.MAHASISWA,
        nama: nama,       
        jurusan: jurusan, 
      },
    });

    await prisma.mahasiswa.create({
      data: {
        id_user: newUser.id,
        nama: nama,
        nim,
        jurusan: jurusan, 
      },
    });

    return NextResponse.json({ message: 'Akun mahasiswa berhasil dibuat.' }, { status: 201 });
  } catch (error) {
    console.error("Gagal melakukan registrasi:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}