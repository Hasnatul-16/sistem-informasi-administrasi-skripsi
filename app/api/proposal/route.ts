// app/api/proposal/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Status } from '@prisma/client';

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
    return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const judulIdString = formData.get('id_judul') as string;
    const judulId = parseInt(judulIdString, 10);

    const proposalFile = formData.get('proposal') as File | null;
    const persetujuanFile = formData.get('persetujuan') as File | null;
    // --- PERBAIKAN: Ambil file dengan nama baru dari FormData ---
    const buktiSeminarFile = formData.get('lampiran_5xseminar') as File | null;
    const transkripFile = formData.get('transkrip') as File | null;


    if (isNaN(judulId)) {
      return NextResponse.json({ message: 'ID Judul tidak valid.' }, { status: 400 });
    }

    // --- PERBAIKAN: Validasi file dengan nama baru ---
    if (!proposalFile || !persetujuanFile || !buktiSeminarFile || !transkripFile) {
      return NextResponse.json({ message: 'Semua dokumen persyaratan wajib diupload.' }, { status: 400 });
    }

    // Validasi Judul & Mahasiswa (tidak berubah)
    const judul = await prisma.judul.findUnique({ where: { id: judulId }, select: { status: true, id_mahasiswa: true }});
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id_user: session.user.id }, select: { id: true }});
    if (!judul || judul.status !== 'DISETUJUI' || judul.id_mahasiswa !== mahasiswa?.id) {
      return NextResponse.json({ message: 'Judul tidak ditemukan, belum disetujui, atau bukan milik Anda.' }, { status: 404 });
    }
    const existingProposal = await prisma.proposal.findUnique({ where: { id_judul: judulId }});
    if (existingProposal) {
      return NextResponse.json({ message: 'Anda sudah pernah mendaftar seminar proposal untuk judul ini.' }, { status: 409 });
    }

    // Simpan file (tidak berubah, hanya pastikan subfolder benar)
    const proposalPath = await saveFile(proposalFile, 'proposals');
    const persetujuanPath = await saveFile(persetujuanFile, 'persetujuan');
    // --- PERBAIKAN: Gunakan nama field baru untuk subfolder (opsional tapi lebih rapi) ---
    const buktiSeminarPath = await saveFile(buktiSeminarFile, 'lampiran_seminar');
    const transkripPath = await saveFile(transkripFile, 'transkrip_proposal');


    const newProposal = await prisma.proposal.create({
      data: {
        id_judul: judulId,
        proposal: proposalPath,
        persetujuan: persetujuanPath,
        status: Status.TERKIRIM,
        // --- PERBAIKAN: Simpan ke kolom database yang baru ---
        lampiran_5xseminar: buktiSeminarPath,
        transkrip: transkripPath,
        // 'catatan' tidak perlu diisi saat mahasiswa submit
      },
    });

    return NextResponse.json(newProposal, { status: 201 });

  } catch (error) {
    console.error("Gagal membuat pendaftaran proposal:", error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}