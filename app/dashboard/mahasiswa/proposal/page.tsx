import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/auth';
import prisma from "@/lib/prisma";
import SeminarProposalForm from "./SeminarProposalForm"; 
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";

export const revalidate = 0;

export default async function SeminarProposalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div className="p-4 text-red-600">Sesi tidak ditemukan.</div>;
  }

  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id_user: session.user.id },
  });

  if (!mahasiswa) {
    return <div className="p-4 text-red-600">Profil mahasiswa tidak ditemukan.</div>;
  }

  const approvedJudul = await prisma.judul.findFirst({
    where: {
      id_mahasiswa: mahasiswa.id,
      status: 'DISETUJUI',
    },

    select: {
      id: true,
      topik: true,
      judul: true,
      usulan_pembimbing1: true,
      usulan_pembimbing2: true,
      usulan_pembimbing3: true,
      pembimbing1: true,
      pembimbing2: true,
    },
   
    orderBy: {
      tanggal: 'desc',
    }
  });
 
  if (!approvedJudul) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg border border-yellow-300">
          <FiAlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Judul Belum Disetujui</h1>
          <p className="text-gray-600 mb-6">
            Anda belum bisa mendaftar Seminar Proposal karena judul skripsi Anda belum disetujui oleh Ketua Program Studi.
          </p>
          <Link href="/dashboard/mahasiswa" className="text-[#325827] hover:underline font-medium">
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <SeminarProposalForm
      judulId={approvedJudul.id}
      judulData={approvedJudul}
    />
  );
}