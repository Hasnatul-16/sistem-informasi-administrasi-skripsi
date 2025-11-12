import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Status } from '@prisma/client';

const saveFile = async (file: File, subfolder: string) => {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads', 'seminar-hasil', subfolder);
    const filePath = path.join(uploadDir, filename);
    try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
        return `/uploads/seminar-hasil/${subfolder}/${filename}`;
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
        const newTopik = formData.get('topik_baru') as string | null;
        const newJudul = formData.get('judul_baru') as string | null;
        const transkripFile = formData.get('transkrip') as File | null;
        const buktiSemproFile = formData.get('bukti_sempro') as File | null; 
        const drafSkripsiFile = formData.get('draf_skripsi') as File | null;
        const buktiKonsultasiFile = formData.get('bukti_konsultasi') as File | null;
        const sertifikatToeflFile = formData.get('sertifikat_toefl') as File | null;
        const buktiHafalanFile = formData.get('bukti_hafalan') as File | null;

        if (isNaN(judulId)) {
            return NextResponse.json({ message: 'ID Judul tidak valid.' }, { status: 400 });
        }

        if (!newTopik || !newJudul || newTopik.trim() === '' || newJudul.trim() === '') {
            return NextResponse.json({ message: 'Topik dan Judul Skripsi wajib diisi.' }, { status: 400 });
        }

        if (!transkripFile || !buktiSemproFile || !drafSkripsiFile || !buktiKonsultasiFile || !sertifikatToeflFile || !buktiHafalanFile) {
            return NextResponse.json({ message: 'Semua dokumen persyaratan Seminar Hasil wajib diupload.' }, { status: 400 });
        }

        const judul = await prisma.judul.findUnique({ where: { id: judulId }, select: { status: true, id_mahasiswa: true } });
        const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id_user: session.user.id }, select: { id: true } });
        if (!judul || judul.status !== 'DISETUJUI' || judul.id_mahasiswa !== mahasiswa?.id) {
            return NextResponse.json({ message: 'Judul tidak ditemukan, belum disetujui, atau bukan milik Anda.' }, { status: 404 });
        }

        const proposalStatus = await prisma.proposal.findFirst({
            where: { id_judul: judulId, status: Status.DISETUJUI }
        });
        if (!proposalStatus) {
            return NextResponse.json({ message: 'Anda belum lulus Seminar Proposal.' }, { status: 403 });
        }

        await prisma.judul.update({
            where: { id: judulId },
            data: {
                topik: newTopik.trim(),
                judul: newJudul.trim(),
            },
        });

        const activeSeminarHasil = await prisma.seminarHasil.findFirst({
            where: {
                id_judul: judulId,
                status: {
                    notIn: [Status.DITOLAK_ADMIN]
                }
            }
        });


        if (activeSeminarHasil && activeSeminarHasil.status !== Status.DITOLAK_ADMIN) {
            return NextResponse.json({
                message: ' Anda sudah memiliki pengajuan aktif yang sedang diproses atau telah disetujui.'
            }, { status: 409 });
        }

        const transkripPath = await saveFile(transkripFile, 'transkrip');
        const buktiSemproPath = await saveFile(buktiSemproFile, 'bukti_sempro');
        const drafSkripsiPath = await saveFile(drafSkripsiFile, 'draf_skripsi');
        const buktiKonsultasiPath = await saveFile(buktiKonsultasiFile, 'bukti_konsultasi');
        const sertifikatToeflPath = await saveFile(sertifikatToeflFile, 'sertifikat_toefl');
        const buktiHafalanPath = await saveFile(buktiHafalanFile, 'bukti_hafalan');

        const newSeminarHasil = await prisma.seminarHasil.create({
            data: {
                id_judul: judulId,
                transkrip: transkripPath, 
                bukti_sempro: buktiSemproPath,
                draf_skripsi: drafSkripsiPath,
                bukti_konsultasi: buktiKonsultasiPath,
                sertifikat_toefl: sertifikatToeflPath,
                bukti_hafalan: buktiHafalanPath,
                status: Status.TERKIRIM,
            },
        });

        return NextResponse.json(newSeminarHasil, { status: 201 });

    } catch (error) {
        console.error("Gagal membuat pendaftaran Sidang Skripsi:", error);
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}