import prisma from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth';


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
    <main className="space-y-6"> 
      
      <div className=" bg-[#325827] p-5 rounded-xl shadow-lg text-white flex justify-between items-center">
        <div>
       
          <h1 className="text-xl font-bold">Selamat datang, Admin {adminName}!</h1>
          <p className="mt-1 opacity-90 text-sm">Dashboard pengelolaan Sistem Administrasi Skripsi.</p>
        </div>
      
      </div>
      
      <AdminDashboardClient 
        titleSubmissions={titleSubmissions}
     
        proposalSubmissions={proposalSubmissions.map(p => ({ ...p, submission: p.judul }))}
        hasilSubmissions={hasilSubmissions.map(h => ({ ...h, submission: h.judul }))}
      />
    </main>
  );
}