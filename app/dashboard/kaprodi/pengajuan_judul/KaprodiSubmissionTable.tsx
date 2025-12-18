"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Judul, Mahasiswa, User, Dosen, Status } from '@prisma/client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FiX, FiClock, FiCheckCircle, FiFileText, FiUsers, FiBook, FiTag, FiSettings, FiCalendar, FiUser, FiHash, FiSearch, FiSave } from 'react-icons/fi';
import { Pagination } from '@/components/ui/pagination';

const MySwal = withReactContent(Swal);

type SubmissionWithStudent = Judul & {
  mahasiswa: Mahasiswa & { user: User };
};

interface KaprodiTableProps {
  initialSubmissions: SubmissionWithStudent[];
  lecturers: Dosen[];
}

const StatusBadge = ({ status }: { status: Status }) => {
  const statusConfig: { [key in Status]?: { text: string; icon: React.ComponentType<{ className?: string }>; color: string } } = {
    DIPROSES_KAPRODI: { text: "Perlu Diproses", icon: FiClock, color: "bg-purple-100 text-purple-800" },
    DISETUJUI: { text: "Selesai ", icon: FiCheckCircle, color: "bg-green-100 text-green-800" },
  };
  const config = statusConfig[status] || { text: status.replace('_', ' '), icon: FiFileText, color: "bg-gray-100 text-gray-800" };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.text}
    </span>
  );
};


