"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// --- PERUBAHAN: Tambahkan tipe data yang dibutuhkan ---
import type { Judul, Mahasiswa, User } from '@prisma/client';
import { FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// --- PERUBAHAN 1: Definisikan tipe data lengkap untuk 'submission' ---
type SubmissionWithStudent = Judul & {
  student:Mahasiswa & { user: User };
};

// --- PERUBAHAN 2: Terima seluruh objek submission, bukan hanya ID ---
export default function VerificationActions({ submission }: { submission: SubmissionWithStudent }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'VERIFY' | 'REJECT') => {
    if (action === 'REJECT') {
      const { value: catatanAdmin } = await MySwal.fire({
        title: "Tolak Pengajuan",
        input: "textarea",
        inputLabel: "Alasan Penolakan",
        inputPlaceholder: "Masukkan alasan mengapa pengajuan ini ditolak...",
        inputAttributes: { "aria-label": "Masukkan alasan penolakan" },
        showCancelButton: true,
        confirmButtonText: 'Tolak & Kirim',
        confirmButtonColor: '#d33',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
          if (!value) {
            return "Alasan penolakan tidak boleh kosong!";
          }
        }
      });
      if (!catatanAdmin) return;
      processSubmission(action, catatanAdmin);
    } else {
      MySwal.fire({
        title: "Teruskan ke Kaprodi?",
        text: "Anda yakin data dan dokumen pengajuan ini sudah lengkap?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: 'Ya, teruskan!',
        confirmButtonColor: '#3085d6',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          processSubmission(action);
        }
      });
    }
  };

  const processSubmission = async (action: 'VERIFY' | 'REJECT', catatanAdmin = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/submission/${submission.id}`, { // Menggunakan submission.id
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catatanAdmin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memproses aksi.');
      }

      await MySwal.fire({
        icon: 'success',
        title: 'Aksi Berhasil!',
        text: `Pengajuan berhasil di-${action === 'VERIFY' ? 'teruskan ke Kaprodi' : 'kembalikan ke mahasiswa'}.`,
        timer: 2000,
        showConfirmButton: false,
      });

      // --- PERUBAHAN 3: Arahkan ke halaman jurusan yang benar (dinamis) ---
      router.push(`/dashboard/admin/verifikasi/${submission.jurusan}`);
      router.refresh();

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
    // --- PERUBAHAN 4: Ubah layout untuk menampung tombol Kembali ---
    <div className="flex justify-between items-center gap-4 pt-6 mt-6 border-t">
      {/* Tombol Kembali */}
      <button
        onClick={() => router.back()} // Menggunakan router.back() untuk kembali
        className="inline-flex items-center gap-2 py-2 px-5 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
      >
        <FiArrowLeft /> Kembali
      </button>

      {/* Grup Tombol Aksi */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleAction('REJECT')}
          disabled={isLoading}
          className="inline-flex items-center gap-2 py-2 px-5 border border-red-500 text-red-500 rounded-md font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <FiXCircle /> Tolak & Kembalikan
        </button>
        <button
          onClick={() => handleAction('VERIFY')}
          disabled={isLoading}
          className="inline-flex items-center gap-2 py-2 px-5 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Memproses...' : <><FiCheckCircle /> Lengkap & Teruskan</>}
        </button>
      </div>
    </div>
  );
}