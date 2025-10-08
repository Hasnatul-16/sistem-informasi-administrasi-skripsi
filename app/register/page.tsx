"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUserPlus } from 'react-icons/fi';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    nim: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Kita tidak lagi mengirim role, API akan menanganinya
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mendaftar.');
      }

      alert('Registrasi berhasil! Anda akan diarahkan ke halaman login.');
      router.push('/login');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg border">
        <div className="text-center">
          <FiUserPlus className="w-12 h-12 mx-auto text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Daftar Akun Mahasiswa</h1>
          <p className="mt-2 text-sm text-gray-600">Buat akun untuk memulai proses skripsi Anda.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input name="fullName" type="text" required placeholder="Nama Lengkap" onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
          <input name="nim" type="text" required placeholder="NIM" onChange={(e) => setFormData({...formData, nim: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
          <input name="email" type="email" required placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
          <input name="password" type="password" required placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
          
          {/* Dropdown role sudah dihapus */}
          
          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full py-3 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
            {isLoading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p className="text-sm text-center text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}