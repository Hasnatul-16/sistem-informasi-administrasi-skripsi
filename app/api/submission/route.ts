import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import { writeFile, mkdir } from 'fs/promises'; 
import path from 'path';

const saveFile = async (file: File, subfolder: string) => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
  const uploadDir = path.join(process.cwd(), 'public/uploads', subfolder);
  const filePath = path.join(uploadDir, filename);

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);
    return `/uploads/${subfolder}/${filename}`;
  } catch (error) {
    console.error(`Gagal menyimpan file ke ${filePath}:`, error);
    throw new Error(`Gagal menyimpan file: ${file.name}`);
  }
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'MAHASISWA') {
    return NextResponse.json({ message: 'Akses ditolak. Anda harus login sebagai mahasiswa.' }, { status: 403 });
  }

  try {
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id_user: session.user.id },
    });

    if (!mahasiswa) {
      return NextResponse.json({ message: 'Profil mahasiswa tidak ditemukan.' }, { status: 404 });
    }

    const existingSubmission = await prisma.judul.findFirst({
      where: {
        id_mahasiswa: mahasiswa.id,
        status: {
          not: 'DITOLAK_ADMIN'
        }
      }
    });
    if (existingSubmission) {
      return NextResponse.json(
        { message: 'Anda sudah memiliki pengajuan aktif yang sedang diproses atau telah disetujui.' },
        { status: 409 }
      );
    }

    const formData = await request.formData();
    const judul = formData.get('judul') as string;
    const topik = formData.get('topik') as string;
    const usulan_pembimbing1 = formData.get('usulan_pembimbing1') as string;
    const usulan_pembimbing2 = formData.get('usulan_pembimbing2') as string;
    const usulan_pembimbing3 = formData.get('usulan_pembimbing3') as string | null;

    const transkripFile = formData.get('transkrip') as File | null;
    const uktFile = formData.get('ukt') as File | null;
    const konsultasiFile = formData.get('konsultasi') as File | null;

    if (!judul || !topik || !usulan_pembimbing1 || !usulan_pembimbing2 || !transkripFile || !uktFile || !konsultasiFile) {
      return NextResponse.json({ message: 'Semua field wajib diisi.' }, { status: 400 });
    }

    const SUBFOLDER = 'pengajuan-judul';
    const transkrip = await saveFile(transkripFile, SUBFOLDER);
    const ukt = await saveFile(uktFile, SUBFOLDER);
    const konsultasi = await saveFile(konsultasiFile, SUBFOLDER);

    const newSubmission = await prisma.judul.create({
      data: {
        id_mahasiswa: mahasiswa.id,
        jurusan: mahasiswa.jurusan,
        topik,
        judul,
        usulan_pembimbing1,
        usulan_pembimbing2,
        usulan_pembimbing3: usulan_pembimbing3 || undefined,
        transkrip, 
        ukt,
        konsultasi, 
        status: 'TERKIRIM',
      },
    });

    return NextResponse.json(newSubmission, { status: 201 });

  } catch (error) {
    console.error("Gagal membuat pengajuan:", error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.', error: (error as Error).message }, { status: 500 });
  }
}