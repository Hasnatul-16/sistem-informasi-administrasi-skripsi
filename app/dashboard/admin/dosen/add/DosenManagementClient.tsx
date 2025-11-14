"use client";

import { useState, useEffect } from 'react';
import { Jurusan } from '@prisma/client';
import {
  FiUser, FiHash, FiEdit, FiTrash2, FiPlus, FiSearch,
  FiLoader, FiAlertTriangle, FiCheckCircle, FiX, FiUsers, FiSettings,
  FiUserPlus, FiMail, FiBookOpen
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

type Dosen = {
  id: number;
  nama: string | null;
  nip: string;
  jurusan: Jurusan;
};

const ALL_JURUSAN: Jurusan[] = ['SISTEM_INFORMASI', 'MATEMATIKA'];

export default function DosenManagementClient() {
  const [dosenList, setDosenList] = useState<Dosen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJurusan, setSelectedJurusan] = useState<Jurusan>('SISTEM_INFORMASI');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDosen, setEditingDosen] = useState<Dosen | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    jurusan: 'SISTEM_INFORMASI' as Jurusan,
  });

  const fetchDosen = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dosen/manage?jurusan=${selectedJurusan}&search=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data dosen');
      }
      const data = await response.json();
      setDosenList(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      setDosenList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDosen();
  }, [selectedJurusan, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditModalOpen ? `/api/dosen/manage/${editingDosen?.id}` : '/api/dosen/manage';
      const method = isEditModalOpen ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan data dosen');
      }

      await MySwal.fire({
        icon: 'success',
        title: isEditModalOpen ? 'Berhasil Diperbarui!' : 'Berhasil Ditambahkan!',
        text: isEditModalOpen ? 'Data dosen telah diperbarui.' : 'Dosen baru telah ditambahkan.',
        timer: 2000,
        showConfirmButton: false,
      });

      closeModal();
      fetchDosen();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dosen: Dosen) => {
    const result = await MySwal.fire({
      title: 'Apakah Anda yakin?',
      text: `Data dosen ${dosen.nama} akan dihapus permanen!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/dosen/manage/${dosen.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Gagal menghapus dosen');
        }

        await MySwal.fire({
          icon: 'success',
          title: 'Berhasil Dihapus!',
          text: 'Data dosen telah dihapus.',
          timer: 1500,
          showConfirmButton: false,
        });

        fetchDosen();

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
        MySwal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: message,
        });
      }
    }
  };

  const openAddModal = () => {
    setFormData({ nama: '', nip: '', jurusan: selectedJurusan });
    setIsAddModalOpen(true);
  };

  const openEditModal = (dosen: Dosen) => {
    setFormData({
      nama: dosen.nama || '',
      nip: dosen.nip,
      jurusan: dosen.jurusan,
    });
    setEditingDosen(dosen);
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingDosen(null);
    setFormData({ nama: '', nip: '', jurusan: 'SISTEM_INFORMASI' });
  };

  const filteredDosen = dosenList.filter(dosen =>
    dosen.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dosen.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Dosen</h1>
      </div>

      <p className="text-gray-600">Kelola data dosen Fakultas Sains dan Teknologi</p>

      <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-4">
        
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-white mb-1">
                Filter Jurusan
              </label>
              <div className="flex items-center gap-2">
                {ALL_JURUSAN.map(j => (
                  <button
                    key={j}
                    onClick={() => setSelectedJurusan(j)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full transition duration-150 ${
                      selectedJurusan === j
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {j.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

        
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-white mb-1 opacity-0">
                Action
              </label>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-gray-100 transition duration-150 font-semibold"
              >
                <FiPlus className="h-4 w-4" />
                Tambah Dosen Baru
              </button>
            </div>
          </div>

          <div className="relative self-end">
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-white/30 text-white placeholder-white/70 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 font-sans"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 h-5 w-5" />
          </div>
        </div>

      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">
        
        <p className="mt-1 text-gray-600">
          Data ditampilkan untuk Jurusan:{' '}
          <strong className='text-indigo-700'>{selectedJurusan.replace('_', ' ')}</strong>
        </p>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-10 text-blue-500 flex flex-col items-center">
              <FiLoader className="h-8 w-8 animate-spin" />
              <p className="mt-2">Memuat data...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
              <FiAlertTriangle className="h-5 w-5" />
              <p className='font-medium'>Error: {error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full w-full bg-white border divide-y divide-gray-200 table-fixed">
                <thead className="bg-slate-50">
                  <tr>
                    
                    <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[40%]">
                      <div className="flex items-center gap-2"><FiUsers size={16} className="text-blue-600" /><span>Dosen</span></div>
                    </th>
                  
                    <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[25%]">
                      <div className="flex items-center gap-2"><FiHash size={16} className="text-blue-600" /><span>NIP</span></div>
                    </th>
                   
                    <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[20%]">
                      <div className="flex items-center gap-2"><FiCheckCircle size={16} className="text-blue-600" /><span>Jurusan</span></div>
                    </th>
                  
                    <th className="px-6 py-4 font-bold text-slate-800 text-sm text-left w-[15%]">
                      <div className="flex items-center gap-2"><FiSettings size={16} className="text-blue-600" /><span>Aksi</span></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDosen.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Tidak ada data dosen ditemukan.</td></tr>
                  ) : (
                    filteredDosen.map((dosen) => (
                      <tr key={dosen.id} className="hover:bg-gray-50 transition-colors">
                      
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <FiUser size={14} className="text-blue-600" />
                              <span className="text-sm text-gray-700">
                                <span className="font-semibold">Nama: </span>
                                {dosen.nama || 'Nama tidak tersedia'}
                              </span>
                            </div>
                          </div>
                        </td>
                       
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {dosen.nip}
                        </td>
                      
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {dosen.jurusan.replace('_', ' ')}
                          </span>
                        </td>
                     
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(dosen)}
                               className="inline-flex items-center gap-2 text-green-600 hover:text-green-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                            >
                              <FiEdit className="h-4 w-4" />Edit
                            </button>
                            <button
                              onClick={() => handleDelete(dosen)}
                               className="inline-flex items-center gap-2 text-red-600 hover:text-red-900 font-semibold disabled:text-gray-400 disabled:cursor-wait"
                            >
                              <FiTrash2 className="h-4 w-4" /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 transform transition-all animate-fade-in-scale">

          
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditModalOpen ? 'Edit Dosen' : 'Tambah Dosen Baru'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-500 hover:text-gray-800">
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
             
              <div className="space-y-2">
                <label htmlFor="nama" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FiUser className="h-4 w-4 text-blue-600" />
                  Nama Lengkap
                </label>
                <div className="relative">
                  <input
                    id="nama"
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Masukkan nama lengkap dosen"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="nip" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FiHash className="h-4 w-4 text-blue-600" />
                  NIP (Nomor Induk Pegawai)
                </label>
                <div className="relative">
                  <input
                    id="nip"
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                    className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Masukkan NIP dosen"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="jurusan" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FiBookOpen className="h-4 w-4 text-blue-600" />
                  Jurusan
                </label>
                <div className="relative">
                  <select
                    id="jurusan"
                    value={formData.jurusan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jurusan: e.target.value as Jurusan }))}
                    className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition duration-200 bg-gray-50 focus:bg-white appearance-none"
                  >
                    {ALL_JURUSAN.map(j => (
                      <option key={j} value={j}>{j.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition duration-200 font-medium flex items-center gap-2"
                >
                  <FiX className="h-4 w-4" />
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 transition duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      {isEditModalOpen ? <FiEdit className="h-4 w-4" /> : <FiUserPlus className="h-4 w-4" />}
                      {isEditModalOpen ? 'Perbarui' : 'Tambah'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
