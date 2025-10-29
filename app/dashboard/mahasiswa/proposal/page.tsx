import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import SeminarProposalForm from "./SeminarProposalForm"; // Komponen Client untuk form
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";

export default async function SeminarProposalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Seharusnya tidak terjadi jika middleware/proteksi route bekerja
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
  const approvedJudul = await prisma.judul.findFirst({
    where: {
      id_mahasiswa: mahasiswa.id,
      status: 'DISETUJUI', // Hanya cari yang sudah disetujui
    },
    // Pilih hanya ID dan status proposal jika sudah ada
    select: {
        id: true,
        proposal: { // Cek apakah proposal sudah pernah diajukan
            select: { id: true }
        }
    }
  });

  // 3. Jika tidak ada judul yang disetujui
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

  // 4. Jika judul sudah disetujui TAPI proposal sudah pernah diajukan
  if (approvedJudul.proposal) {
     return (
       <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
         <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg border border-blue-300">
            <FiAlertTriangle className="w-12 h-12 mx-auto text-blue-500 mb-4" />
           <h1 className="text-xl font-bold text-gray-800 mb-2">Proposal Sudah Diajukan</h1>
           <p className="text-gray-600 mb-6">
             Anda sudah pernah mengajukan pendaftaran Seminar Proposal untuk judul ini. Silakan cek statusnya di dashboard.
           </p>
           <Link href="/dashboard/mahasiswa" className="text-blue-600 hover:underline font-medium">
             Kembali ke Dashboard
           </Link>
         </div>
       </main>
     );
  }


  // 5. Jika judul disetujui dan proposal belum diajukan, render form
  return <SeminarProposalForm judulId={approvedJudul.id} />;
}

export const revalidate = 0; // Pastikan data selalu baru