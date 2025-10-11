"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiBookOpen, FiMail, FiLock } from 'react-icons/fi';
import Link from 'next/link';

// --- Komponen Input dengan Efek Floating Label yang Diperbarui ---
const FloatingLabelInput = ({ id, label, type, value, onChange, icon }: any) => {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        className="block px-3.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
        placeholder=" " // Placeholder kosong ini penting
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


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Email atau password salah. Silakan coba lagi.');
        setIsLoading(false);
      } else if (result?.ok) {
        router.push('/dashboard'); 
      }
    } catch (error) {
      setError('Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.');
      setIsLoading(false);
    }
  };

  return (
    // --- PERBAIKAN 1: Latar Belakang Biru Cerah ---
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-cyan-400">
      
      {/* --- PERBAIKAN 2: Form Berwarna Putih Solid --- */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <FiBookOpen className="w-12 h-12 mx-auto text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            SisAdmin Skripsi
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Masuk untuk mengelola progres skripsi Anda
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <FloatingLabelInput 
            id="email"
            label="Alamat Email"
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            icon={<FiMail className="h-5 w-5" />}
          />

          <FloatingLabelInput 
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            icon={<FiLock className="h-5 w-5" />}
          />
          
          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-500">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}