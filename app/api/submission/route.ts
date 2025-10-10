// app/api/submission/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Pastikan path ini benar
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  // 1. Dapatkan sesi pengguna yang sedang login untuk keamanan
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'MAHASISWA') {
    return NextResponse.json({ message: 'Akses ditolak. Anda harus login sebagai mahasiswa.' }, { status: 403 });
  }

  try {
    // 2. Cari profil mahasiswa BERDASARKAN ID DARI SESI (bukan findFirst)
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!studentProfile) {
      return NextResponse.json({ message: 'Profil mahasiswa tidak ditemukan.' }, { status: 404 });
    }

    // 3. Ambil data dari form (tanpa perlu mengambil jurusan)
    const formData = await request.formData();
    const judul = formData.get('judul') as string;
    const topik = formData.get('topik') as string;
    const usulanPembimbing1 = formData.get('usulanPembimbing1') as string;
    const usulanPembimbing2 = formData.get('usulanPembimbing2') as string;
    const usulanPembimbing3 = formData.get('usulanPembimbing3') as string | null;

    const transkripFile = formData.get('transkrip') as File | null;
    const uktFile = formData.get('ukt') as File | null;
    const konsultasiFile = formData.get('konsultasi') as File | null;

    // Validasi input dasar
    if (!judul || !topik || !usulanPembimbing1 || !usulanPembimbing2 || !transkripFile || !uktFile || !konsultasiFile) {
        return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 });
    }
    
    // Fungsi untuk menyimpan file dan mendapatkan URL
    const saveFile = async (file: File) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const filePath = path.join(process.cwd(), 'public/uploads', fileName);
        await writeFile(filePath, buffer);
        return `/uploads/${fileName}`;
    };
    
    const transkripUrl = await saveFile(transkripFile);
    const uktUrl = await saveFile(uktFile);
    const konsultasiUrl = await saveFile(konsultasiFile);

    // 4. Simpan pengajuan baru ke database DENGAN JURUSAN DARI PROFIL
    const newSubmission = await prisma.thesisSubmission.create({
      data: {
        studentId: studentProfile.id,
        jurusan: studentProfile.jurusan, // <-- JURUSAN DIAMBIL OTOMATIS DARI PROFIL!
        topik,
        judul,
        usulanPembimbing1,
        usulanPembimbing2,
        usulanPembimbing3: usulanPembimbing3 || undefined,
        transkripUrl,
        uktUrl,
        konsultasiUrl,
        status: 'TERKIRIM',
      },
    });

    return NextResponse.json(newSubmission, { status: 201 });

  } catch (error) {
    console.error("Gagal membuat pengajuan:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.', error: (error as Error).message }, { status: 500 });
  }
}