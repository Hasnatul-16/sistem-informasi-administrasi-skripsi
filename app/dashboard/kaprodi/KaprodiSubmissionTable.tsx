"use client";

import { useState } from 'react';
import type { ThesisSubmission, StudentProfile, User, Dosen } from '@prisma/client';

// Definisikan tipe data gabungan
type SubmissionWithStudent = ThesisSubmission & {
  student: StudentProfile & { user: User };
};

// Tipe props untuk komponen
interface KaprodiTableProps {
  initialSubmissions: SubmissionWithStudent[];
  lecturers: Dosen[];
}

export default function KaprodiSubmissionTable({ initialSubmissions, lecturers }: KaprodiTableProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithStudent | null>(null);
  const [pembimbing, setPembimbing] = useState({ p1: '', p2: '' });

  const openModal = (submission: SubmissionWithStudent) => {
    setSelectedSubmission(submission);
    setPembimbing({ p1: '', p2: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const handleAssign = async () => {
    if (!selectedSubmission || !pembimbing.p1 || !pembimbing.p2) {
      alert("Harap pilih Pembimbing 1 dan Pembimbing 2.");
      return;
    }

    try {
      const response = await fetch(`/api/submission/${selectedSubmission.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pembimbing1: pembimbing.p1, pembimbing2: pembimbing.p2 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menyimpan data');
      }

      const updated = await response.json();
      setSubmissions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      alert('Dosen Pembimbing berhasil ditetapkan!');
      closeModal();

    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      {/* Tabel Utama */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          {/* ... thead sama seperti tabel admin ... */}
          <thead className="bg-gray-50">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mahasiswa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {submissions.length === 0 ? (
              <tr><td colSpan={4} className="py-4 text-center text-gray-500">Tidak ada pengajuan untuk diproses.</td></tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id}>
                  <td className="px-6 py-4">{sub.student.fullName}</td>
                  <td className="px-6 py-4 max-w-sm">{sub.judul}</td>
                  <td className="px-6 py-4">{sub.status.replace('_', ' ')}</td>
                  <td className="px-6 py-4">
                    {sub.status === 'DIPROSES_KAPRODI' ? (
                      <button onClick={() => openModal(sub)} className="text-indigo-600 hover:text-indigo-900 font-medium">
                        Tetapkan Pembimbing
                      </button>
                    ) : (
                      <span className="text-green-600 font-semibold">Selesai</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal untuk Menetapkan Pembimbing */}
      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Tetapkan Pembimbing</h2>
            <p className="mb-2"><strong>Mahasiswa:</strong> {selectedSubmission.student.fullName}</p>
            <p className="mb-6"><strong>Judul:</strong> {selectedSubmission.judul}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pembimbing 1</label>
                <select value={pembimbing.p1} onChange={e => setPembimbing({...pembimbing, p1: e.target.value})} className="mt-1 block w-full input-style">
                  <option value="">-- Pilih Dosen --</option>
                  {lecturers.map(d => <option key={d.id} value={d.nama}>{d.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pembimbing 2</label>
                <select value={pembimbing.p2} onChange={e => setPembimbing({...pembimbing, p2: e.target.value})} className="mt-1 block w-full input-style">
                  <option value="">-- Pilih Dosen --</option>
                  {lecturers.map(d => <option key={d.id} value={d.nama}>{d.nama}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
              <button onClick={handleAssign} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}