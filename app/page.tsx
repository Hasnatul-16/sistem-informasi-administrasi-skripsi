"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';

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
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 sm:p-8">
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
              <FeatureItem
                icon={FiCheckCircle}
                title="Pengajuan Online"
                description="Ajukan judul dan daftar seminar secara digital"
                colorClass="text-yellow-300"
              />
              <FeatureItem
                icon={FiCheckCircle}
                title="Pantauan Progres Online"
                description="Pantau status pengajuan Anda setiap saat"
                colorClass="text-blue-300"
              />
              <FeatureItem
                icon={FiCheckCircle}
                title="Dokumen Aman"
                description="SK dan dokumen tersimpan aman dan mudah diakses"
                colorClass="text-pink-400"
              />
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 bg-white">
          <div className="w-full max-w-xs">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Selamat Datang!</h2>
            <p className="text-gray-500 mb-8 text-sm">Silakan login untuk melanjutkan ke sistem</p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <CustomInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<FiMail className="h-5 w-5" />}
                placeholder="Masukkan Email"
              />
              <CustomInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<FiLock className="h-5 w-5" />}
                placeholder="Masukkan Password"
              />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-gray-900 select-none">
                    Ingat saya
                  </label>
                </div>
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Lupa Password?
                </Link>
              </div>
              {error && (
                <p className="text-sm text-center text-red-600 font-medium bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition duration-150"
                >
                  {isLoading ? 'Memproses...' : 'Login'}
                </button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              Belum Punya akun?
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                Daftar Di sini
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
