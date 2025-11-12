"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Judul, Mahasiswa, User, Dosen, Status } from '@prisma/client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FiX, FiClock, FiCheckCircle, FiFileText, FiUsers, FiBook, FiTag, FiSettings, FiCalendar, FiUser, FiHash, FiSearch } from 'react-icons/fi';

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
    DISETUJUI: { text: "Selesai Diproses", icon: FiCheckCircle, color: "bg-green-100 text-green-800" },
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
  const [submissions, setSubmissions] = useState(initialSubmissions ?? []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [pembimbing, setPembimbing] = useState({ p1: '', p2: '' });
  const [isLoading, setIsLoading] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState({
    month: currentMonth,
    year: currentYear,
  });

  const [searchTerm, setSearchTerm] = useState('');

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) }));
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
    <>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4 mb-6">
        
        <div className="flex items-center gap-4">
          <div className='flex flex-col'>
            <label htmlFor="month" className="text-white font-semibold text-sm">Bulan</label>
            <select id="month" name="month" value={filters.month} onChange={handleFilterChange}
              className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-[120px]">
              {monthOptions.map(opt => <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>)}
            </select>
          </div>
          <div className='flex flex-col'>
            <label htmlFor="year" className="text-white font-semibold text-sm">Tahun</label>
            <select id="year" name="year" value={filters.year} onChange={handleFilterChange}
              className="p-2 border border-white/30 rounded-md bg-white/20 text-white focus:ring-2 focus:ring-white/50 min-w-[100px]">
              {yearOptions.map(year => <option key={year} value={year} className="text-black">{year}</option>)}
            </select>
          </div>
        </div>

        <div className="relative self-end">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NIM, atau Judul..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md border">
        <table className="min-w-full">
          <thead className="border-b-2 border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]"><div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600" /> <span>Mahasiswa</span></div></th>
              <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiCalendar size={16} className="text-blue-600" /> <span>Tgl Pengajuan</span></div></th>
              <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[25%]"><div className="flex items-center gap-2"><FiBook size={16} className="text-blue-600" /> <span>Judul Skripsi</span></div></th>
              <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiTag size={16} className="text-blue-600" /> <span>Topik</span></div></th>
              <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600" /> <span>Usulan Pembimbing</span></div></th>
              <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]"><div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600" /> <span>Pembimbing</span></div></th>
              <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[10%]"><div className="flex items-center gap-2"><FiSettings size={16} className="text-blue-600" /> <span>Aksi</span></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-gray-500">Tidak ada pengajuan yang cocok dengan filter atau pencarian.</td></tr>
            ) : (
              displayData.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sub.mahasiswa.nama}</div>
                    <div className="text-sm text-gray-500">{sub.mahasiswa.nim}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(sub.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4"><p className="text-sm text-gray-800 whitespace-normal">{sub.judul}</p></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sub.topik}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>1. {sub.usulan_pembimbing1}</li>
                      <li>2. {sub.usulan_pembimbing2}</li>
                      {sub.usulan_pembimbing3 && (<li>3. {sub.usulan_pembimbing3}</li>)}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>1. {sub.pembimbing1}</li>
                      <li>2. {sub.pembimbing2}</li>
                    </ul>
                  </td>
                  <td className="px-6 py-4">
                    {sub.status === 'DIPROSES_KAPRODI' ? (
                      <button onClick={() => openModal(sub)} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
                        Tetapkan
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
      </div>

      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl animate-fade-in-scale">
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
                  <select value={pembimbing.p1} onChange={e => setPembimbing({ ...pembimbing, p1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                    <option value="" disabled>-- Pilih Dosen --</option>
                    {lecturers.map(dosen => <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pembimbing 2</label>
                  <select value={pembimbing.p2} onChange={e => setPembimbing({ ...pembimbing, p2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                    <option value="" disabled>-- Pilih Dosen --</option>
                    {lecturers.map(dosen => <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={handleAssign} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Menyimpan...' : 'Simpan & Tetapkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}