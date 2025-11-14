"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiBookmark, FiMail, FiLock, FiChevronDown, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const Logo = () => (
  <div className="flex items-center mb-6">
    <Image
      src="/Logo FST Teks Hitam.png"
      alt="Logo FST"
      width={72}
      height={72}
      className="h-18 w-auto mr-3 mb-5"
    />
    <div className="flex flex-col mb-4">
      <span className="text-xl font-semibold">SisAdmin Skripsi</span>
      <span className="text-xs font-light opacity-80 mb-1">UIN Imam Bonjol Padang</span>
    </div>
  </div>
);

interface CustomInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  placeholder: string;
}

const CustomInput = ({ id, type, value, onChange, icon, placeholder }: CustomInputProps) => {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        className="block pl-10 pr-4 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition duration-150"
        placeholder={placeholder}
        required
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
    </div>
  );
};

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}

const CustomSelect = ({ id, value, onChange, options }: CustomSelectProps) => {
  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className="block pl-4 pr-10 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition duration-150 cursor-pointer"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
        <FiChevronDown className="h-5 w-5" />
      </div>
    </div>
  );
};

const FeatureItem = ({ icon: Icon, title, description, colorClass }:
  { icon: React.ElementType, title: string, description: string, colorClass: string }) => (
  <li className="flex items-start bg-white/20 p-2 rounded-lg text-white backdrop-blur-sm transition duration-300 hover:bg-white/30">
    <Icon className={`w-4 h-4 mr-3 mt-1 ${colorClass} flex-shrink-0`} />
    <div>
      <strong className="text-base">{title}</strong>
      <p className="text-xs opacity-90">{description}</p>
    </div>
  </li>
);

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

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const jurusanOptions = [
    { value: 'SISTEM_INFORMASI', label: 'Sistem Informasi' },
    { value: 'MATEMATIKA', label: 'Matematika' },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-8">
      <div className="flex max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="hidden lg:flex flex-col p-10 w-1/2 bg-blue-700 text-white relative">
          <div className="relative z-10">
            <Logo />
            <h1 className="font-extrabold leading-tight mb-4">
              <span className="text-xl block">Fakultas Sains Dan Teknologi</span>
              <span className="text-4xl block">Administrasi Skripsi</span>
            </h1>
            <p className="text-xs font-light mb-10 mt-6 opacity-90">
              Platform digital untuk mengelola administrasi skripsi dengan mudah, cepat, dan efisien
            </p>
            <ul className="space-y-3">
              <li className="flex items-start bg-white/20 p-2 rounded-lg text-white backdrop-blur-sm transition duration-300 hover:bg-white/30">
                <FiCheckCircle className="w-4 h-4 mr-3 mt-1 text-yellow-300 flex-shrink-0" />
                <div>
                  <strong className="text-base">Pengajuan Online</strong>
                  <p className="text-xs opacity-90">Ajukan judul dan daftar seminar secara digital</p>
                </div>
              </li>
              <li className="flex items-start bg-white/20 p-2 rounded-lg text-white backdrop-blur-sm transition duration-300 hover:bg-white/30">
                <FiCheckCircle className="w-4 h-4 mr-3 mt-1 text-blue-300 flex-shrink-0" />
                <div>
                  <strong className="text-base">Pantauan Progres Online</strong>
                  <p className="text-xs opacity-90">Pantau status pengajuan Anda setiap saat</p>
                </div>
              </li>
              <li className="flex items-start bg-white/20 p-2 rounded-lg text-white backdrop-blur-sm transition duration-300 hover:bg-white/30">
                <FiCheckCircle className="w-4 h-4 mr-3 mt-1 text-pink-400 flex-shrink-0" />
                <div>
                  <strong className="text-base">Dokumen Aman</strong>
                  <p className="text-xs opacity-90">SK dan dokumen tersimpan aman dan mudah diakses</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 bg-white">
          <div className="w-full max-w-xs">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Selamat Datang!</h2>
            <p className="text-gray-500 mb-8 text-sm">Silakan daftar untuk bisa Login</p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <CustomInput
                id="nama"
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                icon={<FiUser className="h-5 w-5" />}
                placeholder="Masukkan Nama Lengkap"
              />
              <CustomInput
                id="nim"
                type="text"
                value={formData.nim}
                onChange={(e) => setFormData(prev => ({ ...prev, nim: e.target.value }))}
                icon={<FiBookmark className="h-5 w-5" />}
                placeholder="Masukkan NIM"
              />
              <CustomInput
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                icon={<FiMail className="h-5 w-5" />}
                placeholder="Masukkan Email"
              />
              <CustomInput
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                icon={<FiLock className="h-5 w-5" />}
                placeholder="Masukkan Password"
              />
              <CustomSelect
                id="jurusan"
                value={formData.jurusan}
                onChange={(e) => setFormData(prev => ({ ...prev, jurusan: e.target.value }))}
                options={jurusanOptions}
              />
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition duration-150"
                >
                  {isLoading ? 'Memproses...' : 'Daftar'}
                </button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              Sudah Punya akun?
              <Link href="/" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                Masuk Di sini
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
