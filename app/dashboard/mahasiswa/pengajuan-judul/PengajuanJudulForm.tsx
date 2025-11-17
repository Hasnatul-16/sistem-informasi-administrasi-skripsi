"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiSend, FiFileText } from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import type { Dosen } from '@prisma/client'; 

const MySwal = withReactContent(Swal);

interface PengajuanJudulFormProps {
  dosenList: Dosen[];
}

type FilesState = {
  transkrip: File | null;
  ukt: File | null;
  konsultasi: File | null;
};
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

export default function PengajuanJudulForm({ dosenList }: PengajuanJudulFormProps) {
  const initialFormData = { judul: '', topik: '', usulan_pembimbing1: '', usulan_pembimbing2: '', usulan_pembimbing3: '' };
  const initialFilesState = { transkrip: null, ukt: null, konsultasi: null };

  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState<FilesState>(initialFilesState);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target as HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target as HTMLInputElement & { name: keyof FilesState };
    if (inputFiles && inputFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: inputFiles[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.judul || !formData.topik || !formData.usulan_pembimbing1 || !formData.usulan_pembimbing2 || !files.transkrip || !files.ukt || !files.konsultasi) {
      MySwal.fire({ icon: 'warning', title: 'Form Belum Lengkap', text: 'Harap lengkapi semua field yang ditandai dengan *' });
      return;
    }

    const pembimbing1 = formData.usulan_pembimbing1.trim();
    const pembimbing2 = formData.usulan_pembimbing2.trim();
    const pembimbing3 = formData.usulan_pembimbing3.trim();

    if (pembimbing1 === pembimbing2) {
      MySwal.fire({ icon: 'error', title: 'Pembimbing Tidak Valid', text: 'Usulan Pembimbing 1 dan Pembimbing 2 tidak boleh sama' });
      return;
    }

    if (pembimbing3 && (pembimbing1 === pembimbing3 || pembimbing2 === pembimbing3)) {
      MySwal.fire({ icon: 'error', title: 'Pembimbing Tidak Valid', text: 'Usulan Pembimbing 3 tidak boleh sama dengan Pembimbing 1 atau Pembimbing 2' });
      return;
    }

    setIsLoading(true);
    const submissionData = new FormData();

    submissionData.append('judul', formData.judul);
    submissionData.append('topik', formData.topik);
    submissionData.append('usulan_pembimbing1', formData.usulan_pembimbing1);
    submissionData.append('usulan_pembimbing2', formData.usulan_pembimbing2);
    if (formData.usulan_pembimbing3) submissionData.append('usulan_pembimbing3', formData.usulan_pembimbing3);

    Object.entries(files).forEach(([key, value]) => {
      if (value) submissionData.append(key, value as File);
    });

    try {
      const response = await fetch('/api/submission', { method: 'POST', body: submissionData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal mengirim pengajuan.');

      MySwal.fire({ icon: 'success', title: 'Berhasil!', text: 'pengajuan berhasil .', timer: 2000, showConfirmButton: false });
      router.push('/dashboard/mahasiswa');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      MySwal.fire({ icon: 'error', title: 'Gagal Mengirim', text: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pengajuan Judul Skripsi</h1>
          <p className="text-gray-600 mt-1">Lengkapi form berikut untuk mengajukan judul skripsi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Informasi Judul</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="topik" className="block text-sm font-medium text-gray-700 mb-1">Topik <span className="text-red-500">*</span></label>
                <input id="topik" name="topik" type="text" value={formData.topik} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required placeholder="Contoh: Machine Learning"/>
              </div>
              <div>
                <label htmlFor="judul" className="block text-sm font-medium text-gray-700 mb-1">Judul Skripsi <span className="text-red-500">*</span></label>
                <textarea id="judul" name="judul" rows={4} value={formData.judul} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan judul skripsi Anda..." required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div>
                  <label htmlFor="usulan_pembimbing1" className="block text-sm font-medium text-gray-700 mb-1">Usulan Calon Pembimbing 1 <span className="text-red-500">*</span></label>
                  <select id="usulan_pembimbing1" name="usulan_pembimbing1" value={formData.usulan_pembimbing1} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                    <option value="" disabled>Pilih Dosen</option>
                    {Array.isArray(dosenList) && dosenList.length > 0 ? (
                      dosenList.map(dosen => (
                        <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama ?? '—'}</option>
                      ))
                    ) : (
                      <option value="" disabled>Tidak ada dosen</option>
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="usulan_pembimbing2" className="block text-sm font-medium text-gray-700 mb-1">Usulan Calon Pembimbing 2 <span className="text-red-500">*</span></label>
                  <select id="usulan_pembimbing2" name="usulan_pembimbing2" value={formData.usulan_pembimbing2} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                    <option value="" disabled>Pilih Dosen</option>
                    {Array.isArray(dosenList) && dosenList.length > 0 ? (
                      dosenList.map(dosen => (
                        <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama ?? '—'}</option>
                      ))
                    ) : (
                      <option value="" disabled>Tidak ada dosen</option>
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="usulan_pembimbing3" className="block text-sm font-medium text-gray-700 mb-1">Usulan Calon Pembimbing 3 </label>
                  <select id="usulan_pembimbing3" name="usulan_pembimbing3" value={formData.usulan_pembimbing3} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="">Pilih Dosen</option>
                    {Array.isArray(dosenList) && dosenList.length > 0 ? (
                      dosenList.map(dosen => (
                        <option key={dosen.id} value={dosen.nama ?? ''}>{dosen.nama ?? '—'}</option>
                      ))
                    ) : (
                      <option value="">Tidak ada dosen</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Dokumen Persyaratan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FileUploadBox id="transkrip" name="transkrip" label="Transkrip Nilai" file={files.transkrip} onChange={handleFileChange} />
              <FileUploadBox id="ukt" name="ukt" label="Bukti Pembayaran UKT" file={files.ukt} onChange={handleFileChange} />
              <FileUploadBox id="konsultasi" name="konsultasi" label="Lembar Konsultasi" file={files.konsultasi} onChange={handleFileChange} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
              {isLoading ? 'Mengirim...' : <><FiSend /> Kirim Pengajuan</>}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}