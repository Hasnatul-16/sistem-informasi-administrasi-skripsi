import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Prisma, Jurusan } from '@prisma/client';

export type ArsipData = {
    id: number;
    nama: string;
    nim: string;
    topik: string;
    judul: string;
    jurusan: Jurusan;
    tanggal_pengajuan_judul: Date;
    pembimbing1: string | null;
    pembimbing2: string | null;

    sk_pembimbing_number: string | null;
    file_sk_pembimbing: string | null;
    proposal: {
        id: number;
        tanggal: Date;
        jadwal_sidang: Date | null;
        sk_penguji_file: string | null; 
        file_sk_proposal: string | null;
        penguji: string | null; 
    } | null;
    seminar_hasil: {
        id: number;
        tanggal: Date;
        jadwal_sidang: Date | null;
        sk_penguji_file: string | null; 
        file_sk_skripsi: string | null;
        penguji1: string | null; 
        penguji2: string | null;
    } | null;
};

const getMonthYearFilter = (year: number, month: number) => {
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    return { startDate, endDate };
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const selectedMonth = searchParams.get('month');
        const selectedJurusan = searchParams.get('jurusan') as Jurusan | null;
        const searchTerm = searchParams.get('search');
        const selectedTahun = searchParams.get('tahun');
        const selectedSemester = (searchParams.get('semester') as 'GANJIL' | 'GENAP') || null;

        let dateFilter: { tanggal?: { gte: Date; lt: Date } } = {};

        // Priority: explicit month filter (month=YYYY-MM) -> then tahun+semester -> otherwise no date filter
        if (selectedMonth) {
            const [yearStr, monthStr] = selectedMonth.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);

            if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
                const { startDate, endDate } = getMonthYearFilter(year, month);

                dateFilter = {
                    tanggal: {
                        gte: startDate,
                        lt: endDate,
                    },
                };
            }
        } else if (selectedTahun && selectedSemester) {
            const year = parseInt(selectedTahun);
            if (!isNaN(year)) {
                // Academic semester mapping:
                // GANJIL: July 1st of year to December 31st of year
                // GENAP: January 1st of year to June 30th of year
                let startDate: Date;
                let endDate: Date;
                if (selectedSemester === 'GANJIL') {
                    startDate = new Date(year, 6, 1); // July 1
                    endDate = new Date(year, 12, 1); // Jan 1 next year (exclusive)
                } else {
                    startDate = new Date(year, 0, 1); // Jan 1
                    endDate = new Date(year, 6, 1); // July 1 (exclusive)
                }
                dateFilter = {
                    tanggal: {
                        gte: startDate,
                        lt: endDate,
                    },
                };
            }
        }
        // No default month filter - show all data

        const jurusanFilter = selectedJurusan ? { jurusan: selectedJurusan } : {};

        const whereClause: Prisma.JudulWhereInput = {
            ...jurusanFilter,
            ...dateFilter,
  
            OR: [
                { status: 'DISETUJUI' },
                { proposal: { some: { status: 'DISETUJUI' } } },
                { seminar_hasil: { some: { status: 'DISETUJUI' } } },
            ],
       
            ...(searchTerm && searchTerm.trim() !== '' ? {
                mahasiswa: {
                    OR: [
                        { nama: { contains: searchTerm } },
                        { nim: { contains: searchTerm } },
                    ]
                }
            } : {})
        };

        const judulList = await prisma.judul.findMany({
            where: whereClause,
            include: {
                mahasiswa: true,
                proposal: {
                    where: { status: 'DISETUJUI' },
                    orderBy: { tanggal: 'desc' },
                    take: 1, 
                },
                seminar_hasil: {
                    where: { status: 'DISETUJUI' },
                    orderBy: { tanggal: 'desc' },
                    take: 1, 
                },
            },
            orderBy: { tanggal: 'desc' },
        });

        const arsipData: ArsipData[] = judulList.map(judul => ({
            id: judul.id,
            nama: judul.mahasiswa.nama,
            nim: judul.mahasiswa.nim,
            topik: judul.topik,
            judul: judul.judul,
            jurusan: judul.jurusan,
            tanggal_pengajuan_judul: judul.tanggal,
            pembimbing1: judul.pembimbing1,
            pembimbing2: judul.pembimbing2,
            sk_pembimbing_number: judul.sk_pembimbing,
            file_sk_pembimbing: judul.file_sk_pembimbing,

            proposal: judul.proposal.length > 0 ? {
                id: judul.proposal[0].id,
                tanggal: judul.proposal[0].tanggal,
                jadwal_sidang: judul.proposal[0].jadwal_sidang,
                sk_penguji_file: judul.proposal[0].sk_penguji,
                file_sk_proposal: judul.proposal[0].file_sk_proposal,
                penguji: judul.proposal[0].penguji,
            } : null,

            seminar_hasil: judul.seminar_hasil.length > 0 ? {
                id: judul.seminar_hasil[0].id,
                tanggal: judul.seminar_hasil[0].tanggal,
                jadwal_sidang: judul.seminar_hasil[0].jadwal_sidang,
                sk_penguji_file: judul.seminar_hasil[0].sk_penguji,
                file_sk_skripsi: judul.seminar_hasil[0].file_sk_skripsi,
                penguji1: judul.seminar_hasil[0].penguji1,
                penguji2: judul.seminar_hasil[0].penguji2,
            } : null,
        }));

        return NextResponse.json(arsipData);
    } catch (error) {
        console.error('Error fetching arsip data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}