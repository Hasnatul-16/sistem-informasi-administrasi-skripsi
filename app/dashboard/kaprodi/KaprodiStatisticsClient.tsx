"use client";

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { FiFilter, FiCalendar, FiFilePlus, FiClipboard, FiCheckSquare } from 'react-icons/fi';
import type { Judul, Proposal, SeminarHasil, Jurusan } from '@prisma/client';

type TitleSubmissionWithStudent = Judul & { mahasiswa: { nama: string; jurusan: Jurusan; } };
type ProposalWithDetails = Proposal & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };
type HasilWithDetails = SeminarHasil & { judul: { mahasiswa: { nama: string; jurusan: Jurusan; } } };
type SubmissionItem = TitleSubmissionWithStudent | ProposalWithDetails | HasilWithDetails;

interface KaprodiStatisticsProps {
  titleSubmissions: TitleSubmissionWithStudent[];
  proposalSubmissions: ProposalWithDetails[];
  hasilSubmissions: HasilWithDetails[];
}


const StatCard = ({ title, value, subtitle, icon, iconBgColor, iconColor, link }: {
  title: string,
  value: number,
  subtitle: string,
  icon: React.ReactNode,
  iconBgColor: string,
  iconColor: string,
  link?: string
}) => {
  const content = (
    <div className="bg-white p-5 rounded-xl shadow-md border flex flex-col items-center text-center gap-2 justify-between transition-transform hover:scale-105 hover:shadow-lg min-h-[160px] cursor-pointer">
      <div className={`flex-shrink-0 p-2.5 rounded-full ${iconBgColor}`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <div className='flex flex-col'>
        <p className="text-xs font-semibold text-gray-700">{title}</p>
        <p className={`text-3xl font-bold ${iconColor}`}>{value}</p>
      </div>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
};

export default function KaprodiStatisticsClient({ titleSubmissions, proposalSubmissions, hasilSubmissions }: KaprodiStatisticsProps) {
  const [filters, setFilters] = useState({
    periode: 'harian', 
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
      
      if (item.status === 'DITOLAK_ADMIN') return false;

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

  const periodFilteredTitles = useMemo(() => filterByPeriod(titleSubmissions), [titleSubmissions, filterByPeriod]);
  const periodFilteredProposals = useMemo(() => filterByPeriod(proposalSubmissions), [proposalSubmissions, filterByPeriod]);
  const periodFilteredHasils = useMemo(() => filterByPeriod(hasilSubmissions), [hasilSubmissions, filterByPeriod]);

  const stats = {
    totalJudul: periodFilteredTitles.filter(item => item.status === 'DISETUJUI').length,
    totalProposal: periodFilteredProposals.filter(item => item.status === 'DISETUJUI').length,
    totalHasil: periodFilteredHasils.filter(item => item.status === 'DISETUJUI').length
  };

  const periodeText = useMemo(() => {
    const year = appliedFilters.tahun;
    switch (appliedFilters.periode) {
      case 'harian':
        return `Pada ${new Date(appliedFilters.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
      case 'bulanan':
        const monthName = new Date(0, parseInt(appliedFilters.bulan) - 1).toLocaleString('id-ID', { month: 'long' });
        return `Dalam periode Bulan ${monthName} ${year}`;
      case 'tahunan':
        return `Dalam periode Tahun ${year}`;
      case 'ajaran':
        return `Semester ${appliedFilters.semester} T.A ${year}/${parseInt(year) + 1}`;
      default:
        return "Seluruh Periode";
    }
  }, [appliedFilters]);

  const renderFilterInputs = () => {
    switch (filters.periode) {
      case 'harian':
        return (
          <div className="relative">
            <input
              type="date"
              name="tanggal"
              value={filters.tanggal}
              onChange={handleFilterChange}
              className="w-full mt-1 p-2 pl-10 border border-gray-300 rounded-md bg-white focus:ring-green-700 focus:border-green-700 appearance-none"
            />
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 pointer-events-none" />
          </div>
        );
      case 'bulanan':
        return (
          <select
            name="bulan"
            value={filters.bulan}
            onChange={handleFilterChange}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white focus:ring-green-700 focus:border-green-700"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
              </option>
            ))}
          </select>
        );
      case 'ajaran':
        return (
          <select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white focus:ring-green-700 focus:border-green-700"
          >
            <option value="ganjil">Ganjil</option>
            <option value="genap">Genap</option>
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
     
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiFilter size={18} /> Filter Data Statistik
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-gray-600">Jenis Periode</label>
            <select
              name="periode"
              value={filters.periode}
              onChange={handleFilterChange}
              className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
            >
              <option value="harian">Harian</option>
              <option value="bulanan">Bulanan</option>
              <option value="ajaran">Tahun Ajaran</option>
              <option value="tahunan">Tahunan</option>
            </select>
          </div>
          {filters.periode !== 'tahunan' && (
            <div>
              <label className="text-sm font-medium text-gray-600 capitalize">
                Pilih {filters.periode === 'ajaran' ? 'Semester' : filters.periode.replace(/an$/, '')}
              </label>
              {renderFilterInputs()}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">Pilih Tahun</label>
            <select
              name="tahun"
              value={filters.tahun}
              onChange={handleFilterChange}
              className="w-full mt-1 p-2 border rounded-md bg-white text-sm"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          <div>
            <button
              onClick={handleApplyFilters}
              className="w-full bg-[#325827] text-white font-semibold p-2 rounded-md hover:bg-green-900 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FiFilter size={16} /> Terapkan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Pengajuan Judul"
          value={stats.totalJudul}
          subtitle={periodeText}
          icon={<FiFilePlus size={22} />}
          iconBgColor="bg-red-100"
          iconColor="text-[#7a1c10]"
          link={`/dashboard/kaprodi/pengajuan_judul${appliedFilters.periode === 'bulanan' ? `?month=${appliedFilters.bulan}&year=${appliedFilters.tahun}` : ''}`}
        />
        <StatCard
          title="Total Seminar Proposal"
          value={stats.totalProposal}
          subtitle={periodeText}
          icon={<FiClipboard size={22} />}
          iconBgColor="bg-green-100"
          iconColor="text-[#19ca28]"
          link={`/dashboard/kaprodi/proposal${appliedFilters.periode === 'bulanan' ? `?month=${appliedFilters.bulan}&year=${appliedFilters.tahun}` : ''}`}
        />
        <StatCard
          title="Total Sidang Skripsi"
          value={stats.totalHasil}
          subtitle={periodeText}
          icon={<FiCheckSquare size={22} />}
          iconBgColor="bg-orange-100"
          iconColor="text-[#e9ab19]"
          link={`/dashboard/kaprodi/seminar-hasil${appliedFilters.periode === 'bulanan' ? `?month=${appliedFilters.bulan}&year=${appliedFilters.tahun}` : ''}`}
        />
      </div>
    </div>
  );
}
