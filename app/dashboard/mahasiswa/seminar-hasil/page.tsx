import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/auth';
import prisma from "@/lib/prisma";
import SeminarHasilForm from "./SeminarHasilForm"; 
import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { Status } from '@prisma/client'; 

export const revalidate = 0;

export default async function SeminarHasilPage() {
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
      status: Status.DISETUJUI, 
    },
    select: {
      id: true,
      topik: true,
      judul: true,
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
            Anda belum bisa mendaftar Seminar Hasil karena judul skripsi Anda belum disetujui.
          </p>
          <Link href="/dashboard/mahasiswa" className="text-blue-600 hover:underline font-medium">
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isProposalLulus = await prisma.proposal.findFirst({
    where: {
      id_judul: approvedJudul.id,
      status: Status.DISETUJUI, 
    },
  });

  if (!isProposalLulus) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg border border-red-300">
          <FiAlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Seminar Proposal Belum Lulus</h1>
          <p className="text-gray-600 mb-6">
            Anda harus LULUS Seminar Proposal terlebih dahulu sebelum mendaftar Seminar Hasil.
          </p>
          <Link href="/dashboard/mahasiswa/proposal" className="text-blue-600 hover:underline font-medium">
            Lihat Status Proposal
          </Link>
        </div>
      </main>
    );
  }


  const activeSeminarHasil = await prisma.seminarHasil.findFirst({
   where: {
       id_judul: approvedJudul.id, 
        status: {
        not: Status.DITOLAK_ADMIN,
        },
    },
  });
    if (activeSeminarHasil) {
     return (
            <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg border border-blue-300">
                    <FiCheckCircle className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Pengajuan Sedang Diproses/Disetujui</h1>
                    <p className="text-gray-600 mb-6">
                        Anda sudah memiliki pengajuan Seminar Hasil yang sedang dalam proses verifikasi atau telah disetujui untuk judul ini.
                    </p>
                    <Link href="/dashboard/mahasiswa" className="text-blue-600 hover:underline font-medium">
                        Kembali ke Dashboard
                    </Link>
                </div>
            </main>
        );
    }


  return (
    <SeminarHasilForm
      judulId={approvedJudul.id}
      judulData={approvedJudul} 
    />
  );
}