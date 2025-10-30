"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FiFileText, FiBarChart2, FiBell, FiArrowRight, FiFilter, FiCalendar, FiFilePlus, FiClipboard, FiCheckSquare, FiInfo } from 'react-icons/fi';
import type { Judul, Proposal, SeminarHasil, Mahasiswa } from '@prisma/client';


type TitleSubmissionWithStudent = Judul & { mahasiswa: Mahasiswa };
type ProposalWithDetails = Proposal & { submission: { mahasiswa: Mahasiswa } };
type HasilWithDetails = SeminarHasil & { submission: { mahasiswa: Mahasiswa } };

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
  <div className="bg-white p-5 rounded-xl shadow-md border flex flex-col items-center text-center gap-2 justify-between transition-transform hover:scale-105 hover:shadow-lg min-h-[160px]">
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



const ActionCard = ({ title, icon, iconBgColor, iconColor, notifications, emptyText, viewLink }: { 
    title: string; 
    icon: React.ReactNode; 
    iconBgColor: string;
    iconColor: string;
    notifications: any[]; 
    emptyText: string; 
    viewLink: string;
}) => {
    const getNotificationDetails = (item: any) => {
        const mahasiswa = item.mahasiswa || item.submission?.mahasiswa;
        return {
            id: item.id,
            nama: mahasiswa?.nama || 'N/A',
            jurusan: mahasiswa?.jurusan || 'N/A'
        };
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border h-full flex flex-col">
            <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${iconBgColor}`}>
                    <div className={iconColor}>{icon}</div>
                </div>
                <div>
                    <h3 className={`font-bold ${iconColor}`}>{title}</h3>
                    <p className="text-sm text-gray-500">
                        {notifications.length > 0 
                            ? `Ada ${notifications.length} pengajuan baru.`
                            : `Tidak ada pengajuan baru.`
                        }
                    </p>
                </div>
            </div>
            <hr className="my-4" />
            <div className="flex-grow">
                {notifications.length > 0 ? (
                    <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {notifications.map(item => {
                            const { id, nama, jurusan } = getNotificationDetails(item);
                            return (
                                <li key={id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm text-gray-800">{nama}</p>
                                        <p className="text-xs text-gray-500">{jurusan.replace('_', ' ')}</p>
                                    </div>
                                    <Link href={`${viewLink}/${jurusan}`} className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                        Lihat <FiArrowRight size={14}/>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 h-full py-8">
                        <FiBell className="w-8 h-8 mb-2"/>
                        <p className="text-sm font-medium">{emptyText}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function AdminDashboardClient({ titleSubmissions, proposalSubmissions, hasilSubmissions }: AdminDashboardProps) {
  const [filters, setFilters] = useState({
    periode: 'harian',
    tanggal: new Date().toISOString().split('T')[0],
    bulan: (new Date().getMonth() + 1).toString(),
    tahun: new Date().getFullYear().toString(),
    semester: 'ganjil',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const filterByPeriod = (data: any[]) => { return data.filter(item => { const itemDate = new Date(item.createdAt); const itemYear = itemDate.getFullYear(); const itemMonth = itemDate.getMonth() + 1; const filterYear = parseInt(filters.tahun); switch (filters.periode) { case 'harian': return itemDate.toDateString() === new Date(filters.tanggal).toDateString(); case 'bulanan': return itemMonth === parseInt(filters.bulan) && itemYear === filterYear; case 'tahunan': return itemYear === filterYear; case 'ajaran': if (filters.semester === 'ganjil') return (itemYear === filterYear && itemMonth >= 8) || (itemYear === filterYear + 1 && itemMonth <= 1); return itemYear === filterYear + 1 && itemMonth >= 2 && itemMonth <= 7; default: return true; } }); };
  
  const periodFilteredTitles = useMemo(() => filterByPeriod(titleSubmissions), [titleSubmissions, filters]);
  const periodFilteredProposals = useMemo(() => filterByPeriod(proposalSubmissions), [proposalSubmissions, filters]);
  const periodFilteredHasils = useMemo(() => filterByPeriod(hasilSubmissions), [hasilSubmissions, filters]);


  const verifiedTitles = useMemo(() => 
    periodFilteredTitles.filter(s => 
        s.status === 'DIPROSES_KAPRODI' || s.status === 'DISETUJUI'
    ),
    [periodFilteredTitles]
  );
  
  const stats = { totalJudul: verifiedTitles.length, totalProposal: periodFilteredProposals.length, totalHasil: periodFilteredHasils.length };
  
  const chartData = useMemo(() => { const getJurusan = (item: any) => item.mahasiswa?.jurusan || item.submission?.mahasiswa?.jurusan; return { si: { judul: verifiedTitles.filter(s => getJurusan(s) === 'SISTEM_INFORMASI').length, proposal: periodFilteredProposals.filter(s => getJurusan(s) === 'SISTEM_INFORMASI').length, hasil: periodFilteredHasils.filter(s => getJurusan(s) === 'SISTEM_INFORMASI').length }, mtk: { judul: verifiedTitles.filter(s => getJurusan(s) === 'MATEMATIKA').length, proposal: periodFilteredProposals.filter(s => getJurusan(s) === 'MATEMATIKA').length, hasil: periodFilteredHasils.filter(s => getJurusan(s) === 'MATEMATIKA').length } }; }, [verifiedTitles, periodFilteredProposals, periodFilteredHasils]);
  const yAxisMax = useMemo(() => { const maxSI = Math.max(chartData.si.judul, chartData.si.proposal, chartData.si.hasil); const maxMTK = Math.max(chartData.mtk.judul, chartData.mtk.proposal, chartData.mtk.hasil); const maxData = Math.max(maxSI, maxMTK); if (maxData < 5) return 5; return Math.ceil(maxData / 5) * 5; }, [chartData]);
  const yAxisLabels = Array.from({ length: 6 }, (_, i) => Math.round(yAxisMax * i / 5));
  const periodeText = useMemo(() => { const year = filters.tahun; switch (filters.periode) { case 'harian': return `Pada ${new Date(filters.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`; case 'bulanan': const monthName = new Date(0, parseInt(filters.bulan) - 1).toLocaleString('id-ID', { month: 'long' }); return `Dalam periode Bulan ${monthName} ${year}`; case 'tahunan': return `Dalam periode Tahun ${year}`; case 'ajaran': return `Semester ${filters.semester} T.A ${year}/${parseInt(year) + 1}`; default: return "Seluruh Periode"; } }, [filters]);
  const renderFilterInputs = () => { switch (filters.periode) { case 'harian': return (<div className="relative"><input type="date" name="tanggal" value={filters.tanggal} onChange={handleFilterChange} className="w-full mt-1 p-2 pl-10 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none"/><FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 pointer-events-none"/></div>); case 'bulanan': return (<select name="bulan" value={filters.bulan} onChange={handleFilterChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500">{Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}</select>); case 'ajaran': return (<select name="semester" value={filters.semester} onChange={handleFilterChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"><option value="ganjil">Ganjil</option><option value="genap">Genap</option></select>); default: return null; } };
  
  const todayString = new Date().toDateString();
  const todayTitleNotifications = titleSubmissions.filter(s => s.status === 'TERKIRIM' && new Date(s.tanggal).toDateString() === todayString);
  const todayProposalNotifications = proposalSubmissions.filter(s => new Date(s.tanggal).toDateString() === todayString);
  const todayHasilNotifications = hasilSubmissions.filter(s => new Date(s.tanggal).toDateString() === todayString);

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiBell /> Notifikasi Pengajuan Baru
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard 
            title="Pengajuan Judul" 
            icon={<FiFilePlus size={20}/>} 
            notifications={todayTitleNotifications} 
            emptyText="Tidak ada pengajuan judul hari ini." 
            viewLink="/dashboard/admin/verifikasi" 
            iconBgColor="bg-blue-100" 
            iconColor="text-blue-600" 
          />
          <ActionCard 
            title="Pendaftaran Sem. Proposal" 
            icon={<FiClipboard size={20}/>} 
            notifications={todayProposalNotifications} 
            emptyText="Tidak ada pendaftaran proposal." 
            viewLink="/dashboard/admin/proposal" 
            iconBgColor="bg-green-100" 
            iconColor="text-green-600" 
          />
          <ActionCard 
            title="Pendaftaran Sem. Hasil" 
            icon={<FiCheckSquare size={20}/>} 
            notifications={todayHasilNotifications} 
            emptyText="Tidak ada pendaftaran hasil." 
            viewLink="/dashboard/admin/semhas" 
            iconBgColor="bg-orange-100" 
            iconColor="text-orange-600" 
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiFilter size={18}/> Filter Data Statistik</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <div><label className="text-sm font-medium text-gray-600">Jenis Periode</label><select name="periode" value={filters.periode} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md bg-white text-sm"><option value="harian">Harian</option><option value="bulanan">Bulanan</option><option value="ajaran">Tahun Ajaran</option><option value="tahunan">Tahunan</option></select></div>
             {filters.periode !== 'tahunan' && (<div><label className="text-sm font-medium text-gray-600 capitalize">Pilih {filters.periode === 'ajaran' ? 'Semester' : filters.periode.replace(/an$/, '')}</label>{renderFilterInputs()}</div>)}
             <div><label className="text-sm font-medium text-gray-600">Pilih Tahun</label><select name="tahun" value={filters.tahun} onChange={handleFilterChange} className="w-full mt-1 p-2 border rounded-md bg-white text-sm"><option value="2025">2025</option><option value="2024">2024</option><option value="2023">2023</option></select></div>
             <div><button className="w-full bg-blue-600 text-white font-semibold p-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"><FiFilter size={16}/> Terapkan</button></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Judul Terverifikasi" value={stats.totalJudul} subtitle={periodeText} icon={<FiFilePlus size={22}/>} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
        <StatCard title="Total Sem. Proposal" value={stats.totalProposal} subtitle={periodeText} icon={<FiClipboard size={22}/>} iconBgColor="bg-green-100" iconColor="text-green-600" />
        <StatCard title="Total Sem. Hasil" value={stats.totalHasil} subtitle={periodeText} icon={<FiCheckSquare size={22}/>} iconBgColor="bg-orange-100" iconColor="text-orange-600" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
           <h3 className="text-lg font-semibold mb-1 flex items-center gap-2"><FiBarChart2 size={20}/> Statistik Pengajuan Terverifikasi</h3>
           <p className="text-sm text-gray-500 mb-6">{periodeText}</p>
           <div className="flex justify-center gap-4 mb-4 text-xs font-medium"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span>Pengajuan Judul</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-500"></div><span>Sem. Proposal</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-orange-500"></div><span>Sem. Hasil</span></div></div>
           <div className="flex gap-4 h-80">
               <div className="flex flex-col-reverse justify-between text-xs text-gray-500 font-medium">{yAxisLabels.map(label => <span key={label}>{label}</span>)}</div>
               <div className="w-full relative border-l border-b border-gray-300">
                   {yAxisLabels.slice(1).map(label => (<div key={label} className="absolute w-full border-b border-dashed border-gray-200" style={{ bottom: `calc(${(label / yAxisMax) * 100}% - 1px)` }}></div>))}
                   {stats.totalJudul === 0 && stats.totalProposal === 0 && stats.totalHasil === 0 ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                           <FiInfo className="w-10 h-10 text-gray-400 mb-2"/>
                           <p className="font-semibold text-gray-600">Tidak ada data terverifikasi</p>
                           <p className="text-sm text-gray-400">Silakan ubah filter periode di atas.</p>
                       </div>
                    ) : (
                       <div className="absolute bottom-0 left-0 right-0 h-full flex justify-around items-end px-4">
                           <div className="w-1/3 flex flex-col items-center gap-2"><div className="flex justify-center items-end gap-1 w-full h-full"><div className="bg-blue-500 w-1/4 rounded-t-md transition-all duration-300" title={`Judul: ${chartData.si.judul}`} style={{ height: `${(chartData.si.judul / yAxisMax) * 100}%` }}></div><div className="bg-green-500 w-1/4 rounded-t-md transition-all duration-300" title={`Proposal: ${chartData.si.proposal}`} style={{ height: `${(chartData.si.proposal / yAxisMax) * 100}%` }}></div><div className="bg-orange-500 w-1/4 rounded-t-md transition-all duration-300" title={`Hasil: ${chartData.si.hasil}`} style={{ height: `${(chartData.si.hasil / yAxisMax) * 100}%` }}></div></div><p className="text-sm text-gray-600 font-medium">Sistem Informasi</p></div>
                           <div className="w-1/3 flex flex-col items-center gap-2"><div className="flex justify-center items-end gap-1 w-full h-full"><div className="bg-blue-500 w-1/4 rounded-t-md transition-all duration-300" title={`Judul: ${chartData.mtk.judul}`} style={{ height: `${(chartData.mtk.judul / yAxisMax) * 100}%` }}></div><div className="bg-green-500 w-1/4 rounded-t-md transition-all duration-300" title={`Proposal: ${chartData.mtk.proposal}`} style={{ height: `${(chartData.mtk.proposal / yAxisMax) * 100}%` }}></div><div className="bg-orange-500 w-1/4 rounded-t-md transition-all duration-300" title={`Hasil: ${chartData.mtk.hasil}`} style={{ height: `${(chartData.mtk.hasil / yAxisMax) * 100}%` }}></div></div><p className="text-sm text-gray-600 font-medium">Matematika</p></div>
                       </div>
                    )}
               </div>
           </div>
            <p className="text-center text-sm font-semibold text-gray-700 mt-4">Jurusan</p>
      </div>
      
    </div>
  );
}