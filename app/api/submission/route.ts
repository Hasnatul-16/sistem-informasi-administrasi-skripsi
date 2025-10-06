// src/app/api/submission/route.ts

import { NextResponse } from 'next/server';
import { Jurusan } from '@prisma/client'; // Mengimpor 'Jurusan' dengan huruf besar
import prisma from '@/lib/prisma'; // <-- PERUBAHAN 1: Impor dari file terpusat
import { writeFile } from 'fs/promises';
import path from 'path';

// const prisma = new PrismaClient(); // <-- PERUBAHAN 2: Baris ini sudah dihapus

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    
    // --- (Kode untuk upload file tetap sama) ---
    const transkripFile = data.get('transkrip') as File | null;
    const uktFile = data.get('ukt') as File | null;
    const konsultasiFile = data.get('konsultasi') as File | null;

    if (!transkripFile || !uktFile || !konsultasiFile) {
      return NextResponse.json({ message: 'Semua file persyaratan wajib diunggah.' }, { status: 400 });
    }

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
    
    const studentProfile = await prisma.studentProfile.findFirst(); 
    if (!studentProfile) {
        return NextResponse.json({ message: 'Tidak ada data mahasiswa untuk dihubungkan. Harap buat data dummy mahasiswa terlebih dahulu.' }, { status: 404 });
    }

    const jurusanValue = data.get('jurusan') as string;

    // Validasi apakah nilai jurusan yang diterima valid
    if (!Object.values(Jurusan).includes(jurusanValue as Jurusan)) {
        return NextResponse.json({ message: 'Nilai jurusan tidak valid.' }, { status: 400 });
    }

    const newSubmission = await prisma.thesisSubmission.create({
      data: {
        studentId: studentProfile.id,
        // Di Prisma Schema Anda tidak ada kolom jurusan di ThesisSubmission, jadi ini dihapus
        // Jika ada, pastikan untuk menambahkannya lagi di schema.prisma
        // jurusan: jurusanValue as Jurusan, 
        topik: data.get('topik') as string,
        judul: data.get('judul') as string,
        usulanPembimbing1: data.get('usulanPembimbing1') as string,
        usulanPembimbing2: data.get('usulanPembimbing2') as string,
        usulanPembimbing3: data.get('usulanPembimbing3') as string,
        transkripUrl,
        uktUrl,
        konsultasiUrl,
        status: 'TERKIRIM',
      },
    });

    return NextResponse.json(newSubmission, { status: 201 });

  } catch (error) {
    console.error("Gagal membuat pengajuan:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}