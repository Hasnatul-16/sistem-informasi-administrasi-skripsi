// File: SeminarProposalForm.tsx

"use client";

import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Mungkin tidak perlu
import { FiUpload, FiSend, FiFileText } from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// --- PERUBAHAN 1: Hapus prop 'isAlreadySubmitted' ---
interface SeminarProposalFormProps {
  judulId: number;
  // isAlreadySubmitted: boolean; // Dihapus
}

// Tipe FilesState (tidak berubah)
type FilesState = {
  proposal: File | null;
  persetujuan: File | null;
  lampiran_5xseminar: File | null;
  transkrip: File | null;
};

// Komponen FileUploadBox (tidak berubah)
const FileUploadBox = ({ id, name, label, file, onChange }: {
    id: string;
    name: keyof FilesState;
    label: string;
    file: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
    <div>
      <label
        htmlFor={id}
        className="flex flex-col items-center justify-center w-full h-40 px-4 text-center border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex flex-col items-center justify-center">
          {file ? (
            <>
              <FiFileText className="w-10 h-10 mb-2 text-green-500" />
              <p className="text-sm font-medium text-gray-800 break-all">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">Klik untuk mengganti file</p>
            </>
          ) : (
            <>
              <FiUpload className="w-10 h-10 mb-2 text-gray-400" />
              <p className="font-semibold text-gray-700">{label} <span className="text-red-500">*</span></p>
              <p className="text-xs text-gray-500">Klik untuk upload (PDF)</p>
            </>
          )}
        </div>
        <input id={id} name={name} type="file" className="hidden" onChange={onChange} accept=".pdf" />
      </label>
    </div>
);


// --- PERUBAHAN 2: Hapus prop 'isAlreadySubmitted' dari parameter ---
export default function SeminarProposalForm({ judulId }: SeminarProposalFormProps) {
  const initialFilesState: FilesState = {
    proposal: null,
    persetujuan: null,
    lampiran_5xseminar: null,
    transkrip: null,
  };

  const [files, setFiles] = useState<FilesState>(initialFilesState);
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target as HTMLInputElement & { name: keyof FilesState };
    if (inputFiles && inputFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: inputFiles[0] }));
    } else {
      setFiles(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // --- PERUBAHAN 3: Hapus pengecekan 'isAlreadySubmitted' di awal ---
    /*
    if (isAlreadySubmitted) {
      MySwal.fire({...});
      return;
    }
    */

    // Validasi kelengkapan form (tidak berubah)
    if (!files.proposal || !files.persetujuan || !files.lampiran_5xseminar || !files.transkrip) {
      MySwal.fire({ icon: 'warning', title: 'Form Belum Lengkap', text: 'Harap lengkapi semua dokumen persyaratan.' });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('id_judul', judulId.toString());

    Object.entries(files).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    try {
      const response = await fetch('/api/proposal', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      // Jika response TIDAK OK (termasuk jika proposal sudah ada)
      if (!response.ok) {
        // --- PERUBAHAN 4: Lempar error agar ditangkap oleh catch ---
        // Pesan error akan diambil dari response API
        throw new Error(result.message || `Gagal mengirim: Status ${response.status}`);
      }

      // Jika response OK (berhasil submit)
      await MySwal.fire({
        icon: 'success',
        title: 'Pendaftaran Terkirim!',
        text: 'Data Anda telah berhasil dikirim.',
        timer: 2000,
        showConfirmButton: false
      });
      // Setelah sukses, bisa refresh atau redirect
      // Contoh: window.location.reload();

    } catch (error: any) {
      // --- PERUBAHAN 5: Tampilkan alert error dari API ---
      // Pesan error di sini akan berisi "Anda sudah mengajukan..." jika API mengembalikannya
      MySwal.fire({
          icon: 'error', // Atau 'info' jika pesan error adalah "sudah diajukan"
          title: 'Gagal Mengirim',
          text: error.message // Tampilkan pesan dari API
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Form (Tidak ada perubahan di sini) ---
  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Seminar Proposal</h1>
          <p className="text-gray-600 mt-1">Upload dokumen persyaratan untuk mendaftar seminar proposal.</p>
           {/* Hapus pesan info di sini jika tidak diperlukan */}
           {/* {isAlreadySubmitted && ( ... )} */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Dokumen Persyaratan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {/* FileUploadBox tidak berubah */}
              <FileUploadBox
                id="proposal" name="proposal" label="Draft Proposal Skripsi"
                file={files.proposal} onChange={handleFileChange}
              />
              <FileUploadBox
                id="persetujuan" name="persetujuan" label="Lampiran Persetujuan Pembimbing"
                file={files.persetujuan} onChange={handleFileChange}
              />
              <FileUploadBox
                id="lampiran_5xseminar" name="lampiran_5xseminar" label="Bukti Mengikuti Seminar (min. 5)"
                file={files.lampiran_5xseminar} onChange={handleFileChange}
              />
              <FileUploadBox
                id="transkrip" name="transkrip" label="Transkrip Nilai Terbaru"
                file={files.transkrip} onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              // Tombol hanya disabled saat loading, tidak berdasarkan status submit
              disabled={isLoading}
              className="inline-flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mengirim...' : <><FiSend /> Kirim Pendaftaran</>}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}