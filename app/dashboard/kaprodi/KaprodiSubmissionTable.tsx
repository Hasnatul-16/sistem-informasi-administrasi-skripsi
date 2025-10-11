"use client";

import { useState } from 'react';
import type { ThesisSubmission, StudentProfile, User, Dosen } from '@prisma/client';
// --- 1. Impor SweetAlert2 ---
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Tipe data gabungan
type SubmissionWithStudent = ThesisSubmission & {
  student: StudentProfile & { user: User };
};

// Tipe props
interface KaprodiTableProps {
  initialSubmissions: SubmissionWithStudent[];
  lecturers: Dosen[];
}

export default function KaprodiSubmissionTable({ initialSubmissions, lecturers }: KaprodiTableProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [pembimbing, setPembimbing] = useState({ p1: '', p2: '' });
  const [isLoading, setIsLoading] = useState(false); // Tambahkan state loading

  const openModal = (submission: SubmissionWithStudent) => {
    setSelectedSubmission(submission);
    const p1_usulan = lecturers.find(d => d.nama === submission.usulanPembimbing1) ? submission.usulanPembimbing1 : '';
    const p2_usulan = lecturers.find(d => d.nama === submission.usulanPembimbing2) ? submission.usulanPembimbing2 : '';
    setPembimbing({ p1: p1_usulan, p2: p2_usulan });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  // --- 2. Perbarui fungsi handleAssign ---
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
      
      MySwal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Dosen Pembimbing berhasil ditetapkan.',
        timer: 2000,
        showConfirmButton: false
      });
      
      setSubmissions(prev => prev.filter(s => s.id !== updated.id));
      closeModal();

    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message || 'Terjadi kesalahan pada server.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Mahasiswa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Judul Skripsi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Topik</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Usulan Pembimbing</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {submissions.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-gray-500">Tidak ada pengajuan untuk diproses.</td></tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sub.student.fullName}</div>
                    <div className="text-sm text-gray-500">{sub.student.nim}</div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-800 whitespace-normal">{sub.judul}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">{sub.topik}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>1. {sub.usulanPembimbing1}</li>
                      <li>2. {sub.usulanPembimbing2}</li>
                      {sub.usulanPembimbing3 && (
                        <li>3. {sub.usulanPembimbing3}</li>
                      )}
                    </ul>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => openModal(sub)} className="px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
                      Tetapkan
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Tetapkan Dosen Pembimbing</h2>
            <p className="text-gray-600 mb-6">Untuk: <strong>{selectedSubmission.student.fullName}</strong></p>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Usulan dari Mahasiswa:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>{selectedSubmission.usulanPembimbing1}</li>
                <li>{selectedSubmission.usulanPembimbing2}</li>
                {selectedSubmission.usulanPembimbing3 && <li>{selectedSubmission.usulanPembimbing3}</li>}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pembimbing 1</label>
                <select value={pembimbing.p1} onChange={e => setPembimbing({...pembimbing, p1: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                  <option value="" disabled>-- Pilih Dosen --</option>
                  {lecturers.map(dosen => <option key={dosen.id} value={dosen.nama}>{dosen.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pembimbing 2</label>
                <select value={pembimbing.p2} onChange={e => setPembimbing({...pembimbing, p2: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                  <option value="" disabled>-- Pilih Dosen --</option>
                  {lecturers.map(dosen => <option key={dosen.id} value={dosen.nama}>{dosen.nama}</option>)}
                </select>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300">Batal</button>
              <button onClick={handleAssign} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Menyimpan...' : 'Simpan & Tetapkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}