"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUserPlus, FiMail, FiLock, FiUser, FiBookmark } from 'react-icons/fi';
import Link from 'next/link';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// --- Komponen Floating Label Input (Tidak Berubah) ---
const FloatingLabelInput = ({ id, name, label, type, value, onChange, icon }: any) => { // Tambahkan 'name'
  return (
    <div className="relative">
      <input
        id={id}
        name={name} // Gunakan 'name'
        type={type}
        value={value}
        onChange={onChange}
        className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        placeholder=" "
        required
      />
      <label
        htmlFor={id}
        className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1 flex items-center"
      >
        <div className="mr-2">{icon}</div>
        {label}
      </label>
    </div>
  );
};

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nama: '',
    nim: '',
    email: '',
    password: '',
    jurusan: 'SISTEM_INFORMASI',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // --- PERBAIKAN DI SINI: Satu fungsi untuk semua input ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mendaftar.');
      }

      await MySwal.fire({
        icon: 'success',
        title: 'Registrasi Berhasil!',
        text: 'Akun Anda telah berhasil dibuat.',
        timer: 2000,
        showConfirmButton: false,
      });
      
      router.push('/');

    } catch (err: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.message || 'Terjadi kesalahan pada server.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-400 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <FiUserPlus className="w-12 h-12 mx-auto text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Daftar Akun Mahasiswa
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Buat akun untuk memulai proses skripsi Anda.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Gunakan 'name' dan 'handleInputChange' untuk semua input */}
          <FloatingLabelInput id="nama" name="nama" label="Nama Lengkap" type="text" value={formData.nama} onChange={handleInputChange} icon={<FiUser className="h-5 w-5" />} />
          <FloatingLabelInput id="nim" name="nim" label="NIM" type="text" value={formData.nim} onChange={handleInputChange} icon={<FiBookmark className="h-5 w-5" />} />
          <FloatingLabelInput id="email" name="email" label="Alamat Email" type="email" value={formData.email} onChange={handleInputChange} icon={<FiMail className="h-5 w-5" />} />
          <FloatingLabelInput id="password" name="password" label="Password" type="password" value={formData.password} onChange={handleInputChange} icon={<FiLock className="h-5 w-5" />} />
          
          <div>
            <select id="jurusan" name="jurusan" value={formData.jurusan} onChange={handleInputChange} className="block w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 focus:border-blue-600 focus:ring-0 sm:text-sm">
              <option value="SISTEM_INFORMASI">Sistem Informasi</option>
              <option value="MATEMATIKA">Matematika</option>
            </select>
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
              {isLoading ? 'Memproses...' : 'Daftar'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}