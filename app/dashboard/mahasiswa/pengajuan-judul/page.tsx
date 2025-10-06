"use client";

import { useState } from 'react';
import { FiUpload, FiSend, FiFileText } from 'react-icons/fi';

type FileUploadBoxProps = {
  id: string;
  name: keyof FilesState;
  label: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

type FilesState = {
  transkrip: File | null;
  ukt: File | null;
  konsultasi: File | null;
};

const FileUploadBox = ({ id, name, label, file, onChange }: FileUploadBoxProps) => {
  return (
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
              <p className="text-xs text-gray-500">Klik untuk upload</p>
            </>
          )}
        </div>
        <input 
          id={id} 
          name={name} 
          type="file" 
          className="hidden" 
          onChange={onChange} 
          accept=".pdf"
        />
      </label>
    </div>
  );
};

export default function PengajuanJudulPage() {
  const [formData, setFormData] = useState({
    jurusan: 'SISTEM_INFORMASI',
    judul: '',
    topik: '',
    usulanPembimbing1: '',
    usulanPembimbing2: '',
    usulanPembimbing3: '',
  });

  const [files, setFiles] = useState<FilesState>({
    transkrip: null,
    ukt: null,
    konsultasi: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target as HTMLInputElement & { name: keyof FilesState };
    if (inputFiles && inputFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: inputFiles[0] }));
    }
  };

  // --- PERUBAHAN UTAMA ADA DI FUNGSI INI ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.judul || !formData.topik || !formData.usulanPembimbing1 || !formData.usulanPembimbing2 || !files.transkrip || !files.ukt || !files.konsultasi) {
      alert('Harap lengkapi semua field yang ditandai dengan *');
      return;
    }

    const submissionData = new FormData();
    submissionData.append('jurusan', formData.jurusan);
    submissionData.append('judul', formData.judul);
    submissionData.append('topik', formData.topik);
    submissionData.append('usulanPembimbing1', formData.usulanPembimbing1);
    submissionData.append('usulanPembimbing2', formData.usulanPembimbing2);
    submissionData.append('usulanPembimbing3', formData.usulanPembimbing3);
    
    if (files.transkrip) submissionData.append('transkrip', files.transkrip);
    if (files.ukt) submissionData.append('ukt', files.ukt);
    if (files.konsultasi) submissionData.append('konsultasi', files.konsultasi);

    // Mengganti console.log dengan logika pengiriman data ke API
    try {
      const response = await fetch('/api/submission', {
        method: 'POST',
        body: submissionData,
      });

      if (response.ok) {
        alert('Pengajuan berhasil dikirim ke server!');
        // Refresh halaman untuk mereset form dan melihat status baru jika ada
        window.location.reload(); 
      } else {
        // Menampilkan pesan error dari server jika ada
        const errorData = await response.json();
        alert(`Gagal mengirim pengajuan: ${errorData.message}`);
      }
    } catch (error) {
      // Menangani error jaringan atau error tak terduga lainnya
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan pada sistem. Periksa koneksi Anda.');
    }
  };

  const dosenList = [
    { id: 'dosen_a', nama: 'Prof. Dr. Budi Santoso' },
    { id: 'dosen_b', nama: 'Dr. Anisa Putri, M.Kom.' },
    { id: 'dosen_c', nama: 'Ahmad Hidayat, S.Kom., M.T.' },
    { id: 'dosen_d', nama: 'Dr. Rina Marlina, M.Sc.' },
  ];

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pengajuan Judul Skripsi</h1>
          <p className="text-gray-600 mt-1">Lengkapi form berikut untuk mengajukan judul skripsi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... Sisa dari JSX (tampilan form) tidak ada perubahan ... */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Informasi Judul</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="jurusan" className="block text-sm font-medium text-gray-700 mb-1">Jurusan <span className="text-red-500">*</span></label>
                  <select id="jurusan" name="jurusan" value={formData.jurusan} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                    <option value="SISTEM_INFORMASI">Sistem Informasi</option>
                    <option value="MATEMATIKA">Matematika</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="topik" className="block text-sm font-medium text-gray-700 mb-1">Topik <span className="text-red-500">*</span></label>
                  <input id="topik" name="topik" type="text" value={formData.topik} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required placeholder="Contoh: Machine Learning"/>
                </div>
              </div>
              <div>
                <label htmlFor="judul" className="block text-sm font-medium text-gray-700 mb-1">Judul Skripsi <span className="text-red-500">*</span></label>
                <textarea id="judul" name="judul" rows={4} value={formData.judul} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Masukkan judul skripsi Anda..." required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="usulanPembimbing1" className="block text-sm font-medium text-gray-700 mb-1">Usulan Calon Pembimbing 1 <span className="text-red-500">*</span></label>
                  <select id="usulanPembimbing1" name="usulanPembimbing1" value={formData.usulanPembimbing1} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                    <option value="" disabled>Pilih Dosen</option>
                    {dosenList.map(dosen => (<option key={dosen.id} value={dosen.nama}>{dosen.nama}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="usulanPembimbing2" className="block text-sm font-medium text-gray-700 mb-1">Usulan Calon Pembimbing 2 <span className="text-red-500">*</span></label>
                  <select id="usulanPembimbing2" name="usulanPembimbing2" value={formData.usulanPembimbing2} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white" required>
                    <option value="" disabled>Pilih Dosen</option>
                    {dosenList.map(dosen => (<option key={dosen.id} value={dosen.nama}>{dosen.nama}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="usulanPembimbing3" className="block text-sm font-medium text-gray-700 mb-1">Usulan Calon Pembimbing 3 <span className="text-gray-500">(Opsional)</span></label>
                  <select id="usulanPembimbing3" name="usulanPembimbing3" value={formData.usulanPembimbing3} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="" disabled>Pilih Dosen</option>
                    {dosenList.map(dosen => (<option key={dosen.id} value={dosen.nama}>{dosen.nama}</option>))}
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
            <button type="submit" className="inline-flex items-center gap-2 py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FiSend /> Kirim Pengajuan
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}