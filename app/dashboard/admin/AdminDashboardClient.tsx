"use client";

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { FiBell, FiArrowRight, FiFilter, FiCalendar, FiFilePlus, FiClipboard, FiCheckSquare } from 'react-icons/fi';
import type { Judul, Proposal, SeminarHasil, Mahasiswa } from '@prisma/client';

type TitleSubmissionWithStudent = Judul & { mahasiswa: Mahasiswa };
type ProposalWithDetails = Proposal & { submission: { mahasiswa: Mahasiswa } };
type HasilWithDetails = SeminarHasil & { submission: { mahasiswa: Mahasiswa } };
type SubmissionItem = TitleSubmissionWithStudent | ProposalWithDetails | HasilWithDetails;

interface AdminDashboardProps {
  titleSubmissions: TitleSubmissionWithStudent[];
  proposalSubmissions: ProposalWithDetails[];
  hasilSubmissions: HasilWithDetails[];
}

const StatCard = ({ title, value, subtitle, icon, iconBgColor, iconColor }: {
  title: string,
  value: number,
  subtitle: string,
  icon: React.ReactNode,
  iconBgColor: string,
  iconColor: string
}) => (
  <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border flex flex-col items-center text-center gap-2 sm:gap-3 justify-between transition-transform hover:scale-105 hover:shadow-lg min-h-[140px] sm:min-h-[160px]">
    <div className={`flex-shrink-0 p-2 sm:p-2.5 rounded-full ${iconBgColor}`}>
      <div className={`${iconColor} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className='flex flex-col'>
     <p className="text-xs sm:text-sm font-semibold text-gray-700">{title}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${iconColor}`}>{value}</p>
    </div>
    <p className="text-xs text-gray-500">{subtitle}</p>
  </div>
);

