// src/app/dashboard/admin/verifikasi/[id]/VerificationActions.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
// --- 1. Impor SweetAlert2 ---
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function VerificationActions({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Tambahkan state loading

  const handleAction = async (action: 'VERIFY' | 'REJECT') => {

    // --- 2. Ganti prompt() dengan SweetAlert2 ---
    if (action === 'REJECT') {
      const { value: catatanAdmin } = await MySwal.fire({
        title: "Tolak Pengajuan",
        input: "textarea",
        inputLabel: "Alasan Penolakan",
        inputPlaceholder: "Masukkan alasan mengapa pengajuan ini ditolak...",
        inputAttributes: {
          "aria-label": "Masukkan alasan penolakan"
        },
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

      // Jika pengguna menekan "Batal" atau input kosong, hentikan proses
      if (!catatanAdmin) {
        return;
      }

      // Lanjutkan proses penolakan dengan catatan dari SweetAlert
      processSubmission(action, catatanAdmin);

    } else {
      // --- 3. Konfirmasi untuk aksi VERIFY ---
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

  // --- 4. Buat fungsi terpisah untuk memproses data ---
  const processSubmission = async (action: 'VERIFY' | 'REJECT', catatanAdmin = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/submission/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catatanAdmin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memproses aksi.');
      }

      // Tampilkan notifikasi sukses
      await MySwal.fire({
        icon: 'success',
        title: 'Aksi Berhasil!',
        text: `Pengajuan berhasil di-${action === 'VERIFY' ? 'teruskan ke Kaprodi' : 'kembalikan ke mahasiswa'}.`,
        timer: 2000,
        showConfirmButton: false,
      });

      router.push('/dashboard/admin/verifikasi/SISTEM_INFORMASI'); // Arahkan ke halaman daftar verifikasi
      router.refresh();

    } catch (error: any) {
      // Tampilkan notifikasi error
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
    <div className="flex justify-end items-center gap-4 pt-6 mt-6 border-t">
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
  );
}
