// File: proposal/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import SeminarProposalForm from "./SeminarProposalForm"; // Komponen Client
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";

// Pastikan data selalu baru
export const revalidate = 0;

export default async function SeminarProposalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div className="p-4 text-red-600">Sesi tidak ditemukan.</div>;
  }

  // 1. Cari profil mahasiswa
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id_user: session.user.id },
  });

  if (!mahasiswa) {
    return <div className="p-4 text-red-600">Profil mahasiswa tidak ditemukan.</div>;
  }

  // 2. Cari judul yang sudah DISETUJUI oleh Kaprodi untuk mahasiswa ini
  //    Kita hanya perlu ID judulnya saja
  const approvedJudul = await prisma.judul.findFirst({
    where: {
      id_mahasiswa: mahasiswa.id,
      status: 'DISETUJUI',
    },
    select: {
      id: true, // Hanya ambil ID
    }
  });

  // 3. Jika tidak ada judul yang disetujui, tampilkan pesan
  if (!approvedJudul) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg border border-yellow-300">
           <FiAlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Judul Belum Disetujui</h1>
          <p className="text-gray-600 mb-6">
            Anda belum bisa mendaftar Seminar Proposal karena judul skripsi Anda belum disetujui oleh Ketua Program Studi.
          </p>
          <Link href="/dashboard/mahasiswa" className="text-blue-600 hover:underline font-medium">
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // 4. Jika judul disetujui, SELALU render form dan kirim judulId
  return <SeminarProposalForm judulId={approvedJudul.id} />;
}