const ActionCard = ({ title, icon, iconBgColor, iconColor, notifications, emptyText, viewLink }: {
  title: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  notifications: SubmissionItem[];
  emptyText: string;
  viewLink: string;
}) => {
  const getNotificationDetails = (item: SubmissionItem) => {
    const mahasiswa = 'mahasiswa' in item ? item.mahasiswa : item.submission.mahasiswa;
    const tanggal = item.tanggal;
    const date = tanggal ? new Date(tanggal) : null;
    const month = date ? date.getMonth() + 1 : null;
    const year = date ? date.getFullYear() : null;
    return {
      id: item.id,
      nama: mahasiswa?.nama || 'N/A',
      jurusan: mahasiswa?.jurusan || 'N/A',
      tanggal: tanggal || 'N/A',
      month,
      year,
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
              const { id, nama, jurusan, month, year } = getNotificationDetails(item);
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-gray-800 truncate">{nama}</p>
                    <p className="text-xs text-gray-500">{jurusan.replace('_', ' ')}</p>
                  </div>
                  <Link href={`${viewLink}/${jurusan}?month=${month}&year=${year}`} className="text-xs sm:text-sm font-semibold text-[#325827] hover:underline flex items-center gap-1 flex-shrink-0">
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


export default function AdminDashboardClient({ titleSubmissions, proposalSubmissions, hasilSubmissions }: AdminDashboardProps) {
  const [filters, setFilters] = useState({
    periode: 'harian', // Default ke harian
    tanggal: new Date().toISOString().split('T')[0],
    bulan: (new Date().getMonth() + 1).toString(),
    tahun: new Date().getFullYear().toString(),
    semester: 'ganjil',
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  const filterByPeriod = useCallback((data: SubmissionItem[]) => {
    return data.filter(item => {

      const dateKey = item.tanggal;
      if (!dateKey) return false;

      const itemDate = new Date(dateKey);
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth() + 1;
      const filterYear = parseInt(appliedFilters.tahun);

      switch (appliedFilters.periode) {
        case 'harian':
          return itemDate.toDateString() === new Date(appliedFilters.tanggal).toDateString();
        case 'bulanan':
          return itemMonth === parseInt(appliedFilters.bulan) && itemYear === filterYear;
        case 'tahunan':
          return itemYear === filterYear;
        case 'ajaran':
          if (appliedFilters.semester === 'ganjil')
            return (itemYear === filterYear && itemMonth >= 8) || (itemYear === filterYear + 1 && itemMonth <= 1);
          return itemYear === filterYear + 1 && itemMonth >= 2 && itemMonth <= 7;
        default:
          return true;
      }
    });
  }, [appliedFilters]);

  const pendingTitleNotifications = titleSubmissions.filter(s =>
    s.status === 'TERKIRIM'
  );

  const pendingProposalNotifications = proposalSubmissions.filter(s =>
    s.status === 'TERKIRIM'
  );

  const pendingHasilNotifications = hasilSubmissions.filter(s =>
    s.status === 'TERKIRIM'
  );

  const periodFilteredTitles = useMemo(() => filterByPeriod(titleSubmissions), [titleSubmissions, filterByPeriod]);
  const periodFilteredProposals = useMemo(() => filterByPeriod(proposalSubmissions), [proposalSubmissions, filterByPeriod]);
  const periodFilteredHasils = useMemo(() => filterByPeriod(hasilSubmissions), [hasilSubmissions, filterByPeriod]);
  const verifiedTitles = useMemo(() =>
    periodFilteredTitles.filter(s =>
      s.status === 'DIPROSES_KAPRODI' ||
      s.status === 'DISETUJUI'
    ),
    [periodFilteredTitles]
  );

  const verifiedProposals = useMemo(() =>
    periodFilteredProposals.filter(s =>
     s.status === 'DIPROSES_KAPRODI' ||
      s.status === 'DISETUJUI'
    ),
    [periodFilteredProposals]
  );

  const verifiedHasils = useMemo(() =>
    periodFilteredHasils.filter(s =>
       s.status === 'DIPROSES_KAPRODI' ||
      s.status === 'DISETUJUI'
    ),
    [periodFilteredHasils]
  );

  const stats = {
    totalJudul: verifiedTitles.length,
    totalProposal: verifiedProposals.length,
    totalHasil: verifiedHasils.length
  };

  const periodeText = useMemo(() => { const year = appliedFilters.tahun; switch (appliedFilters.periode) { case 'harian': return `Pada ${new Date(appliedFilters.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`; case 'bulanan': const monthName = new Date(0, parseInt(appliedFilters.bulan) - 1).toLocaleString('id-ID', { month: 'long' }); return `Dalam periode Bulan ${monthName} ${year}`; case 'tahunan': return `Dalam periode Tahun ${year}`; case 'ajaran': return `Semester ${appliedFilters.semester} T.A ${year}/${parseInt(year) + 1}`; default: return "Seluruh Periode"; } }, [appliedFilters]);

  const renderFilterInputs = () => { switch (filters.periode) { case 'harian': return (<div className="relative"><input type="date" name="tanggal" value={filters.tanggal} onChange={handleFilterChange} className="w-full mt-1 p-2 pl-10 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none" /><FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 pointer-events-none" /></div>); case 'bulanan': return (<select name="bulan" value={filters.bulan} onChange={handleFilterChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}</select>); case 'ajaran': return (<select name="semester" value={filters.semester} onChange={handleFilterChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"><option value="ganjil">Ganjil</option><option value="genap">Genap</option></select>); default: return null; } };


  return (
  <div className="space-y-4 sm:space-y-6">

      {/* --- BAGIAN FILTER STATISTIK TETAP SAMA SEPERTI SEBELUMNYA --- */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base"><FiFilter size={18} /> Filter Data Statistik</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div><label className="text-xs sm:text-sm font-medium text-gray-600">Jenis Periode</label><select name="periode" value={filters.periode} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md bg-white text-xs sm:text-sm"><option value="harian">Harian</option><option value="bulanan">Bulanan</option><option value="ajaran">Tahun Ajaran</option><option value="tahunan">Tahunan</option></select></div>
          {filters.periode !== 'tahunan' && (<div><label className="text-xs sm:text-sm font-medium text-gray-600 capitalize">Pilih {filters.periode === 'ajaran' ? 'Semester' : filters.periode.replace(/an$/, '')}</label>{renderFilterInputs()}</div>)}
          <div><label className="text-xs sm:text-sm font-medium text-gray-600">Pilih Tahun</label><select name="tahun" value={filters.tahun} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md bg-white text-xs sm:text-sm"><option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option></select></div>
          <div><button onClick={handleApplyFilters} className="w-full bg-[#325827] text-white font-semibold p-2 rounded-md hover:bg-green-800 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"><FiFilter size={16} /> Terapkan</button></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        <StatCard
          title="Total Judul Terverifikasi"
          value={stats.totalJudul}
          subtitle={periodeText}
          icon={<FiFilePlus size={22} />}
          iconBgColor="bg-red-100"
          iconColor="text-[#7a1c10]"
        />
        <StatCard
          title="Total Seminar Proposal"
          value={stats.totalProposal}
          subtitle={periodeText}
          icon={<FiClipboard size={22} />}
          iconBgColor="bg-green-100"
          iconColor="text-[#19ca28]"
        />
        <StatCard
          title="Total Sidang Skripsi"
          value={stats.totalHasil}
          subtitle={periodeText}
          icon={<FiCheckSquare size={22} />}
          iconBgColor="bg-orange-100"
          iconColor="text-[#e9ab19]"
        />
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <FiBell /> Notifikasi Pengajuan Baru
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <ActionCard
            title="Pengajuan Judul"
            icon={<FiFilePlus size={20} />}
            notifications={pendingTitleNotifications}
            emptyText="Tidak ada pengajuan judul yang perlu diverifikasi."
            viewLink="/dashboard/admin/verifikasi"
            iconBgColor="bg-red-100"
            iconColor="text-[#7a1c10]"
          />
          <ActionCard
            title="Pendaftaran Sem. Proposal"
            icon={<FiClipboard size={20} />}
            notifications={pendingProposalNotifications}
            emptyText="Tidak ada pendaftaran proposal yang perlu diverifikasi."
            viewLink="/dashboard/admin/proposal"
             iconBgColor="bg-green-100"
             iconColor="text-[#19ca28]"
          />
          <ActionCard
            title="Pendaftaran Sidang Skripsi"
            icon={<FiCheckSquare size={20} />}
            notifications={pendingHasilNotifications}
            emptyText="Tidak ada pendaftaran hasil yang perlu diverifikasi."
            viewLink="/dashboard/admin/seminar-hasil"
            iconBgColor="bg-orange-100"
            iconColor="text-[#e9ab19]"
          />
        </div>
      </div>

    </div>
  );
}