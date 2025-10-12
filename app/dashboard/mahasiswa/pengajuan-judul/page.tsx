// app/dashboard/mahasiswa/pengajuan-judul/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { Jurusan, Dosen } from "@prisma/client";
import PengajuanJudulForm from "./PengajuanJudulForm"; // Kita akan buat komponen ini

// Fungsi untuk mengambil data dosen dari server
async function getDosenByJurusan(jurusan: Jurusan): Promise<Dosen[]> {
  if (!jurusan) return [];

  const dosen = await prisma.dosen.findMany({
    where: {
      jurusan: jurusan,
    },
    orderBy: {
      nama: 'asc', // Urutkan berdasarkan nama
    },
  });
  return dosen;
}

export default async function PengajuanJudulPage() {
  // 1. Dapatkan sesi pengguna di server
  const session = await getServerSession(authOptions);
  const userJurusan = session?.user?.jurusan as Jurusan | undefined;

  // Jika tidak ada jurusan, tampilkan pesan error
  if (!userJurusan) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Gagal Memuat Data</h1>
        <p className="text-gray-700 mt-2">
          Informasi jurusan tidak ditemukan untuk akun Anda.
        </p>
      </main>
    );
  }

  // 2. Ambil daftar dosen berdasarkan jurusan mahasiswa
  const dosenList = await getDosenByJurusan(userJurusan);

  return (
    // 3. Render komponen Form (Client Component) dan kirim daftar dosen sebagai props
    <PengajuanJudulForm dosenList={dosenList} />
  );
}

export const revalidate = 0; // Pastikan data dosen selalu terbaru