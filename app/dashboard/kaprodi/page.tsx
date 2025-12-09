import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';
import { FiClipboard, FiFilePlus, FiCheckSquare, FiLayers, FiBell, FiArrowRight } from 'react-icons/fi';
import prisma from '@/lib/prisma';
import { Jurusan, Judul, Proposal, SeminarHasil } from '@prisma/client';
import Link from 'next/link';
import KaprodiStatisticsClient from './KaprodiStatisticsClient';


type TitleSubmissionWithStudent = Judul & { mahasiswa: { nama: string; jurusan: Jurusan; } };
type ProposalWithStudent = Proposal & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };
type HasilWithStudent = SeminarHasil & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };

const ActionCard = ({ title, icon, iconBgColor, iconColor, notifications, emptyText, viewLink }: {
    title: string;
    icon: React.ReactNode;
    iconBgColor: string;
    iconColor: string;
    notifications: (TitleSubmissionWithStudent | ProposalWithStudent | HasilWithStudent)[];
    emptyText: string;
    viewLink: string;
}) => {
    const getNotificationDetails = (item: TitleSubmissionWithStudent | ProposalWithStudent | HasilWithStudent) => {
        const mahasiswa = 'mahasiswa' in item ? item.mahasiswa : item.judul.mahasiswa;
        return {
            id: item.id,
            nama: mahasiswa?.nama || 'N/A',
            jurusan: mahasiswa?.jurusan || 'N/A'
        };
    };

    return (
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border h-full flex flex-col">
            <div className="flex items-start gap-2 sm:gap-3">
                <div className={`p-2 rounded-lg ${iconBgColor} flex-shrink-0`}>
                    <div className={iconColor}>{icon}</div>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm sm:text-base ${iconColor}`}>{title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {notifications.length > 0
                            ? `Ada ${notifications.length} pengajuan baru.`
                            : `Tidak ada pengajuan baru.`
                        }
                    </p>
                </div>

            </div>
            <hr className="my-3 sm:my-4" />
            <div className="flex-grow">
                {notifications.length > 0 ? (
                    <ul className="space-y-2 sm:space-y-3 max-h-48 overflow-y-auto pr-2">
                        {notifications.map(item => {
                            const { id, nama, jurusan } = getNotificationDetails(item);
                            return (
                                <li key={id} className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-medium text-xs sm:text-sm text-gray-800 truncate">{nama}</p>
                                        <p className="text-xs text-gray-500">{jurusan.replace('_', ' ')}</p>
                                    </div>
                                    <Link href={`${viewLink}`} className="text-xs sm:text-sm font-semibold text-[#325827] hover:underline flex items-center gap-1 flex-shrink-0">
                                        <span className="hidden sm:inline">Lihat</span> <FiArrowRight size={14} />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 h-full py-6 sm:py-8">
                        <FiBell className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                        <p className="text-xs sm:text-sm font-medium">{emptyText}</p>
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
            <div className="bg-[#325827] p-4 sm:p-6 rounded-xl shadow-lg text-white">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold break-words">Selamat datang, {kaprodiName}</h1>
                <p className="mt-2 sm:mt-1 opacity-90 text-xs sm:text-sm break-words line-clamp-2">Dashboard Kepala Program Studi {kaprodiJurusan.replace('_', ' ')}.</p>
            </div>

            <KaprodiStatisticsClient
               
                titleSubmissions={allTitles}
                proposalSubmissions={allProposals}
                hasilSubmissions={allHasils}
            />

            <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                    <FiBell /> Notifikasi Pengajuan Baru
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <ActionCard
                        title="Pengajuan Judul"
                        icon={<FiFilePlus size={20} />}
                        iconBgColor="bg-red-100"
                        iconColor="text-[#7a1c10]"
                        notifications={titleSubmissions}
                        emptyText="Tidak ada pengajuan judul yang perlu diproses."
                        viewLink="/dashboard/kaprodi/pengajuan_judul"
                    />
                    <ActionCard
                        title="Pendaftaran Sem. Proposal"
                        icon={<FiClipboard size={20} />}
                        iconBgColor="bg-green-100"
                        iconColor="text-[#19ca28]"
                        notifications={proposalSubmissions}
                        emptyText="Tidak ada pendaftaran proposal yang perlu diproses."
                        viewLink="/dashboard/kaprodi/proposal"
                    />
                    <ActionCard
                        title="Pendaftaran Sidang Skripsi"
                        icon={<FiCheckSquare size={20} />}
                        iconBgColor="bg-orange-100"
                        iconColor="text-[#e9ab19]"
                        notifications={hasilSubmissions}
                        emptyText="Tidak ada pendaftaran hasil yang perlu diproses."
                        viewLink="/dashboard/kaprodi/seminar-hasil"
                    />
                </div>
            </div>
        </main>
    );
}
