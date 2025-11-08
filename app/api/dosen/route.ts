import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Jurusan, Role, Status } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type DosenStat = {
    nama: string;
    nip: string;
    totalPengujiSempro: number;
    totalPengujiSemhas: number;
    totalPembimbing1: number;
    totalPembimbing2: number;
    totalBeban: number;
};

async function calculateDosenWorkload(jurusan: Jurusan, tahun: number, semester: 'GANJIL' | 'GENAP', search: string): Promise<DosenStat[]> {
    const allDosen = await prisma.dosen.findMany({
        where: { 
            jurusan,
            nama: {
                contains: search,
            }
         },
        select: { nama: true, nip: true },
    });

    let startDate: Date;
    let endDate: Date;

    if (semester === 'GANJIL') {
        startDate = new Date(tahun, 7, 1);
        endDate = new Date(tahun + 1, 1, 28, 23, 59, 59);
    } else {
        startDate = new Date(tahun, 2, 1); 
        endDate = new Date(tahun, 6, 31, 23, 59, 59);
    }
 
    const approvedJudul = await prisma.judul.findMany({
        where: { jurusan: jurusan, status: Status.DISETUJUI, tanggal: { gte: startDate, lte: endDate } },
        select: { pembimbing1: true, pembimbing2: true },
    });
    const approvedProposal = await prisma.proposal.findMany({
        where: { judul: { jurusan: jurusan }, status: { in: [Status.DISETUJUI] }, tanggal: { gte: startDate, lte: endDate } },
        select: { penguji: true },
    });
    const approvedSeminarHasil = await prisma.seminarHasil.findMany({
        where: { judul: { jurusan: jurusan }, status: { in: [Status.DISETUJUI] }, tanggal: { gte: startDate, lte: endDate } },
        select: { penguji1: true, penguji2: true },
    });

    const statsMap = new Map<string, DosenStat>();

    allDosen.forEach(dosen => {
        statsMap.set(dosen.nama!, {
            nama: dosen.nama!,
            nip: dosen.nip,
            totalPengujiSempro: 0,
            totalPengujiSemhas: 0,
            totalPembimbing1: 0,
            totalPembimbing2: 0,
            totalBeban: 0,
        });
    });

    approvedJudul.forEach(j => {
        if (j.pembimbing1 && statsMap.has(j.pembimbing1)) statsMap.get(j.pembimbing1)!.totalPembimbing1 += 1;
        if (j.pembimbing2 && statsMap.has(j.pembimbing2)) statsMap.get(j.pembimbing2)!.totalPembimbing2 += 1;
    });
    approvedProposal.forEach(p => {
        if (p.penguji && statsMap.has(p.penguji)) statsMap.get(p.penguji)!.totalPengujiSempro += 1;
    });
    approvedSeminarHasil.forEach(sh => {
        if (sh.penguji1 && statsMap.has(sh.penguji1)) statsMap.get(sh.penguji1)!.totalPengujiSemhas += 1;
        if (sh.penguji2 && statsMap.has(sh.penguji2)) statsMap.get(sh.penguji2)!.totalPengujiSemhas += 1;
    });
    

    return Array.from(statsMap.values()).map(stat => ({
        ...stat,
        totalBeban: stat.totalPengujiSempro + stat.totalPengujiSemhas + stat.totalPembimbing1 + stat.totalPembimbing2,
    }));
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role;
        const kaprodiJurusan = session?.user?.jurusan as Jurusan | undefined;
        
        if (userRole !== Role.KAPRODI && userRole !== Role.ADMIN) {
            return NextResponse.json({ message: 'Akses Ditolak: Anda tidak memiliki izin.' }, { status: 403 });
        }
        
        const { searchParams } = new URL(request.url);

        let targetJurusanStr = searchParams.get('jurusan');
        let targetJurusan: Jurusan;

        if (userRole === Role.KAPRODI) {
            if (!kaprodiJurusan) return NextResponse.json({ message: 'Kaprodi tidak terasosiasi dengan jurusan.' }, { status: 403 });
            targetJurusan = kaprodiJurusan;
        } else { 
             if (!targetJurusanStr || !(targetJurusanStr in Jurusan)) {
                 targetJurusan = Jurusan.SISTEM_INFORMASI; 
             } else {
                 targetJurusan = targetJurusanStr as Jurusan;
             }
        }
        
        const tahunStr = searchParams.get('tahun');
        const semesterStr = searchParams.get('semester');
        const searchStr = searchParams.get('search') || '';

        const currentYear = new Date().getFullYear();
        const tahun = parseInt(tahunStr || String(currentYear), 10);
        const semester = (semesterStr === 'GENAP' ? 'GENAP' : 'GANJIL') as 'GANJIL' | 'GENAP';

        if (isNaN(tahun)) {
            return NextResponse.json({ message: 'Parameter tahun tidak valid.' }, { status: 400 });
        }

        const dosenStats = await calculateDosenWorkload(targetJurusan, tahun, semester, searchStr);

        return NextResponse.json(dosenStats, { status: 200 });

    } catch (error: any) {
        console.error("Gagal memproses API Dosen Stats:", error);
        return NextResponse.json({ 
            message: 'API Error: Gagal menghitung beban dosen.',
            details: error.message || 'Terjadi kesalahan internal server.'
        }, { status: 500 });
    }
}