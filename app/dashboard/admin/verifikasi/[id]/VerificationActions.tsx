// src/app/dashboard/admin/verifikasi/[id]/VerificationActions.tsx
"use client";

import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function VerificationActions({ submissionId }: { submissionId: string }) {
  const router = useRouter();

  const handleAction = async (action: 'VERIFY' | 'REJECT') => {
    let catatanAdmin = '';
    if (action === 'REJECT') {
      catatanAdmin = prompt("Masukkan alasan penolakan untuk mahasiswa:") || "";
      if (!catatanAdmin) {
        alert("Alasan penolakan tidak boleh kosong.");
        return;
      }
    }

    try {
      const response = await fetch(`/api/submission/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catatanAdmin }),
      });

      if (!response.ok) throw new Error('Gagal memproses aksi');

      alert(`Pengajuan berhasil di-${action === 'VERIFY' ? 'teruskan ke Kaprodi' : 'kembalikan ke mahasiswa'}!`);
      router.push('/dashboard/admin');
      router.refresh();

    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memproses aksi.');
    }
  };

  return (
    <div className="flex justify-end items-center gap-4 pt-6 mt-6 border-t">
      <button 
        onClick={() => handleAction('REJECT')}
        className="inline-flex items-center gap-2 py-2 px-5 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors"
      >
        <FiXCircle /> Tolak & Kembalikan
      </button>
      <button 
        onClick={() => handleAction('VERIFY')}
        className="inline-flex items-center gap-2 py-2 px-5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
      >
        <FiCheckCircle /> Lengkap & Teruskan ke Kaprodi
      </button>
    </div>
  );
}