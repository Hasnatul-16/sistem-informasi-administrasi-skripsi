import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Jurusan, Role, Status } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type RiwayatEntry = {
    mahasiswa: string;
    nim: string;
    judul: string;
    tanggal: Date;
    role: string; 
};

function getTanggalSemester(tahun: number, semester: 'GANJIL' | 'GENAP') {
    let startDate: Date;
    let endDate: Date;
    
    if (semester === 'GANJIL') {
        startDate = new Date(tahun, 7, 1); 
        endDate = new Date(tahun + 1, 0, 31, 23, 59, 59); 
    } else { 
        startDate = new Date(tahun, 1, 1); 
        endDate = new Date(tahun, 6, 31, 23, 59, 59); 
    }
    return { startDate, endDate };
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role;
        const kaprodiJurusan = session?.user?.jurusan as Jurusan | undefined;

        if (userRole !== Role.KAPRODI && userRole !== Role.ADMIN) {
            return NextResponse.json({ message: 'Akses Ditolak.' }, { status: 403 });
        }
        
        const { searchParams } = new URL(request.url);
        const nip = searchParams.get('nip'); 
        const tahunStr = searchParams.get('tahun');
        const semesterStr = searchParams.get('semester');
        const role = searchParams.get('role');

        if (!nip) return NextResponse.json({ message: 'NIP wajib ada.' }, { status: 400 });
        if (!role || (role !== 'penguji' && role !== 'pembimbing')) {
            return NextResponse.json({ message: 'Role wajib ada (penguji/pembimbing).' }, { status: 400 });
        }

        let targetJurusan: Jurusan;
        if (userRole === Role.KAPRODI) {
            if (!kaprodiJurusan) return NextResponse.json({ message: 'Kaprodi tidak terasosiasi dengan jurusan.' }, { status: 403 });
            targetJurusan = kaprodiJurusan;
        } else {
             targetJurusan = (searchParams.get('jurusan') as Jurusan) || Jurusan.SISTEM_INFORMASI; 
        }

        const currentYear = new Date().getFullYear();
        const tahun = parseInt(tahunStr || String(currentYear), 10);
        const semester = (semesterStr === 'GENAP' ? 'GENAP' : 'GANJIL') as 'GANJIL' | 'GENAP';

        const dosen = await prisma.dosen.findUnique({
            where: { nip: nip },
            select: { nama: true }
        });
        if (!dosen || !dosen.nama) return NextResponse.json({ message: 'Dosen tidak ditemukan.' }, { status: 404 });
        
        const { startDate, endDate } = getTanggalSemester(tahun, semester);
        const riwayat: RiwayatEntry[] = [];

        if (role === 'penguji') {
            const semproPenguji = await prisma.proposal.findMany({
                where: {
                    judul: { jurusan: targetJurusan },
                    status: { in: [Status.DISETUJUI] },
                    jadwal_sidang: { gte: startDate, lte: endDate }, 
                    penguji: dosen.nama
                },
                include: { judul: { select: { judul: true, mahasiswa: { select: { nama: true, nim: true } } } } },
            });

            semproPenguji.forEach(prop => {
                riwayat.push({
                    mahasiswa: prop.judul.mahasiswa.nama,
                    nim: prop.judul.mahasiswa.nim,
                    judul: prop.judul.judul,
                    tanggal: prop.jadwal_sidang!,
                    role: 'Penguji Seminar Proposal',
                });
            });

            const semhasPenguji = await prisma.seminarHasil.findMany({
                where: {
                    judul: { jurusan: targetJurusan },
                    status: { in: [Status.DISETUJUI] }, 
                    jadwal_sidang: { gte: startDate, lte: endDate }, 
                    OR: [
                        { penguji1: dosen.nama },
                        { penguji2: dosen.nama }, 
                    ]
                },
                include: { judul: { select: { judul: true, mahasiswa: { select: { nama: true, nim: true } } } } },
            });

            semhasPenguji.forEach(sh => {
                if (sh.penguji1 === dosen.nama) {
                    riwayat.push({
                        mahasiswa: sh.judul.mahasiswa.nama,
                        nim: sh.judul.mahasiswa.nim,
                        judul: sh.judul.judul,
                        tanggal: sh.jadwal_sidang!, 
                        role: 'Penguji Sidang Skripsi 1',
                    });
                }
                if (sh.penguji2 === dosen.nama) {
                    riwayat.push({
                        mahasiswa: sh.judul.mahasiswa.nama,
                        nim: sh.judul.mahasiswa.nim,
                        judul: sh.judul.judul,
                        tanggal: sh.jadwal_sidang!, 
                        role: 'Penguji Sidang Skripsi 2',
                    });
                }
            });

            const totalPengujiSempro = riwayat.filter(r => r.role === 'Penguji Seminar Proposal').length;
            const totalPengujiSemhas = riwayat.filter(r => r.role.includes('Penguji Sidang Skripsi')).length;
            const totalMenguji = totalPengujiSempro + totalPengujiSemhas;

            return NextResponse.json({
                namaDosen: dosen.nama,
                nip: nip,
                totalMenguji,
                totalPengujiSempro,
                totalPengujiSemhas,
                riwayat: riwayat.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())
            }, { status: 200 });

        } else if (role === 'pembimbing') {
            const bimbingan = await prisma.judul.findMany({
                where: {
                    jurusan: targetJurusan,
                    status: Status.DISETUJUI,
                    tanggal: { gte: startDate, lte: endDate }, 
                    OR: [
                        { pembimbing1: dosen.nama },
                        { pembimbing2: dosen.nama }
                    ]
                },
                include: { mahasiswa: { select: { nama: true, nim: true } } }
            });

            bimbingan.forEach(j => {
                if (j.pembimbing1 === dosen.nama) {
                    riwayat.push({
                        mahasiswa: j.mahasiswa.nama,
                        nim: j.mahasiswa.nim,
                        judul: j.judul,
                        tanggal: j.tanggal,
                        role: 'Pembimbing 1',
                    });
                }
                if (j.pembimbing2 === dosen.nama) {
                     riwayat.push({
                        mahasiswa: j.mahasiswa.nama,
                        nim: j.mahasiswa.nim,
                        judul: j.judul,
                        tanggal: j.tanggal, 
                        role: 'Pembimbing 2',
                    });
                }
            });

            const totalPembimbing1 = riwayat.filter(r => r.role === 'Pembimbing 1').length;
            const totalPembimbing2 = riwayat.filter(r => r.role === 'Pembimbing 2').length;
            const totalBimbingan = totalPembimbing1 + totalPembimbing2;

            return NextResponse.json({
                namaDosen: dosen.nama,
                nip: nip,
                totalBimbingan,
                totalPembimbing1,
                totalPembimbing2,
                riwayat: riwayat.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())
            }, { status: 200 });
        } 

        return NextResponse.json({ message: 'Role tidak valid.' }, { status: 400 });

    } catch (error: any) {
        console.error("Gagal memproses API Riwayat Dosen:", error);
        return NextResponse.json({ 
            message: 'API Error: Gagal memuat riwayat dosen.',
            details: error.message || 'Terjadi kesalahan internal server.'
        }, { status: 500 });
    }
}