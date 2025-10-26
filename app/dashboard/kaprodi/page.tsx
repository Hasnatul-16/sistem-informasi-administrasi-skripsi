// app/dashboard/kaprodi/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { FiFileText, FiUsers, FiCheckSquare, FiLayers, FiBell, FiArrowRight, FiUser } from 'react-icons/fi';
import prisma from '@/lib/prisma';
import { Jurusan, Judul, Proposal, SeminarHasil } from '@prisma/client';
import Link from 'next/link';

// Tipe data disesuaikan dengan schema baru
type TitleSubmissionWithStudent = Judul & { mahasiswa: { nama: string; jurusan: Jurusan; } };
type ProposalWithStudent = Proposal & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };
type HasilWithStudent = SeminarHasil & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };

// --- PERUBAHAN UKURAN PADA STATCARD ---
const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
    // Padding diubah dari p-6 menjadi p-5
    <div className={`bg-white p-5 rounded-lg shadow-md border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {/* Ukuran font diubah dari 3xl menjadi 2xl */}
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
            <div className="text-gray-400">{icon}</div>
        </div>
    </div>
);

// --- PERUBAHAN UKURAN PADA ACTIONCARD ---
const ActionCard = ({ title, linkBase, icon, iconBgColor, submissions }: {
    title: string;
    linkBase: string;
    icon: React.ReactNode;
    iconBgColor: string;
    submissions: (TitleSubmissionWithStudent | ProposalWithStudent | HasilWithStudent)[];
}) => {
    const getStudentDetails = (sub: any) => ({
        id: sub.id,
        fullName: sub.mahasiswa?.nama || sub.judul?.mahasiswa?.nama,
        jurusan: sub.mahasiswa?.jurusan || sub.judul?.mahasiswa?.jurusan,
    });

    return (
        // Padding diubah dari p-6 menjadi p-5
        <div className="bg-white p-5 rounded-lg shadow-md border border-transparent hover:border-blue-500 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
            <div>
                <div className="flex items-start gap-3 mb-4">
                    {/* Padding ikon diubah dari p-3 menjadi p-2.5 */}
                    <div className={`p-2.5 rounded-lg ${iconBgColor}`}>{icon}</div>
                    <div>
                        {/* Ukuran font judul diubah menjadi text-base */}
                        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Ada <span className="font-bold text-blue-600">{submissions.length}</span> pengajuan baru.
                        </p>
                    </div>
                </div>
                {submissions.length > 0 ? (
                    <div className="mt-3 pt-3 border-t">
                        {/* Jarak antar item diubah dari space-y-3 menjadi space-y-2 */}
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {submissions.map((sub) => {
                                const { id, fullName, jurusan } = getStudentDetails(sub);
                                const detailLink = `${linkBase}`;

                                return (
                                    // Padding diubah dari p-3 menjadi p-2
                                    <li key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                                        <div>
                                            <p className="font-medium text-sm text-gray-800">{fullName}</p>
                                            <p className="text-xs text-gray-500">{jurusan.replace('_', ' ')}</p>
                                        </div>
                                        <Link href={detailLink} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                            Lihat <FiArrowRight size={14} />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-24 text-center text-gray-500 pt-4 border-t">
                        <FiBell className="w-6 h-6 text-gray-300 mb-1"/>
                        <p className="text-sm">Tidak ada pengajuan baru.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


async function getDashboardData(jurusan: Jurusan) {
    const [titleSubmissions, proposalSubmissions, hasilSubmissions, totalDisetujui, totalDosen] = await Promise.all([
        prisma.judul.findMany({ where: { jurusan: jurusan, status: 'DIPROSES_KAPRODI' }, include: { mahasiswa: { select: { nama: true, jurusan: true } } }, orderBy: { tanggal: 'desc' }, take: 5 }),
        prisma.proposal.findMany({ where: { judul: { jurusan: jurusan }, status: 'DIPROSES_KAPRODI' }, include: { judul: { include: { mahasiswa: { select: { nama: true, jurusan: true } } } } }, orderBy: { tanggal: 'desc' }, take: 5 }),
        prisma.seminarHasil.findMany({ where: { judul: { jurusan: jurusan }, status: 'DIPROSES_KAPRODI' }, include: { judul: { include: { mahasiswa: { select: { nama: true, jurusan: true } } } } }, orderBy: { tanggal: 'desc' }, take: 5 }),
        prisma.judul.count({ where: { jurusan: jurusan, status: 'DISETUJUI' } }),
        prisma.dosen.count({ where: { jurusan: jurusan } })
    ]);
    return { titleSubmissions, proposalSubmissions, hasilSubmissions, totalDisetujui, totalDosen };
}


export default async function KaprodiDashboardPage() {
    const session = await getServerSession(authOptions);
    const kaprodiName = session?.user?.name || 'Kaprodi';
    const kaprodiJurusan = session?.user?.jurusan as Jurusan | undefined;

    if (!kaprodiJurusan) {
        return <div className="p-4">Data jurusan tidak ditemukan untuk akun ini.</div>
    }

    const { titleSubmissions, proposalSubmissions, hasilSubmissions, totalDisetujui, totalDosen } = await getDashboardData(kaprodiJurusan);

    return (
        // Jarak utama diubah dari space-y-8 menjadi space-y-6
        <main className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 rounded-xl shadow-lg text-white">
                {/* Ukuran font diubah dari 2xl menjadi xl */}
                <h1 className="text-xl font-bold">Selamat datang, {kaprodiName}!</h1>
                <p className="mt-1 opacity-90 text-sm">Dashboard Ketua Program Studi {kaprodiJurusan.replace('_', ' ')}.</p>
            </div>

            <div>
                {/* Ukuran font diubah dari xl menjadi lg */}
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FiBell /> Notifikasi Pengajuan Baru
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ActionCard 
                        title="Pengajuan Judul"
                        linkBase="/dashboard/kaprodi/pengajuan_judul"
                        // Ukuran ikon diubah dari 24 menjadi 20
                        icon={<FiFileText className="text-yellow-700" size={20}/>}
                        iconBgColor="bg-yellow-100"
                        submissions={titleSubmissions}
                    />
                    <ActionCard 
                        title="Seminar Proposal"
                        linkBase="/dashboard/kaprodi/seminar-proposal"
                        icon={<FiLayers className="text-green-700" size={20}/>}
                        iconBgColor="bg-green-100"
                        submissions={proposalSubmissions}
                    />
                    <ActionCard 
                        title="Seminar Hasil"
                        linkBase="/dashboard/kaprodi/seminar-hasil"
                        icon={<FiCheckSquare className="text-purple-700" size={20}/>}
                        iconBgColor="bg-purple-100"
                        submissions={hasilSubmissions}
                    />
                </div>
            </div>

            <div>
                {/* Ukuran font diubah dari xl menjadi lg */}
                <h2 className="text-lg font-bold text-gray-800 mb-4">Ringkasan Statistik Prodi</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Judul Perlu Diproses" 
                        value={titleSubmissions.length} 
                        // Ukuran ikon diubah dari 32 menjadi 28
                        icon={<FiFileText size={28} />}
                        color="border-yellow-500"
                    />
                    <StatCard 
                        title="Judul Telah Disetujui" 
                        value={totalDisetujui} 
                        icon={<FiCheckSquare size={28} />}
                        color="border-green-500"
                    />
                    <StatCard 
                        title="Total Dosen Prodi" 
                        value={totalDosen} 
                        icon={<FiUsers size={28} />}
                        color="border-blue-500"
                    />
                </div>
            </div>
        </main>
    );
}