export default function KaprodiSubmissionTable({ initialSubmissions, lecturers }: KaprodiTableProps) {
  const searchParams = useSearchParams();
  const urlMonth = searchParams.get('month');
  const urlYear = searchParams.get('year');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [submissions, setSubmissions] = useState(initialSubmissions ?? []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [pembimbing, setPembimbing] = useState({ p1: '', p2: '' });
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState({
    month: urlMonth ? parseInt(urlMonth) : currentMonth,
    year: urlYear ? parseInt(urlYear) : currentYear,
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
    setCurrentPage(1); // Reset page on filter
  };

  const displayData = useMemo(() => {
    const dateFiltered = submissions.filter(sub => {
      const subDate = new Date(sub.tanggal);
      return subDate.getMonth() + 1 === filters.month && subDate.getFullYear() === filters.year;
    });

    const lowerSearchTerm = searchTerm.toLowerCase();
    if (lowerSearchTerm === '') {
      return dateFiltered;
    }

    return dateFiltered.filter(sub =>
      sub.mahasiswa.nama.toLowerCase().includes(lowerSearchTerm) ||
      sub.mahasiswa.nim.toLowerCase().includes(lowerSearchTerm) ||
      sub.judul.toLowerCase().includes(lowerSearchTerm) ||
      sub.topik.toLowerCase().includes(lowerSearchTerm)
    );
  }, [submissions, filters, searchTerm]);

  // Paginate data
  const totalItems = displayData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = displayData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };


  useEffect(() => {
    setSubmissions(initialSubmissions ?? []);
  }, [initialSubmissions]);

  const openModal = (submission: SubmissionWithStudent) => {
    setSelectedSubmission(submission);
    const p1_usulan = lecturers.find(d => d.nama === submission.usulan_pembimbing1) ? submission.usulan_pembimbing1 : '';
    const p2_usulan = lecturers.find(d => d.nama === submission.usulan_pembimbing2) ? submission.usulan_pembimbing2 : '';
    setPembimbing({ p1: p1_usulan || '', p2: p2_usulan || '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleAssign = async () => {
    if (!selectedSubmission || !pembimbing.p1 || !pembimbing.p2) {
      MySwal.fire({ icon: 'warning', title: 'Belum Lengkap', text: 'Harap pilih Pembimbing 1 dan Pembimbing 2.' });
      return;
    }
    if (pembimbing.p1 === pembimbing.p2) {
      MySwal.fire({ icon: 'warning', title: 'Pilihan Tidak Valid', text: 'Pembimbing 1 dan 2 tidak boleh orang yang sama.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/submission/${selectedSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pembimbing1: pembimbing.p1, pembimbing2: pembimbing.p2 }),
      });
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse?.message || 'Gagal menyimpan data');
      }
      const updated = await response.json();

      MySwal.fire({ icon: 'success', title: 'Berhasil!', text: 'Dosen Pembimbing berhasil ditetapkan.', timer: 2000, showConfirmButton: false });

      setSubmissions(prev =>
        prev.map(s => s.id === updated.id ? { ...s, ...updated } : s)
      );

      closeModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
      MySwal.fire({ icon: 'error', title: 'Oops...', text: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      <div className="bg-[#325827] p-3 sm:p-4 rounded-lg shadow-md flex flex-col gap-3 sm:gap-4 mb-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex flex-col w-full sm:w-auto">
              <label htmlFor="month" className="text-white font-semibold text-xs sm:text-sm">Bulan</label>
              <select id="month" name="month" value={filters.month} onChange={handleFilterChange}
                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-full sm:min-w-[120px] text-sm">
                {monthOptions.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <label htmlFor="year" className="text-white font-semibold text-xs sm:text-sm">Tahun</label>
              <select id="year" name="year" value={filters.year} onChange={handleFilterChange}
                className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-full sm:min-w-[100px] text-sm">
                {yearOptions.map(year => <option key={year} value={year} className="text-black">{year}</option>)}
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari nama, NIM, atau Judul..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-8 sm:pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
            <FiSearch className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md border">
        <table className="min-w-full w-full bg-white border divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[150px]">
                <div className="flex items-center gap-1"><FiUsers size={12} className="text-green-800" /> <span>Mahasiswa</span></div>
              </th>
              <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[120px]">
                <div className="flex items-center gap-1"><FiCalendar size={12} className="text-green-800" /> <span>Tgl Pengajuan</span></div>
              </th>
              <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[200px]">
                <div className="flex items-center gap-1"><FiBook size={12} className="text-green-800" /> <span>Judul Skripsi</span></div>
              </th>
              <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[100px]">
                <div className="flex items-center gap-1"><FiTag size={12} className="text-green-800" /> <span>Topik</span></div>
              </th>
              <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[150px]">
                <div className="flex items-center gap-1"><FiUsers size={12} className="text-green-800" /> <span>Usulan Pembimbing</span></div>
              </th>
              <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-left min-w-[150px]">
                <div className="flex items-center gap-1"><FiUsers size={12} className="text-green-800" /> <span>Pembimbing</span></div>
              </th>
              <th className="px-4 sm:px-6 py-2 sm:py-3 font-bold text-slate-800 text-xs text-center min-w-[80px]">
                <div className="flex items-center gap-1 justify-center"><FiSettings size={12} className="text-green-800" /> <span>Aksi</span></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr><td colSpan={7} className="px-4 sm:px-6 py-8 sm:py-10 text-center text-gray-500 text-sm">Tidak ada pengajuan yang cocok dengan filter atau pencarian.</td></tr>
            ) : (
              paginatedData.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-2 sm:py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <FiUser size={12} className="text-green-800 flex-shrink-0" />
                        <span className="text-xs text-gray-700 break-words">
                          <span className="font-semibold">Nama: </span>
                          {sub.mahasiswa.nama}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiHash size={12} className="text-green-800 flex-shrink-0" />
                        <span className="text-xs text-gray-700 break-words">
                          <span className="font-semibold">NIM: </span>
                          {sub.mahasiswa.nim}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs text-gray-700">
                    {new Date(sub.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 sm:px-6 py-2 sm:py-3">
                    <p className="text-xs text-gray-800 break-words">{sub.judul}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs text-gray-700 break-words">
                    {sub.topik}
                  </td>
                  <td className="px-4 sm:px-6 py-2 sm:py-3">
                    <ul className="text-[10px] text-gray-600 space-y-1">
                      <li>1. {sub.usulan_pembimbing1}</li>
                      <li>2. {sub.usulan_pembimbing2}</li>
                      {sub.usulan_pembimbing3 && (<li>3. {sub.usulan_pembimbing3}</li>)}
                    </ul>
                  </td>
                  <td className="px-4 sm:px-6 py-2 sm:py-3">
                    <ul className="text-[10px] text-gray-600 space-y-1">
                      <li>1. {sub.pembimbing1}</li>
                      <li>2. {sub.pembimbing2}</li>
                    </ul>
                  </td>
                  <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs font-medium text-center">
                    {sub.status === 'DIPROSES_KAPRODI' ? (
                      <button
                        onClick={() => openModal(sub)}
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold"
                        title="Tetapkan Pembimbing"
                      >
                        <FiSave className="h-4 w-4" /> Tetapkan
                      </button>
                    ) : (
                      <StatusBadge status={sub.status} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={totalItems}
        />
      </div>

      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg sm:max-w-2xl md:max-w-3xl animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-4 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Tetapkan Dosen Pembimbing</h2>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Detail Pengajuan</h3>
              </div>
              <div className="flex items-center gap-3">
                <FiUser className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Nama Mahasiswa</p>
                  <p className="font-semibold">{selectedSubmission.mahasiswa.nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiHash className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">NIM</p>
                  <p className="font-semibold">{selectedSubmission.mahasiswa.nim}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiTag className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Topik</p>
                  <p className="font-semibold">{selectedSubmission.topik}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiBook className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Judul Skripsi</p>
                  <p className="font-semibold leading-relaxed">{selectedSubmission.judul}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="bg-slate-50 p-4 rounded-lg border mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Usulan dari Mahasiswa:</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>1. {selectedSubmission.usulan_pembimbing1}</li>
                  <li>2. {selectedSubmission.usulan_pembimbing2}</li>
                  {selectedSubmission.usulan_pembimbing3 && <li>3. {selectedSubmission.usulan_pembimbing3}</li>}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pembimbing 1</label>
                  <select value={pembimbing.p1} onChange={e => setPembimbing({ ...pembimbing, p1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-white" required>
                    <option value="" disabled>-- Pilih Dosen --</option>
                    {lecturers.map(dosen => <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pembimbing 2</label>
                  <select value={pembimbing.p2} onChange={e => setPembimbing({ ...pembimbing, p2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-white" required>
                    <option value="" disabled>-- Pilih Dosen --</option>
                    {lecturers.map(dosen => <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={handleAssign} disabled={isLoading} className="px-4 py-2 bg-[#325827] text-white font-semibold rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Menyimpan...' : 'Simpan & Tetapkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
