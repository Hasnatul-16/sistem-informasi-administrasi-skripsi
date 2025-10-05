// import React from 'react'

// function pengajuanJudul() {
//   return (
//     <div>
//         <h1>pengajuan judul</h1>
//     </div>
//   )
// }

// export default pengajuanJudul

"use client";

import { useState } from 'react';

export default function PengajuanJudulPage() {
  // State untuk menyimpan data form
  const [formData, setFormData] = useState({
    jurusan: 'SISTEM_INFORMASI',
    topik: '',
    judul: '',
    usulanPembimbing1: '',
    usulanPembimbing2: '',
    usulanPembimbing3: '',
  });

  // State untuk menyimpan file
  const [files, setFiles] = useState({
    transkrip: null,
    ukt: null,
    konsultasi: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target;
    if (inputFiles && inputFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: inputFiles[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Validasi sederhana
    if (!formData.topik || !formData.judul || !files.transkrip || !files.ukt || !files.konsultasi) {
      alert('Harap lengkapi semua data dan persyaratan yang wajib diisi.');
      return;
    }

    // Di aplikasi nyata, Anda akan menggunakan FormData untuk mengirim file ke API
    const submissionData = new FormData();
    submissionData.append('jurusan', formData.jurusan);
    submissionData.append('topik', formData.topik);
    submissionData.append('judul', formData.judul);
    submissionData.append('usulanPembimbing1', formData.usulanPembimbing1);
    submissionData.append('usulanPembimbing2', formData.usulanPembimbing2);
    submissionData.append('usulanPembimbing3', formData.usulanPembimbing3);
    
    if (files.transkrip) submissionData.append('transkrip', files.transkrip);
    if (files.ukt) submissionData.append('ukt', files.ukt);
    if (files.konsultasi) submissionData.append('konsultasi', files.konsultasi);

    console.log('Data yang akan dikirim:', Object.fromEntries(submissionData.entries()));
    alert('Pengajuan sedang diproses! Lihat console log untuk data.');

    // Contoh pengiriman ke API (akan kita buat selanjutnya)
    /*
    try {
      const response = await fetch('/api/submission', {
        method: 'POST',
        body: submissionData,
      });

      if (response.ok) {
        alert('Pengajuan berhasil dikirim!');
        // Reset form
      } else {
        const error = await response.json();
        alert(`Gagal mengirim pengajuan: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan pada sistem.');
    }
    */
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Formulir Pengajuan Judul Skripsi</h1>
        <p className="text-gray-600 mb-6">Pastikan semua data diisi dengan benar dan lengkap.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informasi Dasar */}
          <div>
            <label htmlFor="jurusan" className="block text-sm font-medium text-gray-700">Jurusan</label>
            <select
              id="jurusan"
              name="jurusan"
              value={formData.jurusan}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="SISTEM_INFORMASI">Sistem Informasi</option>
              <option value="MATEMATIKA">Matematika</option>
            </select>
          </div>
          
          {/* Detail Skripsi */}
          <div>
            <label htmlFor="topik" className="block text-sm font-medium text-gray-700">Topik Skripsi</label>
            <input
              type="text"
              id="topik"
              name="topik"
              value={formData.topik}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Contoh: Machine Learning, Analisis Aljabar, dll."
            />
          </div>

          <div>
            <label htmlFor="judul" className="block text-sm font-medium text-gray-700">Usulan Judul Skripsi</label>
            <input
              type="text"
              id="judul"
              name="judul"
              value={formData.judul}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Masukkan judul skripsi yang Anda usulkan"
            />
          </div>

          {/* Usulan Pembimbing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="usulanPembimbing1" className="block text-sm font-medium text-gray-700">Usulan Calon Pembimbing 1</label>
              <input type="text" id="usulanPembimbing1" name="usulanPembimbing1" value={formData.usulanPembimbing1} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder="Nama Dosen"/>
            </div>
            <div>
              <label htmlFor="usulanPembimbing2" className="block text-sm font-medium text-gray-700">Usulan Calon Pembimbing 2</label>
              <input type="text" id="usulanPembimbing2" name="usulanPembimbing2" value={formData.usulanPembimbing2} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder="Nama Dosen"/>
            </div>
            <div>
              <label htmlFor="usulanPembimbing3" className="block text-sm font-medium text-gray-700">Usulan Calon Pembimbing 3 (Opsional)</label>
              <input type="text" id="usulanPembimbing3" name="usulanPembimbing3" value={formData.usulanPembimbing3} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder="Nama Dosen"/>
            </div>
          </div>
          
          {/* Unggah Persyaratan */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium text-gray-800">Unggah Berkas Persyaratan (PDF)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transkrip Nilai Terakhir</label>
              <input type="file" name="transkrip" onChange={handleFileChange} className="file-input-style" accept=".pdf"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bukti Pembayaran UKT</label>
              <input type="file" name="ukt" onChange={handleFileChange} className="file-input-style" accept=".pdf"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lembar Konsultasi Judul</label>
              <input type="file" name="konsultasi" onChange={handleFileChange} className="file-input-style" accept=".pdf"/>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}