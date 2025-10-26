// app/dashboard/admin/page.tsx

import prisma from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { FiUsers, FiSettings } from 'react-icons/fi';

export const dynamic = 'force-dynamic';

async function getAllData() {
  const [titleSubmissions, proposalSubmissions, hasilSubmissions] = await prisma.$transaction([
    prisma.judul.findMany({
      orderBy: { tanggal: 'desc' },
      include: { mahasiswa: true },
    }),
    prisma.proposal.findMany({
      orderBy: { tanggal: 'desc' },
      include: { judul: { include: { mahasiswa: true } } },
    }),
    prisma.seminarHasil.findMany({
      orderBy: { tanggal: 'desc' },
      include: { judul: { include: { mahasiswa: true } } },
    }),
  ]);
  return { titleSubmissions, proposalSubmissions, hasilSubmissions };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const { titleSubmissions, proposalSubmissions, hasilSubmissions } = await getAllData();
  const adminName = session?.user?.email?.split('@')[0] || 'Admin';

  return (
    <main className="space-y-6"> {/* Jarak antar elemen sedikit dikurangi */}
      
      {/* --- UKURAN FONT & PADDING DIPERKECIL --- */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-5 rounded-xl shadow-lg text-white flex justify-between items-center">
        <div>
          {/* Ukuran judul diubah dari 2xl menjadi xl */}
          <h1 className="text-xl font-bold">Selamat datang, Admin {adminName}!</h1>
          <p className="mt-1 opacity-90 text-sm">Dashboard pengelolaan Sistem Administrasi Skripsi.</p>
        </div>
        <div className="flex gap-2">
            {/* Ukuran tombol dan teks diperkecil lagi */}
            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-1 px-3 text-xs rounded-lg flex items-center gap-1.5 transition-colors">
                <FiUsers size={14}/> Kelola Pengguna
            </button>
            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-1 px-3 text-xs rounded-lg flex items-center gap-1.5 transition-colors">
                <FiSettings size={14}/> Pengaturan
            </button>
        </div>
      </div>
      
      <AdminDashboardClient 
        titleSubmissions={titleSubmissions}
        // Map shape so client can access `.submission.mahasiswa`
        proposalSubmissions={proposalSubmissions.map(p => ({ ...p, submission: p.judul }))}
        hasilSubmissions={hasilSubmissions.map(h => ({ ...h, submission: h.judul }))}
      />
    </main>
  );
}