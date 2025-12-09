import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import { FiFileText, FiCheckSquare, FiLayers, FiBell, FiArrowRight } from 'react-icons/fi';
import prisma from '@/lib/prisma';
import { Jurusan, Judul, Proposal, SeminarHasil } from '@prisma/client';
import Link from 'next/link';
import KaprodiStatisticsClient from './KaprodiStatisticsClient';


type TitleSubmissionWithStudent = Judul & { mahasiswa: { nama: string; jurusan: Jurusan; } };
type ProposalWithStudent = Proposal & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };
type HasilWithStudent = SeminarHasil & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };

const ActionCard = ({ title, linkBase, icon, iconBgColor, submissions }: {
    title: string;
    linkBase: string;
    icon: React.ReactNode;
    iconBgColor: string;
    submissions: (TitleSubmissionWithStudent | ProposalWithStudent | HasilWithStudent)[];
}) => {
    const getStudentDetails = (sub: TitleSubmissionWithStudent | ProposalWithStudent | HasilWithStudent) => ({
        id: sub.id,
        fullName: 'mahasiswa' in sub ? sub.mahasiswa.nama : sub.judul.mahasiswa.nama,
        jurusan: 'mahasiswa' in sub ? sub.mahasiswa.jurusan : sub.judul.mahasiswa.jurusan,
    });

    return (
     
        <div className="bg-white p-3 sm:p-5 rounded-lg shadow-md border border-transparent hover:border-green-500 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
            <div>
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4 min-w-0">
                   
                    <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${iconBgColor}`}>{icon}</div>
                    <div className="min-w-0 flex-1">
                       
                        <h3 className="font-bold text-gray-800 text-sm sm:text-base break-words">{title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                            Ada <span className="font-bold text-blue-600">{submissions.length}</span> pengajuan baru.
                        </p>
                    </div>
                </div>
                {submissions.length > 0 ? (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                        {/* List items responsif */}
                        <ul className="space-y-1.5 sm:space-y-2 max-h-40 overflow-y-auto pr-2">
                            {submissions.map((sub) => {
                                const { id, fullName, jurusan } = getStudentDetails(sub);
                                const detailLink = `${linkBase}`;

                                return (
                                   
                                    <li key={id} className="flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-gray-50 rounded-md hover:bg-gray-100 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-xs sm:text-sm text-gray-800 truncate">{fullName}</p>
                                            <p className="text-xs text-gray-500 truncate">{jurusan.replace('_', ' ')}</p>
                                        </div>
                                        <Link href={detailLink} className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline flex items-center gap-0.5 flex-shrink-0">
                                            <span className="hidden sm:inline">Lihat</span> <FiArrowRight size={14} />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-20 sm:h-24 text-center text-gray-500 pt-3 sm:pt-4 border-t">
                        <FiBell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 mb-1"/>
                        <p className="text-xs sm:text-sm">Tidak ada pengajuan baru.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


async function getDashboardData(jurusan: Jurusan) {
    const [titleSubmissions, proposalSubmissions, hasilSubmissions, allTitles, allProposals, allHasils] = await Promise.all([
        prisma.judul.findMany({ where: { jurusan: jurusan, status: 'DIPROSES_KAPRODI' }, include: { mahasiswa: { select: { nama: true, jurusan: true } } }, orderBy: { tanggal: 'desc' }, take: 5 }),
        prisma.proposal.findMany({ where: { judul: { jurusan: jurusan }, status: 'DIPROSES_KAPRODI' }, include: { judul: { include: { mahasiswa: { select: { nama: true, jurusan: true } } } } }, orderBy: { tanggal: 'desc' }, take: 5 }),
        prisma.seminarHasil.findMany({ where: { judul: { jurusan: jurusan }, status: 'DIPROSES_KAPRODI' }, include: { judul: { include: { mahasiswa: { select: { nama: true, jurusan: true } } } } }, orderBy: { tanggal: 'desc' }, take: 5 }),
        prisma.judul.findMany({ where: { jurusan: jurusan }, include: { mahasiswa: { select: { nama: true, jurusan: true } } } }),
        prisma.proposal.findMany({ where: { judul: { jurusan: jurusan } }, include: { judul: { include: { mahasiswa: { select: { nama: true, jurusan: true } } } } } }),
        prisma.seminarHasil.findMany({ where: { judul: { jurusan: jurusan } }, include: { judul: { include: { mahasiswa: { select: { nama: true, jurusan: true } } } } } })
    ]);
    return { titleSubmissions, proposalSubmissions, hasilSubmissions, allTitles, allProposals, allHasils };
}


export default async function KaprodiDashboardPage() {
    const session = await getServerSession(authOptions);
    const kaprodiName = session?.user?.name || 'Kaprodi';
    const kaprodiJurusan = session?.user?.jurusan as Jurusan | undefined;

    if (!kaprodiJurusan) {
        return <div className="p-4">Data jurusan tidak ditemukan untuk akun ini.</div>
    }

    const { titleSubmissions, proposalSubmissions, hasilSubmissions, allTitles, allProposals, allHasils } = await getDashboardData(kaprodiJurusan);

    return (
        <main className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 sm:p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold break-words">Selamat datang, {kaprodiName}!</h1>
                <p className="mt-2 sm:mt-1 opacity-90 text-xs sm:text-sm break-words line-clamp-2">Dashboard Kepala Program Studi {kaprodiJurusan.replace('_', ' ')}.</p>
            </div>

            <KaprodiStatisticsClient
               
                titleSubmissions={allTitles}
                proposalSubmissions={allProposals}
                hasilSubmissions={allHasils}
            />

            <div>
                {/* Ukuran font responsif dengan break-words */}
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FiBell size={18} className="flex-shrink-0" /> <span className="break-words">Notifikasi Pengajuan Baru</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                        linkBase="/dashboard/kaprodi/proposal"
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
        </main>
    );
}
